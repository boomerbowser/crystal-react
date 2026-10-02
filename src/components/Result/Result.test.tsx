import { describe, expect, it } from 'vitest';
import { expectNoAxeViolations } from '../../test/axe.js';
import { renderWithCrystal, screen } from '../../test/render.js';
import { Result } from './Result.js';

describe('Result', () => {
  /* "The outcome is stated in the heading; symbol and colour reinforce it." */
  it('states the outcome in a real heading', () => {
    renderWithCrystal(<Result outcome="error" title="Payment declined" />);
    expect(screen.getByRole('heading', { name: 'Payment declined', level: 2 }))
      .toBeInTheDocument();
  });

  it('takes the heading level of the page it sits in', () => {
    renderWithCrystal(<Result title="Page not found" outcome="not-found" headingLevel={1} />);
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
  });

  /* Six outcomes, four ink pairs. The test states the mapping for the two
     outcomes where it is not obvious. */
  it('maps the two outcomes Crystal has no pair for onto ones it does', () => {
    const { container, rerender } = renderWithCrystal(
      <Result title="Page not found" outcome="not-found" />,
    );
    expect(container.querySelector('[data-outcome="not-found"]')).toHaveAttribute('data-status', 'info');
    rerender(<Result title="Not your project" outcome="unauthorised" />);
    expect(container.querySelector('[data-outcome="unauthorised"]')).toHaveAttribute('data-status', 'danger');
  });

  it('has no axe violations', async () => {
    const { container } = renderWithCrystal(
      <Result outcome="success" title="Order placed">We have emailed your receipt.</Result>,
    );
    await expectNoAxeViolations(container);
  });
});

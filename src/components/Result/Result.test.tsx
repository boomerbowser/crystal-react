import { describe, expect, it } from 'vitest';
import { expectNoAxeViolations } from '../../test/axe.js';
import { renderWithPrismata, screen } from '../../test/render.js';
import { Result } from './Result.js';

describe('Result', () => {
  /* "The outcome is stated in the heading; symbol and colour reinforce it." */
  it('states the outcome in a real heading', () => {
    renderWithPrismata(<Result outcome="error" title="Payment declined" />);
    expect(screen.getByRole('heading', { name: 'Payment declined', level: 2 }))
      .toBeInTheDocument();
  });

  it('takes the heading level of the page it sits in', () => {
    renderWithPrismata(<Result title="Page not found" outcome="not-found" headingLevel={1} />);
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
  });

  /* Six outcomes, four ink pairs. The test states the mapping for the two
     outcomes where it is not obvious. */
  it('maps the two outcomes Prismata has no pair for onto ones it does', () => {
    const { container, rerender } = renderWithPrismata(
      <Result title="Page not found" outcome="not-found" />,
    );
    expect(container.querySelector('[data-outcome="not-found"]')).toHaveAttribute('data-status', 'info');
    rerender(<Result title="Not your project" outcome="unauthorised" />);
    expect(container.querySelector('[data-outcome="unauthorised"]')).toHaveAttribute('data-status', 'danger');
  });

  it('has no axe violations', async () => {
    const { container } = renderWithPrismata(
      <Result outcome="success" title="Order placed">We have emailed your receipt.</Result>,
    );
    await expectNoAxeViolations(container);
  });
});

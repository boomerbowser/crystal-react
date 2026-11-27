import { describe, expect, it } from 'vitest';
import { expectNoAxeViolations } from '../../test/axe.js';
import { renderWithPrismata, screen } from '../../test/render.js';
import { StatusBar } from './StatusBar.js';

describe('StatusBar', () => {
  it('reports its status politely at rest', () => {
    renderWithPrismata(<StatusBar status="All changes saved" />);
    expect(screen.getByRole('status')).toHaveTextContent('All changes saved');
    expect(screen.getByRole('alert')).toHaveTextContent('');
  });

  it('reports busy on the bar itself', () => {
    renderWithPrismata(<StatusBar status="Saving…" state="busy" data-testid="bar" />);
    expect(screen.getByTestId('bar')).toHaveAttribute('aria-busy', 'true');
  });

  /* "Errors escalate to assertive." Swapping the role on one element does
     nothing on several screen readers, because politeness is taken when a live
     region is inserted, not when its role attribute changes. So the message
     moves into an assertive region that was already there, and leaves the
     polite one empty so nothing is said twice. */
  it('moves the message into the assertive region when it escalates', () => {
    const { rerenderWithPrismata } = renderWithPrismata(
      <StatusBar status="All changes saved" />,
    );
    expect(screen.getByRole('status')).toHaveTextContent('All changes saved');

    rerenderWithPrismata(<StatusBar status="Could not save" state="error" />);
    expect(screen.getByRole('alert')).toHaveTextContent('Could not save');
    expect(screen.getByRole('status')).toHaveTextContent('');
  });

  it('never says the same thing in both regions', () => {
    renderWithPrismata(<StatusBar status="Could not save" state="error" />);
    const said = [screen.getByRole('status'), screen.getByRole('alert')]
      .map((one) => one.textContent ?? '')
      .filter((one) => one !== '');
    expect(said).toHaveLength(1);
  });

  it('has no axe violations', async () => {
    const { container } = renderWithPrismata(<StatusBar status="All changes saved" />);
    await expectNoAxeViolations(container);
  });
});

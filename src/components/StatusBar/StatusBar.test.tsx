import { describe, expect, it } from 'vitest';
import { expectNoAxeViolations } from '../../test/axe.js';
import { renderWithCrystal, screen } from '../../test/render.js';
import { StatusBar } from './StatusBar.js';

describe('StatusBar', () => {
  it('reports its status politely at rest', () => {
    renderWithCrystal(<StatusBar status="All changes saved" />);
    expect(screen.getByRole('status')).toHaveTextContent('All changes saved');
    expect(screen.getByRole('alert')).toHaveTextContent('');
  });

  it('reports busy on the bar itself', () => {
    renderWithCrystal(<StatusBar status="Saving…" state="busy" data-testid="bar" />);
    expect(screen.getByTestId('bar')).toHaveAttribute('aria-busy', 'true');
  });

  /* "Errors escalate to assertive." The obvious implementation swaps the role on
     one element, and on several screen readers that does nothing: politeness is
     taken when a live region is inserted, not when its role attribute changes.
     The text updates and the urgency does not — a bug invisible to everyone who
     can see the bar. So the message moves into an assertive region that was
     already there, and leaves the polite one empty so nothing is said twice. */
  it('moves the message into the assertive region when it escalates', () => {
    const { rerenderWithCrystal } = renderWithCrystal(
      <StatusBar status="All changes saved" />,
    );
    expect(screen.getByRole('status')).toHaveTextContent('All changes saved');

    rerenderWithCrystal(<StatusBar status="Could not save" state="error" />);
    expect(screen.getByRole('alert')).toHaveTextContent('Could not save');
    expect(screen.getByRole('status')).toHaveTextContent('');
  });

  it('never says the same thing in both regions', () => {
    renderWithCrystal(<StatusBar status="Could not save" state="error" />);
    const said = [screen.getByRole('status'), screen.getByRole('alert')]
      .map((one) => one.textContent ?? '')
      .filter((one) => one !== '');
    expect(said).toHaveLength(1);
  });

  it('has no axe violations', async () => {
    const { container } = renderWithCrystal(<StatusBar status="All changes saved" />);
    await expectNoAxeViolations(container);
  });
});

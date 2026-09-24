import { describe, expect, it } from 'vitest';
import { expectNoAxeViolations } from '../../test/axe.js';
import { renderWithCrystal, screen, waitFor } from '../../test/render.js';
import { FocusMode } from './FocusMode.js';

const chrome = <button type="button">Sidebar</button>;

describe('FocusMode', () => {
  it('shows the chrome when it is off and removes it when it is on', () => {
    const { rerenderWithCrystal } = renderWithCrystal(
      <FocusMode chrome={chrome}><p>The task</p></FocusMode>,
    );
    expect(screen.getByRole('button', { name: 'Sidebar' })).toBeInTheDocument();

    rerenderWithCrystal(<FocusMode chrome={chrome} isOn><p>The task</p></FocusMode>);
    expect(screen.queryByRole('button', { name: 'Sidebar' })).toBeNull();
    expect(screen.getByText('The task')).toBeInTheDocument();
  });

  /* Not shrunk, not transparent, not `visibility: hidden`. Chrome that is
     invisible and still focusable is the worst of both: a keyboard reader tabs
     into something nobody can see. */
  it('leaves nothing of the chrome behind to tab into', () => {
    const { container } = renderWithCrystal(
      <FocusMode chrome={chrome} isOn><p>The task</p></FocusMode>,
    );
    expect(container.querySelectorAll('button')).toHaveLength(0);
  });

  /* The half that fails silently. Focus resting in the chrome when the mode
     turns on is focus on an element about to unmount: it falls to the document
     body, a keyboard reader starts again from the top of the page, and a screen
     reader says nothing, because nothing happened that it reports. */
  it('moves focus out of the chrome before the chrome goes', async () => {
    const { rerenderWithCrystal } = renderWithCrystal(
      <FocusMode chrome={chrome}><p>The task</p></FocusMode>,
    );
    screen.getByRole('button', { name: 'Sidebar' }).focus();

    rerenderWithCrystal(<FocusMode chrome={chrome} isOn><p>The task</p></FocusMode>);
    await waitFor(() => {
      expect(document.activeElement).not.toBe(document.body);
      expect(screen.getByText('The task').closest('[tabindex="-1"]')).toHaveFocus();
    });
  });

  /* And the other half: a reader already working in the task keeps their place.
     Moving focus unconditionally would take it away from them. */
  it('leaves focus alone when it was never in the chrome', async () => {
    const { rerenderWithCrystal } = renderWithCrystal(
      <FocusMode chrome={chrome}><button type="button">In the task</button></FocusMode>,
    );
    const working = screen.getByRole('button', { name: 'In the task' });
    working.focus();

    rerenderWithCrystal(
      <FocusMode chrome={chrome} isOn><button type="button">In the task</button></FocusMode>,
    );
    await waitFor(() => { expect(working).toHaveFocus(); });
  });

  it('announces entering and leaving', async () => {
    const { rerenderWithCrystal } = renderWithCrystal(
      <FocusMode chrome={chrome}><p>The task</p></FocusMode>,
    );
    rerenderWithCrystal(<FocusMode chrome={chrome} isOn><p>The task</p></FocusMode>);
    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent('Focus mode on');
    });

    rerenderWithCrystal(<FocusMode chrome={chrome}><p>The task</p></FocusMode>);
    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent('Focus mode off');
    });
  });

  it('has no axe violations', async () => {
    const { container } = renderWithCrystal(
      <FocusMode chrome={chrome}><p>The task</p></FocusMode>,
    );
    await expectNoAxeViolations(container);
  });
});

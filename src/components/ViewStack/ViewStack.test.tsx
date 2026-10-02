import { describe, expect, it, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { expectNoAxeViolations } from '../../test/axe.js';
import { renderWithCrystal, screen, waitFor } from '../../test/render.js';
import { ViewStack, type StackedView } from './ViewStack.js';

const root: StackedView = {
  id: 'inbox',
  label: 'Inbox',
  children: <button type="button">The quarterly figures</button>,
};
const pushed: StackedView = {
  id: 'message',
  label: 'The quarterly figures',
  children: <p>They are attached.</p>,
};

describe('ViewStack', () => {
  it('shows the top of the stack as a named region', () => {
    renderWithCrystal(<ViewStack views={[root, pushed]} onPop={() => {}} />);
    expect(screen.getByRole('region', { name: 'The quarterly figures' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'The quarterly figures' })).toBeNull();
  });

  /* "The back control is a real button." A back affordance drawn as an icon in
     a div is unreachable by keyboard and unnamed to a screen reader, and the
     browser's own back button is not a route the product offered. */
  it('offers the way back as a button that names where it goes', async () => {
    const onPop = vi.fn();
    const user = userEvent.setup();
    renderWithCrystal(<ViewStack views={[root, pushed]} onPop={onPop} />);

    await user.click(screen.getByRole('button', { name: 'Back to Inbox' }));
    expect(onPop).toHaveBeenCalledOnce();
  });

  /* Nothing to go back to. A back control on the root view would do nothing. */
  it('offers no way back from the root view', () => {
    renderWithCrystal(<ViewStack views={[root]} onPop={() => {}} />);
    expect(screen.queryByRole('button', { name: /^Back to/ })).toBeNull();
  });

  /* "Focus moves to the new view." Pushing replaces what the reader was looking
     at. Focus left on the control that pushed would sit on a button that is no
     longer displayed. */
  it('moves focus to the view it pushed', async () => {
    const { rerenderWithCrystal } = renderWithCrystal(
      <ViewStack views={[root]} onPop={() => {}} />,
    );
    rerenderWithCrystal(<ViewStack views={[root, pushed]} onPop={() => {}} />);
    await waitFor(() => {
      expect(screen.getByRole('region', { name: 'The quarterly figures' })).toHaveFocus();
    });
  });

  /* "And returns on pop." The stack restores focus to the view, not the control.
     It shows one view at a time, so the control the reader left was unmounted
     with its view, and a reference kept to it is a detached node that `focus()`
     accepts and silently ignores. The test asserts that focus lands on the
     region returned to, and that it is not on the document body, which is the
     top of the page. */
  it('returns focus to the view it came back to, and not to the page', async () => {
    const { rerenderWithCrystal } = renderWithCrystal(
      <ViewStack views={[root, pushed]} onPop={() => {}} />,
    );

    rerenderWithCrystal(<ViewStack views={[root]} onPop={() => {}} />);
    await waitFor(() => {
      expect(screen.getByRole('region', { name: 'Inbox' })).toHaveFocus();
    });
    expect(document.activeElement).not.toBe(document.body);
  });

  it('has no axe violations', async () => {
    const { container } = renderWithCrystal(<ViewStack views={[root, pushed]} onPop={() => {}} />);
    await expectNoAxeViolations(container);
  });
});

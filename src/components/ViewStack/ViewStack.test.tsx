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

  /* Nothing to go back to. A back control on the root view is a control that
     does nothing, which is worse than no control. */
  it('offers no way back from the root view', () => {
    renderWithCrystal(<ViewStack views={[root]} onPop={() => {}} />);
    expect(screen.queryByRole('button', { name: /^Back to/ })).toBeNull();
  });

  /* "Focus moves to the new view." Pushing replaces what the reader was looking
     at; leaving focus on the control that did it leaves it on a button that is
     no longer displayed. */
  it('moves focus to the view it pushed', async () => {
    const { rerenderWithCrystal } = renderWithCrystal(
      <ViewStack views={[root]} onPop={() => {}} />,
    );
    rerenderWithCrystal(<ViewStack views={[root, pushed]} onPop={() => {}} />);
    await waitFor(() => {
      expect(screen.getByRole('region', { name: 'The quarterly figures' })).toHaveFocus();
    });
  });

  /* "And returns on pop." What a stack can truthfully restore is the view, not
     the control: it shows one view at a time, so the control the reader left was
     unmounted with the view it belonged to, and a reference kept to it is a
     detached node that `focus()` accepts and silently ignores. The assertion is
     therefore that focus lands on the region returned to — and, just as
     importantly, that it is not on the document body, which is the top of the
     page and the failure this exists to prevent. */
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

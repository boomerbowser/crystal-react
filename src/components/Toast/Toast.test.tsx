import { describe, expect, it, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { expectNoAxeViolations } from '../../test/axe.js';
import { renderWithCrystal, screen, act, waitFor } from '../../test/render.js';
import { Toast, ToastProvider, useToasts } from './Toast.js';

function Raise({ onReady }: { onReady: (api: ReturnType<typeof useToasts>) => void }) {
  const api = useToasts();
  return <button type="button" onClick={() => onReady(api)}>Raise</button>;
}

describe('Toast', () => {
  /* The announcement is the provider's, not the toast's. Two reasons, and the
     second one is why this test looks the way it does: `role="status"` on an
     `<li>` replaces its `listitem` role, so the stack stops being a list with
     items in it — axe caught exactly that on the first run of these stories. */
  it('announces from a region that was there before the message was', async () => {
    let api: ReturnType<typeof useToasts> | null = null;
    renderWithCrystal(
      <ToastProvider><Raise onReady={(one) => { api = one; }} /></ToastProvider>,
    );
    const polite = screen.getByRole('status');
    expect(polite).toBeEmptyDOMElement();
    act(() => { screen.getByRole('button', { name: 'Raise' }).click(); });
    act(() => { api!.show({ title: 'Changes saved' }); });
    await waitFor(() => { expect(polite).toHaveTextContent('Changes saved'); });
  });

  it('keeps the stack a list of list items', () => {
    let api: ReturnType<typeof useToasts> | null = null;
    renderWithCrystal(
      <ToastProvider><Raise onReady={(one) => { api = one; }} /></ToastProvider>,
    );
    act(() => { screen.getByRole('button', { name: 'Raise' }).click(); });
    act(() => { api!.show({ title: 'Changes saved' }); });
    expect(screen.getAllByRole('listitem')).toHaveLength(1);
  });

  it('sends an urgent toast to the assertive region instead', async () => {
    let api: ReturnType<typeof useToasts> | null = null;
    renderWithCrystal(
      <ToastProvider><Raise onReady={(one) => { api = one; }} /></ToastProvider>,
    );
    act(() => { screen.getByRole('button', { name: 'Raise' }).click(); });
    act(() => { api!.show({ title: 'Connection lost', urgent: true }); });
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Connection lost');
    });
    expect(screen.getByRole('status')).toBeEmptyDOMElement();
  });

  /* The live region exists before anything is in it. A region created at the
     same moment as its text is one screen readers may never announce, which is
     the classic way a toast system ends up silent. */
  it('has its stack in the document before any toast arrives', () => {
    renderWithCrystal(<ToastProvider><p>Page</p></ToastProvider>);
    expect(screen.getByRole('list', { name: 'Notifications' })).toBeInTheDocument();
  });

  /* "Auto-dismiss must never remove the only route to an action." The rule is
     enforced in the type — a toast with an `action` cannot be given a
     `duration` — and this is the runtime half.

     Real timers, deliberately. The first of these two proves the lifespan path
     works end to end; without it the second would pass on a toast system where
     nothing is ever dismissed, which is what happened the first time this was
     written with fake timers: the exit recipe never settled, so no toast ever
     left and "the action toast is still there" was true of every toast. */
  it('takes an ordinary toast away when its time is up', async () => {
    let api: ReturnType<typeof useToasts> | null = null;
    renderWithCrystal(
      <ToastProvider defaultDuration={30}><Raise onReady={(one) => { api = one; }} /></ToastProvider>,
    );
    act(() => { screen.getByRole('button', { name: 'Raise' }).click(); });
    act(() => { api!.show({ title: 'Changes saved' }); });
    expect(screen.getByRole('listitem')).toBeInTheDocument();
    await waitFor(() => { expect(screen.queryByRole('listitem')).toBeNull(); }, { timeout: 3000 });
  });

  it('never puts a lifespan on a toast that carries an action', async () => {
    let api: ReturnType<typeof useToasts> | null = null;
    renderWithCrystal(
      <ToastProvider defaultDuration={30}><Raise onReady={(one) => { api = one; }} /></ToastProvider>,
    );
    act(() => { screen.getByRole('button', { name: 'Raise' }).click(); });
    act(() => {
      api!.show({ title: 'Message deleted', action: <button type="button">Undo</button> });
    });
    /* Longer than the lifespan plus the exit recipe: 30ms would start the
       departure and `toast-out` takes 440ms to finish it, so a shorter wait
       here would pass on a toast that *was* given a lifespan. */
    await new Promise((settle) => { setTimeout(settle, 1200); });
    expect(screen.getByRole('listitem')).toHaveTextContent('Message deleted');
    expect(screen.getByRole('button', { name: 'Undo' })).toBeInTheDocument();
  });

  it('names its dismiss control for what it dismisses', async () => {
    const onDismiss = vi.fn();
    renderWithCrystal(<Toast title="Saved" onDismiss={onDismiss} />);
    await userEvent.click(screen.getByRole('button', { name: 'Dismiss: Saved' }));
    /* Awaited, because the exit recipe plays first: a toast that unmounted on
       the state change would play `toast-out` into a detached node. */
    await waitFor(() => { expect(onDismiss).toHaveBeenCalled(); });
  });

  it('has no axe violations', async () => {
    const { container } = renderWithCrystal(
      <ToastProvider><p>Page</p></ToastProvider>,
    );
    await expectNoAxeViolations(container);
  });
});

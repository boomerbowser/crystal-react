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
  /* The provider makes the announcement, not the toast. One reason is that
     `role="status"` on an `<li>` replaces its `listitem` role, so the stack
     stops being a list with items in it. */
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

  /* The live region exists before anything is in it. Screen readers may never
     announce a region created at the same moment as its text. */
  it('has its stack in the document before any toast arrives', () => {
    renderWithCrystal(<ToastProvider><p>Page</p></ToastProvider>);
    expect(screen.getByRole('list', { name: 'Notifications' })).toBeInTheDocument();
  });

  /* "Auto-dismiss must never remove the only route to an action." The type
     enforces the rule (a toast with an `action` cannot be given a `duration`),
     and these two tests check it at runtime.

     They use real timers. With fake timers the exit recipe never settles, so no
     toast ever leaves. The first test proves the lifespan path works end to end.
     Without it, the second would also pass on a toast system where nothing is
     ever dismissed. */
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
    /* Longer than the lifespan plus the exit recipe. 30ms would start the
       departure and `toast-out` takes 440ms to finish it, so a shorter wait
       here would pass on a toast that was given a lifespan. */
    await new Promise((settle) => { setTimeout(settle, 1200); });
    expect(screen.getByRole('listitem')).toHaveTextContent('Message deleted');
    expect(screen.getByRole('button', { name: 'Undo' })).toBeInTheDocument();
  });

  it('names its dismiss control for what it dismisses', async () => {
    const onDismiss = vi.fn();
    renderWithCrystal(<Toast title="Saved" onDismiss={onDismiss} />);
    await userEvent.click(screen.getByRole('button', { name: 'Dismiss: Saved' }));
    /* Awaited, because the exit recipe plays first. A toast that unmounted on
       the state change would play `toast-out` into a detached node. */
    await waitFor(() => { expect(onDismiss).toHaveBeenCalled(); });
  });

  it('has no axe violations', async () => {
    const { container } = renderWithCrystal(
      <ToastProvider><p>Page</p></ToastProvider>,
    );
    await expectNoAxeViolations(container);
  });

  /* `onDismiss` is a new closure on every provider render. If `leave` depended
     on it, the lifespan effect would restart its timer whenever another toast
     arrived, and in a busy stack the oldest toast would outlive them all.

     A single-toast test cannot detect this, so this one keeps toasts arriving
     while the first is counting down. */
  it('keeps each toast on its own clock while others arrive', async () => {
    let api: ReturnType<typeof useToasts> | null = null;
    renderWithCrystal(
      <ToastProvider defaultDuration={120}><Raise onReady={(one) => { api = one; }} /></ToastProvider>,
    );
    act(() => { screen.getByRole('button', { name: 'Raise' }).click(); });
    act(() => { api!.show({ title: 'First' }); });

    for (let arrival = 0; arrival < 8; arrival += 1) {
      // eslint-disable-next-line no-await-in-loop -- the arrivals are the point
      await new Promise((settle) => { setTimeout(settle, 90); });
      // eslint-disable-next-line no-loop-func -- `api` is stable by now
      act(() => { api!.show({ title: `Later ${arrival}` }); });
    }

    /* No `waitFor`, because the assertion is that it left on time. Its own 120ms
       plus the 440ms exit puts it gone by about 560ms, well before the last
       arrival at 720ms. A toast whose clock was restarted by its neighbours
       would still be here. It would leave eventually, so waiting for it to go
       would pass either way. */
    const said = screen.getAllByRole('listitem').map((item) => item.textContent ?? '');
    expect(said.some((text) => text.includes('First'))).toBe(false);
    expect(said.length).toBeGreaterThan(0);
  });
});
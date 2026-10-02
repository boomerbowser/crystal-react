import { describe, expect, it, vi } from 'vitest';
import { renderWithCrystal, screen, userEvent } from '../../test/render.js';
import { FloatingWindow } from './FloatingWindow.js';

const start = { x: 100, y: 100, width: 360, height: 240 };

const handle = (): HTMLElement => screen.getByRole('button', { name: /move or resize/ });
const panel = (): HTMLElement => screen.getByRole('region', { name: 'Notes' });

describe('FloatingWindow', () => {
  it('is named, and is not a dialog unless it is modal', () => {
    renderWithCrystal(<FloatingWindow label="Notes" defaultRect={start}><p>body</p></FloatingWindow>);
    /* A non-modal window announced as a dialog claims an exclusivity it does
       not have. */
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(panel()).toBeTruthy();
  });

  it('is a dialog when it is modal', () => {
    renderWithCrystal(<FloatingWindow label="Notes" isModal defaultRect={start}><p>body</p></FloatingWindow>);
    const dialog = screen.getByRole('dialog', { name: 'Notes' });
    expect(dialog.getAttribute('aria-modal')).toBe('true');
  });

  it('gives the title bar to the keyboard', async () => {
    const user = userEvent.setup();
    renderWithCrystal(<FloatingWindow label="Notes" defaultRect={start}><p>body</p></FloatingWindow>);
    await user.tab();
    /* Keyboard users must be able to move the window. Testing with a mouse
       alone would not show that they cannot. */
    expect(document.activeElement).toBe(handle());
  });

  it('moves with the arrow keys', async () => {
    const user = userEvent.setup();
    const onRectChange = vi.fn();
    renderWithCrystal(
      <FloatingWindow label="Notes" defaultRect={start} step={16} onRectChange={onRectChange}>
        <p>body</p>
      </FloatingWindow>,
    );
    await user.tab();
    await user.keyboard('{ArrowRight}');
    expect(onRectChange).toHaveBeenLastCalledWith(expect.objectContaining({ x: 116, y: 100 }));
    await user.keyboard('{ArrowDown}');
    expect(onRectChange).toHaveBeenLastCalledWith(expect.objectContaining({ x: 116, y: 116 }));
  });

  it('widens the step with Shift', async () => {
    const user = userEvent.setup();
    const onRectChange = vi.fn();
    renderWithCrystal(
      <FloatingWindow label="Notes" defaultRect={start} step={16} onRectChange={onRectChange}>
        <p>body</p>
      </FloatingWindow>,
    );
    await user.tab();
    await user.keyboard('{Shift>}{ArrowRight}{/Shift}');
    expect(onRectChange).toHaveBeenLastCalledWith(expect.objectContaining({ x: 260 }));
  });

  it('resizes rather than moves with a modifier', async () => {
    const user = userEvent.setup();
    const onRectChange = vi.fn();
    renderWithCrystal(
      <FloatingWindow label="Notes" defaultRect={start} step={16} onRectChange={onRectChange}>
        <p>body</p>
      </FloatingWindow>,
    );
    await user.tab();
    await user.keyboard('{Alt>}{ArrowRight}{/Alt}');
    /* Resizing lets a keyboard user fit the window to its content as well as
       place it. */
    expect(onRectChange).toHaveBeenLastCalledWith(expect.objectContaining({ width: 376, x: 100 }));
  });

  it('returns to where it started with Home', async () => {
    const user = userEvent.setup();
    const onRectChange = vi.fn();
    renderWithCrystal(
      <FloatingWindow label="Notes" defaultRect={start} onRectChange={onRectChange}><p>body</p></FloatingWindow>,
    );
    await user.tab();
    await user.keyboard('{ArrowRight}{ArrowRight}{Home}');
    expect(onRectChange).toHaveBeenLastCalledWith(expect.objectContaining(start));
  });

  it('never leaves the viewport', async () => {
    const user = userEvent.setup();
    const onRectChange = vi.fn();
    renderWithCrystal(
      <FloatingWindow label="Notes" defaultRect={{ x: 0, y: 0, width: 360, height: 240 }} step={16} onRectChange={onRectChange}>
        <p>body</p>
      </FloatingWindow>,
    );
    await user.tab();
    await user.keyboard('{ArrowLeft}{ArrowUp}');
    /* Clamped on the way in rather than corrected afterwards. A window dropped
       past a corner cannot be recovered by pointer or keyboard, because both
       need the title bar. */
    expect(onRectChange).toHaveBeenLastCalledWith(expect.objectContaining({ x: 0, y: 0 }));
  });

  it('cannot be resized smaller than its own handle needs', async () => {
    const user = userEvent.setup();
    const onRectChange = vi.fn();
    renderWithCrystal(
      <FloatingWindow
        label="Notes"
        defaultRect={{ x: 10, y: 10, width: 230, height: 130 }}
        step={16}
        minWidth={220}
        minHeight={120}
        onRectChange={onRectChange}
      >
        <p>body</p>
      </FloatingWindow>,
    );
    await user.tab();
    await user.keyboard('{Alt>}{ArrowLeft}{ArrowLeft}{ArrowUp}{ArrowUp}{/Alt}');
    const last = onRectChange.mock.calls.at(-1)?.[0] as { width: number; height: number };
    expect(last.width).toBe(220);
    expect(last.height).toBe(120);
  });
});

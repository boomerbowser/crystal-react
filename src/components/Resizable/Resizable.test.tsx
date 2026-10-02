import { describe, expect, it, vi } from 'vitest';
import { expectNoAxeViolations } from '../../test/axe.js';
import { renderWithCrystal, screen, userEvent } from '../../test/render.js';
import { Resizable } from './Resizable.js';

describe('Resizable', () => {
  it('has no accessibility violations', async () => {
    const { container } = renderWithCrystal(
      <Resizable aria-label="Resize the sidebar" secondary={<p>Rest</p>}><p>Panel</p></Resizable>,
    );
    await expectNoAxeViolations(container);
  });

  /* "Pointer dragging is never the only route" is the catalogue's rule. A
     separator with a value lets a screen reader announce the size as it changes
     rather than announcing that something was grabbed. */
  it('is a separator with a value, not a div with a pointer handler', () => {
    renderWithCrystal(
      <Resizable aria-label="Resize" defaultSize={300} minSize={100} maxSize={600} secondary={<p>Rest</p>}>
        <p>Panel</p>
      </Resizable>,
    );
    const handle = screen.getByRole('separator', { name: 'Resize' });
    expect(handle.getAttribute('aria-valuenow')).toBe('300');
    expect(handle.getAttribute('aria-valuemin')).toBe('100');
    expect(handle.getAttribute('aria-valuemax')).toBe('600');
    expect(handle.tabIndex).toBe(0);
  });

  it('resizes from the keyboard', async () => {
    const onSizeChange = vi.fn();
    renderWithCrystal(
      <Resizable aria-label="Resize" defaultSize={300} onSizeChange={onSizeChange} secondary={<p>Rest</p>}>
        <p>Panel</p>
      </Resizable>,
    );
    screen.getByRole('separator', { name: 'Resize' }).focus();
    await userEvent.keyboard('{ArrowRight}');
    expect(onSizeChange).toHaveBeenCalled();
    expect(onSizeChange.mock.calls[0]?.[0]).toBeGreaterThan(300);
  });

  /* Reaching a bound is a state the handle shows. */
  it('says when it is at a bound', () => {
    renderWithCrystal(
      <Resizable aria-label="Resize" defaultSize={100} minSize={100} maxSize={600} secondary={<p>Rest</p>}>
        <p>Panel</p>
      </Resizable>,
    );
    expect(screen.getByRole('separator', { name: 'Resize' }).dataset['crState']).toBe('at-min');
  });
});

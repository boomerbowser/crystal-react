import { describe, expect, it } from 'vitest';
import { expectNoAxeViolations } from '../../test/axe.js';
import { renderWithCrystal, screen, userEvent } from '../../test/render.js';
import { Toolbar } from './Toolbar.js';
import { Button } from '../Button/Button.js';

function Bar({ orientation }: { orientation?: 'horizontal' | 'vertical' }) {
  return (
    <Toolbar aria-label="Formatting" {...(orientation ? { orientation } : {})}>
      <Button>Bold</Button>
      <Button>Italic</Button>
      <Button>Underline</Button>
    </Toolbar>
  );
}

describe('Toolbar', () => {
  it('has no accessibility violations and declares its orientation', async () => {
    const { container } = renderWithCrystal(<Bar />);
    const bar = screen.getByRole('toolbar', { name: 'Formatting' });
    expect(bar.getAttribute('aria-orientation')).toBe('horizontal');
    await expectNoAxeViolations(container);
  });

  /* The whole point, and an accessibility decision rather than a layout one: a
     formatting bar of fifteen buttons is fifteen tab stops between a person and
     the next field. One stop in, arrows within, one stop out. */
  it('is one tab stop, with arrows moving between the controls', async () => {
    renderWithCrystal(
      <div>
        <button type="button">Before</button>
        <Bar />
        <button type="button">After</button>
      </div>,
    );
    screen.getByRole('button', { name: 'Before' }).focus();

    await userEvent.tab();
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Bold' }));

    await userEvent.keyboard('{ArrowRight}');
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Italic' }));

    /* Out in one press, not three: the other controls are reached by arrow. */
    await userEvent.tab();
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'After' }));
  });

  /* A vertical toolbar uses up and down, which is the half a hand-rolled roving
     tab index usually forgets. */
  it('moves with up and down when it is vertical', async () => {
    renderWithCrystal(<Bar orientation="vertical" />);
    screen.getByRole('button', { name: 'Bold' }).focus();
    await userEvent.keyboard('{ArrowDown}');
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Italic' }));
  });
});

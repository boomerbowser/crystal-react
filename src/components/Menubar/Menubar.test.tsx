import { describe, expect, it } from 'vitest';
import { Button, Menu, MenuItem, MenuTrigger, Popover } from 'react-aria-components';
import { renderWithCrystal, screen, userEvent } from '../../test/render.js';
import { Menubar } from './Menubar.js';

function Bar(): React.JSX.Element {
  return (
    <Menubar aria-label="Document">
      {['File', 'Edit', 'View'].map((name) => (
        <MenuTrigger key={name}>
          <Button>{name}</Button>
          <Popover>
            <Menu aria-label={name}>
              <MenuItem id="one">{name} one</MenuItem>
              <MenuItem id="two">{name} two</MenuItem>
            </Menu>
          </Popover>
        </MenuTrigger>
      ))}
    </Menubar>
  );
}

describe('Menubar', () => {
  it('is a named menubar', () => {
    renderWithCrystal(<Bar />);
    const bar = screen.getByRole('menubar', { name: 'Document' });
    expect(bar.getAttribute('aria-orientation')).toBe('horizontal');
  });

  it('is one tab stop, not one per trigger', async () => {
    const user = userEvent.setup();
    renderWithCrystal(<><a href="/before">before</a><Bar /><a href="/after">after</a></>);
    await user.tab();
    expect(document.activeElement?.textContent).toBe('before');
    await user.tab();
    expect(document.activeElement?.textContent).toBe('File');
    /* One more Tab leaves the whole bar. A bar where every trigger is its own
       tab stop makes a ten-item menu bar ten presses deep. */
    await user.tab();
    expect(document.activeElement?.textContent).toBe('after');
  });

  it('moves between triggers with the arrow keys, and wraps', async () => {
    const user = userEvent.setup();
    renderWithCrystal(<Bar />);
    await user.tab();
    expect(document.activeElement?.textContent).toBe('File');
    await user.keyboard('{ArrowRight}');
    expect(document.activeElement?.textContent).toBe('Edit');
    await user.keyboard('{ArrowRight}{ArrowRight}');
    /* Wrapping: the last trigger's right arrow reaches the first in one press. */
    expect(document.activeElement?.textContent).toBe('File');
    await user.keyboard('{ArrowLeft}');
    expect(document.activeElement?.textContent).toBe('View');
  });

  it('jumps to the ends with Home and End', async () => {
    const user = userEvent.setup();
    renderWithCrystal(<Bar />);
    await user.tab();
    await user.keyboard('{End}');
    expect(document.activeElement?.textContent).toBe('View');
    await user.keyboard('{Home}');
    expect(document.activeElement?.textContent).toBe('File');
  });

  it('returns to where you left rather than to the beginning', async () => {
    const user = userEvent.setup();
    renderWithCrystal(<><Bar /><a href="/after">after</a></>);
    await user.tab();
    await user.keyboard('{ArrowRight}');
    expect(document.activeElement?.textContent).toBe('Edit');
    await user.tab();
    expect(document.activeElement?.textContent).toBe('after');
    await user.tab({ shift: true });
    /* Not 'File'. Every return journey starting over is the thing this avoids. */
    expect(document.activeElement?.textContent).toBe('Edit');
  });

  it('opens a trigger’s own menu', async () => {
    const user = userEvent.setup();
    renderWithCrystal(<Bar />);
    await user.click(screen.getByRole('button', { name: 'Edit' }));
    expect(await screen.findByRole('menu', { name: 'Edit' })).toBeTruthy();
  });
});

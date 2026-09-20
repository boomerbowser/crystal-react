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
    await user.click(screen.getByRole('menuitem', { name: 'Edit' }));
    expect(await screen.findByRole('menu', { name: 'Edit' })).toBeTruthy();
  });

  /* `role="menubar"` must contain `menuitem`s, and React Aria's trigger is a
     `button` with `aria-haspopup` — correct standing alone, invalid here. The
     bar sets the role itself rather than asking callers to remember it, and
     this is what stops that quietly coming undone. It was found by axe running
     over a story, not by a test: every query by role passed, because both
     elements did report the role they were asked for. */
  it('presents its triggers as menuitems, which is what a menubar may contain', () => {
    renderWithCrystal(<Bar />);
    const bar = screen.getByRole('menubar', { name: 'Document' });
    const items = screen.getAllByRole('menuitem');
    expect(items.map((item) => item.textContent)).toEqual(['File', 'Edit', 'View']);
    for (const item of items) expect(item.closest('[role="menubar"]')).toBe(bar);
    /* And nothing generic in between: a plain element between the bar and its
       items breaks the same rule the roles were set to satisfy. */
    for (const item of items) {
      let node = item.parentElement;
      while (node && node !== bar) {
        expect(node.getAttribute('role')).toBe('none');
        node = node.parentElement;
      }
    }
  });
});

import { describe, expect, it, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { expectNoAxeViolations } from '../../test/axe.js';
import { renderWithCrystal, screen, waitFor } from '../../test/render.js';
import { Menu, MenuItem, MenuGroup, MenuSeparator, MenuTrigger, Submenu, ContextMenu } from './Menu.js';
import { Button } from '../Button/Button.js';
import { Dialog } from '../Dialog/Dialog.js';

const Simple = (
  <MenuTrigger>
    <Button>Actions</Button>
    <Menu label="Actions">
      <MenuGroup label="Edit">
        <MenuItem id="cut" shortcut="⌘X">Cut</MenuItem>
        <MenuItem id="copy" shortcut="⌘C">Copy</MenuItem>
      </MenuGroup>
      <MenuSeparator />
      <MenuItem id="delete" isDestructive>Delete</MenuItem>
    </Menu>
  </MenuTrigger>
);

describe('Menu', () => {
  it('opens, names its groups and carries its shortcuts', async () => {
    renderWithCrystal(Simple);
    await userEvent.click(screen.getByRole('button', { name: 'Actions' }));

    expect(screen.getByRole('menu', { name: 'Actions' })).toBeInTheDocument();
    expect(screen.getAllByRole('menuitem')).toHaveLength(3);
    /* Announced as the shortcut rather than read as loose text beside the label. */
    expect(screen.getByRole('menuitem', { name: /Cut/ }).textContent).toContain('⌘X');
  });

  /* Crystal's one exception: a check mark in a menu means checked. Everywhere
     else it means validated, and selection is label weight. */
  it('reports a checkable item as checked rather than selected', async () => {
    renderWithCrystal(
      <MenuTrigger>
        <Button>View</Button>
        <Menu label="View" selectionMode="multiple" selectedKeys={new Set(['grid'])}>
          <MenuItem id="grid" isChecked>Grid</MenuItem>
          <MenuItem id="list" isChecked={false}>List</MenuItem>
        </Menu>
      </MenuTrigger>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'View' }));
    const grid = screen.getByRole('menuitemcheckbox', { name: 'Grid' });
    expect(grid.getAttribute('aria-checked')).toBe('true');
    expect(screen.getByRole('menuitemcheckbox', { name: 'List' }).getAttribute('aria-checked')).toBe('false');
  });

  it('runs an item and closes', async () => {
    const onAction = vi.fn();
    renderWithCrystal(
      <MenuTrigger>
        <Button>Actions</Button>
        <Menu label="Actions"><MenuItem id="go" onAction={onAction}>Go</MenuItem></Menu>
      </MenuTrigger>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Actions' }));
    await userEvent.click(screen.getByRole('menuitem', { name: 'Go' }));
    expect(onAction).toHaveBeenCalledOnce();
    await waitFor(() => expect(screen.queryByRole('menu')).toBeNull());
  });

  it('opens a submenu from the keyboard', async () => {
    renderWithCrystal(
      <MenuTrigger>
        <Button>Actions</Button>
        <Menu label="Actions">
          <Submenu label="Share">
            <Menu label="Share"><MenuItem id="link">Copy link</MenuItem></Menu>
          </Submenu>
        </Menu>
      </MenuTrigger>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Actions' }));
    await userEvent.keyboard('{ArrowDown}{ArrowRight}');
    await waitFor(() => {
      expect(screen.getByRole('menuitem', { name: 'Copy link' })).toBeInTheDocument();
    });
  });

  /* Resin never contains Resin. A menu on the page floats above it; the same menu
     inside a dialog is floating above Haze, so it recesses rather than stacking a
     second pane of the same glass. The DOM cannot tell — every overlay is
     portalled to `body` — so the decision travels by React context. */
  it('steps down to Haze inside a dialog', async () => {
    renderWithCrystal(
      <>
        {Simple}
        <Dialog title="Settings" isOpen>
          <MenuTrigger>
            <Button>Nested actions</Button>
            <Menu label="Nested actions"><MenuItem id="a">One</MenuItem></Menu>
          </MenuTrigger>
        </Dialog>
      </>,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Nested actions' }));
    const nested = screen.getByRole('menu', { name: 'Nested actions' })
      .closest('[data-cr-overlay]');
    expect(nested?.getAttribute('data-cr-overlay')).toBe('haze');
  });

  it('is Frost on the page: a transient overlay is a panel, not a control (R15e)', async () => {
    renderWithCrystal(Simple);
    await userEvent.click(screen.getByRole('button', { name: 'Actions' }));
    expect(
      screen.getByRole('menu').closest('[data-cr-overlay]')?.getAttribute('data-cr-overlay'),
    ).toBe('frost');
  });

  it('has no axe violations when open', async () => {
    renderWithCrystal(Simple);
    await userEvent.click(screen.getByRole('button', { name: 'Actions' }));
    await expectNoAxeViolations(document.body);
  });
});

describe('ContextMenu', () => {
  const subject = (
    <ContextMenu menu={(anchor) => (
      <Menu label="File" triggerRef={anchor}>
        <MenuItem id="rename">Rename</MenuItem>
      </Menu>
    )}
    >
      <button type="button">Right-click me</button>
    </ContextMenu>
  );

  it('opens on right-click at the pointer', async () => {
    renderWithCrystal(subject);
    await userEvent.pointer({ keys: '[MouseRight]', target: screen.getByRole('button', { name: 'Right-click me' }) });
    await waitFor(() => expect(screen.getByRole('menu', { name: 'File' })).toBeInTheDocument());
  });

  /* The half that is usually missing. Shift+F10 and the Menu key are how a
     context menu is opened without a mouse, on every operating system; one that
     answers only the right button is a feature a keyboard user does not have.
     The keystroke reaches the region by bubbling, so something inside has to be
     focusable — which is the documented requirement, not an accident of this
     test. */
  it('opens with Shift+F10', async () => {
    renderWithCrystal(subject);
    screen.getByRole('button', { name: 'Right-click me' }).focus();
    await userEvent.keyboard('{Shift>}{F10}{/Shift}');
    await waitFor(() => expect(screen.getByRole('menu', { name: 'File' })).toBeInTheDocument());
  });

  it('opens with the Menu key', async () => {
    renderWithCrystal(subject);
    screen.getByRole('button', { name: 'Right-click me' }).focus();
    await userEvent.keyboard('{ContextMenu}');
    await waitFor(() => expect(screen.getByRole('menu', { name: 'File' })).toBeInTheDocument());
  });
});

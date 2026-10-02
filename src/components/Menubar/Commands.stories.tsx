import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Menu, MenuItem, MenuTrigger, Popover } from 'react-aria-components';
import { only } from '../../../.storybook/environment.js';
import { Menubar } from './Menubar.js';
import { Button } from '../Button/Button.js';
import { NavigationMenu } from '../NavigationMenu/NavigationMenu.js';
import { Burger } from '../Burger/Burger.js';
import { Anchor } from '../Anchor/Anchor.js';
import { Stack } from '../Stack/Stack.js';

const menus = {
  File: ['New', 'Open…', 'Save'],
  Edit: ['Undo', 'Cut', 'Paste'],
  View: ['Zoom in', 'Zoom out', 'Full screen'],
};

const sections = [
  {
    id: 'product',
    label: 'Product',
    children: (
      <Stack gap="sm">
        <Anchor href="#overview">Overview</Anchor>
        <Anchor href="#materials">Materials</Anchor>
        <Anchor href="#components">Components</Anchor>
      </Stack>
    ),
  },
  {
    id: 'developers',
    label: 'Developers',
    children: (
      <Stack gap="sm">
        <Anchor href="#install">Install</Anchor>
        <Anchor href="#tokens">Tokens</Anchor>
        <Anchor href="#contract">Parity contract</Anchor>
      </Stack>
    ),
  },
];

const triggers = Object.entries(menus).map(([name, items]) => (
  <MenuTrigger key={name}>
    <Button variant="quiet">{name}</Button>
    <Popover>
      <Menu aria-label={name}>
        {items.map((item) => <MenuItem key={item} id={item}>{item}</MenuItem>)}
      </Menu>
    </Popover>
  </MenuTrigger>
));

const meta = {
  title: 'Navigation/Menu bars',
  component: Menubar,
  args: { 'aria-label': 'Document', children: triggers },
  argTypes: {
    'aria-label': { control: 'text', table: { category: 'Menubar' } },
    children: { control: false, table: { category: 'Menubar' } },
  },
  parameters: {
    docs: {
      description: {
        component:
          '**A menu bar is one tab stop, not one per trigger.** Tab reaches the bar, the arrow keys '
          + 'move inside it, and Tab again leaves it, so a ten-item bar costs one press to pass '
          + 'instead of ten. That is the reason `role="menubar"` exists, and a row of plain buttons '
          + 'does not do it.\n\n'
          + '**A menu bar and a navigation menu are different components.** A menu bar holds '
          + 'commands: `menuitem`s that do something to the thing on screen. A navigation menu holds '
          + 'links: ordinary anchors, announced as a navigation landmark, which a screen reader lists '
          + 'with the page\'s other landmarks. A menu bar is never listed there. Borrowing '
          + '`role="menu"` for a set of links is the most common way a site becomes unusable with a '
          + 'screen reader while passing every automated check.\n\n'
          + 'The burger is a disclosure, so its name does not change with its state. `aria-expanded` '
          + 'carries that. Renaming it "Close menu" when it opens re-announces it as a different '
          + 'control, and a user tracking it by name loses it.',
      },
    },
  },
} satisfies Meta<typeof Menubar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Bar: Story = {
  render: (args) => <Menubar {...only(args)} />,
};

export const Sections: Story = {
  name: 'Navigation menu',
  render: () => <NavigationMenu sections={sections} aria-label="Site" />,
};

/* Controlled, because the component is: the caller owns whether the navigation
   is open, and the story shows that contract. */
export const Disclosure: Story = {
  name: 'Burger',
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <Stack gap="md">
        <Burger isOpen={open} onOpenChange={setOpen} controls="burger-nav" label="Navigation" />
        <div id="burger-nav" hidden={!open}>
          <NavigationMenu sections={sections} aria-label="Site" />
        </div>
      </Stack>
    );
  },
};

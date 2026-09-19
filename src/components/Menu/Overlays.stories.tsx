import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Menu, MenuItem, MenuGroup, MenuSeparator, MenuTrigger, Submenu, ContextMenu } from './Menu.js';
import { Popover, PopoverTrigger } from '../Popover/Popover.js';
import { Tooltip, TooltipTrigger } from '../Tooltip/Tooltip.js';
import { Button } from '../Button/Button.js';
import { IconButton } from '../IconButton/IconButton.js';
import { Dialog } from '../Dialog/Dialog.js';
import { Stack, Group } from '../Stack/Stack.js';
import { Text } from '../Text/Text.js';

const meta = {
  title: 'Overlays/Anchored surfaces',
  parameters: {
    docs: {
      description: {
        component:
          '**Resin never contains Resin.** A menu opened from the page floats above it and is Resin. '
          + 'The same menu opened inside a dialog is floating above Haze, and a second pane of the same '
          + 'glass reads as neither pane — so it recesses into Haze instead.\n\n'
          + 'The decision is made in React, not in CSS, because the DOM cannot make it: every overlay is '
          + 'portalled to a container on `body` and loses its nesting on the way there. A `Dialog` declares '
          + 'the material it presents and an overlay anywhere inside it reads that through context, which '
          + 'follows the element tree rather than the document.\n\n'
          + 'The arrow is a rotated square carrying the overlay\'s own material, not an SVG filled with its '
          + 'colour: a diffusing surface and a flat triangle of the same nominal fill do not match, and the '
          + 'mismatch lands exactly where the eye is looking.',
      },
    },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const Actions = ({ label }: { label: string }) => (
  <MenuTrigger>
    <Button>{label}</Button>
    <Menu label={label}>
      <MenuGroup label="Edit">
        <MenuItem id="cut" shortcut="⌘X">Cut</MenuItem>
        <MenuItem id="copy" shortcut="⌘C">Copy</MenuItem>
        <MenuItem id="paste" shortcut="⌘V" isDisabled>Paste</MenuItem>
      </MenuGroup>
      <MenuSeparator />
      <Submenu label="Share">
        <Menu label="Share">
          <MenuItem id="link">Copy link</MenuItem>
          <MenuItem id="email">Send by email</MenuItem>
        </Menu>
      </Submenu>
      <MenuSeparator />
      <MenuItem id="delete" isDestructive>Delete permanently</MenuItem>
    </Menu>
  </MenuTrigger>
);

/** A menu, a popover and a tooltip on the page: all Resin. */
export const OnThePage: Story = {
  render: () => (
    <Group gap="md">
      <Actions label="Actions" />
      <PopoverTrigger>
        <Button variant="quiet">Details</Button>
        <Popover label="Details" hasArrow>
          <Stack gap="xs">
            <Text weight="strong">Seven files, 2.4 MB</Text>
            <Text tone="muted">Last changed on Tuesday by Ada.</Text>
          </Stack>
        </Popover>
      </PopoverTrigger>
      <TooltipTrigger>
        <IconButton
          label="Refresh"
          icon={<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 12a9 9 0 11-3-6.7M21 4v5h-5" /></svg>}
        />
        <Tooltip>Fetch the latest from the server</Tooltip>
      </TooltipTrigger>
    </Group>
  ),
};

/** The same menu inside a dialog. It recesses to Haze rather than stacking glass. */
export const InsideADialog: Story = {
  render: function InsideADialog() {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button onPress={() => setOpen(true)}>Open a dialog</Button>
        <Dialog title="Share this project" isOpen={open} onOpenChange={setOpen}>
          <Stack gap="md">
            <Text>
              A menu opened here is floating above Haze, not above the page, so it
              recesses instead of stacking a second pane of the same glass.
            </Text>
            <Group gap="md">
              <Actions label="Actions" />
              <PopoverTrigger>
                <Button variant="quiet">Details</Button>
                <Popover label="Details" hasArrow>
                  <Text>Also Haze, for the same reason.</Text>
                </Popover>
              </PopoverTrigger>
            </Group>
          </Stack>
        </Dialog>
      </>
    );
  },
};

/** Right-click, or Shift+F10 — the keyboard route is not optional. */
export const OnRightClick: Story = {
  render: () => (
    <ContextMenu menu={(anchor) => (
      <Menu label="File" triggerRef={anchor}>
        <MenuItem id="open">Open</MenuItem>
        <MenuItem id="rename">Rename…</MenuItem>
        <MenuSeparator />
        <MenuItem id="delete" isDestructive>Delete</MenuItem>
      </Menu>
    )}
    >
      <Stack gap="xs">
        <Text tone="muted">Right-click the button, or focus it and press Shift+F10.</Text>
        <Button variant="quiet">proposal.pdf</Button>
      </Stack>
    </ContextMenu>
  ),
};

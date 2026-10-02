import type { Meta, StoryObj } from '@storybook/react-vite';
import { ariaArgTypes } from '../../../.storybook/react-aria.js';
import type { DrawerProps } from './Drawer.js';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { useState } from 'react';
import { Drawer, type DrawerPlacement } from './Drawer.js';
import { Button } from '../Button/Button.js';
import { Stack, Group } from '../Stack/Stack.js';
import { Text } from '../Text/Text.js';
import { TextInput } from '../TextInput/TextInput.js';

const meta = {
  title: 'Overlays/Drawer',
  /* Without this, docgen has nothing to read and Storybook generates no
     controls. This file shows several components together. The one named here
     is its subject, and the others are the context it is normally seen in. */
  component: Drawer,
  /* The callbacks as actions, so the Actions panel shows what fired and with
     what. They are declared by hand because this Storybook uses `react-docgen`,
     not `react-docgen-typescript` (see `.storybook/main.ts`), and react-docgen
     reads a component's own interface without resolving what it extends. Every
     callback here is inherited from a React Aria interface, so docgen cannot
     see any of them. Each was checked against the compiler. */
  argTypes: {
    ...ariaArgTypes<DrawerProps>({
      isOpen: true,
      onOpenChange: true,
    }),
  },
  args: { title: 'Filters', placement: 'end' as const, isModal: true, onOpenChange: fn() },
  parameters: {
    docs: {
      description: {
        component:
          'Modality must be real, not implied. A common drawer draws a dark wash over the '
          + 'page and does nothing else. The wash makes the page look unavailable, but a keyboard '
          + 'user tabs past the drawer into the page. `isModal` chooses between two different '
          + 'constructions, not two appearances. One is a dialog with focus contained, the page '
          + 'inert and a Mirage scrim. The other is a `complementary` landmark with no scrim, no '
          + 'focus trap and no scroll lock. You cannot ask for one\'s appearance with the '
          + 'other\'s behaviour.\n\n'
          + 'The panel is Frost, not Haze. That separates a drawer from a dialog. A dialog is '
          + 'content to be read in the middle of the page and takes an 80% content fill. A drawer '
          + 'is a surface the page grew, attached to an edge.\n\n'
          + 'The radius is on the inner edges only. The outer edge is flush against the '
          + 'viewport, and rounding it would show a sliver of page through a corner that belongs '
          + 'to the screen.\n\n'
          + 'Crystal authors one drawer recipe, arriving from the right. Every other edge and '
          + 'every right-to-left page uses that same authored movement, spring included, pointed '
          + 'somewhere else. Three more recipes would be three more specifications.',
      },
    },
  },
} satisfies Meta<typeof Drawer>;

export default meta;
type Story = StoryObj<typeof meta>;

function Openable({ placement, isModal }: { placement: DrawerPlacement; isModal: boolean }): React.JSX.Element {
  const [isOpen, setOpen] = useState(false);
  return (
    <>
      <Button onPress={() => { setOpen(true); }}>Open the {placement} drawer</Button>
      <Drawer title="Filters" placement={placement} isModal={isModal} isOpen={isOpen} onOpenChange={setOpen}>
        <Stack gap="md">
          <TextInput label="Search" />
          <Text>Everything here is reachable; nothing outside is, while this is modal.</Text>
          <Button>Apply</Button>
        </Stack>
      </Drawer>
    </>
  );
}

export const Modal: Story = {
  render: () => (
    <Stack gap="md">
      <Text>Open it, then press Tab repeatedly. Focus never leaves the panel.</Text>
      <Group gap="sm">
        <Button>A control on the page</Button>
        <Button>Another</Button>
      </Group>
      <Openable placement="end" isModal />
    </Stack>
  ),
};

/* Modality gets its own story, for the same reason the tree's keyboard model
   does. `verify-behaviour` probes `overlays-drawer--modal`, and a `play`
   function runs whenever a story loads, so the gate could arrive while the play
   function was still pressing Escape. A story that a measurement gate probes
   carries no play function. */
export const ModalFocus: Story = {
  name: 'Modality, asserted',
  render: () => (
    <Stack gap="md">
      <Text>Open it, then press Tab repeatedly. Focus never leaves the panel.</Text>
      <Group gap="sm">
        <Button>A control on the page</Button>
        <Button>Another</Button>
      </Group>
      <Openable placement="end" isModal />
    </Stack>
  ),
  /* Modality in both directions. React Aria marks a modal open by making
     everything behind it `inert`, not by setting `aria-modal`, so the check is
     whether the page behind went inert and whether it came back. A test that
     only checks the first half passes on a drawer that never releases the page. */
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const behind = canvas.getByRole('button', { name: 'A control on the page' });
    await step('the page behind goes inert while it is open', async () => {
      await userEvent.click(canvas.getByRole('button', { name: /open/i }));
      await waitFor(async () => {
        await expect(document.querySelector('[role="dialog"]')).toBeTruthy();
      });
      await expect(behind.closest('[inert]')).toBeTruthy();
    });
    await step('and comes back when it closes', async () => {
      await userEvent.keyboard('{Escape}');
      await waitFor(async () => {
        await expect(document.querySelector('[role="dialog"]')).toBeNull();
      });
      await expect(behind.closest('[inert]')).toBeNull();
    });
  },
};

export const EveryEdge: Story = {
  render: () => (
    <Group gap="sm">
      <Openable placement="start" isModal />
      <Openable placement="end" isModal />
      <Openable placement="top" isModal />
      <Openable placement="bottom" isModal />
    </Group>
  ),
};

/* No scrim, no focus trap and no scroll lock. Its role is `complementary`, not
   `dialog`. */
export const NotModal: Story = {
  render: function NotModalStory() {
    const [isOpen, setOpen] = useState(true);
    return (
      <div style={{ display: 'flex', gap: 'var(--cr-space)', alignItems: 'start' }}>
        <main style={{ flex: 1 }}>
          <Stack gap="md">
            <Text>The page beside an inspector keeps working. Tab into it and back out.</Text>
            <Button onPress={() => { setOpen((open) => !open); }}>Toggle the inspector</Button>
            <Button>A control on the page</Button>
          </Stack>
        </main>
        <Drawer title="Inspector" isModal={false} isOpen={isOpen} onOpenChange={setOpen}>
          <Stack gap="md">
            <TextInput label="Name" />
            <Text>Nothing here traps focus.</Text>
          </Stack>
        </Drawer>
      </div>
    );
  },
};

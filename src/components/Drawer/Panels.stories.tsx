import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { useState } from 'react';
import { Drawer, type DrawerPlacement } from './Drawer.js';
import { Button } from '../Button/Button.js';
import { Stack, Group } from '../Stack/Stack.js';
import { Text } from '../Text/Text.js';
import { TextInput } from '../TextInput/TextInput.js';

const meta = {
  title: 'Overlays/Drawer',
  /* Without this docgen has nothing to read and Storybook generates no
     controls at all — the message Meridian screenshotted. This file shows
     several components together; the one named here is its subject, and the
     others are the context it is normally seen in. */
  component: Drawer,
  /* The callbacks as actions, so the Actions panel shows what fired and with
     what. They are declared by hand because this Storybook uses `react-docgen`
     rather than `react-docgen-typescript` — see `.storybook/main.ts` — and
     react-docgen reads a component's own interface without resolving what it
     extends. Every callback here is inherited from a React Aria interface, so
     docgen cannot see one of them. Each was checked against the compiler
     before being written down. */
  argTypes: {
    onOpenChange: { action: 'onOpenChange', table: { category: 'Events' } },
  },
  args: { title: 'Filters', placement: 'end' as const, isModal: true, onOpenChange: fn() },
  parameters: {
    docs: {
      description: {
        component:
          '**Modality must be real, not implied.** The usual drawer draws a dark wash over the '
          + 'page and stops there: the wash looks like the page is unavailable, and a keyboard '
          + 'user tabs straight past the drawer into it. `isModal` chooses between two genuinely '
          + 'different constructions rather than two appearances — a dialog with focus contained, '
          + 'the page inert and a Mirage scrim, or a `complementary` landmark with no scrim, no '
          + 'focus trap and no scroll lock. There is no way to ask for one\'s look with the '
          + 'other\'s behaviour.\n\n'
          + '**The panel is Frost, not Haze.** That is what separates a drawer from a dialog: a '
          + 'dialog is content to be read in the middle of the page and takes an 80% content '
          + 'fill; a drawer is a surface the page grew, attached to an edge.\n\n'
          + '**The radius is on the inner edges only.** The outer edge is flush against the '
          + 'viewport, and rounding it would show a sliver of page through a corner that is '
          + 'supposed to be the screen\'s own.\n\n'
          + '**Crystal authors one drawer recipe, arriving from the right.** Every other edge and '
          + 'every right-to-left page is that same authored movement pointed somewhere else, '
          + 'spring and all — not three more recipes, which would be three more specifications.',
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
  /* Modality, in both directions, which is the assertion that matters and the
     one a unit test keeps getting wrong. React Aria marks a modal open by making
     everything behind it `inert` — not by `aria-modal` — so the check is whether
     the page behind actually went inert, and whether it came back. A test that
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

/* No scrim, no focus trap, no scroll lock — and it says `complementary` rather
   than `dialog`, because that is what it is. */
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

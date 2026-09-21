import type { Meta, StoryObj } from '@storybook/react-vite';
import { ariaArgTypes } from '../../../.storybook/react-aria.js';
import type { CommandPaletteProps } from './CommandPalette.js';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { useState } from 'react';
import { CommandPalette, type Command } from './CommandPalette.js';
import { Button } from '../Button/Button.js';
import { Stack } from '../Stack/Stack.js';
import { Text } from '../Text/Text.js';

const commands: Command[] = [
  { id: 'open', label: 'Open file…', shortcut: '⌘O', section: 'File' },
  { id: 'save', label: 'Save', shortcut: '⌘S', section: 'File' },
  { id: 'saveAs', label: 'Save as…', shortcut: '⇧⌘S', section: 'File' },
  { id: 'theme', label: 'Toggle dark mode', description: 'Switch between the light and dark appearance', section: 'View' },
  { id: 'zen', label: 'Enter focus mode', shortcut: '⌘K Z', section: 'View' },
  { id: 'palette', label: 'Change palette', description: 'Prism, Fuchsia, Cobalt, Ion, Amethyst, Harbor', section: 'View' },
  { id: 'help', label: 'Keyboard shortcuts', shortcut: '⌘/' },
];

const meta = {
  title: 'Overlays/Command palette',
  /* Without this docgen has nothing to read and Storybook generates no
     controls at all — the message Meridian screenshotted. This file shows
     several components together; the one named here is its subject, and the
     others are the context it is normally seen in. */
  component: CommandPalette,
  /* Every callback as an action, so the Actions panel shows what fired
     and with what. For a library whose whole subject is behaviour, the
     panel that shows behaviour happening was blank. */
  argTypes: {
    ...ariaArgTypes<CommandPaletteProps>({
      isOpen: true,
      label: true,
      onAction: true,
      onOpenChange: true,
      placeholder: true,
    }),
  },
  args: { commands, onAction: fn(), label: 'Run a command' },
  parameters: {
    docs: {
      description: {
        component:
          '**Three materials, and the catalogue names each: Mirage scrim, Haze decision surface, '
          + 'Resin field shell.** The palette is a surface you read and decide from rather than a '
          + 'control plane floating over the page, so it is Haze; what lifts it off the page is the '
          + 'Mirage beneath rather than elevation above. The field inside it is a control, so it '
          + 'is Resin — the ordinary field stack, not Resin inside Resin.\n\n'
          + '**Focus never leaves the search field.** Arrow through the list and the caret stays '
          + 'where you are typing; the highlighted row is named by `aria-activedescendant`. Every '
          + 'palette that moves real focus into the list breaks typing, and most of them do.\n\n'
          + '**Searching, empty and loading are three different things.** A list showing nothing '
          + 'is indistinguishable from one still thinking, and both are indistinguishable from a '
          + 'broken palette. Each says which it is, in text.',
      },
    },
  },
} satisfies Meta<typeof CommandPalette>;

export default meta;
type Story = StoryObj<typeof meta>;


function Palette({ isLoading = false, registry = commands }: { isLoading?: boolean; registry?: Command[] }): React.JSX.Element {
  const [isOpen, setOpen] = useState(false);
  const [last, setLast] = useState<string | null>(null);
  return (
    <Stack gap="md">
      <Button onPress={() => { setOpen(true); }}>Open the palette</Button>
      <Text>{last ? `Ran: ${last}` : 'Nothing run yet.'}</Text>
      <CommandPalette
        commands={registry}
        isOpen={isOpen}
        onOpenChange={setOpen}
        isLoading={isLoading}
        onAction={(id) => { setLast(String(id)); setOpen(false); }}
      />
    </Stack>
  );
}

export const Palette_: Story = {
  name: 'Palette',
  render: () => <Palette />,
};

/* Type-ahead and focus containment, in a story of its own. `verify-theme` opens
   `--palette` to ask an overlay which custom properties resolve on it, and a
   `play` that opens and then closes the palette leaves that gate racing a
   dialog. The first response to this was to make the gate tolerate a palette
   that was already open, which is accommodating the problem rather than fixing
   it. */
export const PaletteKeyboard: Story = {
  name: 'Keyboard navigation',
  render: () => <Palette />,
  /* The requirement every hand-built palette breaks, watched in a browser:
     focus stays in the search field while the arrow keys move the list, and the
     highlighted row is named by `aria-activedescendant`. Move real focus into
     the list and typing stops working — the user has to arrow back up to keep
     searching — and a jsdom test can assert the attribute without ever proving
     the caret stayed put. */
  play: async ({ step }) => {
    const screen = within(document.body);
    await userEvent.click(screen.getByRole('button', { name: /open the palette/i }));
    const search = await screen.findByRole('searchbox');
    await step('typing filters the list', async () => {
      await userEvent.type(search, 'save');
      await waitFor(async () => {
        await expect(screen.getAllByRole('option').length).toBeLessThan(commands.length);
      });
    });
    await step('the arrow keys move the list and leave the caret alone', async () => {
      await userEvent.keyboard('{ArrowDown}');
      await expect(search).toHaveFocus();
      await waitFor(async () => {
        await expect(search.getAttribute('aria-activedescendant')).toBeTruthy();
      });
      const active = document.getElementById(search.getAttribute('aria-activedescendant')!);
      await expect(active).toHaveAttribute('role', 'option');
    });
    await userEvent.keyboard('{Escape}');
  },
};

/* Type something that matches nothing. The message says which of the three
   reasons an empty list has. */
export const Empty: Story = { render: () => <Palette registry={[{ id: 'only', label: 'The only command' }]} /> };

export const Loading: Story = { render: () => <Palette isLoading registry={[]} /> };

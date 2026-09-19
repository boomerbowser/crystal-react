import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { CommandPalette, type Command } from './CommandPalette.js';
import { Button } from '../Button/Button.js';
import { Stack } from '../Stack/Stack.js';
import { Text } from '../Text/Text.js';

const meta = {
  title: 'Overlays/Command palette',
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
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const commands: Command[] = [
  { id: 'open', label: 'Open file…', shortcut: '⌘O', section: 'File' },
  { id: 'save', label: 'Save', shortcut: '⌘S', section: 'File' },
  { id: 'saveAs', label: 'Save as…', shortcut: '⇧⌘S', section: 'File' },
  { id: 'theme', label: 'Toggle dark mode', description: 'Switch between the light and dark appearance', section: 'View' },
  { id: 'zen', label: 'Enter focus mode', shortcut: '⌘K Z', section: 'View' },
  { id: 'palette', label: 'Change palette', description: 'Prism, Fuchsia, Cobalt, Ion, Amethyst, Harbor', section: 'View' },
  { id: 'help', label: 'Keyboard shortcuts', shortcut: '⌘/' },
];

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

export const Palette_: Story = { name: 'Palette', render: () => <Palette /> };

/* Type something that matches nothing. The message says which of the three
   reasons an empty list has. */
export const Empty: Story = { render: () => <Palette registry={[{ id: 'only', label: 'The only command' }]} /> };

export const Loading: Story = { render: () => <Palette isLoading registry={[]} /> };

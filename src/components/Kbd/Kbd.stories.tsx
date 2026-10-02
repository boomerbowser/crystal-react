import type { Meta, StoryObj } from '@storybook/react-vite';
import { only } from '../../../.storybook/environment.js';
import { Kbd } from './Kbd.js';

const meta = {
  title: 'Data display/Keyboard key',
  component: Kbd,
  parameters: {
    docs: {
      description: {
        component:
          'A Resin cap with a defined lower rim. Resin already carries two optical rims, and the '
          + 'extra inset highlight underneath makes the cap read as a key you could press. A real '
          + '`kbd` element, for its semantics. Key names are spelled, not drawn as symbols alone: '
          + 'a cap reading "⌘" tells a screen-reader user nothing and a Windows user the wrong '
          + 'thing, so `name` is announced in its place.',
      },
    },
  },
  args: { children: 'Enter' },
} satisfies Meta<typeof Kbd>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** The glyph is shown, the word is announced. */
export const ASymbolWithItsName: Story = {
  args: { children: '⌘', name: 'Command' },
};

/** In a sentence, where the cap must not disturb the line's rhythm. */
export const InAShortcut: Story = {
  render: (args) => (
    <p>
      Press <Kbd {...only(args)}>⌘</Kbd> <Kbd {...only(args)}>K</Kbd> to open the command palette.
    </p>
  ),
};

import type { Meta, StoryObj } from '@storybook/react-vite';
import { TextBalance } from './TextBalance.js';

const meta = {
  title: 'Typography/TextBalance',
  component: TextBalance,
  parameters: {
    docs: {
      description: {
        component:
          'Even lines rather than a long first line and one word on the second. Purely visual: the '
          + 'text is the same string, and the browser only chooses the break points. `balance` for '
          + 'short, prominent text; `pretty` for longer runs, where the goal is not a single-word '
          + 'last line. Where `text-wrap` is unsupported the text wraps as it always did.',
      },
    },
  },
  args: {
    as: 'p',
    mode: 'balance',
    children: 'Everything your team needs to plan the quarter, in one place and in one order',
    style: { maxInlineSize: 360, fontSize: 24, fontWeight: 800, lineHeight: 1.25, margin: 0 },
  },
} satisfies Meta<typeof TextBalance>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A heading-like line, balanced. */
export const Balanced: Story = {};
/** A longer run, where only the last line is protected. */
export const Pretty: Story = {
  args: {
    mode: 'pretty',
    children: 'The quarter closes on Friday. Figures are due the Wednesday before, so the board sees '
      + 'them with a day to spare, and anything late goes into the next pack rather than this one.',
    style: { maxInlineSize: 420, margin: 0 },
  },
};

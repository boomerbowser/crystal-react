import type { Meta, StoryObj } from '@storybook/react-vite';
import { only } from '../../../.storybook/environment.js';
import { crystalTokens } from '../../theme/tokens.generated.js';
import { StatusBadge, type StatusBadgeStatus } from './StatusBadge.js';

const meta = {
  title: 'Data display/Status badge',
  component: StatusBadge,
  parameters: {
    docs: {
      description: {
        component:
          'A semantic symbol in a circular well, followed by a visible word. The pill is Resin with '
          + 'ordinary text and the tint lives on the well alone. A status-coloured pill would make '
          + 'the word decoration on a coloured ground, and a status-coloured perimeter is the shape '
          + 'Crystal uses for focus. Success uses a check mark, which is the one legitimate use of '
          + 'that glyph: information display. A check mark never means "selected".',
      },
    },
  },
  args: { status: 'success', children: crystalTokens['feedback.light.success.label'] },
} satisfies Meta<typeof StatusBadge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** The five states, with Crystal's own wording. The words are the tested labels
 *  from the token set rather than invented here, so this strip cannot drift from
 *  what the design system says these states are called. */
export const TheFiveStates: Story = {
  render: (args) => (
    <div style={{ display: 'flex', gap: 'var(--cr-space)', flexWrap: 'wrap' }}>
      {([
        ['success', crystalTokens['feedback.light.success.label']],
        ['attention', crystalTokens['feedback.light.attention.label']],
        ['danger', crystalTokens['feedback.light.danger.label']],
        ['info', crystalTokens['feedback.light.info.label']],
        ['neutral', 'Draft'],
      ] as const).map(([status, word]) => (
        <StatusBadge {...only(args)} key={status} status={status as StatusBadgeStatus}>
          {word}
        </StatusBadge>
      ))}
    </div>
  ),
};

/** Neutral is the absence of a status rather than a fifth one: the ordinary
 *  surface pair, and no symbol, because a glyph would imply a meaning the state
 *  does not have. */
export const Neutral: Story = {
  args: { status: 'neutral', children: 'Draft' },
};

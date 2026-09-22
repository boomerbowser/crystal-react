import type { Meta, StoryObj } from '@storybook/react-vite';
import { only } from '../../../.storybook/environment.js';
import { crystalTokens } from '../../theme/tokens.generated.js';
import { Indicator, type IndicatorState } from './Indicator.js';

const STATES: readonly IndicatorState[] = [
  'selection', 'current', 'busy', 'field-idle', 'field-focused', 'required', 'invalid',
];

const meta = {
  title: 'Data display/Indicator',
  component: Indicator,
  parameters: {
    docs: {
      description: {
        component:
          'A small circular mark attached to a control. It is `aria-hidden` and never a click '
          + 'target: the control beside it already carries `aria-checked`, `aria-invalid`, '
          + '`aria-current` or `aria-busy`, so a mark that announced anything would say it twice '
          + 'and a mark that could be pressed would be a second control for the same thing. '
          + 'There is no check mark in this vocabulary — selection resolves to label weight, '
          + `not a badge. Its Haze fill is the one in Crystal that is not feathered at `
          + `${crystalTokens['material.haze.feather']}: at ${crystalTokens['indicator.size']} across, that feather is a fifth of the mark's own radius.`,
      },
    },
  },
  args: { state: 'current', onField: false },
} satisfies Meta<typeof Indicator>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** The catalogue's seven states, and the two sizes. */
export const TheVocabulary: Story = {
  render: (args) => (
    <div style={{ display: 'flex', gap: 'var(--cr-space)', alignItems: 'center', flexWrap: 'wrap' }}>
      {STATES.map((state) => (
        <span key={state} style={{ display: 'inline-flex', gap: 'var(--cr-spacing-xs)', alignItems: 'center' }}>
          <Indicator {...only(args)} state={state} />
          <span style={{ fontSize: 'var(--cr-text-caption-size)', color: 'var(--cr-muted)' }}>{state}</span>
        </span>
      ))}
    </div>
  ),
};

/** 24px rather than 20px, for a mark sitting beside a field. */
export const OnAField: Story = {
  args: { state: 'field-focused', onField: true },
};

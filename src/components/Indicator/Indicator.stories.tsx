import type { Meta, StoryObj } from '@storybook/react-vite';
import { only } from '../../../.storybook/environment.js';
import { Indicator } from './Indicator.js';

/* The hosts. An indicator shows what its host says, so each story gives it one:
   a destination that is current, a control that is busy, a field shell. */
const host = { position: 'relative', display: 'inline-flex' } as const;

const meta = {
  title: 'Data display/Indicator',
  component: Indicator,
  parameters: {
    docs: {
      description: {
        component:
          'Crystal\'s `.cr-indicator`: a small Haze disc attached to a control, carrying a glyph that '
          + 'its host\'s own state switches — ● on an `aria-current` host, … on an `aria-busy` one, '
          + 'and on a field shell ○ at rest, ● focused, * required, ! invalid. It is `aria-hidden` '
          + 'and never a click target: the host already says the state, so a mark that announced '
          + 'it would say it twice. Shape rather than colour, and there is no selection kind — '
          + 'selection in Crystal is label weight, with nothing drawn beside the label.',
      },
    },
  },
  args: { kind: 'current' },
  argTypes: { kind: { control: 'inline-radio', options: ['current', 'busy', 'field'] } },
  render: (args) => (
    <a href="#inbox" aria-current="page" className="cr-button" style={host}>
      Inbox
      <Indicator {...only(args)} />
    </a>
  ),
} satisfies Meta<typeof Indicator>;

export default meta;
type Story = StoryObj<typeof meta>;

/** On a destination that is the current page. */
export const Default: Story = {};

/** Every kind on its host, and the same marks on hosts that do not carry the state. */
export const TheVocabulary: Story = {
  render: () => (
    <div style={{ display: 'grid', gap: 'var(--cr-space)', justifyItems: 'start' }}>
      <div style={{ display: 'flex', gap: 'var(--cr-space)', flexWrap: 'wrap' }}>
        <a href="#inbox" aria-current="page" className="cr-button" style={host}>Current<Indicator kind="current" /></a>
        <a href="#drafts" className="cr-button" style={host}>Not current<Indicator kind="current" /></a>
        <button type="button" aria-busy="true" className="cr-button" style={host}>Busy<Indicator kind="busy" /></button>
        <button type="button" className="cr-button" style={host}>Idle<Indicator kind="busy" /></button>
      </div>
      <div style={{ display: 'grid', gap: 'var(--cr-spacing-sm)', inlineSize: 'min(100%, 320px)' /* crystal-allow-literal: story column */ }}>
        <div className="cr-field-shell"><input className="cr-input" aria-label="At rest" placeholder="At rest" /><Indicator kind="field" /></div>
        <div className="cr-field-shell"><input className="cr-input" aria-label="Required" placeholder="Required" required /><Indicator kind="field" /></div>
        <div className="cr-field-shell"><input className="cr-input" aria-label="Invalid" aria-invalid="true" defaultValue="not an email" /><Indicator kind="field" /></div>
      </div>
    </div>
  ),
};

import type { Meta, StoryObj } from '@storybook/react-vite';
import { only } from '../../../.storybook/environment.js';
import { ThemeIcon } from './ThemeIcon.js';

/* A stand-in glyph. The library ships no icon set of its own — Crystal's icons
   come from `@crystal-ui/core` — so a story that needs a shape draws one. */
const Glyph = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path d="M4 7h16M4 12h16M4 17h10" strokeLinecap="round" />
  </svg>
);

const meta = {
  title: 'Data display/Theme icon',
  component: ThemeIcon,
  parameters: {
    docs: {
      description: {
        component:
          'An icon in a filled container, used as a visual anchor rather than an action. It looks '
          + 'exactly like an icon button, so the difference is carried by what it does: no press '
          + 'handler, no hit area, not focusable. Without a `label` it is hidden from assistive '
          + 'technology, because an anchor beside a heading that already says the same thing is '
          + 'read twice otherwise.',
      },
    },
  },
  args: { variant: 'primary', shape: 'content', children: <Glyph /> },
} satisfies Meta<typeof ThemeIcon>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** Both fills, in both shapes. */
export const FillsAndShapes: Story = {
  render: (args) => (
    <div style={{ display: 'flex', gap: 'var(--cr-space)', alignItems: 'center' }}>
      <ThemeIcon {...only(args)} variant="primary" shape="content" />
      <ThemeIcon {...only(args)} variant="primary" shape="circle" />
      <ThemeIcon {...only(args)} variant="surface" shape="content" />
      <ThemeIcon {...only(args)} variant="surface" shape="circle" />
    </div>
  ),
};

/** With a label it becomes `role="img"` and says what it means — the state for an
 *  icon that is the only thing carrying it. */
export const Named: Story = {
  args: { label: 'Archived' },
};

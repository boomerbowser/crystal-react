import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from './Button.js';

/* Every story is reachable on every theme axis through the toolbar: six
   palettes, both modes, both densities, both directions, and reduced effects.
   Nothing here hard-codes an axis, so a reviewer can take any story anywhere. */
const meta = {
  title: 'Actions/Button',
  component: Button,
  parameters: {
    docs: {
      description: {
        component:
          'An action control. Pills in every variant — `shape="card"` is Crystal\'s one '
          + 'documented exception and keeps the content radius. Press and hover motion bind to '
          + 'press *state* rather than to click, so a keyboard user gets the same feedback a '
          + 'pointer user does.',
      },
    },
  },
  args: { children: 'Save changes' },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Resin: Story = {
  args: { variant: 'resin' },
};

export const Primary: Story = {
  args: { variant: 'primary' },
};

export const Secondary: Story = {
  args: { variant: 'secondary' },
};

export const Quiet: Story = {
  args: { variant: 'quiet' },
};

/** The documented exception to pill geometry, for a button that reads as a surface. */
export const CardShaped: Story = {
  args: { shape: 'card' },
};

export const Disabled: Story = {
  args: { isDisabled: true },
};

/** Every variant together, which is how a geometry regression shows itself. */
export const AllVariants: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 'var(--cr-space)', flexWrap: 'wrap', alignItems: 'center' }}>
      <Button variant="primary">Primary</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="resin">Resin</Button>
      <Button variant="quiet">Quiet</Button>
      <Button shape="card">Card shaped</Button>
      <Button isDisabled>Disabled</Button>
    </div>
  ),
};

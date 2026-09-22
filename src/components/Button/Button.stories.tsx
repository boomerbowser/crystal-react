import type { Meta, StoryObj } from '@storybook/react-vite';
import { ariaArgTypes } from '../../../.storybook/react-aria.js';
import type { ButtonProps } from './Button.js';
import { Button } from './Button.js';

/* Every story is reachable on every theme axis through the toolbar: six
   palettes, both modes, both densities, both directions, and reduced effects.
   Nothing here hard-codes an axis, so a reviewer can take any story anywhere. */
const meta = {
  title: 'Actions/Button',
  component: Button,
  /* The callbacks as actions, so the Actions panel shows what fired and with
     what. They are declared by hand because this Storybook uses `react-docgen`
     rather than `react-docgen-typescript` — see `.storybook/main.ts` — and
     react-docgen reads a component's own interface without resolving what it
     extends. Every callback here is inherited from a React Aria interface, so
     docgen cannot see one of them. Each was checked against the compiler
     before being written down. */
  argTypes: {
    ...ariaArgTypes<ButtonProps>({
      autoFocus: false,
      isDisabled: true,
      onFocusChange: false,
      onHoverChange: false,
      onPress: true,
    }),
  },
  parameters: {
    docs: {
      description: {
        component:
          'An action control. Pills in every variant — `shape="card"` is Crystal\'s one '
          + 'documented exception and keeps the content radius. Press and hover motion bind to '
          + 'press *state* rather than to click, so a keyboard user gets the same feedback a '
          + 'pointer user does.\n\n'
          + 'One variant is tinted and the rest are not, which is what makes the tinted one read '
          + 'as primary: `primary` paints its **Haze reading fill** in `--cr-primary` with '
          + '`--cr-on-primary` as the ink, inside the same glass rim every other control has. '
          + 'The colour is in the fill rather than the perimeter — a fill painted on the button '
          + 'itself sits *behind* the inset Haze layer and shows only as a ring. `secondary`, '
          + '`quiet` and `resin` are all the base Resin surface; the names differ because what a '
          + 'caller means differs.',
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

/** The Haze reading fill in `--cr-primary`, with `--cr-on-primary` as the ink:
 *  the palette's own tested pair, 4.74 to 10.31 against the rendered composite
 *  across all six palettes and both modes. */
export const Primary: Story = {
  args: { variant: 'primary' },
};

/** The base Resin surface. Crystal's own stylesheet carries no `.secondary` fill:
 *  the modifier fills were removed from `crystal.css` once they computed
 *  identically to it. */
export const Secondary: Story = {
  args: { variant: 'secondary' },
};

/** The base Resin surface too, at Meridian's direction. It used to have no
 *  surface at all — transparent background, no rim, no shadow — which left the
 *  Haze pad painting a bare blob with no perimeter around it. */
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

import type { Meta, StoryObj } from '@storybook/react-vite';
import { CheckoutSteps } from './CheckoutSteps.js';

const meta = {
  title: 'Commerce/Checkout steps',
  component: CheckoutSteps,
  parameters: {
    docs: {
      description: {
        component:
          '"The current step is `aria-current`; **completion is stated in words**, and a check '
          + 'mark here means validated rather than selected." All three come from `Stepper`, so '
          + 'this is `Stepper` with a shape and not a second implementation. The catalogue asks '
          + 'for two drawings (circular markers on a Haze track for a stepper, pills with '
          + 'hairline connectors for this) and one set of semantics. Writing the semantics twice '
          + 'would give `aria-current` and the state wording two places to drift, and the '
          + 'wording carries the meaning to anybody not looking at the markers.\n\n'
          + 'This is the one place in Crystal the check mark glyph is right. It means validated, '
          + 'which is information display. It never means "selected".',
      },
    },
  },
  args: {
    steps: [
      { id: 'bag', label: 'Bag', state: 'complete' },
      { id: 'delivery', label: 'Delivery', state: 'complete' },
      { id: 'payment', label: 'Payment', state: 'current' },
      { id: 'confirm', label: 'Confirm', state: 'upcoming' },
    ],
  },
} satisfies Meta<typeof CheckoutSteps>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** A step that failed validation. It says "needs attention" in its name,
 *  because a warning glyph tells a reader who cannot see it nothing. */
export const WithAStepToGoBackTo: Story = {
  args: {
    steps: [
      { id: 'bag', label: 'Bag', state: 'complete' },
      { id: 'delivery', label: 'Delivery', state: 'error', description: 'Postcode not recognised' },
      { id: 'payment', label: 'Payment', state: 'current' },
      { id: 'confirm', label: 'Confirm', state: 'upcoming' },
    ],
    onNavigate: () => {},
  },
};

/** Down the page, for a narrow checkout. */
export const Vertical: Story = {
  args: {
    orientation: 'vertical',
    steps: [
      { id: 'bag', label: 'Bag', state: 'complete' },
      { id: 'delivery', label: 'Delivery', state: 'current' },
      { id: 'payment', label: 'Payment', state: 'upcoming' },
    ],
  },
};

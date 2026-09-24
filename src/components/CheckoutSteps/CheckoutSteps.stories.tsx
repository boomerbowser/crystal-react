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
          + 'mark here means validated rather than selected." All three are `Stepper`\'s, which '
          + 'is why this is `Stepper` with a shape rather than a second implementation. The '
          + 'catalogue asks for two *drawings* — circular markers on a Haze track for a '
          + 'stepper, pills with hairline connectors for this — and one set of semantics. '
          + 'Writing the semantics twice would be two places for `aria-current` and the state '
          + 'wording to drift, and the wording is what carries the meaning to anybody not '
          + 'looking at the markers.\n\n'
          + 'The check mark is the one place in Crystal this glyph is right: it means '
          + '*validated*, which is information display. It never means "selected".',
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

/** A step that failed validation. It says "needs attention" in its name, because
 *  a warning glyph is a shape and to a reader who does not see it, nothing. */
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

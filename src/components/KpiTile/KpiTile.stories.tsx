import type { Meta, StoryObj } from '@storybook/react-vite';
import { only } from '../../../.storybook/environment.js';
import { crystalTokens } from '../../theme/tokens.generated.js';
import { KpiTile } from './KpiTile.js';

const meta = {
  title: 'Data display/KPI tile',
  component: KpiTile,
  parameters: {
    docs: {
      description: {
        component:
          '"Target attainment is stated in words as well as shown." The bar is the *shown* half '
          + 'and the half that fails first: a bar near its end and a bar past its end look the '
          + 'same at a glance, and neither says whether past the end is good. So the words come '
          + 'first and the bar follows as reinforcement.\n\n'
          + '`onTarget` is the caller\'s judgement rather than a comparison this tile makes — a '
          + 'cost target is met by coming in *under* it, and a tile that decided for itself '
          + 'would report every saving as a miss. The bar is a real `progress` element, and its '
          + `treatment is Crystal's own: the ${crystalTokens['slider.trackHeight']} band at the pill radius that \`crystal.css\` `
          + 'already gives the range control. When slice L ships `progress`, this composes it.',
      },
    },
  },
  args: {
    label: 'Revenue',
    value: '£48,210',
    target: '£45,000 target',
    attainment: 1.07,
    attainmentLabel: '107% of target, on target',
    onTarget: true,
  },
} satisfies Meta<typeof KpiTile>;

export default meta;
type Story = StoryObj<typeof meta>;

export const OnTarget: Story = {};

/** Under the target, said in words. The bar does not turn red: attainment is
 *  never carried by colour here. */
export const OffTarget: Story = {
  args: {
    label: 'New subscribers',
    value: '612',
    target: '1,000 target',
    attainment: 0.612,
    attainmentLabel: '61% of target, behind',
    onTarget: false,
  },
};

/** A cost target is met by coming in *under* it — which is why the judgement is
 *  the caller's and not a comparison. */
export const ACostTarget: Story = {
  args: {
    label: 'Cost per acquisition',
    value: '£18.40',
    target: '£25.00 ceiling',
    attainment: 0.736,
    attainmentLabel: '26% under the ceiling, on target',
    onTarget: true,
  },
};

export const Loading: Story = {
  render: (args) => <KpiTile {...only(args)} loading />,
};

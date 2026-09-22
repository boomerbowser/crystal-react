import type { Meta, StoryObj } from '@storybook/react-vite';
import { crystalTokens } from '../../theme/tokens.generated.js';
import { Accordion } from './Accordion.js';

const items = [
  { id: 'shipping', title: 'When will my order arrive?', children: 'Two to four working days in the UK, five to nine elsewhere.' },
  { id: 'returns', title: 'What is the returns window?', children: 'Thirty days, unopened, with the receipt.' },
  { id: 'support', title: 'How do I reach somebody?', children: 'Reply to any order email and a person will read it.' },
];

const meta = {
  title: 'Data display/Accordion',
  component: Accordion,
  parameters: {
    docs: {
      description: {
        component:
          'Disclosure rows on Haze. React Aria owns the part that is easy to get subtly wrong: the '
          + 'header is a real button carrying `aria-expanded` and `aria-controls`, the panel is '
          + 'associated back to it, and `DisclosureGroup` keeps `expandedKeys` in one place — which '
          + 'is what makes "only one at a time" a property of the group rather than of five rows '
          + `each watching the others. Crystal owns the material, the ${crystalTokens['action.minTarget']} header, and the rule `
          + 'that the chevron\'s rotation is a CSS end state: `icon-turn` plays it, but the turned '
          + 'chevron is correct at rest whether or not the recipe ran.',
      },
    },
  },
  args: { items },
} satisfies Meta<typeof Accordion>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const OneOpenToStart: Story = {
  args: { defaultExpandedKeys: ['shipping'] },
};

/** Several at once, which is a property of the group. */
export const SeveralOpen: Story = {
  args: { allowsMultipleExpanded: true, defaultExpandedKeys: ['shipping', 'returns'] },
};

/** A disabled row still announces itself; it is the opening that is unavailable,
 *  not the question. */
export const WithADisabledRow: Story = {
  args: {
    items: [items[0]!, { ...items[1]!, isDisabled: true }, items[2]!],
  },
};

import type { Meta, StoryObj } from '@storybook/react-vite';
import { Avatar } from '../Avatar/Avatar.js';
import { OrganizationChart } from './OrganizationChart.js';

const items = [
  {
    id: 'ada',
    name: 'Ada Lovelace',
    role: 'Director',
    leading: <Avatar name="Ada Lovelace" size="sm" />,
    children: [
      {
        id: 'grace',
        name: 'Grace Hopper',
        role: 'Engineering',
        leading: <Avatar name="Grace Hopper" size="sm" />,
        children: [
          { id: 'annie', name: 'Annie Easley', role: 'Computation', leading: <Avatar name="Annie Easley" size="sm" /> },
          { id: 'mary', name: 'Mary Jackson', role: 'Aerodynamics', leading: <Avatar name="Mary Jackson" size="sm" /> },
        ],
      },
      {
        id: 'katherine',
        name: 'Katherine Johnson',
        role: 'Research',
        leading: <Avatar name="Katherine Johnson" size="sm" />,
        children: [
          { id: 'dorothy', name: 'Dorothy Vaughan', role: 'Programming', leading: <Avatar name="Dorothy Vaughan" size="sm" /> },
        ],
      },
    ],
  },
];

const meta = {
  title: 'Data display/Organization chart',
  component: OrganizationChart,
  parameters: {
    docs: {
      description: {
        component:
          'A hierarchy drawn as connected nodes, vertically, in place of the top-down boxes a '
          + 'diagram tool would produce, as a decision about who the chart is for. The '
          + 'catalogue asks for "a tree; collapse state is announced, and the chart is navigable '
          + 'by keyboard", and a top-down layout makes both hard: the DOM order that reads '
          + 'correctly is depth-first, the visual order is breadth-first, and implementations '
          + 'that reconcile them position absolutely and leave the keyboard behind. A vertical '
          + 'hierarchy has the same connectors, the same collapse and the same reading order, '
          + 'and gets React Aria\'s tree keyboard behaviour for free.\n\n'
          + 'It is a `treegrid` and not a `tree`, by M-3\'s decision, which applies here for '
          + 'the same reason: a node carries a disclosure control and is also selectable, and the '
          + 'ARIA tree pattern has no key left to reach a control inside an item.\n\n'
          + 'The material is what separates it from `TreeView`: Haze node boxes on whatever '
          + 'surrounds them, joined by connectors in the rim colour, which are the catalogue\'s '
          + 'own words for both.',
      },
    },
  },
  args: { items, label: 'Team', defaultExpandedKeys: ['ada', 'grace', 'katherine'] },
} satisfies Meta<typeof OrganizationChart>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** Collapsed to the root. The chevron's direction is a CSS end state, correct at
 *  rest, and `aria-expanded` is what announces the state. */
export const Collapsed: Story = {
  args: { defaultExpandedKeys: [] },
};

/** Selectable nodes. Selection is label weight first. The soft fill is the
 *  second signal, and in forced colours it becomes a Highlight ring. */
export const Selectable: Story = {
  args: { selectionMode: 'single', defaultSelectedKeys: ['katherine'] },
};

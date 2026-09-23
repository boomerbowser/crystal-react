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
          'A hierarchy drawn as connected nodes — **vertically**, rather than as the top-down '
          + 'boxes a diagram tool would produce, and that is a decision about who it is for. The '
          + 'catalogue asks for "a tree; collapse state is announced, and the chart is navigable '
          + 'by keyboard", and the top-down layout is the one that makes both hard: the DOM order '
          + 'that reads correctly is depth-first, the visual order is breadth-first, and every '
          + 'implementation that reconciles them does it by positioning absolutely and leaving '
          + 'the keyboard behind. A vertical hierarchy has the same connectors, the same '
          + 'collapse, the same reading order — and React Aria\'s tree keyboard behaviour for '
          + 'nothing.\n\n'
          + 'It is a `treegrid` rather than a `tree`, which is M-3\'s decision and applies here '
          + 'for its reason: a node carries a disclosure control *and* is selectable, and the '
          + 'ARIA tree pattern has no key left to reach a control inside an item.\n\n'
          + 'What makes it a chart rather than `TreeView` is the material: Haze node boxes on '
          + 'whatever surrounds them, joined by connectors in the rim colour, which are the '
          + 'catalogue\'s own words for both.',
      },
    },
  },
  args: { items, label: 'Team', defaultExpandedKeys: ['ada', 'grace', 'katherine'] },
} satisfies Meta<typeof OrganizationChart>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** Collapsed to the root. The chevron's direction is a CSS end state, correct at
 *  rest, and `aria-expanded` is what actually says so. */
export const Collapsed: Story = {
  args: { defaultExpandedKeys: [] },
};

/** Selectable nodes. Selection is label weight first; the soft fill is the
 *  second signal, and in forced colours it becomes a Highlight ring. */
export const Selectable: Story = {
  args: { selectionMode: 'single', defaultSelectedKeys: ['katherine'] },
};

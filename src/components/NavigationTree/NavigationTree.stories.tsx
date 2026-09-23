import type { Meta, StoryObj } from '@storybook/react-vite';
import { only } from '../../../.storybook/environment.js';
import { crystalTokens } from '../../theme/tokens.generated.js';
import { NavigationTree } from './NavigationTree.js';

const items = [
  {
    id: 'docs',
    label: 'Documentation',
    href: '/docs',
    children: [
      { id: 'principles', label: 'Identity & foundations', href: '/docs/principles' },
      { id: 'colors', label: 'Colour architecture', href: '/docs/colors' },
      {
        id: 'materials',
        label: 'Materials & elevation',
        href: '/docs/materials',
        children: [
          { id: 'haze', label: 'Haze', href: '/docs/materials#haze' },
          { id: 'stone', label: 'Stone', href: '/docs/materials#stone' },
        ],
      },
      { id: 'motion', label: 'Motion & transitions', href: '/docs/motion' },
    ],
  },
  { id: 'playground', label: 'Playground', href: '/playground' },
  { id: 'verification', label: 'Verification', href: '/verification' },
];

const meta = {
  title: 'Navigation/Navigation tree',
  component: NavigationTree,
  parameters: {
    docs: {
      description: {
        component:
          'The other half of the split M-3 made. A `tree-view` row is selectable; a navigation '
          + 'tree\'s rows are destinations, and "which one am I on" is `aria-current` rather than '
          + 'selection. React Aria ships both patterns and the catalogue names this one as the '
          + 'parity target outright.\n\n'
          + 'Worth knowing, because the name suggests otherwise: `NavigationTree` renders a '
          + '`treegrid` of pressable rows carrying `data-href`, routed through `RouterProvider` '
          + '— not a nested set of `a` elements. It also does not set `aria-current`; it computes '
          + '`data-current` and `data-current-ancestor` for styling and stops, so this library '
          + 'puts the attribute on the row from React Aria\'s own `isCurrent`.\n\n'
          + `Crystal owns the rest: Haze rows at the ${crystalTokens['action.minTarget']} destination floor, the current row `
          + 'marked by **label weight** with the soft fill as the second signal, and '
          + '`accordion-in` on a row that arrives because somebody expanded its parent — never '
          + 'on the rows that were there when the page loaded.',
      },
    },
  },
  args: { items, label: 'Documentation', defaultExpandedKeys: ['docs'] },
} satisfies Meta<typeof NavigationTree>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** On a page inside a branch. The destination is heavier and carries the soft
 *  fill; its ancestor is heavier too, so a collapsed branch still shows where
 *  you are. */
export const OnACurrentPage: Story = {
  args: { selectedRoute: '/docs/materials', defaultExpandedKeys: ['docs', 'materials'] },
};

/** Collapsed, with the current page two levels inside it. `data-current-ancestor`
 *  is what keeps the trail visible without expanding anything. */
export const CurrentInsideACollapsedBranch: Story = {
  render: (args) => (
    <NavigationTree {...only(args)} selectedRoute="/docs/materials#stone" defaultExpandedKeys={[]} />
  ),
};

import type { Meta, StoryObj } from '@storybook/react-vite';
import { Tabs } from './Tabs.js';
import { Breadcrumbs } from '../Breadcrumbs/Breadcrumbs.js';
import { SegmentedControl } from '../SegmentedControl/SegmentedControl.js';
import { Stack } from '../Stack/Stack.js';
import { Text } from '../Text/Text.js';

const meta = {
  title: 'Navigation/Tabs and breadcrumbs',
  parameters: {
    docs: {
      description: {
        component:
          '**Selection is label weight.** The selected tab is heavier; the soft fill beneath it is a '
          + 'second signal rather than the only one, which is what keeps selection off colour alone. '
          + 'In forced colours the fill goes and a ring takes its place, because Chromium paints an '
          + 'opaque backplate behind text and a filled label disappears under it.\n\n'
          + 'A tab list and a segmented control are the same material and different semantics. A tab '
          + 'list picks a *view* and promises a panel will change; a segmented control picks a *value* '
          + 'and announces as a radio group. Borrowing one for the other tells a screen-reader user to '
          + 'expect something that never happens, so the strip is shared through `styles/_strip.scss` '
          + 'and the semantics are not.\n\n'
          + 'A breadcrumb trail has no material of its own. It sits in the page\'s own content, and '
          + 'giving it a surface would make it read as a card containing the navigation rather than as '
          + 'the page saying where it is.',
      },
    },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const docs = [
  {
    id: 'overview',
    label: 'Overview',
    content: <Text>A tab list picks a view. The panel below it is what changed.</Text>,
  },
  {
    id: 'usage',
    label: 'Usage',
    content: <Text>Arrow keys move between tabs; Home and End reach the ends.</Text>,
  },
  {
    id: 'api',
    label: 'API',
    content: <Text>Every prop, with the one that is required marked as such.</Text>,
  },
];

export const TabStrip: Story = {
  render: () => <Tabs label="Documentation" items={docs} />,
};

/* The label is shown, so it names the list by reference. What is seen and what
   is announced then cannot drift apart, which an `aria-label` cannot promise. */
export const WithAVisibleLabel: Story = {
  render: () => <Tabs label="Documentation" items={docs} labelVisible />,
};

export const Vertical: Story = {
  render: () => <Tabs label="Documentation" items={docs} orientation="vertical" />,
};

export const WithADisabledTab: Story = {
  render: () => (
    <Tabs
      label="Documentation"
      items={[docs[0]!, { ...docs[1]!, isDisabled: true }, docs[2]!]}
    />
  ),
};

/* The same strip, the other semantics. Side by side because the pair is the
   thing worth seeing: identical material, and a screen reader is told two
   entirely different stories. */
export const TheSameStripWithDifferentSemantics: Story = {
  render: () => (
    <Stack gap="lg">
      <Tabs label="Views" items={docs} labelVisible />
      <SegmentedControl
        label="Appearance"
        options={[
          { value: 'light', label: 'Light' },
          { value: 'dark', label: 'Dark' },
          { value: 'auto', label: 'Auto' },
        ]}
        defaultValue="light"
      />
    </Stack>
  ),
};

const trail = [
  { id: 'home', label: 'Home', href: '#' },
  { id: 'library', label: 'Library', href: '#' },
  { id: 'data', label: 'Data', href: '#' },
  { id: 'reports', label: 'Reports', href: '#' },
  { id: 'q3', label: 'Q3 summary' },
];

export const Trail: Story = {
  render: () => <Breadcrumbs items={trail} />,
};

/* Collapsed. What is hidden goes into a menu that says how many it holds, and
   every collapsed crumb is still a real anchor — middle-click, open in a new
   tab, the status bar showing where it goes. */
export const CollapsedTrail: Story = {
  render: () => <Breadcrumbs items={trail} maxItems={3} />,
};

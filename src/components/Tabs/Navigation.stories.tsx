import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { only } from '../../../.storybook/environment.js';
import { Tabs } from './Tabs.js';
import { Breadcrumbs } from '../Breadcrumbs/Breadcrumbs.js';
import { Button } from '../Button/Button.js';
import { SegmentedControl } from '../SegmentedControl/SegmentedControl.js';
import { Stack } from '../Stack/Stack.js';
import { Text } from '../Text/Text.js';

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

const meta = {
  title: 'Navigation/Tabs and breadcrumbs',
  /* Without this docgen has nothing to read and Storybook generates no controls
     at all — which is the message Meridian screenshotted on this very story. */
  component: Tabs,
  args: {
    items: docs,
    label: 'Documentation',
    labelVisible: false,
    orientation: 'horizontal' as const,
    /* A spy rather than a no-op, so the Actions panel shows what fired and with
       what. For a tab list that is the whole contract: the strip's job is to
       report which view was picked. */
    onSelectionChange: fn(),
  },
  argTypes: {
    labelVisible: {
      description: 'Show the label above the strip, naming the list by reference.',
      control: 'boolean', table: { category: 'Tabs' },
    },
    orientation: {
      control: 'inline-radio', options: ['horizontal', 'vertical'],
      table: { category: 'Tabs' },
    },
    label: { control: 'text', table: { category: 'Tabs' } },
    /* The collection is structure, not a setting. A JSON editor over it would be
       a control a reviewer can only break. */
    items: { control: false, table: { category: 'Tabs' } },
    onSelectionChange: { table: { category: 'Tabs' } },
  },
  parameters: {
    docs: {
      description: {
        component:
          '**Selection is weight and the primary fill.** The strip is Crystal\'s dock, and the selected '
          + 'tab is heavier as well as filled, which is what keeps selection off colour alone. '
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
} satisfies Meta<typeof Tabs>;

export default meta;
type Story = StoryObj<typeof meta>;


export const TabStrip: Story = {
  render: (args) => <Tabs {...only(args)} />,
};

/* The keyboard model, in a story of its own because `verify-targets` probes
   `--tab-strip` and a `play` function runs whenever a story loads. A gate that
   opens a story with one measures it mid-interaction. */
export const TabKeyboard: Story = {
  name: 'Keyboard navigation',
  render: (args) => <Tabs {...only(args)} />,
  /* The Interactions panel, and the first thing in this library that watches a
     keyboard in a real browser. A tab list's arrow-key model is the part jsdom
     cannot answer for: the unit tests assert what React Aria reports, and this
     asserts what a person pressing Right actually gets. */
  play: async ({ canvasElement, args, step }) => {
    const canvas = within(canvasElement);
    await step('the first tab is selected and carries the weight', async () => {
      const overview = canvas.getByRole('tab', { name: 'Overview' });
      await expect(overview).toHaveAttribute('aria-selected', 'true');
    });
    await step('Right moves to the next tab and reports it', async () => {
      await userEvent.click(canvas.getByRole('tab', { name: 'Overview' }));
      await userEvent.keyboard('{ArrowRight}');
      await expect(canvas.getByRole('tab', { name: 'Usage' })).toHaveAttribute('aria-selected', 'true');
      await expect(args.onSelectionChange).toHaveBeenCalled();
    });
    await step('nothing is marked with a check', async () => {
      for (const tab of canvas.getAllByRole('tab')) {
        await expect(tab.textContent ?? '').not.toMatch(/[\u2713\u2714]/);
      }
    });
  },
};

/* The label is shown, so it names the list by reference. What is seen and what
   is announced then cannot drift apart, which an `aria-label` cannot promise. */
export const WithAVisibleLabel: Story = {
  args: { labelVisible: true },
  render: (args) => <Tabs {...only(args)} />,
};

export const Vertical: Story = {
  args: { orientation: 'vertical' },
  render: (args) => <Tabs {...only(args)} />,
};

export const WithADisabledTab: Story = {
  args: { items: [docs[0]!, { ...docs[1]!, isDisabled: true }, docs[2]!] },
  render: (args) => <Tabs {...only(args)} />,
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

/* Going a level deeper adds a crumb, and the new crumb arrives with Crystal's
   `breadcrumb` — the ones the page loaded with do not move. */
export const GoingDeeper: Story = {
  render: function GoingDeeperStory() {
    const [depth, setDepth] = useState(trail.length);
    /* Every level keeps its id as the reader moves past it; only the level
       reached is new. The last crumb is the current page, so it has no link. */
    const levels = [...trail, ...Array.from({ length: 12 }, (_, index) => ({
      id: `level-${trail.length + index + 1}`, label: `Level ${trail.length + index + 1}`, href: '#',
    }))];
    const shown = levels.slice(0, depth).map((level, index, all) => (
      index === all.length - 1 ? { id: level.id, label: level.label } : { ...level, href: level.href ?? '#' }
    ));
    return (
      <div style={{ display: 'grid', gap: 16, justifyItems: 'start' }}>
        <Breadcrumbs items={shown} />
        <Button onPress={() => { setDepth((level) => level + 1); }}>Go a level deeper</Button>
      </div>
    );
  },
};

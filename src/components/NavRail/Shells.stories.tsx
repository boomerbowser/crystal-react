import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { only } from '../../../.storybook/environment.js';
import { NavRail } from './NavRail.js';
import { Dock } from '../Dock/Dock.js';
import { BottomNavigation } from '../BottomNavigation/BottomNavigation.js';
import { Button } from '../Button/Button.js';
import { Stack } from '../Stack/Stack.js';

/* One collection, three shells. Deliberately the same destinations in all three
   stories: the point of the group is that a rail, a dock and a bottom bar are
   the same navigation wearing different geometry, and varying the content would
   hide that behind a spot-the-difference. */
const destinations = [
  { id: 'home', label: 'Home', href: '#home' },
  { id: 'library', label: 'Library', href: '#library' },
  { id: 'shared', label: 'Shared', href: '#shared', badge: '4' },
  { id: 'settings', label: 'Settings', href: '#settings' },
];

const meta = {
  title: 'Navigation/Rails and bars',
  component: NavRail,
  args: {
    items: destinations,
    currentId: 'library',
    isCollapsed: false,
    'aria-label': 'Sections',
  },
  argTypes: {
    /* The collection is structure, not a setting — a JSON editor over it is a
       control a reviewer can only break. Same judgement as the tab strip. */
    items: { control: false, table: { category: 'Rail' } },
    currentId: {
      description: 'The destination this page *is*. Carried by `aria-current`, never `aria-selected`.',
      control: 'inline-radio', options: destinations.map((d) => d.id),
      table: { category: 'Rail' },
    },
    isCollapsed: {
      description: 'Icons only. The labels stay in the accessibility tree, so the name never changes with the width.',
      control: 'boolean', table: { category: 'Rail' },
    },
    'aria-label': { control: 'text', table: { category: 'Rail' } },
    footer: { control: false, table: { category: 'Rail' } },
  },
  parameters: {
    docs: {
      description: {
        component:
          '**Selection is label weight, and the current destination is `aria-current`.** Not '
          + '`aria-selected`: a destination is where you *are*, and a tab is what you have *picked*. '
          + 'Telling a screen reader the second when you mean the first promises a panel that never '
          + 'changes.\n\n'
          + 'Nothing is drawn beside the label to mark it. A leading mark sits inside the control and '
          + 'offsets the very label it points at, so the current item stops lining up with the others — '
          + 'which is why Crystal carries selection typographically rather than with a rail or a dot.\n\n'
          + 'A collapsed rail still has full-height hit areas: the label is hidden, the target is not. '
          + 'That is the 44px floor, and it is measured in a real browser by `verify-targets.mjs` '  /* crystal-allow-literal: the catalogue's wording, quoted in prose; the floor itself is FLOOR in verify-targets.mjs */
          + 'rather than asserted in jsdom, where every box reports as zero.',
      },
    },
  },
} satisfies Meta<typeof NavRail>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Rail: Story = {
  render: (args) => <NavRail {...only(args)} />,
};

/* Collapsed is its own story rather than a knob on the first, because
   `verify-targets` probes a story ID: a state reachable only by toggling a
   control is a state no gate can address. */
export const Collapsed: Story = {
  name: 'Collapsed to icons',
  args: { isCollapsed: true },
  render: (args) => <NavRail {...only(args)} />,
};

/* The rail's footer is where a product puts the control that drives the state
   above it. Shown working, because a footer that cannot do anything does not
   demonstrate what the slot is for. */
export const WithAFooter: Story = {
  render: (args) => {
    const [collapsed, setCollapsed] = useState(false);
    return (
      <NavRail
        {...only(args)}
        isCollapsed={collapsed}
        footer={(
          <Button variant="quiet" onPress={() => setCollapsed((was) => !was)}>
            {collapsed ? 'Expand' : 'Collapse'}
          </Button>
        )}
      />
    );
  },
};

export const DockBar: Story = {
  name: 'Dock',
  /* Driven by the same \`currentId\` arg as the rail, so moving it in Controls
     moves the current destination — the client-side navigation a dock is for. */
  render: (args) => <Dock items={destinations} currentId={args.currentId ?? 'library'} aria-label="Sections" />,
};

export const BottomBar: Story = {
  name: 'Bottom navigation',
  render: (args) => (
    <BottomNavigation items={destinations} currentId={args.currentId ?? 'library'} aria-label="Sections" />
  ),
};

/* The three side by side. Not a gate's story — it is the one a reviewer opens to
   check that the same destinations read as the same destinations. */
export const TheSameDestinationsInThreeShells: Story = {
  render: () => (
    <Stack gap="lg">
      <NavRail items={destinations} currentId="library" aria-label="Rail" />
      <Dock items={destinations} currentId="library" aria-label="Dock" />
      <BottomNavigation items={destinations} currentId="library" aria-label="Bottom bar" />
    </Stack>
  ),
};

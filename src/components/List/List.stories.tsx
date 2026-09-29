import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { only } from '../../../.storybook/environment.js';
import { Avatar } from '../Avatar/Avatar.js';
import { Badge } from '../Badge/Badge.js';
import { List, ListItem } from './List.js';
import { Button } from '../Button/Button.js';

const meta = {
  title: 'Data display/List',
  component: List,
  parameters: {
    docs: {
      description: {
        component:
          'Rows on a Haze surface. "Interactive rows are buttons or links, not clickable divs": a '
          + 'div with an `onClick` is not reachable by keyboard, is not announced as anything, and '
          + 'cannot be opened in a new tab when it was really a link — so `ListItem` takes `href` '
          + 'or `onPress` and renders the element each of those means. A trailing action sits '
          + 'outside the row\'s own press target, because a button inside a button is invalid. '
          + 'A row that mounts after the list has settled has arrived and plays `list-in`; one that '
          + 'was there on the first render has not, and nothing moves at rest.',
      },
    },
  },
  args: { separated: false, ordered: false },
} satisfies Meta<typeof List>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: [
      <ListItem key="a" href="/ada" leading={<Avatar name="Ada Lovelace" size="sm" />}>Ada Lovelace</ListItem>,
      <ListItem key="g" href="/grace" leading={<Avatar name="Grace Hopper" size="sm" />}>Grace Hopper</ListItem>,
      <ListItem key="k" href="/katherine" leading={<Avatar name="Katherine Johnson" size="sm" />}>Katherine Johnson</ListItem>,
    ],
  },
};

/** Hairline separators, a leading avatar and a trailing badge — which is a
 *  sibling of the row's control rather than a child of it. */
export const WithLeadingAndTrailing: Story = {
  args: {
    separated: true,
    children: [
      <ListItem key="a" onPress={fn()} leading={<Avatar name="Ada Lovelace" size="sm" />}
        trailing={<Badge count={3} description="3 unread from Ada Lovelace" />}>
        Ada Lovelace
      </ListItem>,
      <ListItem key="g" onPress={fn()} leading={<Avatar name="Grace Hopper" size="sm" />}
        trailing={<Badge count={0} />}>
        Grace Hopper
      </ListItem>,
    ],
  },
};

/** Selection is label weight. The soft fill is the second signal, and there is no
 *  leading mark — one would sit inside the row and offset the very label it
 *  points at. */
export const Selected: Story = {
  render: (args) => (
    <List {...only(args)}>
      <ListItem href="/overview">Overview</ListItem>
      <ListItem href="/activity" isSelected>Activity</ListItem>
      <ListItem href="/settings">Settings</ListItem>
    </List>
  ),
};

export const Empty: Story = {
  args: { children: [], empty: 'Nobody has joined yet.' },
};

/* The list reordered and shortened. A row moved among the others plays
   `reorder`; a row removed plays `list-out` and goes once it has; the rest stay
   still. */
export const Reordering: Story = {
  render: function ReorderingStory() {
    const [items, setItems] = useState(['Quarterly figures', 'Board minutes', 'Hiring plan', 'Office move']);
    return (
      <div style={{ display: 'grid', gap: 16, justifyItems: 'start' }}>
        <List separated>
          {items.map((item) => <ListItem key={item}>{item}</ListItem>)}
        </List>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button onPress={() => { setItems((list) => [list[list.length - 1]!, ...list.slice(0, -1)]); }}>Move last to top</Button>
          <Button onPress={() => { setItems((list) => list.slice(1)); }}>Remove first</Button>
        </div>
      </div>
    );
  },
};

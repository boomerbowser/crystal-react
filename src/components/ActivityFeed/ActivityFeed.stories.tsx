import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { ActivityFeed, type ActivityEvent } from './ActivityFeed.js';
import { Button } from '../Button/Button.js';

const event = (id: string, actor: string, action: string, timestamp: string): ActivityEvent => ({
  id, actor, action, dateTime: '2026-09-28T09:00:00Z', timestamp,
});
const events = [
  event('a', 'Ada Fern', 'commented on Quarterly figures', '4 minutes ago'),
  event('b', 'Bo Lindqvist', 'uploaded Board minutes', '1 hour ago'),
  event('c', 'Chen Wei', 'joined the workspace', 'Yesterday'),
];

const meta = {
  title: 'Blocks/ActivityFeed',
  component: ActivityFeed,
  parameters: {
    docs: {
      description: {
        component:
          '"Live updates are announced politely and never steal focus."\n\nArrivals are counted by the '
          + 'ids the feed had not shown before and said politely ("2 new events") and nothing is '
          + 'focused; the reader goes to them when they choose. The first render says nothing. A live '
          + 'feed says so in a word beside its heading.',
      },
    },
  },
  args: { title: 'Activity', events },
} satisfies Meta<typeof ActivityFeed>;

export default meta;
type Story = StoryObj<typeof meta>;

export const AtRest: Story = {};
export const Live: Story = { args: { isLive: true } };
export const Loading: Story = { args: { state: 'loading', events: [] } };
export const Empty: Story = { args: { state: 'empty', events: [] } };

/** New events arriving: they are inserted with `list-in` and counted aloud; focus stays put. */
export const Arriving: Story = {
  render: function ArrivingStory(args) {
    const [list, setList] = useState(events);
    return (
      <div style={{ display: 'grid', gap: 16, maxInlineSize: 560 }}>
        <Button onPress={() => { setList((all) => [event(`n${all.length}`, 'Dara Byrne', 'shared Hiring plan', 'Just now'), ...all]); }}>
          Something happens
        </Button>
        <ActivityFeed {...args} events={list} isLive />
      </div>
    );
  },
};

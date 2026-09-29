import { describe, expect, it } from 'vitest';
import { expectNoAxeViolations } from '../../test/axe.js';
import { renderWithCrystal, screen, waitFor, within } from '../../test/render.js';
import { ActivityFeed, type ActivityEvent } from './ActivityFeed.js';

const event = (id: string, who: string, what: string): ActivityEvent => ({
  id, actor: who, action: what, dateTime: '2026-09-28T09:00:00Z', timestamp: 'This morning',
});
const events = [event('a', 'Ada', 'commented on Quarterly figures'), event('b', 'Bo', 'uploaded Board minutes')];

describe('ActivityFeed', () => {
  it('is a region named by its heading, listing events in order', () => {
    renderWithCrystal(<ActivityFeed title="Activity" events={events} />);
    const region = screen.getByRole('region', { name: 'Activity' });
    expect(within(region).getAllByRole('listitem')).toHaveLength(2);
    expect(within(region).getAllByRole('listitem')[0]).toHaveTextContent('Ada commented on Quarterly figures');
  });

  /* The opinion: arrivals are said, politely, counted by new ids — and nothing is focused. */
  it('says how many events arrived, not on load, and moves no focus', async () => {
    const { rerenderWithCrystal } = renderWithCrystal(<ActivityFeed title="Activity" events={events} isLive />);
    expect(screen.getByRole('status')).toHaveTextContent('');
    const before = document.activeElement;
    rerenderWithCrystal(
      <ActivityFeed title="Activity" events={[event('c', 'Chen', 'joined'), event('d', 'Dara', 'left'), ...events]} isLive />,
    );
    await waitFor(() => { expect(screen.getByRole('status')).toHaveTextContent('2 new events'); });
    expect(document.activeElement).toBe(before);
  });

  it('does not count a shorter list as arrivals', async () => {
    const { rerenderWithCrystal } = renderWithCrystal(<ActivityFeed title="Activity" events={events} />);
    rerenderWithCrystal(<ActivityFeed title="Activity" events={events.slice(1)} />);
    await waitFor(() => { expect(screen.getByRole('status')).toHaveTextContent(''); });
  });

  it('shows that it is live in words', () => {
    renderWithCrystal(<ActivityFeed title="Activity" events={events} isLive />);
    expect(screen.getByText('Live')).toBeInTheDocument();
  });

  it('replaces the list while loading, and says so when empty', () => {
    const { unmount } = renderWithCrystal(<ActivityFeed title="Activity" events={[]} state="loading" />);
    expect(screen.queryByRole('list')).toBeNull();
    unmount();
    renderWithCrystal(<ActivityFeed title="Activity" events={[]} state="empty" />);
    expect(screen.getByText('Nothing has happened here yet')).toBeInTheDocument();
  });

  it.each([
    ['at rest', {}],
    ['live', { isLive: true }],
    ['loading', { state: 'loading' as const, events: [] }],
    ['empty', { state: 'empty' as const, events: [] }],
  ])('has no axe violations %s', async (_, extra) => {
    const { container } = renderWithCrystal(<ActivityFeed title="Activity" events={events} {...extra} />);
    await expectNoAxeViolations(container);
  });
});

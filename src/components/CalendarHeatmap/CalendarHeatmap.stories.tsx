import type { Meta, StoryObj } from '@storybook/react-vite';
import { CalendarHeatmap } from './CalendarHeatmap.js';

const year = Array.from({ length: 280 }, (_, i) => {
  const date = new Date(Date.UTC(2026, 0, 1 + i));
  const weekday = date.getUTCDay();
  const quiet = weekday === 0 || weekday === 6;
  return {
    date: date.toISOString().slice(0, 10),
    value: i % 37 === 0 ? null : Math.max(0, Math.round((quiet ? 1 : 6) + Math.sin(i / 11) * 4)),
  };
});

const meta = {
  title: 'Charts/Calendar heatmap',
  component: CalendarHeatmap,
  parameters: {
    docs: {
      description: {
        component:
          '"Every cell states its date and value." The date matters more than the value here: a '
          + 'grid of squares with no axis cannot be read by position — nobody counts "third '
          + 'column, fifth row" back to a Tuesday in March — so the date is written into every '
          + "cell's label rather than inferred from where it sits.\n\n"
          + 'A day with no measurement says so in words and is drawn as an outline. "No data" '
          + 'and "the least data" are different facts, and a calendar where an empty day looks '
          + 'like a quiet one cannot be read at all.\n\n'
          + 'The ramp, the buckets and the contrast floor are the same ones the heatmap uses. '
          + 'There is one intensity scale in the system, not one per chart.',
      },
    },
  },
  args: {
    label: 'Commits by day',
    description: '2026 to date',
    days: year,
    format: (value: number) => `${value} commits`,
  },
} satisfies Meta<typeof CalendarHeatmap>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** A quarter, where each day is drawn at its full size. */
export const AQuarter: Story = { args: { days: year.slice(0, 90) } };

/** Weeks starting on Sunday. */
export const SundayFirst: Story = { args: { weekStart: 0 } };

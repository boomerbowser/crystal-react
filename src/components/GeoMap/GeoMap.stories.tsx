import type { Meta, StoryObj } from '@storybook/react-vite';
import { GeoMap } from './GeoMap.js';

/* Fictional regions, chosen instead of a real country's borders. A design
   system that shipped a world outline would ship one political opinion about
   borders and names to every product that used it. `features` is the caller's
   GeoJSON, and this is only a demonstration. */
const square = (id: string, name: string, x: number, y: number) => ({
  type: 'Feature',
  id,
  properties: { name },
  geometry: {
    type: 'Polygon',
    coordinates: [[[x, y], [x + 9, y], [x + 9, y + 9], [x, y + 9], [x, y]]],
  },
});

const features = [
  square('nw', 'North west', 0, 10), square('ne', 'North east', 10, 10),
  square('sw', 'South west', 0, 0), square('se', 'South east', 10, 0),
  square('c', 'Central', 5, 5),
];

const meta = {
  title: 'Charts/Geographic map',
  component: GeoMap,
  parameters: {
    docs: {
      description: {
        component:
          '"Regions are reachable by keyboard and state their name and value; a table '
          + 'equivalent is required." On a map the picture carries the *identity* of each mark '
          + 'as well as its value, and a reader who cannot see it cannot tell which shape is '
          + 'which. So every region is a mark that names itself, and the table lists every '
          + 'region whether or not the join found a value.\n\n'
          + 'The topology and the join are the caller\'s, as the catalogue says. A component that '
          + 'shipped a world outline would ship one political opinion about borders and names to '
          + 'every product that used it. The regions here are fictional squares for that '
          + 'reason.\n\n'
          + 'The intensity is Crystal\'s ramp, because a choropleth is a heatmap with an '
          + 'irregular grid. A region the join missed is drawn as the plot showing through, with '
          + 'its border intact.',
      },
    },
  },
  args: {
    label: 'Sales by region',
    features,
    values: { nw: 42, ne: 88, sw: 16, c: 61 },
    projection: 'mercator' as const,
    format: (value: number) => `£${value}k`,
  },
} satisfies Meta<typeof GeoMap>;

export default meta;
type Story = StoryObj<typeof meta>;

/** One region has no value: it is the plot showing through, and it says so. */
export const Default: Story = {};

/** A fixed range, so two maps of different periods are comparable. */
export const AFixedRange: Story = { args: { domain: [0, 100] } };

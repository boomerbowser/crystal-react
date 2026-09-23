import type { Meta, StoryObj } from '@storybook/react-vite';
import { ChartTooltip } from './ChartTooltip.js';

const meta = {
  title: 'Charts/Chart tooltip',
  component: ChartTooltip,
  parameters: {
    docs: {
      description: {
        component:
          'Values at a position, following the pointer or the focused item.\n\n'
          + 'Not `Tooltip` with different content. An ordinary tooltip describes *the element '
          + 'that has focus*; a chart tooltip describes the mark the roving cursor is on, which '
          + 'is inside a single focusable plot — there is no per-element hover or focus to hang '
          + 'it from.\n\n'
          + 'It is `aria-hidden`, deliberately: every value in it is already the label of the '
          + 'mark it describes, and announcing both would read every number twice. This is the '
          + "sighted reader's version of what the mark already says.\n\n"
          + '"Never covers the point it describes" — it is offset from the point and turns to '
          + 'the other side near an edge rather than being clipped.',
      },
    },
  },
  args: {
    shown: true,
    x: 120,
    y: 60,
    bounds: { width: 480, height: 200 },
    title: 'February',
    rows: [
      { name: 'Revenue', value: '£18k', index: 0 },
      { name: 'Costs', value: '£9k', index: 1 },
    ],
  },
  decorators: [
    (Story) => (
      <div style={{ position: 'relative', height: 200, width: 480 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ChartTooltip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** Near the far edge it turns rather than being clipped. */
export const NearTheEdge: Story = { args: { x: 450, y: 170 } };

/** Hidden: nothing under the cursor, or Escape was pressed. */
export const Hidden: Story = { args: { shown: false } };

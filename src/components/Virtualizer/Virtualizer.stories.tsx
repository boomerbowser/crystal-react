import type { Meta, StoryObj } from '@storybook/react-vite';
import { ListBox, ListBoxItem, Virtualizer } from 'react-aria-components';
import { ListLayout } from 'react-stately';
import { only } from '../../../.storybook/environment.js';
import { ScrollArea } from '../ScrollArea/ScrollArea.js';

/* A height, because a virtual scroller with no viewport windows nothing. */
const VIEWPORT = '320px'; // crystal-allow-literal: the story's viewport, not a design value

const rows = Array.from({ length: 2000 }, (_, index) => ({
  id: `row-${index}`,
  label: `Row ${index + 1}`,
}));

const meta = {
  title: 'Data display/Virtual scroller',
  component: Virtualizer,
  parameters: {
    docs: {
      description: {
        component:
          'Renders only what is near the viewport. This is React Aria\'s `Virtualizer`, '
          + 're-exported instead of wrapped. The hard part is keeping `aria-setsize` and '
          + '`aria-posinset` correct across recycling and never dropping focus when a focused '
          + 'row is reused. React Aria\'s virtualizer is integrated with its collections, so it '
          + 'does both. A general-purpose windowing library is not, and the product has to add '
          + 'the accessibility back.\n\n'
          + 'Crystal\'s half is the scroll surface, which the caller composes: the virtualized '
          + 'collection goes inside a `ScrollArea`, which brings the scroll contract (contained '
          + 'overscroll, a stable gutter, native gestures) and the right scrollbar for the '
          + 'material. This story is that assembly, two thousand rows deep.',
      },
    },
  },
  /* `Virtualizer` requires a layout and children, so the meta supplies the
     layout and each story supplies the collection. */
  args: { layout: ListLayout, children: null },
} satisfies Meta<typeof Virtualizer>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Two thousand rows, windowed, on a Frost scroll surface. Frost, because a long
 *  reading surface is a panel and not a control plane. */
export const TwoThousandRows: Story = {
  render: (args) => (
    <ScrollArea variant="frost" style={{ blockSize: VIEWPORT }} aria-label="Rows">
      <Virtualizer {...only(args)} layout={ListLayout} layoutOptions={{ rowHeight: 40 }}>
        <ListBox aria-label="Two thousand rows" items={rows} selectionMode="none">
          {(row: { id: string; label: string }) => (
            <ListBoxItem id={row.id} textValue={row.label} style={{ padding: 'var(--cr-spacing-xs) var(--cr-spacing-sm)' }}>
              {row.label}
            </ListBoxItem>
          )}
        </ListBox>
      </Virtualizer>
    </ScrollArea>
  ),
};

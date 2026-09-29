import type { Meta, StoryObj } from '@storybook/react-vite';
import { DropIndicator } from './DropIndicator.js';

const meta = {
  title: 'Utilities/DropIndicator',
  component: DropIndicator,
  parameters: {
    docs: {
      description: {
        component:
          'Where a dragged item will land, drawn and said. The line is the palette\'s primary — it '
          + 'belongs to the gesture, not to the page — and it is drawn on a pseudo-element with no '
          + 'height in the flow, so the list does not part to make room and move the gap the reader '
          + 'is aiming at.\n\n'
          + 'This is the standalone form, for a list a product lays out itself. Inside a React Aria '
          + 'collection, use React Aria\'s own `DropIndicator` with `dropIndicatorClassName`.',
      },
    },
  },
  args: { label: 'Drop between Quarterly figures and Board minutes', isActive: true },
  /* An indicator is an option — the place a reader can choose to drop — so the
     list it sits in is a listbox, as React Aria's own collections are. */
  render: (args) => (
    <div role="listbox" aria-label="Documents" style={{ display: 'grid', gap: 8, maxInlineSize: 320 }}>
      <div role="option" aria-selected={false}>Quarterly figures</div>
      <DropIndicator {...args} />
      <div role="option" aria-selected={false}>Board minutes</div>
    </div>
  ),
} satisfies Meta<typeof DropIndicator>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A valid landing place, while an item is carried over it. */
export const Active: Story = {};
/** Where the item cannot go: the same line, marked refused. */
export const Invalid: Story = { args: { isInvalid: true, label: 'Cannot drop here' } };
/** Present in the tree, drawn only while a drag is over it. */
export const AtRest: Story = { args: { isActive: false } };

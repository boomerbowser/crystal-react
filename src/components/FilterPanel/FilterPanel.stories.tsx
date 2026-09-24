import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { only } from '../../../.storybook/environment.js';
import { FilterPanel } from './FilterPanel.js';
import { CheckboxGroup, Checkbox } from '../Checkbox/Checkbox.js';

const meta = {
  title: 'Commerce/Filter panel',
  component: FilterPanel,
  parameters: {
    docs: {
      description: {
        component:
          '"**Applied filters are announced and individually removable**; counts update '
          + 'politely." Both halves are about the same gap: filtering is the one interaction on '
          + 'a storefront where the reader\'s action happens *here* and its whole effect happens '
          + 'somewhere else — a list they are not looking at gets shorter. A checkbox going on '
          + 'says "checked", and nothing about the four hundred products that just became '
          + 'eleven.\n\n'
          + '*Individually* removable means a control per applied filter and not only Clear '
          + 'all: a reader who has applied six filters and wants five of them is otherwise made '
          + 'to start again. And Clear all appears only when there is something to clear, '
          + 'because a disabled Clear all is a control that exists to be greyed out.',
      },
    },
  },
  args: {
    label: 'Filters',
    children: (
      <CheckboxGroup label="Colour">
        <Checkbox value="blue">Blue (12)</Checkbox>
        <Checkbox value="green">Green (3)</Checkbox>
      </CheckboxGroup>
    ),
  },
} satisfies Meta<typeof FilterPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Remove a filter and listen: the announcement is the set that is left and how
 *  many results it leaves, which is the fact the reader does not otherwise get. */
export const Default: Story = {
  render: (args) => {
    function Live() {
      const [applied, setApplied] = useState([
        { id: 'blue', label: 'Blue' },
        { id: 'large', label: 'Large' },
        { id: 'in-stock', label: 'In stock only' },
      ]);
      return (
        <div style={{ maxWidth: 'var(--cr-layout-sidebar-width)' }}>
          <FilterPanel
            {...only(args)}
            applied={applied}
            resultCount={11 * (applied.length || 1)}
            onRemove={(id) => setApplied((was) => was.filter((one) => one.id !== id))}
            onClearAll={() => setApplied([])}
          >
            <CheckboxGroup label="Colour">
              <Checkbox value="blue">Blue (12)</Checkbox>
              <Checkbox value="green">Green (3)</Checkbox>
              <Checkbox value="ink">Ink (28)</Checkbox>
            </CheckboxGroup>
            <CheckboxGroup label="Size">
              <Checkbox value="a3">A3 (18)</Checkbox>
              <Checkbox value="a2">A2 (24)</Checkbox>
              <Checkbox value="a1">A1 (6)</Checkbox>
            </CheckboxGroup>
          </FilterPanel>
        </div>
      );
    }
    return <Live />;
  },
};

/** Nothing applied: no chips, no Clear all, and nothing announced. */
export const NothingApplied: Story = {
  render: (args) => (
    <div style={{ maxWidth: 'var(--cr-layout-sidebar-width)' }}>
      <FilterPanel {...only(args)}>
        <CheckboxGroup label="Colour">
          <Checkbox value="blue">Blue (12)</Checkbox>
          <Checkbox value="green">Green (3)</Checkbox>
        </CheckboxGroup>
      </FilterPanel>
    </div>
  ),
};

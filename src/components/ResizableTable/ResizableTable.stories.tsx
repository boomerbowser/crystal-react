import type { Meta, StoryObj } from '@storybook/react-vite';
import type { DataTableRow } from '../DataTable/DataTable.js';
import { crystalTokens } from '../../theme/tokens.generated.js';
import { ResizableTable } from './ResizableTable.js';

const columns = [
  { id: 'workspace', header: 'Workspace', width: '2fr' as const, minWidth: 120 },
  { id: 'plan', header: 'Plan', minWidth: 100 },
  { id: 'seats', header: 'Seats', align: 'end' as const, isResizable: false },
];

const rows: DataTableRow[] = [
  { id: 'gather', name: 'Gather', cells: { workspace: 'Gather', plan: 'Team', seats: '12' } },
  { id: 'atlas', name: 'Atlas', cells: { workspace: 'Atlas', plan: 'Solo', seats: '1' } },
  { id: 'harbour', name: 'Harbour', cells: { workspace: 'Harbour', plan: 'Team', seats: '34' } },
];

const meta = {
  title: 'Data display/Resizable table',
  component: ResizableTable,
  parameters: {
    docs: {
      description: {
        component:
          '`DataTable` with resizing on and every column resizable unless it says otherwise — and '
          + 'that is the whole of it. The catalogue lists it separately and says its material '
          + '"inherits the table surface", so a second implementation would be a second table to '
          + 'keep in step with the first.\n\n'
          + 'What the separate name buys is the API: `DataTable` is the full instrument, and a '
          + 'product that only needs columns a reader can widen should not have to switch '
          + 'selection and sorting off to get one. Here resizing is the point, so it is opt-out.\n\n'
          + `The rule the catalogue attaches is geometric: the resizer is a ${crystalTokens['action.minTarget']} target that does `
          + 'not shift the column it borders. It reaches the floor by filling the header cell\'s '
          + 'height, and it sits *inside* the header\'s box rather than straddling the boundary — '
          + 'a resizer that overhangs moves the edge it is supposed to report. It is a slider, so '
          + 'arrow keys resize it and the new width is announced as "N pixels".',
      },
    },
  },
  args: { columns, rows, label: 'Workspaces' },
} satisfies Meta<typeof ResizableTable>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** One column pinned. A column that must keep its width says so, which is the
 *  opt-out this component is named for. */
export const WithAFixedColumn: Story = {
  args: { columns: columns.map((column) => ({ ...column, isResizable: column.id !== 'plan' })) },
};

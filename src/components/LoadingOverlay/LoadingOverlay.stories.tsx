import type { Meta, StoryObj } from '@storybook/react-vite';
import { LoadingOverlay } from './LoadingOverlay.js';
import { Button } from '../Button/Button.js';
import { TextInput } from '../TextInput/TextInput.js';

const meta = {
  title: 'Feedback/Loading overlay',
  component: LoadingOverlay,
  parameters: {
    docs: {
      description: {
        component:
          '"Blocked content is **inert**; focus does not enter it; the reason is announced." '
          + 'The first is the half that is usually faked: a scrim hides a region and stops the '
          + 'mouse, and does nothing about the tab key — so a keyboard reader walks into a form '
          + 'they cannot see and fills in fields that are about to be replaced. `inert` takes '
          + 'the subtree out of the tab order, out of hit testing and out of the accessibility '
          + 'tree at once, which is why this component wraps its region rather than being '
          + 'dropped on top of it.\n\n'
          + 'Mirage at region scope, inheriting the region\'s radius: a square wash over a '
          + 'rounded panel says the page is blocked rather than the panel.',
      },
    },
  },
  args: {
    loading: true,
    label: 'Saving changes',
    children: (
      <div style={{ display: 'grid', gap: 12, padding: 24 }}>
        <TextInput label="Project name" defaultValue="Northwind" />
        <Button>Save</Button>
      </div>
    ),
  },
} satisfies Meta<typeof LoadingOverlay>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Blocked: Story = {};

export const Clear: Story = { args: { loading: false } };

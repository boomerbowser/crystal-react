import type { Meta, StoryObj } from '@storybook/react-vite';
import { Toast, ToastProvider, useToasts } from './Toast.js';
import { Button } from '../Button/Button.js';

const meta = {
  title: 'Feedback/Toast',
  component: Toast,
  parameters: {
    docs: {
      description: {
        component:
          '**"Auto-dismiss must never remove the only route to an action."** A toast carrying '
          + 'the only "Undo" and taking it away after four seconds is a control that exists for '
          + 'people who happened to be looking. So the two are mutually exclusive **in the '
          + 'type**: `ToastOptions` is a union where a toast with an `action` cannot have a '
          + '`duration`, and one with a `duration` cannot have an `action`. Not a runtime '
          + 'warning — a runtime warning is something you read after shipping.\n\n'
          + 'One live region, owned by the provider and present before anything is in it. A '
          + 'region created at the same moment as its text is one screen readers may never '
          + 'announce, which is the classic way a toast system ends up silent.\n\n'
          + '`toast-out` is **awaited** before the toast unmounts. `useMotion`\'s promise '
          + 'exists for exactly this: removing the node on the state change would play the exit '
          + 'recipe into a detached element.',
      },
    },
  },
  args: { title: 'Changes saved', onDismiss: () => {} },
} satisfies Meta<typeof Toast>;

export default meta;
type Story = StoryObj<typeof meta>;

/* A toast is an `<li>` — the stack is a list, because three toasts are three
   things. Shown on its own it still needs the list around it, so these stories
   supply one rather than putting a stray list item in a div. `AStack` does not,
   because the provider brings its own. */
const inAList: NonNullable<Story['decorators']> = [
  (Story) => <ol style={{ margin: 0, padding: 0, listStyle: 'none' }}><Story /></ol>,
];

export const Success: Story = { decorators: inAList, args: { status: 'success' } };

export const WithDescription: Story = {
  decorators: inAList,
  args: { status: 'info', title: 'Export started', description: 'We will email you when it is ready.' },
};

/* A toast with a route out of what just happened. It has no duration, and the
   type is what stops one being added. */
export const CarryingTheOnlyUndo: Story = {
  decorators: inAList,
  args: {
    status: 'attention',
    title: 'Message deleted',
    action: <Button variant="quiet">Undo</Button>,
  },
};

export const Urgent: Story = {
  decorators: inAList,
  args: { status: 'danger', urgent: true, title: 'Connection lost' },
};

function Demo(): React.JSX.Element {
  const toasts = useToasts();
  return (
    <div style={{ display: 'flex', gap: 12 }}>
      <Button onPress={() => toasts.show({ status: 'success', title: 'Changes saved' })}>
        Save
      </Button>
      <Button
        variant="danger"
        onPress={() => toasts.show({
          status: 'attention',
          title: 'Message deleted',
          action: <Button variant="quiet">Undo</Button>,
        })}
      >
        Delete
      </Button>
    </div>
  );
}

/* The stack as a product uses it: raised through `useToasts`, never rendered by
   hand. The first goes away on its own; the second does not, because it is
   carrying the only way back. */
export const AStack: Story = {
  args: { title: '', onDismiss: () => {} },
  render: () => <ToastProvider defaultDuration={5000}><Demo /></ToastProvider>,
};

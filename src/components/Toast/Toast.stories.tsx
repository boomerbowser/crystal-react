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
          '**"Auto-dismiss must never remove the only route to an action."** A toast that '
          + 'carries the only "Undo" and removes it after four seconds only helps people who '
          + 'happened to be looking. So the two are mutually exclusive in the type: '
          + '`ToastOptions` is a union where a toast with an `action` cannot have a '
          + '`duration`, and one with a `duration` cannot have an `action`. A type error is '
          + 'caught at compile time, where a runtime warning is only read after shipping.\n\n'
          + 'Two live regions, one polite and one assertive, owned by the provider and present '
          + 'before anything is in them. '
          + 'Screen readers may never announce a region created at the same moment as its '
          + 'text, and that is a common reason a toast system goes silent.\n\n'
          + '`toast-out` is awaited before the toast unmounts, using `useMotion`\'s promise. '
          + 'Removing the node on the state change would play the exit recipe into a detached '
          + 'element.',
      },
    },
  },
  args: { title: 'Changes saved', onDismiss: () => {} },
} satisfies Meta<typeof Toast>;

export default meta;
type Story = StoryObj<typeof meta>;

/* A toast is an `<li>`, because the stack is a list. Shown on its own it still
   needs the list around it, so these stories supply one instead of putting a
   stray list item in a div. `AStack` does not, because the provider brings its
   own. */
const inAList: NonNullable<Story['decorators']> = [
  (Story) => <ol style={{ margin: 0, padding: 0, listStyle: 'none' }}><Story /></ol>,
];

export const Success: Story = { decorators: inAList, args: { status: 'success' } };

export const WithDescription: Story = {
  decorators: inAList,
  args: { status: 'info', title: 'Export started', description: 'We will email you when it is ready.' },
};

/* A toast with a way to undo what just happened. It has no duration, and the
   type prevents one from being added. */
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
   hand. The first toast goes away on its own. The second stays, because it
   carries the only way back. */
export const AStack: Story = {
  args: { title: '', onDismiss: () => {} },
  render: () => <ToastProvider defaultDuration={5000}><Demo /></ToastProvider>,
};

import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { ProfileBlock, type ProfileState } from './ProfileBlock.js';
import { TextInput } from '../TextInput/TextInput.js';

const editor = (
  <>
    <TextInput name="name" label="Name" defaultValue="Ada Fern" autoComplete="name" />
    <TextInput name="email" type="email" label="Email" defaultValue="ada@example.com" autoComplete="email" />
  </>
);

const meta = {
  title: 'Blocks/ProfileBlock',
  component: ProfileBlock,
  parameters: {
    docs: {
      description: {
        component:
          '"Destructive actions confirm and say what they remove."\n\nGiving an action `removes` is what '
          + 'makes it destructive: it opens an alert dialog titled with the action, whose body is what '
          + 'goes, with focus on Cancel. There is no way to build an "Are you sure?" that says nothing. '
          + 'Editing swaps the details for the product\'s named fields; Save hands over their values.',
      },
    },
  },
  args: {
    name: 'Ada Fern',
    subtitle: 'Design lead',
    details: [
      { label: 'Email', value: 'ada@example.com' },
      { label: 'Phone', value: '+44 20 7946 0000' },
      { label: 'Time zone', value: 'London (GMT+1)' },
    ],
    actions: [
      { id: 'sign-out', label: 'Sign out everywhere', onPress: () => {} },
      {
        id: 'delete',
        label: 'Delete account',
        onPress: () => {},
        removes: 'Your 14 projects, their comments and your billing history. This cannot be undone.',
      },
    ],
    editor,
    onEdit: () => {},
  },
  decorators: [(Story) => <div style={{ maxInlineSize: 640 }}><Story /></div>],
} satisfies Meta<typeof ProfileBlock>;

export default meta;
type Story = StoryObj<typeof meta>;

export const AtRest: Story = {};
export const Editing: Story = { args: { state: 'editing' } };
export const Saving: Story = { args: { state: 'saving' } };

/** Edit, save, and try deleting the account. */
export const AWorkingProfile: Story = {
  render: function Working(args) {
    const [state, setState] = useState<ProfileState>('at-rest');
    const [name, setName] = useState('Ada Fern');
    return (
      <ProfileBlock
        {...args}
        name={name}
        state={state}
        onEdit={() => { setState('editing'); }}
        onCancelEdit={() => { setState('at-rest'); }}
        onSave={(values) => {
          setState('saving');
          setTimeout(() => { setName(String(values.get('name') ?? name)); setState('at-rest'); }, 600);
        }}
      />
    );
  },
};

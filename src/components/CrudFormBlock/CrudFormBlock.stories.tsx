import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { CrudFormBlock, type CrudFormBlockProps, type CrudFormState } from './CrudFormBlock.js';
import { TextInput } from '../TextInput/TextInput.js';
import { TextArea } from '../TextArea/TextArea.js';

const sections: CrudFormBlockProps['sections'] = [
  {
    id: 'details',
    title: 'Details',
    description: 'How the project appears to the team.',
    children: (
      <>
        <TextInput name="name" label="Project name" defaultValue="Harbour" />
        <TextInput name="code" label="Project code" />
        <TextArea name="summary" label="Summary" />
      </>
    ),
  },
  { id: 'owner', title: 'Owner', children: <TextInput name="owner" label="Owner email" type="email" /> },
];

const errors = { code: 'Enter a project code', owner: 'Enter an email address, like name@example.com' };

const meta = {
  title: 'Blocks/CrudFormBlock',
  component: CrudFormBlock,
  parameters: {
    docs: {
      description: {
        component:
          '"Errors summarise at the top and link to their fields; submission state is announced."\n\n'
          + 'Errors come from one object keyed by field name — a validation result or a server\'s '
          + 'rejection. React Aria\'s `Form` hands each field its message, and `ErrorSummary` lists '
          + 'them at the top, takes focus, and links to each. Checking, saving, saved and failed are '
          + 'said from one polite region; saved is shown as well. Sections are Crystal\'s `Fieldset`, '
          + 'Haze inside the Frost panel.',
      },
    },
  },
  args: { title: 'Edit project', sections, onSubmit: () => {}, onCancel: () => {} },
} satisfies Meta<typeof CrudFormBlock>;

export default meta;
type Story = StoryObj<typeof meta>;

export const AtRest: Story = {};
export const Validating: Story = { args: { state: 'validating' } };
export const Submitting: Story = { args: { state: 'submitting' } };
export const Saved: Story = { args: { state: 'saved' } };
export const Failed: Story = { args: { state: 'error', errors, errorMessage: 'Not saved. Correct the problems below and save again.' } };

/** The whole round trip: an empty code is refused, a filled one saves. */
export const RoundTrip: Story = {
  render: function RoundTrip(args) {
    const [state, setState] = useState<CrudFormState>('at-rest');
    const [found, setFound] = useState<Record<string, string>>({});
    return (
      <CrudFormBlock
        {...args}
        state={state}
        errors={found}
        onSubmit={(values) => {
          setState('validating');
          const next: Record<string, string> = {};
          if (!String(values.get('code') ?? '').trim()) next['code'] = 'Enter a project code';
          if (!String(values.get('owner') ?? '').includes('@')) next['owner'] = 'Enter an email address, like name@example.com';
          setFound(next);
          if (Object.keys(next).length > 0) { setState('error'); return; }
          setState('submitting');
          setTimeout(() => { setState('saved'); }, 600);
        }}
      />
    );
  },
};

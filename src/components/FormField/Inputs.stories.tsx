import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { FormField, Fieldset } from './FormField.js';
import { TextInput } from '../TextInput/TextInput.js';
import { TextArea } from '../TextArea/TextArea.js';
import { NumberInput } from '../NumberInput/NumberInput.js';
import { PasswordInput } from '../PasswordInput/PasswordInput.js';
import { SearchInput } from '../SearchInput/SearchInput.js';
import { PinInput } from '../PinInput/PinInput.js';
import { MaskInput } from '../MaskInput/MaskInput.js';
import { JsonInput } from '../JsonInput/JsonInput.js';
import { Select, NativeSelect } from '../Select/Select.js';
import { MultiSelect } from '../MultiSelect/MultiSelect.js';
import { Stack } from '../Stack/Stack.js';
import { Button } from '../Button/Button.js';

const meta = {
  title: 'Inputs/Text and choice',
  component: FormField,
  parameters: {
    docs: {
      description: {
        component:
          'Every text-shaped control in Crystal is the same anatomy: a label, a Haze well inside '
          + 'a Resin shell, and helper text or an error beneath. That is one stylesheet shared by '
          + 'mixins rather than ten copies of a material.\n\n'
          + '**Errors are text, never colour alone**, and they are announced rather than only '
          + 'drawn — a red outline is invisible to a reader who cannot distinguish it and silent '
          + 'to one who cannot see it at all. The hint and the error are both in '
          + '`aria-describedby`: describing a field by only its error drops the guidance that '
          + 'would have prevented it.\n\n'
          + 'Motion binds to validation **state**, not to a blur handler, so a field that failed '
          + 'on the server looks exactly like one that failed locally.',
      },
    },
  },
  args: { label: 'Field', children: <input /> },
} satisfies Meta<typeof FormField>;

export default meta;
type Story = StoryObj<typeof meta>;

export const TextFamily: Story = {
  render: function TextFamily() {
    const [strength, setStrength] = useState(0);
    return (
      <Stack gap="lg" style={{ maxWidth: '420px' /* crystal-allow-literal: story column */ }}>
        <TextInput label="Workspace name" description="Visible to everyone you invite." />
        <TextInput label="Workspace name" errorMessage="That name is already taken." />
        <TextArea label="Description" description="A sentence or two." maxLength={80} />
        <NumberInput label="Seats" defaultValue={5} minValue={1} maxValue={50} />
        <PasswordInput
          label="Password"
          reveals="the password"
          onChange={(value) => setStrength(Math.min(1, value.length / 12))}
          strength={{
            score: strength,
            label: strength > 0.7 ? 'Strong' : strength > 0.3 ? 'Fair' : 'Weak',
            tone: strength > 0.7 ? 'success' : strength > 0.3 ? 'attention' : 'danger',
          }}
        />
        <SearchInput label="Find a document" placeholder="Search" />
        <MaskInput label="Card number" mask="0000 0000 0000 0000" id="card" description="The raw digits are what submits." />
        <PinInput label="Verification code" length={6} description="Paste the whole code — it fills every box." />
      </Stack>
    );
  },
};

export const ChoiceFamily: Story = {
  render: () => (
    <Stack gap="lg" style={{ maxWidth: '420px' /* crystal-allow-literal: story column */ }}>
      <Select
        label="Palette"
        options={[
          { value: 'prism', label: 'Prism' },
          { value: 'harbor', label: 'Harbor' },
          { value: 'ion', label: 'Ion' },
        ]}
      />
      <NativeSelect label="Time zone" id="tz" description="A real select opens the platform picker.">
        <option value="utc">UTC</option>
        <option value="cet">Central European</option>
      </NativeSelect>
      <MultiSelect
        label="Notify"
        options={[
          { value: 'mentions', label: 'Mentions' },
          { value: 'replies', label: 'Replies' },
          { value: 'digests', label: 'Weekly digest' },
        ]}
        defaultValue={['mentions']}
      />
    </Stack>
  ),
};

/** The wrapper for a control this library does not ship. The wiring is the whole
 *  component: label, both describedby targets, invalid and required. */
export const AroundAnything: Story = {
  render: () => (
    <Stack gap="lg" style={{ maxWidth: '420px' /* crystal-allow-literal: story column */ }}>
      <Fieldset legend="Billing" description="Where the invoice goes.">
        <FormField label="Account reference" description="Six characters." isRequired>
          <input style={{ padding: 'var(--cr-spacing-sm)' }} />
        </FormField>
        <FormField label="Purchase order" errorMessage="We could not find that order.">
          <input style={{ padding: 'var(--cr-spacing-sm)' }} />
        </FormField>
      </Fieldset>
      <JsonInput label="Configuration" defaultValue={'{ "seats": 5 }'} />
      <Button>Save</Button>
    </Stack>
  ),
};

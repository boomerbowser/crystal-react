import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { ComboBox, Autocomplete } from './ComboBox.js';
import { TagsInput, TokenField } from '../TagsInput/TagsInput.js';
import { Transfer } from '../Transfer/Transfer.js';
import { Cascader } from '../Cascader/Cascader.js';
import { Stack } from '../Stack/Stack.js';

const palettes = [
  { value: 'prism', label: 'Prism', description: 'Electric violet, orchid light' },
  { value: 'fuchsia', label: 'Fuchsia', description: 'Confident magenta' },
  { value: 'cobalt', label: 'Cobalt', description: 'Clear blue, violet undertone' },
  { value: 'ion', label: 'Ion', description: 'Vivid cyan and indigo' },
  { value: 'amethyst', label: 'Amethyst', description: 'Rich purple, warm edge' },
  { value: 'harbor', label: 'Harbor', description: 'The original palette' },
];

const meta = {
  title: 'Inputs/Composite',
  component: ComboBox,
  parameters: {
    docs: {
      description: {
        component:
          'A combobox has a set of values and the text is a way of finding one. An autocomplete '
          + 'has suggestions and the text is the value. Both are `role="combobox"` and only the '
          + 'second keeps whatever was typed.\n\n'
          + '**Focus never leaves the text field.** The highlighted row is named through '
          + '`aria-activedescendant`, which lets typing continue while the list is open. Any '
          + 'implementation that moves focus into the list breaks typing, and most do.\n\n'
          + 'Empty and loading are surfaces, shown in the popover. A list showing nothing cannot '
          + 'be told apart from one still loading, or from a broken field.\n\n'
          + 'Transfer moves items with named controls instead of a drag. Dragging between two '
          + 'lists is the obvious gesture, but it is unavailable to a keyboard user and '
          + 'invisible to a screen reader. Cascader announces the whole path, because "Edinburgh" '
          + 'alone has lost what disambiguates it.',
      },
    },
  },
  args: { label: 'Palette', options: palettes },
} satisfies Meta<typeof ComboBox>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Filtering: Story = {
  render: function Filtering() {
    const [loading, setLoading] = useState(false);
    return (
      <Stack gap="lg" style={{ maxWidth: '420px' /* crystal-allow-literal: story column */ }}>
        <ComboBox label="Palette" options={palettes} description="Type to filter." />
        <Autocomplete label="City" options={palettes} description="Anything you type is the value." />
        <ComboBox
          label="Loading"
          options={[]}
          isLoading={loading}
          description="Focus the field to see the loading surface."
          onOpenChange={(open) => setLoading(open)}
        />
        <ComboBox label="Nothing matches" options={[]} emptyMessage="No palettes by that name" />
      </Stack>
    );
  },
};

export const Tokens: Story = {
  render: () => (
    <Stack gap="lg" style={{ maxWidth: '420px' /* crystal-allow-literal: story column */ }}>
      <TagsInput
        label="Topics"
        defaultValue={['design', 'accessibility']}
        description="Comma or Enter commits. Backspace in an empty field removes the last."
        maxTags={5}
      />
      <TokenField
        label="Recipients"
        description="Committed when you leave the field."
        placeholder="name@example.com"
      />
    </Stack>
  ),
};

export const TwoLists: Story = {
  render: () => (
    <Transfer
      items={[
        { value: 'read', label: 'Read' },
        { value: 'write', label: 'Write' },
        { value: 'admin', label: 'Administer' },
        { value: 'billing', label: 'Billing' },
        { value: 'audit', label: 'Audit log' },
      ]}
      defaultValue={['read']}
      sourceLabel="Available permissions"
      targetLabel="Granted"
    />
  ),
};

export const Hierarchy: Story = {
  render: () => (
    <Cascader
      label="Location"
      defaultValue={['uk', 'scotland']}
      options={[
        {
          value: 'uk',
          label: 'United Kingdom',
          children: [
            { value: 'scotland', label: 'Scotland', children: [{ value: 'edinburgh', label: 'Edinburgh' }, { value: 'glasgow', label: 'Glasgow' }] },
            { value: 'wales', label: 'Wales', children: [{ value: 'cardiff', label: 'Cardiff' }] },
          ],
        },
        { value: 'fr', label: 'France', children: [{ value: 'idf', label: 'Île-de-France' }] },
        { value: 'pt', label: 'Portugal' },
      ]}
    />
  ),
};

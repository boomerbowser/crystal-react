import type { Meta, StoryObj } from '@storybook/react-vite';
import { ariaArgTypes } from '../../../.storybook/react-aria.js';
import type { CheckboxProps } from './Checkbox.js';
import { useState } from 'react';
import { Checkbox, CheckboxGroup, Radio, RadioGroup } from './Checkbox.js';
import { Switch } from '../Switch/Switch.js';
import { SegmentedControl } from '../SegmentedControl/SegmentedControl.js';
import { Chip } from '../Chip/Chip.js';
import { Rating } from '../Rating/Rating.js';
import { Slider, RangeSlider } from '../Slider/Slider.js';
import { AngleSlider, Knob } from '../AngleSlider/AngleSlider.js';
import { Stack, Group } from '../Stack/Stack.js';

const meta = {
  title: 'Inputs/Choice and range',
  component: Checkbox,
  /* The callbacks as actions, so the Actions panel shows what fired and with
     what. They are declared by hand because this Storybook uses `react-docgen`
     rather than `react-docgen-typescript` — see `.storybook/main.ts` — and
     react-docgen reads a component's own interface without resolving what it
     extends. Every callback here is inherited from a React Aria interface, so
     docgen cannot see one of them. Each was checked against the compiler
     before being written down. */
  argTypes: {
    ...ariaArgTypes<CheckboxProps>({
      autoFocus: false,
      isDisabled: true,
      isIndeterminate: true,
      isInvalid: true,
      isReadOnly: true,
      isRequired: true,
      onChange: true,
      onFocusChange: false,
      onHoverChange: false,
      onPress: true,
    }),
  },
  parameters: {
    docs: {
      description: {
        component:
          '**Selection is label weight.** Crystal\'s rule, and the segmented control and the '
          + 'select are where it is most often broken — a coloured pill is the obvious thing to '
          + 'draw, and a reader who cannot distinguish the colour then has nothing. Weight is '
          + 'typographic rather than chromatic, so it survives greyscale, forced colours and a '
          + 'poor screen; the soft fill beneath it is a second signal, never the only one.\n\n'
          + 'A check mark is allowed on a checkbox and nowhere else: there it is the value of a '
          + 'boolean, contained inside the box so the pair reads as one control. In a list or a '
          + 'menu a check mark means validated or informational.\n\n'
          + 'The switch does not rely on position alone — the track changes colour and the thumb '
          + 'changes with it — and the sliders announce their value with its unit, because a '
          + 'number without its unit is a guess. Try the toolbar\'s reduced-motion setting: the '
          + 'switch\'s travel goes and its state change stays.',
      },
    },
  },
  args: { children: 'Remember this device' },
} satisfies Meta<typeof Checkbox>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Choices: Story = {
  render: function Choices() {
    const [filters, setFilters] = useState<readonly string[]>(['london']);
    return (
      <Stack gap="lg" style={{ maxWidth: '460px' /* crystal-allow-literal: story column */ }}>
        <CheckboxGroup label="Notify me about" description="You can change this later.">
          <Checkbox value="mentions">Mentions</Checkbox>
          <Checkbox value="replies">Replies</Checkbox>
          <Checkbox value="digest" isIndeterminate>Weekly digest</Checkbox>
        </CheckboxGroup>
        <RadioGroup label="Plan" defaultValue="pro">
          <Radio value="free">Free</Radio>
          <Radio value="pro">Pro</Radio>
          <Radio value="team">Team</Radio>
        </RadioGroup>
        <Switch defaultSelected>Wi-Fi</Switch>
        <SegmentedControl
          label="Appearance"
          defaultValue="auto"
          options={[
            { value: 'light', label: 'Light' },
            { value: 'dark', label: 'Dark' },
            { value: 'auto', label: 'Auto' },
          ]}
        />
        <Group gap="xs">
          {['london', 'berlin', 'lisbon'].map((city) => (
            <Chip
              key={city}
              isSelectable
              isSelected={filters.includes(city)}
              onChange={(selected: boolean) => setFilters(
                selected ? [...filters, city] : filters.filter((each) => each !== city),
              )}
              onRemove={() => setFilters(filters.filter((each) => each !== city))}
              removeLabel={`Remove the ${city} filter`}
            >
              {city}
            </Chip>
          ))}
        </Group>
        <Rating label="Rate this release" defaultValue={4} />
        <Rating label="Average score" value={4.2} isReadOnly />
      </Stack>
    );
  },
};

export const Ranges: Story = {
  render: () => (
    <Stack gap="lg" style={{ maxWidth: '460px' /* crystal-allow-literal: story column */ }}>
      <Slider label="Volume" defaultValue={40} ticks={['0', '50', '100']} />
      <Slider
        label="Budget"
        defaultValue={2400}
        minValue={0}
        maxValue={10000}
        step={100}
        formatOptions={{ style: 'currency', currency: 'GBP', maximumFractionDigits: 0 }}
      />
      <RangeSlider
        label="Price"
        defaultValue={[20, 80]}
        startLabel="Minimum price"
        endLabel="Maximum price"
        formatOptions={{ style: 'currency', currency: 'GBP', maximumFractionDigits: 0 }}
      />
      <Group gap="xl">
        <AngleSlider label="Rotation" defaultValue={45} />
        <Knob label="Gain" defaultValue={-6} minValue={-24} maxValue={6} formatValue={(v) => `${v} dB`} />
      </Group>
    </Stack>
  ),
};

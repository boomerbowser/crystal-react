import type { Meta, StoryObj } from '@storybook/react-vite';
import { ariaArgTypes } from '../../../.storybook/react-aria.js';
import type { DatePickerProps } from './DatePicker.js';
import { CalendarDate, today, getLocalTimeZone } from '@internationalized/date';
import { DateInput, TimeInput, DatePicker, DateRangePicker, DateTimePicker, DigitalClock } from './DatePicker.js';
import { ColorInput, ColorPicker, ColorSwatchPicker, ColorWheel } from '../ColorPicker/ColorPicker.js';
import { FileInput, DropZone, Upload } from '../FileInput/FileInput.js';
import { Stack, Group } from '../Stack/Stack.js';
import crystalFlat from '@crystal-ui/core/flat' with { type: 'json' };

/* The six palettes, from Crystal's own token file. Typing the seeds here would
   make a swatch picker that stops matching the palettes it is showing — which is
   a particularly bad place for a colour to drift. */
const palettes = (crystalFlat as unknown as {
  palettes: Record<string, { name: string; seed: string }>;
}).palettes;
const PALETTE_SWATCHES = Object.values(palettes).map((palette) => ({
  value: palette.seed,
  name: palette.name,
}));

const meta = {
  title: 'Inputs/Temporal, colour and files',
  component: DatePicker,
  /* The callbacks as actions, so the Actions panel shows what fired and with
     what. They are declared by hand because this Storybook uses `react-docgen`
     rather than `react-docgen-typescript` — see `.storybook/main.ts` — and
     react-docgen reads a component's own interface without resolving what it
     extends. Every callback here is inherited from a React Aria interface, so
     docgen cannot see one of them. Each was checked against the compiler
     before being written down. */
  argTypes: {
    ...ariaArgTypes<DatePickerProps>({
      description: true,
      errorMessage: true,
      isDisabled: true,
      isInvalid: true,
      isRequired: true,
      label: true,
      onChange: true,
    }),
  },
  parameters: {
    docs: {
      description: {
        component:
          'A date field is **not** a text field with a pattern. It is a row of segments, each its '
          + 'own spin button, which is what makes a date enterable by keyboard in any locale '
          + 'without knowing the order — and what makes it announce "day, 14" rather than reading '
          + 'a formatted string back. An unset segment shows `dd` rather than a plausible number: '
          + '`01` is an answer nobody gave.\n\n'
          + 'All the arithmetic is `@internationalized/date`. Dates are the largest single source '
          + 'of wrong answers in application code, and a design system doing its own date maths is '
          + 'a design system with a bug in it.\n\n'
          + '**Colour is never the only representation.** A swatch carries its name as text, a '
          + 'field keeps an editable text value, and the thumb is two rings — white inside dark — '
          + 'because a single-colour border disappears against part of the gamut it sits on.\n\n'
          + 'A drop surface always contains a real button: dragging needs a pointer, a steady hand '
          + 'and sight of both ends of the gesture, so it is an enhancement over choosing rather '
          + 'than a replacement.',
      },
    },
  },
  args: { label: 'Due date' },
} satisfies Meta<typeof DatePicker>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Temporal: Story = {
  render: () => (
    <Stack gap="lg" style={{ maxWidth: '420px' /* crystal-allow-literal: story column */ }}>
      <DateInput label="Date of birth" description="Type it — no calendar needed." />
      <DatePicker label="Due date" defaultValue={today(getLocalTimeZone())} />
      <DatePicker
        label="Delivery"
        description="Weekends are unavailable."
        isDateUnavailable={(date) => [0, 6].includes(date.toDate(getLocalTimeZone()).getDay())}
      />
      <DateRangePicker
        label="Stay"
        defaultValue={{ start: new CalendarDate(2026, 9, 18), end: new CalendarDate(2026, 9, 24) }}
      />
      <DateTimePicker label="Starts at" />
      <Group gap="lg">
        <TimeInput label="Opens" />
        <DigitalClock label="Closes" />
      </Group>
    </Stack>
  ),
};

export const Colour: Story = {
  render: () => (
    <Stack gap="lg" style={{ maxWidth: '420px' /* crystal-allow-literal: story column */ }}>
      <ColorInput label="Brand colour" defaultValue={PALETTE_SWATCHES[0]!.value} />
      <ColorPicker label="Accent" />
      <ColorWheel />
      <ColorSwatchPicker
        label="Palette"
        colors={PALETTE_SWATCHES}
      />
    </Stack>
  ),
};

export const Files: Story = {
  render: () => (
    <Stack gap="lg" style={{ maxWidth: '460px' /* crystal-allow-literal: story column */ }}>
      <FileInput label="Avatar" acceptedFileTypes={['image/png', 'image/jpeg']} />
      <DropZone label="Attachments" allowsMultiple>
        Drop files here, or choose them
      </DropZone>
      <Upload
        label="Attachments"
        files={[
          { id: '1', name: 'brand-guidelines.pdf', size: 2480000, progress: 0.62 },
          { id: '2', name: 'logo.svg', size: 14200 },
          { id: '3', name: 'video.mov', size: 980000000, error: 'That file is too large' },
        ]}
        onRemove={() => undefined}
      />
    </Stack>
  ),
};

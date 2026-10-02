import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { ariaArgTypes } from '../../../.storybook/react-aria.js';
import type { DatePickerProps } from './DatePicker.js';
import { CalendarDate, today, getLocalTimeZone } from '@internationalized/date';
import { DateInput, TimeInput, DatePicker, DateRangePicker, DateTimePicker, DigitalClock } from './DatePicker.js';
import { ColorInput, ColorPicker, ColorSwatchPicker, ColorWheel } from '../ColorPicker/ColorPicker.js';
import { FileInput, DropZone, Upload, UploadZone } from '../FileInput/FileInput.js';
import { Stack, Group } from '../Stack/Stack.js';
import crystalFlat from '@crystal-ui/core/flat' with { type: 'json' };

/* The six palettes, from Crystal's own token file. Seeds typed here could drift
   from the palettes the swatch picker is showing. */
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
     what. They are declared by hand because this Storybook uses `react-docgen`,
     not `react-docgen-typescript` (see `.storybook/main.ts`), and
     react-docgen reads a component's own interface without resolving what it
     extends. Every callback here is inherited from a React Aria interface, so
     docgen cannot see any of them. Each was checked against the compiler. */
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
          'A date field is a row of segments, each its own spin button, and not a text field '
          + 'with a pattern. Segments make a date enterable by keyboard in any locale without '
          + 'knowing the order, and make the field announce "day, 14" instead of reading a '
          + 'formatted string back. An unset segment shows `dd`, not a plausible number, '
          + 'because `01` is an answer nobody gave.\n\n'
          + 'All the arithmetic is `@internationalized/date`. Dates are the largest single source '
          + 'of wrong answers in application code, so the design system does no date maths of '
          + 'its own.\n\n'
          + '**Colour is never the only representation.** A swatch carries its name as text, a '
          + 'field keeps an editable text value, and the thumb is two rings (white inside dark), '
          + 'because a single-colour border disappears against part of the gamut it sits on.\n\n'
          + 'A drop surface always contains a real button. Dragging needs a pointer, a steady hand '
          + 'and sight of both ends of the gesture, so it is an enhancement to choosing and does '
          + 'not replace it.',
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
      <DateInput label="Date of birth" description="Type it. No calendar needed." />
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

/* Files dropped arrive where chosen files do, and the list shows them: the zone
   lifts with `drag-pickup` as they are carried over it and settles with
   `drag-settle` once they land, and each file joins the list with `list-in`. */
export const DroppingFiles: Story = {
  render: function DroppingFilesStory() {
    const [files, setFiles] = useState<{ id: string; name: string; size: number }[]>([]);
    const add = (list: FileList | null): void => {
      if (!list) return;
      setFiles((held) => [...held, ...[...list].map((file) => ({ id: `${file.name}-${held.length}`, name: file.name, size: file.size }))]);
    };
    return (
      <div style={{ maxWidth: '460px' /* crystal-allow-literal: story column */ }}>
        <UploadZone
          label="Attachments"
          allowsMultiple
          files={files}
          onSelect={add}
          onRemove={(id) => { setFiles((held) => held.filter((file) => file.id !== id)); }}
        >
          Drop files here, or choose them
        </UploadZone>
      </div>
    );
  },
};

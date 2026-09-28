'use client';

/* The colour family: ColorInput, ColorArea, ColorSlider, ColorWheel, ColorSwatch
 * and ColorSwatchPicker.
 *
 * One rule runs through all six and the catalogue states it twice: **colour is
 * never the only representation.** A swatch carries its name as text. A field
 * keeps an editable text value. A picker announces the colour it moved to. Every
 * one of these is a component whose entire subject is a colour, which is exactly
 * why none of them may rely on one.
 *
 * The thumb is the other shared problem. It sits on an arbitrary colour, so a
 * single-colour border disappears against part of the gamut. Crystal's thumb is
 * two rings — white inside dark — which keeps an edge against anything. The two
 * colours are the one place besides the QR code where a literal is correct: they
 * are contrast, not palette, and theming them would undo the reason they exist.
 *
 * React Aria supplies the parsing, the channel arithmetic, the two linked sliders
 * inside a colour area and the announcements. What Crystal adds is the material
 * and the thumb.
 */
import { useId, useState, type ReactNode } from 'react';
import {
  ColorPicker as AriaColorPicker,
  ColorArea as AriaColorArea,
  ColorSlider as AriaColorSlider,
  ColorWheel as AriaColorWheel,
  ColorField, ColorSwatch as AriaColorSwatch,
  ColorSwatchPicker as AriaColorSwatchPicker, ColorSwatchPickerItem,
  ColorThumb, SliderTrack, ColorWheelTrack, Label, Input, Text,
  parseColor, type Color,
} from 'react-aria-components';
import crystalFlat from '@crystal-ui/core/flat' with { type: 'json' };
import { cx } from '../../styles/cx.js';
import { FieldGroupShell } from '../FormField/FieldShell.js';
import { useChangeMotion, entered } from '../../motion/useChangeMotion.js';
import styles from './ColorPicker.module.scss';

/* Crystal's own signature, read from the tokens rather than typed in. A picker
   has to open on something, and a hex literal here would be the one colour in
   the library that stopped tracking the palette it came from. */
const flat = crystalFlat as unknown as {
  default: { palette: string };
  palettes: Record<string, { seed: string }>;
};
const DEFAULT_COLOUR = flat.palettes[flat.default.palette]!.seed;

export interface ColorInputProps {
  label: ReactNode;
  description?: ReactNode;
  errorMessage?: ReactNode;
  value?: string | Color;
  defaultValue?: string | Color;
  onChange?: (value: Color | null) => void;
  isDisabled?: boolean;
  className?: string;
}

/**
 * A text value with a swatch beside it. The text is always editable — a picker
 * that can only be pointed at is unusable without a pointer, and unusable for
 * anybody who knows the hex they want.
 */
export function ColorInput({
  label, description, errorMessage, value, defaultValue, onChange, isDisabled = false, className,
}: ColorInputProps): React.JSX.Element {
  return (
    <ColorField
      {...(value !== undefined ? { value } : {})}
      {...(defaultValue !== undefined ? { defaultValue } : {})}
      {...(onChange ? { onChange } : {})}
      isDisabled={isDisabled}
      className={cx(styles['field'], className)}
    >
      {({ isInvalid }) => (
      <>
      <Label className={cx(styles['label'])}>{label}</Label>
      <FieldGroupShell isInvalid={isInvalid} className={cx(styles['shell'], 'cr-field-shell')}>
        <AriaColorSwatch className={cx(styles['swatch'])} />
        <Input className={cx(styles['control'])} />
      </FieldGroupShell>
      {description ? (
        <Text slot="description" className={cx(styles['description'])}>{description}</Text>
      ) : null}
      {errorMessage ? <span role="alert" className={cx(styles['error'])}>{errorMessage}</span> : null}
      </>
      )}
    </ColorField>
  );
}

/* Each of the three surfaces below works on its own as well as inside a
   `ColorPicker`. The catalogue lists them as separate components, so they have to:
   React Aria throws without a value when there is no picker above to inherit
   one from, which is what made the first version unusable standalone. */
interface StandaloneColour {
  value?: string | Color;
  defaultValue?: string | Color;
  onChange?: (value: Color) => void;
}

export interface ColorAreaProps extends StandaloneColour {
  /** Which two channels the area moves. Defaults to saturation and brightness. */
  xChannel?: 'saturation' | 'hue' | 'red' | 'green' | 'blue';
  yChannel?: 'brightness' | 'saturation' | 'red' | 'green' | 'blue';
  className?: string;
}

/** Two linked sliders in a plane. Each axis announces its own value. */
export function ColorArea({
  xChannel = 'saturation', yChannel = 'brightness', value, defaultValue, onChange, className,
}: ColorAreaProps): React.JSX.Element {
  /* The same conversion `ColorSlider` does, and it was missing here. An area's
     two channels have to exist in the colour it is given: handed `#7338EF`,
     which is RGB, it asks an RGBColor for its saturation and React Aria throws
     `Unknown color channel: saturation` — the story rendered nothing at all.
     No unit test saw it, because the defect is a render-time throw in a browser
     and the Colour story had no assertion of its own. */
  const resolvedValue = inSpaceFor(xChannel, value);
  const resolvedDefault = inSpaceFor(xChannel, defaultValue);

  return (
    <AriaColorArea
      xChannel={xChannel}
      yChannel={yChannel}
      {...(resolvedValue !== undefined ? { value: resolvedValue } : {})}
      {...(resolvedDefault !== undefined ? { defaultValue: resolvedDefault } : {})}
      {...(onChange ? { onChange } : {})}
      className={cx(styles['area'], className)}
    >
      <ColorThumb className={cx(styles['thumb'])} />
    </AriaColorArea>
  );
}

export interface ColorSliderProps extends StandaloneColour {
  /** Which channel. Named in the label, and in the announcement. */
  channel: 'hue' | 'saturation' | 'brightness' | 'lightness' | 'alpha' | 'red' | 'green' | 'blue';
  label?: ReactNode;
  className?: string;
}

/* A colour only has the channels of the space it is in: `#7338EF` is RGB and has
   no hue, so a hue slider handed a hex throws rather than converting. Everybody's
   colour is a hex, so the conversion happens here — the alternative is a
   component that works only when it is passed a value in a format nobody writes
   by hand. */
const SPACE_FOR_CHANNEL = {
  hue: 'hsb', saturation: 'hsb', brightness: 'hsb',
  lightness: 'hsl',
  red: 'rgb', green: 'rgb', blue: 'rgb',
} as const;

function inSpaceFor(
  channel: ColorSliderProps['channel'] | NonNullable<ColorAreaProps['xChannel']>,
  colour: string | Color | undefined,
): Color | undefined {
  if (colour === undefined) return undefined;
  const parsed = typeof colour === 'string' ? parseColor(colour) : colour;
  const space = SPACE_FOR_CHANNEL[channel as keyof typeof SPACE_FOR_CHANNEL];
  /* Alpha exists in every space, so a colour carrying it is left alone. */
  return space ? parsed.toFormat(space) : parsed;
}

/** One channel, as a track. The value announces in that channel's own units. */
export function ColorSlider({
  channel, label, value, defaultValue, onChange, className,
}: ColorSliderProps): React.JSX.Element {
  const resolvedValue = inSpaceFor(channel, value);
  const resolvedDefault = inSpaceFor(channel, defaultValue);

  return (
    <AriaColorSlider
      channel={channel}
      {...(resolvedValue !== undefined ? { value: resolvedValue } : {})}
      {...(resolvedDefault !== undefined ? { defaultValue: resolvedDefault } : {})}
      {...(onChange ? { onChange } : {})}
      className={cx(styles['field'], className)}
    >
      {label ? <Label className={cx(styles['label'])}>{label}</Label> : null}
      <SliderTrack className={cx(styles['track'])}>
        <ColorThumb className={cx(styles['thumb'])} />
      </SliderTrack>
    </AriaColorSlider>
  );
}

export interface ColorWheelProps extends StandaloneColour {
  /** Outer diameter in px. */
  size?: number;
  className?: string;
}

/** Hue as a ring, in degrees, wrapping at 360. */
export function ColorWheel({
  size = 192, value, defaultValue, onChange, className,
}: ColorWheelProps): React.JSX.Element {
  return (
    <AriaColorWheel
      outerRadius={size / 2}
      innerRadius={size / 2 - 24}
      {...(value !== undefined ? { value } : {})}
      {...(defaultValue !== undefined ? { defaultValue } : {})}
      {...(onChange ? { onChange } : {})}
      className={cx(styles['wheel'], className)}
    >
      <ColorWheelTrack />
      <ColorThumb className={cx(styles['thumb'])} />
    </AriaColorWheel>
  );
}

export interface ColorSwatchProps {
  color: string | Color;
  /** The colour's name. Required: colour cannot be the only carrier. */
  name: string;
  className?: string;
}

/** One colour, with its name as text beside it. */
export function ColorSwatch({ color, name, className }: ColorSwatchProps): React.JSX.Element {
  return (
    <span className={className}>
      <AriaColorSwatch color={color} className={cx(styles['swatch'])} />
      {/* Not a tooltip and not a title: the name is content. */}
      <span className={cx(styles['name'])}>{name}</span>
    </span>
  );
}

export interface ColorSwatchPickerProps {
  label: ReactNode;
  /** The palette offered, each with the name it is announced by. */
  colors: readonly { value: string; name: string }[];
  value?: string | Color;
  defaultValue?: string | Color;
  onChange?: (value: Color) => void;
  className?: string;
}

/** A listbox of swatches. Arrow keys move; the chosen one is announced by name. */
export function ColorSwatchPicker({
  label, colors, value, defaultValue, onChange, className,
}: ColorSwatchPickerProps): React.JSX.Element {
  return (
    <div className={cx(styles['field'], className)}>
      <span className={cx(styles['label'])}>{label}</span>
      <AriaColorSwatchPicker
        {...(value !== undefined ? { value } : {})}
        {...(defaultValue !== undefined ? { defaultValue } : {})}
        {...(onChange ? { onChange } : {})}
        className={cx(styles['swatchGrid'])}
      >
        {colors.map((colour) => (
          <ColorSwatchPickerItem
            key={colour.value}
            color={colour.value}
            /* The name, not the hex. "#7338EF" is not something anybody
               recognises as a colour. */
            aria-label={colour.name}
            className={cx(styles['swatchOption'])}
          >
            {({ isSelected }) => <PickedSwatch isSelected={isSelected} />}
          </ColorSwatchPickerItem>
        ))}
      </AriaColorSwatchPicker>
    </div>
  );
}

export interface ColorPickerProps {
  label: ReactNode;
  defaultValue?: string;
  onChange?: (value: Color) => void;
  className?: string;
}

/** The whole surface: an area, a hue slider and an editable text value. */
export function ColorPicker({
  label, defaultValue = DEFAULT_COLOUR, onChange, className,
}: ColorPickerProps): React.JSX.Element {
  /* Held in HSB, not in whatever space the hex parsed to.
     
     Every child of this picker reads an HSB channel — the area moves saturation
     and brightness, the slider moves hue — and `parseColor('#7338EF')` returns
     an RGBColor, which has none of them. React Aria throws on the first render
     rather than converting, so the whole picker rendered as an error boundary.
     Converting once here is the fix for all three children at once; converting
     in each child would leave them disagreeing about what the current colour is
     the moment one of them changed it. `toString('hex')` still works from HSB,
     so a consumer reading the value back sees no difference. */
  const [colour, setColour] = useState<Color>(() => parseColor(defaultValue).toFormat('hsb'));
  const groupId = useId();

  return (
    <AriaColorPicker
      value={colour}
      onChange={(next) => { setColour(next); onChange?.(next); }}
    >
      <div className={cx(styles['field'], className)} role="group" aria-labelledby={groupId}>
        <span id={groupId} className={cx(styles['label'])}>{label}</span>
        <ColorArea />
        <ColorSlider channel="hue" />
        {/* Always editable, and always present: the text is the representation
            that does not depend on seeing the colour.

            Named, and it was not. The picker's own caption is a `span` heading a
            group, so it labels the group and not the input inside it, and the
            hex field went out with no accessible name at all — React Aria said
            so in a console warning on every render and nobody was reading the
            console. "Hexadecimal value" rather than repeating the picker's
            label: inside a group that is already announced as "Accent", a field
            called "Accent" says nothing a listener did not just hear. */}
        <ColorField className={cx(styles['field'])} aria-label="Hexadecimal value">
          {({ isInvalid }) => (
            <FieldGroupShell isInvalid={isInvalid} className={cx(styles['shell'], 'cr-field-shell')}>
              <AriaColorSwatch className={cx(styles['swatch'])} />
              <Input className={cx(styles['control'])} />
            </FieldGroupShell>
          )}
        </ColorField>
      </div>
    </AriaColorPicker>
  );
}

/* The swatch inside a picker option, playing `selection` when its option becomes
   the chosen colour — and not on the render that opens the picker with one
   already chosen. React Aria hands the option's state to a render function, so
   the motion is on the swatch rather than on the option around it. */
function PickedSwatch({ isSelected }: { isSelected: boolean }): React.JSX.Element {
  const scope = useChangeMotion(isSelected, entered('selection'));
  return <AriaColorSwatch ref={scope as never} />;
}

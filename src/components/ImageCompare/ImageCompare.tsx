'use client';

/* ImageCompare. Two images under a draggable divider.
 *
 * "The divider is a slider with a percentage value and keyboard steps." A
 * divider that is only draggable is a control nobody without a pointer can use,
 * and one that looks like a slider without the role announces nothing. So it is
 * React Aria's slider, which supplies the role, the value, the arrow keys with
 * Home and End, and `aria-valuetext`, so it says "62%" rather than "62". The
 * value text is the part that is easy to miss.
 *
 * The images are stacked and the top one is clipped to the divider. Both carry
 * their own `alt`: they are two different pictures, and a reader who is told
 * about one of them has been told half of what the comparison is.
 *
 * Right-to-left needs no work here beyond what React Aria already does. The
 * layout is logical, and the value mapping reverses inside the slider, which no
 * stylesheet can express.
 */
import { forwardRef, useState, type CSSProperties, type HTMLAttributes } from 'react';
import {
  Slider as AriaSlider, SliderTrack, SliderThumb,
} from 'react-aria-components';
import { cx } from '../../styles/cx.js';
import { useChangeMotion } from '../../motion/useChangeMotion.js';
import styles from './ImageCompare.module.scss';

export interface ImageCompareSide {
  src: string;
  /** What this picture is. Both sides need one; they are different pictures. */
  alt: string;
}

export interface ImageCompareProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'onChange'> {
  /** Shown on the start side, under the divider. */
  before: ImageCompareSide;
  /** Shown on the end side. */
  after: ImageCompareSide;
  /** Names the comparison and the divider, as in "Before and after
   *  retouching". */
  label: string;
  /** Where the divider starts, 0 to 100. */
  defaultValue?: number;
  value?: number;
  onChange?: (value: number) => void;
  /** Width over height, reserved so nothing shifts as the pictures load. */
  ratio?: number;
}

export const ImageCompare = forwardRef<HTMLDivElement, ImageCompareProps>(function ImageCompare(
  { before, after, label, defaultValue = 50, value, onChange, ratio = 16 / 9, className, ...props },
  ref,
) {
  /* The divider's position is held here, not read out of the slider's render
     prop. A custom property inherits down the tree, so a value written inside
     the slider cannot reach the picture that is clipped by it. It has to be on
     the container, above both. */
  const [internal, setInternal] = useState(defaultValue);
  const at = value ?? internal;

  const move = (next: number) => {
    if (value === undefined) setInternal(next);
    onChange?.(next);
  };

  return (
    <div
      {...props}
      ref={ref}
      className={cx(styles['compare'], className)}
      style={{ aspectRatio: String(ratio), '--compare-at': `${at}%` } as CSSProperties}
    >
      {/* Two different pictures, so both carry their own description: a reader
          told about one of them has been told half the comparison. */}
      <img src={after.src} alt={after.alt} className={styles['image']} />
      <img src={before.src} alt={before.alt} className={cx(styles['image'], styles['clipped'])} />

      <AriaSlider
        className={cx(styles['slider'])}
        aria-label={label}
        minValue={0}
        maxValue={100}
        step={1}
        /* `style: 'unit'` with the percent unit, not `style: 'percent'`. The
           latter multiplies by a hundred, so a divider at 62 would announce
           "6,200%" (checked). */
        formatOptions={{ style: 'unit', unit: 'percent' }}
        value={at}
        onChange={move}
      >
        <SliderTrack className={cx(styles['track'])}>
          <span aria-hidden="true" className={styles['position']} />
          {/* `data-cr-handle` is the handle's identity in the DOM, in the same
              `data-cr-*` namespace the motion state uses. React Aria puts the
              real `input[role=slider]` in a visually-hidden 1px box inside
              this element, so the element ARIA names and the element a finger
              meets are different nodes. A target gate that probed the named one
              would report a 1px handle on a control that is 44px. The segmented
              control's label has the same trap. */}
          <SliderThumb className={cx(styles['thumb'])} data-cr-handle="">
            {({ isDragging }) => <Grip isDragging={isDragging} />}
          </SliderThumb>
        </SliderTrack>
      </AriaSlider>
    </div>
  );
});

/* The handle you can see: Crystal's Resin plane at the pill, filling the thumb.
   An element of its own because React Aria positions the thumb with an inline
   `transform`, and a recipe that moved the thumb's transform would move it off
   the divider. The grip is free to move. It lifts with `drag-pickup` as a drag begins
   and settles with `drag-settle` as it ends. The keyboard moves the divider
   without either, since nothing is picked up. */
function Grip({ isDragging }: { isDragging: boolean }): React.JSX.Element {
  const scope = useChangeMotion(isDragging, (was, is) => (is ? 'drag-pickup' : was ? 'drag-settle' : null));
  return <span ref={scope as never} aria-hidden="true" className={cx(styles['grip'], 'cr-resin')} />;
}

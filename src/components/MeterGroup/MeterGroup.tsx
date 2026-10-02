'use client';

/* MeterGroup: several proportions shown on one bar.
 *
 * "Each segment is labelled; meaning never rests on colour alone." That rule
 * forbids a stacked bar of tinted bands with only a colour key beside it, so
 * every segment is named twice: in the legend under the bar, beside its
 * swatch, and in the segment's own accessible text. The colour reinforces the
 * name in both places.
 *
 * "Segments meet without gaps", so this is one track with segments laid end to
 * end, not a row of bars with the gap collapsed to zero. The difference shows
 * when a segment rounds to a fraction of a pixel.
 *
 * Each segment is its own `role="meter"` with its own value against the
 * group's total, because "63% disk, 22% cache" is two measurements and an
 * element that reported one number would have to pick. The group itself is a
 * plain labelled region.
 */
import {
  forwardRef, useId, type CSSProperties, type HTMLAttributes, type ReactNode,
} from 'react';
import { seriesColour } from '../../charts/channel.js';
import { cx } from '../../styles/cx.js';
import { useChangeMotion } from '../../motion/useChangeMotion.js';
import styles from './MeterGroup.module.scss';

export interface MeterSegment {
  /** What this part is. Required, because without a name a segment is only a colour. */
  name: string;
  value: number;
  /** The value in words. Defaults to a share of the total. */
  valueLabel?: string;
  /** A status colour, when the segment means one. Never the only signal. */
  status?: 'success' | 'attention' | 'danger' | 'info';
}

export interface MeterGroupProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  /** What the bar is of. */
  label: ReactNode;
  segments: readonly MeterSegment[];
  /** The whole the segments are parts of. Defaults to their sum. */
  total?: number;
  /** Show the legend. On by default: it is where the names live. */
  legend?: boolean;
  format?: (value: number) => string;
}

export const MeterGroup = forwardRef<HTMLDivElement, MeterGroupProps>(function MeterGroup({
  label, segments, total, legend = true, format = (value) => String(value),
  className, ...props
}, ref): ReactNode {
  const id = useId();
  const sum = segments.reduce((carry, one) => carry + Math.max(0, one.value), 0);
  const whole = total ?? sum;
  /* A group whose parts do not fill the whole leaves the rest of the track
     empty, which is the point of passing a `total` at all. */
  const share = (value: number): number => (whole > 0 ? Math.max(0, value) / whole : 0);

  return (
    <div {...props} ref={ref} className={cx(styles['group'], className)} aria-labelledby={`${id}-label`} role="group">
      <p className={styles['heading']} id={`${id}-label`}>{label}</p>
      <div className={styles['track']}>
        {segments.map((segment, index) => (
          <MovingSegment
            key={segment.name}
            value={segment.value}
            role="meter"
            aria-label={segment.name}
            aria-valuenow={segment.value}
            aria-valuemin={0}
            aria-valuemax={whole}
            aria-valuetext={segment.valueLabel ?? `${format(segment.value)} of ${format(whole)}`}
            className={styles['segment']}
            data-status={segment.status}
            /* The colour arrives as a custom property instead of a
               `background`, so the forced-colours rules in the stylesheet can
               win. An inline `background` outranks every rule in every sheet,
               including the one that replaces it when the operating system
               takes the palette away. The charts do the same. */
            style={{
              inlineSize: `${share(segment.value) * 100}%`,
              ...(segment.status ? {} : { '--segment-colour': seriesColour(index) }),
            } as CSSProperties}
          />
        ))}
      </div>
      {legend ? (
        <ul className={styles['legend']}>
          {segments.map((segment, index) => (
            <li key={segment.name} className={styles['entry']}>
              <span
                aria-hidden="true"
                className={styles['swatch']}
                data-status={segment.status}
                style={segment.status
                  ? undefined
                  : { '--segment-colour': seriesColour(index) } as CSSProperties}
              />
              <span className={styles['name']}>{segment.name}</span>
              <span className={styles['value']}>
                {segment.valueLabel ?? format(segment.value)}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
});

/* One segment. A change in what it measures plays Crystal's `progress-change`
   after the value is set (the recipe does not stand in for the value), and
   never on the render that first shows it. */
function MovingSegment({ value, ...props }: HTMLAttributes<HTMLDivElement> & { value: number; 'data-status'?: string | undefined }): React.JSX.Element {
  const scope = useChangeMotion(value, () => 'progress-change');
  return <div ref={scope as never} {...props} />;
}

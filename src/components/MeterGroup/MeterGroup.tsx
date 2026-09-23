'use client';

/* MeterGroup — several proportions shown on one bar.
 *
 * "Each segment is labelled; **meaning never rests on colour alone**." A stacked
 * bar of five tinted bands with a colour key beside it is exactly the shape that
 * rule forbids, so every segment is named twice: in the legend under the bar,
 * where the name is written out beside its swatch, and in the segment's own
 * accessible text. The colour is reinforcement in both places.
 *
 * "Segments meet without gaps" — so this is one track with segments laid end to
 * end, not a row of bars with a gap collapsed to zero. The difference shows the
 * first time a segment rounds to a fraction of a pixel.
 *
 * A group of meters is not one meter. Each segment is its own `role="meter"`
 * with its own value against the group's total, because "63% disk, 22% cache" is
 * two measurements and an element that reported one number would have to pick.
 * The group itself is a plain labelled region.
 */
import {
  forwardRef, useId, type CSSProperties, type HTMLAttributes, type ReactNode,
} from 'react';
import { seriesColour } from '../../charts/channel.js';
import { cx } from '../../styles/cx.js';
import styles from './MeterGroup.module.scss';

export interface MeterSegment {
  /** What this part is. Required — a segment with no name is a colour. */
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
          <div
            key={segment.name}
            role="meter"
            aria-label={segment.name}
            aria-valuenow={segment.value}
            aria-valuemin={0}
            aria-valuemax={whole}
            aria-valuetext={segment.valueLabel ?? `${format(segment.value)} of ${format(whole)}`}
            className={styles['segment']}
            data-status={segment.status}
            /* The colour arrives as a custom property rather than as a
               `background`, so the forced-colours rules in the stylesheet can
               win: an inline `background` outranks every rule in every sheet,
               including the one that has to replace it when the operating
               system takes the palette away. Same reason as the charts. */
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

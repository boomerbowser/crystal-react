'use client';

/* ChartLegend — names the series in a chart and toggles them.
 *
 * "Toggles are buttons with a pressed state; hidden series are announced." Both
 * halves matter and the second is the one that gets left out: turning a series
 * off changes the picture, and a reader who cannot see the picture is told
 * nothing unless somebody says it. So each entry carries `aria-pressed` and the
 * change is announced in words.
 *
 * Selection is by **weight**, not by a mark and not by colour. A legend entry
 * that is on is heavier than one that is off; the swatch beside it is which
 * series this is, never whether it is showing. That is Crystal's rule
 * everywhere and it matters more here than usual, because the one thing a legend
 * entry already carries is a colour.
 *
 * The swatch carries the series' second channel too — the dash for a line, the
 * shape for a point — so that a reader matching the legend to the chart is
 * matching the same two things in both places rather than a colour in one and a
 * pattern in the other.
 */
import { useId, useState, type CSSProperties, type HTMLAttributes, type ReactNode } from 'react';
import { markerPath, seriesColour, seriesDash, seriesMarker } from '../../charts/channel.js';
import { chartGeometry } from '../../theme/chartGeometry.js';
import { cx } from '../../styles/cx.js';
import { useChangeMotion, entered } from '../../motion/useChangeMotion.js';
import styles from './ChartLegend.module.scss';

export type LegendMark = 'swatch' | 'line' | 'point';

export interface ChartLegendEntry {
  name: string;
  /** The index into the series scale — which colour and which second channel. */
  index: number;
  /** Showing. Omitted entirely for a legend that does not toggle. */
  shown?: boolean;
}

export interface ChartLegendProps extends Omit<HTMLAttributes<HTMLElement>, 'onToggle'> {
  entries: readonly ChartLegendEntry[];
  /** What the swatch draws, so it matches the marks it names. */
  mark?: LegendMark;
  /** Given a series name, toggles it. Without this the legend is a key, not a
   *  control, and it renders as text rather than as buttons. */
  onToggle?: (name: string, shown: boolean) => void;
  /** How a change is announced. */
  announce?: (name: string, shown: boolean) => string;
}

export function ChartLegend({
  entries, mark = 'swatch', onToggle, announce, className, ...props
}: ChartLegendProps): ReactNode {
  const id = useId();
  const said = announce ?? ((name, shown) => `${name} ${shown ? 'shown' : 'hidden'}`);
  /* What the reader last did, not what the data last was. Announcing a state
     derived from the entries would say something on every render the chart made
     for any reason, and a live region that speaks when nobody acted is a live
     region people turn off. */
  const [spoken, setSpoken] = useState<string | null>(null);

  return (
    <div {...props} className={cx(styles['legend'], className)}>
      <ul className={styles['list']}>
        {entries.map((entry) => {
          const shown = entry.shown ?? true;
          const content = (
            <>
              <Swatch mark={mark} index={entry.index} />
              <span className={styles['name']}>{entry.name}</span>
            </>
          );
          return (
            <li key={entry.name} className={styles['item']}>
              {onToggle ? (
                <Toggle
                  isShown={shown}
                  className={cx(styles['toggle'], 'cr-bare')}
                  aria-pressed={shown}
                  data-shown={shown ? '' : undefined}
                  onClick={() => {
                    onToggle(entry.name, !shown);
                    setSpoken(said(entry.name, !shown));
                  }}
                >
                  {content}
                </Toggle>
              ) : (
                <span className={styles['entry']}>{content}</span>
              )}
            </li>
          );
        })}
      </ul>
      {/* Announced rather than only drawn. A polite live region, because the
          reader pressed the button and is not waiting on the result. */}
      <span className={styles['announcement']} role="status" aria-live="polite" id={id}>
        {spoken}
      </span>
    </div>
  );
}

function Swatch({ mark, index }: { mark: LegendMark; index: number }): ReactNode {
  const size = chartGeometry.pointMin * 2;
  const style = { '--series-colour': seriesColour(index) } as CSSProperties;
  if (mark === 'line') {
    const dash = seriesDash(index);
    return (
      <svg aria-hidden="true" className={styles['swatch']} viewBox="0 0 16 16" style={style}>
        <line
          className={styles['swatchLine']}
          x1={0}
          x2={16}
          y1={8}
          y2={8}
          {...(dash ? { strokeDasharray: dash } : {})}
        />
      </svg>
    );
  }
  if (mark === 'point') {
    return (
      <svg aria-hidden="true" className={styles['swatch']} viewBox="0 0 16 16" style={style}>
        <path className={styles['swatchFill']} transform="translate(8,8)" d={markerPath(seriesMarker(index), size)} />
      </svg>
    );
  }
  return (
    <svg aria-hidden="true" className={styles['swatch']} viewBox="0 0 16 16" style={style}>
      <rect className={styles['swatchFill']} x={2} y={2} width={12} height={12} rx={3} />
    </svg>
  );
}

/* A series toggle, playing `selection` when the series is turned on — the one
   state a legend entry enters — and not on the render that shows it on. */
function Toggle({ isShown, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  isShown: boolean;
  'data-shown'?: string | undefined;
}): React.JSX.Element {
  const scope = useChangeMotion(isShown, entered('selection'));
  return <button type="button" ref={scope as never} {...props} />;
}

'use client';

/* CalendarHeatmap: daily values across weeks and months.
 *
 * "Every cell states its date and value." The date matters more here than the
 * value. A grid of squares with no axis cannot be read by position alone (a
 * reader cannot count "third column, fifth row" back to a Tuesday in March), so
 * the date is written into every cell's label. For the same reason, a day with
 * no measurement says so in words instead of being a lighter square.
 *
 * Weeks run down the columns and months label them along the top, as in every
 * calendar heatmap. A year is 53 columns of 7. The alternative, 7 columns of 53,
 * is a tall strip that cannot be compared across.
 *
 * The scale, the buckets and the contrast floor are Crystal's, the same ones the
 * heatmap uses. There is one ramp in the system, not one per chart.
 */
import { type CSSProperties, type ReactNode } from 'react';
import { ChartSurface, type ChartSurfaceProps } from '../ChartSurface/ChartSurface.js';
import { useMarkNavigation } from '../../charts/useMarkNavigation.js';
import {
  INTENSITY_STEPS, intensityFill, intensityInk, intensityStep,
} from '../../charts/intensity.js';
import { chartGeometry } from '../../theme/chartGeometry.js';
import { cx } from '../../styles/cx.js';
import styles from './CalendarHeatmap.module.scss';

export interface CalendarDay {
  /** An ISO date, `YYYY-MM-DD`. */
  date: string;
  value: number | null;
}

export interface CalendarHeatmapProps extends Omit<ChartSurfaceProps, 'children' | 'table'> {
  days: readonly CalendarDay[];
  domain?: [number, number];
  format?: (value: number) => string;
  /** How a date reads. Defaults to the ISO date, which is at least unambiguous. */
  formatDate?: (date: string) => string;
  /** Which day a week starts on, 0 for Sunday. */
  weekStart?: number;
  table?: ChartSurfaceProps['table'];
}

/* The largest a day is drawn. A year is 53 columns, and a cell that grew to fill
   a wide container would turn a calendar of small squares into a calendar of
   tiles, which a reader does not recognise. Cells shrink below this to fit and
   never grow past it. */
const CELL = 14;

export function CalendarHeatmap({
  days, domain, format = (value) => String(value), formatDate = (date) => date,
  weekStart = 1, table, className, height = 160, ...surface
}: CalendarHeatmapProps): ReactNode {
  const values = days.map((day) => day.value).filter((value): value is number => value !== null);
  const [low, high] = domain ?? [Math.min(0, ...values), Math.max(1, ...values)];
  const marks = useMarkNavigation(days.length);
  const placed = place(days, weekStart);
  const weeks = placed.reduce((most, day) => Math.max(most, day.week + 1), 0);

  return (
    <ChartSurface
      {...surface}
      height={height}
      insets={{ top: 20, right: 8, bottom: 8, left: 36 }}
      table={table ?? {
        columns: ['Date', 'Value'],
        rows: days.map((day) => [
          formatDate(day.date),
          day.value === null ? null : format(day.value),
        ]),
      }}
      empty={surface.empty ?? days.length === 0}
      className={cx(styles['chart'], className)}
    >
      {(frame) => {
        const { inner } = frame;
        const gap = chartGeometry.cellGap;
        const side = Math.max(4, Math.min(CELL, (inner.width - gap * (weeks - 1)) / weeks));
        const months = monthStarts(placed);

        return (
          <>
            <g aria-hidden="true">
              {months.map((month) => (
                <text
                  key={month.label}
                  className={styles['axisLabel']}
                  x={inner.x + month.week * (side + gap)}
                  y={inner.y - 6}
                >
                  {month.label}
                </text>
              ))}
            </g>
            <g {...marks.containerProps}>
              {placed.map((day, index) => {
                const step = day.value === null ? 0 : intensityStep(day.value, low, high);
                const missing = day.value === null;
                return (
                  <g
                    key={day.date}
                    {...marks.markProps(index)}
                    role="graphics-symbol"
                    aria-label={`${formatDate(day.date)}, `
                      + `${day.value === null ? 'no measurement' : format(day.value)}`}
                    className={styles['day']}
                    data-active={marks.active === index ? '' : undefined}
                    data-empty={step === 0 ? '' : undefined}
                    data-missing={missing ? '' : undefined}
                    style={{
                      '--cell-fill': intensityFill(step),
                      '--cell-ink': intensityInk(step),
                      '--cell-strength': String(step / INTENSITY_STEPS),
                    } as CSSProperties}
                  >
                    <rect
                      className={styles['fill']}
                      x={inner.x + day.week * (side + gap)}
                      y={inner.y + day.row * (side + gap)}
                      width={side}
                      height={side}
                      /* Just off square. A day is a mark, not a control, so it
                         takes none of Crystal's action geometry. This is the
                         smallest radius that stops a 14px square reading as a
                         pixel. */
                      rx={2}
                    />
                  </g>
                );
              })}
            </g>
          </>
        );
      }}
    </ChartSurface>
  );
}

interface PlacedDay extends CalendarDay {
  week: number;
  row: number;
  month: number;
}

/** Which column and row each day sits in, counted from the first day given. */
export function place(days: readonly CalendarDay[], weekStart: number): PlacedDay[] {
  const first = days[0];
  if (!first) return [];
  const start = new Date(`${first.date}T00:00:00Z`);
  /* Back to the start of that day's week, so the first column is a whole week
     and the days before the range are absent, not shifted. */
  const offset = (start.getUTCDay() - weekStart + 7) % 7;
  return days.map((day) => {
    const at = new Date(`${day.date}T00:00:00Z`);
    const elapsed = Math.round((at.getTime() - start.getTime()) / 86400000) + offset;
    return {
      ...day,
      week: Math.floor(elapsed / 7),
      row: elapsed % 7,
      month: at.getUTCMonth(),
    };
  });
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** The column each month first appears in, for the labels along the top. */
function monthStarts(days: readonly PlacedDay[]): { week: number; label: string }[] {
  const seen = new Set<number>();
  const out: { week: number; label: string }[] = [];
  for (const day of days) {
    if (seen.has(day.month)) continue;
    seen.add(day.month);
    out.push({ week: day.week, label: MONTHS[day.month] ?? '' });
  }
  return out;
}

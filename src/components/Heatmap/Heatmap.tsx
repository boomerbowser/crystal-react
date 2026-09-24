'use client';

/* Heatmap — a matrix of values shown as cell intensity.
 *
 * "Intensity is paired with a value; colour alone never carries meaning." Both
 * clauses, and they are the same requirement stated twice: every cell is
 * labelled with its number, and every cell's label reads on its own paint,
 * because Crystal's intensity ramp ships the ink for each step. That is what
 * makes the pairing real rather than a promise — a number written in one colour
 * across a five-step ramp is unreadable at one end of it.
 *
 * "Cells are square with a hairline gap." Square, so a row and a column weigh
 * the same; the gap is Crystal's `--cr-chart-cell-gap`, which is a gap rather
 * than a border for the same reason the pie's separation is.
 *
 * The scale is equal-width buckets, never quantiles — see `charts/intensity.ts`
 * for why that is a correctness decision and not a preference.
 */
import { type CSSProperties, type ReactNode } from 'react';
import { ChartSurface, type ChartSurfaceProps } from '../ChartSurface/ChartSurface.js';
import { useMarkNavigation } from '../../charts/useMarkNavigation.js';
import {
  INTENSITY_STEPS, intensityFill, intensityInk, intensityStep,
} from '../../charts/intensity.js';
import { chartGeometry } from '../../theme/chartGeometry.js';
import { cx } from '../../styles/cx.js';
import styles from './Heatmap.module.scss';

export interface HeatmapProps extends Omit<ChartSurfaceProps, 'children' | 'table'> {
  /** One row per row label, one value per column. `null` is no measurement. */
  rows: readonly (readonly (number | null)[])[];
  rowLabels: readonly string[];
  columnLabels: readonly string[];
  /** Fix the range, so two heatmaps can be compared. */
  domain?: [number, number];
  format?: (value: number) => string;
  /** Write the number in the cell as well as pairing it in the label. */
  showValues?: boolean;
  table?: ChartSurfaceProps['table'];
}

export function Heatmap({
  rows, rowLabels, columnLabels, domain, format = (value) => String(value),
  showValues = true, table, className, height = 260, ...surface
}: HeatmapProps): ReactNode {
  const values = rows.flat().filter((value): value is number => value !== null);
  const [low, high] = domain ?? [Math.min(0, ...values), Math.max(1, ...values)];
  const marks = useMarkNavigation(rowLabels.length * columnLabels.length);

  return (
    <ChartSurface
      {...surface}
      height={height}
      insets={{ top: 24, right: 8, bottom: 8, left: 88 }}
      table={table ?? {
        columns: ['Row', ...columnLabels],
        rows: rowLabels.map((label, r) => [
          label,
          ...columnLabels.map((_, c) => {
            const value = rows[r]?.[c];
            return value === null || value === undefined ? null : format(value);
          }),
        ]),
      }}
      empty={surface.empty ?? rowLabels.length === 0}
      className={cx(styles['chart'], className)}
    >
      {(frame) => {
        const { inner } = frame;
        const gap = chartGeometry.cellGap;
        /* Square: the smaller of what a column and a row can have, so a wide
           matrix does not stretch its cells into bars. */
        const side = Math.max(1, Math.min(
          (inner.width - gap * (columnLabels.length - 1)) / columnLabels.length,
          (inner.height - gap * (rowLabels.length - 1)) / rowLabels.length,
        ));

        return (
          <>
            <g aria-hidden="true">
              {columnLabels.map((label, c) => (
                <text
                  key={label}
                  className={styles['axisLabel']}
                  x={inner.x + c * (side + gap) + side / 2}
                  y={inner.y - 8}
                  textAnchor="middle"
                >
                  {label}
                </text>
              ))}
              {rowLabels.map((label, r) => (
                <text
                  key={label}
                  className={styles['axisLabel']}
                  x={inner.x - 8}
                  y={inner.y + r * (side + gap) + side / 2}
                  textAnchor="end"
                  dominantBaseline="middle"
                >
                  {label}
                </text>
              ))}
            </g>
            <g {...marks.containerProps}>
              {rowLabels.map((rowLabel, r) => columnLabels.map((columnLabel, c) => {
                const value = rows[r]?.[c];
                const index = r * columnLabels.length + c;
                const missing = value === null || value === undefined;
                const step = missing ? 0 : intensityStep(value, low, high);
                const x = inner.x + c * (side + gap);
                const y = inner.y + r * (side + gap);
                return (
                  <g
                    key={`${rowLabel}-${columnLabel}`}
                    {...marks.markProps(index)}
                    role="graphics-symbol"
                    aria-label={`${rowLabel}, ${columnLabel}, `
                      + `${value === null || value === undefined ? 'no measurement' : format(value)}`}
                    className={styles['cell']}
                    data-active={marks.active === index ? '' : undefined}
                    data-empty={step === 0 ? '' : undefined}
                    data-missing={missing ? '' : undefined}
                    style={{
                      '--cell-fill': intensityFill(step),
                      '--cell-ink': intensityInk(step),
                      /* How strong this cell is, as a fraction. Read only under
                         forced colours, where the ramp has been replaced by one
                         colour and the intensity has to be carried by the size of
                         the mark instead of by its paint. */
                      '--cell-strength': String(step / INTENSITY_STEPS),
                    } as CSSProperties}
                  >
                    <rect className={styles['fill']} x={x} y={y} width={side} height={side} />
                    {showValues && value !== null && value !== undefined && side >= 28 ? (
                      <text
                        className={styles['value']}
                        x={x + side / 2}
                        y={y + side / 2}
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        {format(value)}
                      </text>
                    ) : null}
                  </g>
                );
              }))}
            </g>
          </>
        );
      }}
    </ChartSurface>
  );
}

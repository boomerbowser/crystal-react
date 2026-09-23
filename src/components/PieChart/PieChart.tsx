'use client';

/* PieChart — parts of a whole as segments.
 *
 * "Each segment is labelled with its value; the total is stated." Both, and the
 * second is the one people leave out: a pie asserts that its segments are *the
 * whole of something*, and a reader cannot check that assertion — or notice that
 * 4% is missing — unless the total is written down. So the total is in the
 * caption area and in the table, always.
 *
 * Areas are the marks here, so the second channel is the **label** rather than a
 * pattern — see `charts/channel.ts` for why that is the right answer for an area
 * and not a concession. Each wedge states its name, its value and its share.
 *
 * The order is the caller's. A pie sorted by size is a different chart from a pie
 * in the caller's order, and a component that re-ordered silently would make
 * "the third segment" mean two things in the picture and in the table.
 */
import { type CSSProperties, type ReactNode } from 'react';
import { ChartSurface, type ChartSurfaceProps } from '../ChartSurface/ChartSurface.js';
import { seriesColour } from '../../charts/channel.js';
import { useMarkNavigation } from '../../charts/useMarkNavigation.js';
import { wedges } from '../../charts/Radial.js';
import { cx } from '../../styles/cx.js';
import styles from './PieChart.module.scss';

export interface PieSlice {
  name: string;
  value: number;
}

export interface PieChartProps extends Omit<ChartSurfaceProps, 'children' | 'table'> {
  slices: readonly PieSlice[];
  /** The hole, as a proportion of the radius. Zero here; the donut sets it. */
  hole?: number;
  /** Drawn in the middle of a donut. Text, never an image. */
  centre?: ReactNode;
  format?: (value: number) => string;
  /** How a share reads. */
  formatShare?: (share: number) => string;
  table?: ChartSurfaceProps['table'];
}

export function PieChart({
  slices, hole = 0, centre, format = (value) => String(value),
  formatShare = (share) => `${Math.round(share * 100)}%`,
  table, className, height = 260, ...surface
}: PieChartProps): ReactNode {
  const marks = useMarkNavigation(slices.length);
  const total = slices.reduce((sum, one) => sum + Math.max(0, one.value), 0);

  return (
    <ChartSurface
      {...surface}
      height={height}
      /* A circle needs no axis gutters, and keeping the default ones would
         shrink it off-centre. */
      insets={{ top: 8, right: 8, bottom: 8, left: 8 }}
      table={table ?? pieTable(slices, format, formatShare, total)}
      empty={surface.empty ?? slices.length === 0}
      className={cx(styles['chart'], className)}
    >
      {(frame) => {
        const { inner } = frame;
        const radius = Math.min(inner.width, inner.height) / 2;
        const cx$ = inner.x + inner.width / 2;
        const cy = inner.y + inner.height / 2;
        const drawn = wedges(slices, { radius, hole });

        return (
          <g transform={`translate(${cx$},${cy})`} {...marks.containerProps}>
            {drawn.map((wedge) => (
              <g
                key={wedge.name}
                {...marks.markProps(wedge.index)}
                role="graphics-symbol"
                aria-label={`${wedge.name}, ${format(wedge.value)}, ${formatShare(wedge.share)} of ${format(total)}`}
                className={styles['wedge']}
                data-active={marks.active === wedge.index ? '' : undefined}
                style={{ '--series-colour': seriesColour(wedge.index) } as CSSProperties}
              >
                <path className={styles['fill']} d={wedge.path} />
                {/* The label is the second channel. It is drawn only where the
                    wedge is big enough to hold it — a label spilling out of a 2%
                    sliver is worse than no label, and the same words are on the
                    mark itself and in the table either way. */}
                {wedge.share >= 0.08 ? (
                  <text
                    className={styles['label']}
                    x={wedge.centroid[0]}
                    y={wedge.centroid[1]}
                    textAnchor="middle"
                    dominantBaseline="middle"
                  >
                    {formatShare(wedge.share)}
                  </text>
                ) : null}
              </g>
            ))}
            {centre ? (
              <foreignObject
                className={styles['centre']}
                x={-radius * hole}
                y={-radius * hole}
                width={radius * hole * 2}
                height={radius * hole * 2}
              >
                <div className={styles['centreInner']}>{centre}</div>
              </foreignObject>
            ) : null}
          </g>
        );
      }}
    </ChartSurface>
  );
}

/** The table, with the share and the total both written down — the two things a
 *  reader would otherwise have to work out from the picture. */
export function pieTable(
  slices: readonly PieSlice[],
  format: (value: number) => string,
  formatShare: (share: number) => string,
  total: number,
): ChartSurfaceProps['table'] {
  return {
    columns: ['Segment', 'Value', 'Share'],
    rows: [
      ...slices.map((slice) => [
        slice.name,
        format(slice.value),
        formatShare(total === 0 ? 0 : Math.max(0, slice.value) / total),
      ]),
      ['Total', format(total), formatShare(1)],
    ],
  };
}

'use client';

/* PieChart: parts of a whole as segments.
 *
 * "Each segment is labelled with its value; the total is stated." The second is
 * the one people leave out. A pie asserts that its segments are *the whole of
 * something*, and a reader cannot check that assertion, or notice that 4% is
 * missing, unless the total is written down. So the total is always in the
 * caption area and in the table.
 *
 * Areas are the marks here, so the second channel is the label rather than a
 * pattern; `charts/channel.ts` explains why a label suits an area. Each wedge
 * states its name, its value and its share.
 *
 * The order is the caller's. A pie sorted by size is a different chart from a pie
 * in the caller's order, and a component that re-ordered silently would make
 * "the third segment" mean two things in the picture and in the table.
 */
import { useRef, type CSSProperties, type ReactNode } from 'react';
import { ChartSurface, type ChartSurfaceProps } from '../ChartSurface/ChartSurface.js';
import { ChartLegend } from '../ChartLegend/ChartLegend.js';
import { ChartTooltip } from '../ChartTooltip/ChartTooltip.js';
import { seriesColour } from '../../charts/channel.js';
import { useMarkNavigation } from '../../charts/useMarkNavigation.js';
import { useMarkTooltip, type MarkTip } from '../../charts/useMarkTooltip.js';
import { wedges } from '../../charts/Radial.js';
import { cx } from '../../styles/cx.js';
import { useMarkArrival } from '../../charts/useMarkArrival.js';
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
  table, legend, className, height = 260, ...surface
}: PieChartProps): ReactNode {
  const marks = useMarkNavigation(slices.length);
  const arrival = useMarkArrival();
  const tip = useMarkTooltip(marks);
  const tips = useRef<MarkTip[]>([]);
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
      /* A wedge carries its share as a label and its name nowhere. On a pie the
         legend is the only place the slice is named, so it is here by default.
         A caller who has named the slices some other way passes
         `legend={null}`. */
      legend={legend === undefined && slices.length > 1
        ? <ChartLegend entries={slices.map((one, index) => ({ name: one.name, index }))} />
        : legend}
      tooltip={(frame) => {
        const at = tip.index === null ? undefined : tips.current[tip.index];
        return at ? (
          <ChartTooltip
            shown={tip.shown}
            x={at.x}
            y={at.y}
            bounds={{ width: frame.width, height: frame.height }}
            title={at.title}
            rows={at.rows}
          />
        ) : null;
      }}
      className={cx(styles['chart'], className)}
    >
      {(frame) => {
        const { inner } = frame;
        const radius = Math.min(inner.width, inner.height) / 2;
        const cx$ = inner.x + inner.width / 2;
        const cy = inner.y + inner.height / 2;
        const drawn = wedges(slices, { radius, hole });
        const built: MarkTip[] = [];
        tips.current = built;
        drawn.forEach((wedge) => {
          built[wedge.index] = {
            /* The centroid is relative to the circle's middle; the panel is
               placed in the plot the circle sits in. */
            x: cx$ + wedge.centroid[0],
            y: cy + wedge.centroid[1],
            title: wedge.name,
            rows: [
              { name: 'Value', value: format(wedge.value), index: wedge.index },
              { name: 'Share', value: formatShare(wedge.share) },
            ],
          };
        });

        return (
          <g transform={`translate(${cx$},${cy})`} {...tip.containerProps} ref={arrival as never}>
            {drawn.map((wedge) => (
              <g
                key={wedge.name}
                {...tip.markProps(wedge.index)}
                role="graphics-symbol"
                aria-label={`${wedge.name}, ${format(wedge.value)}, ${formatShare(wedge.share)} of ${format(total)}`}
                className={styles['wedge']}
                data-active={marks.active === wedge.index ? '' : undefined}
                /* A segment grows out of the centre, which is this group's own
                   origin: the parent translates to it. Crystal's `mark-in`, once. */
                data-mark-in=""
                style={{
                  '--series-colour': seriesColour(wedge.index),
                  transformBox: 'view-box',
                  transformOrigin: '0px 0px',
                } as CSSProperties}
              >
                <path className={styles['fill']} d={wedge.path} />
                {/* The label is the second channel. It is drawn only where the
                    wedge is big enough to hold it, so a 2% sliver gets no label
                    rather than one that spills out. The same words are on the
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

/** The table, with the share and the total both written down. A reader would
 *  otherwise have to work both out from the picture. */
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

'use client';

/* The grid, the axes and their ticks — shared by every chart drawn on two
 * perpendicular scales.
 *
 * Kept out of `ChartSurface` because the surface must not know what a scale is:
 * a pie, a treemap and a map all sit on the surface and none of them has an
 * axis. Kept out of the individual charts because a bar chart and a histogram
 * differ in what they *put in* the plot, not in how the plot is ruled, and two
 * copies of "how the plot is ruled" is two grids that drift.
 *
 * Everything here is decoration and says so: the grid, the ticks and the axis
 * rules are `aria-hidden`, because the numbers they stand for are in the table
 * the surface renders, stated rather than inferred from a pixel position. What
 * is left for a reader is the mark, which carries its own label.
 */
import type { ReactNode } from 'react';
import type { ChartFrame } from './types.js';
import styles from './Axes.module.scss';

/* How far a tick's label sits from the plot. Not tokens: they are a consequence
   of the caption type size, which is why they are here beside the text that uses
   them rather than in Crystal, and they move together or not at all. */
const VALUE_LABEL_GAP = 8;
const CATEGORY_LABEL_BASELINE = 18;

export interface AxisTick {
  /** Where it sits, in pixels within the plot. */
  offset: number;
  label: string;
}

export interface AxesProps {
  frame: ChartFrame;
  /** Ticks along the value axis, measured from the plot's top edge. */
  value?: readonly AxisTick[];
  /** Ticks along the category axis, measured from the plot's left edge. */
  category?: readonly AxisTick[];
  /** Draw the horizontal rules behind the marks. */
  grid?: boolean;
  /** Every nth category label, when they would otherwise collide. */
  categoryEvery?: number;
}

export function Axes({
  frame, value = [], category = [], grid = true, categoryEvery = 1,
}: AxesProps): ReactNode {
  const { inner } = frame;
  return (
    <g aria-hidden="true" className={styles['axes']}>
      {grid ? value.map((tick) => (
        <line
          key={`grid-${tick.offset}`}
          className={styles['grid']}
          x1={inner.x}
          x2={inner.x + inner.width}
          y1={inner.y + tick.offset}
          y2={inner.y + tick.offset}
        />
      )) : null}

      {/* The value axis has no rule of its own: the gridlines already say where
          the numbers are, and a second vertical line beside the first gridline
          is furniture. The category axis does, because it is the line the bars
          stand on and a bar with nothing under it floats. */}
      <line
        className={styles['axis']}
        x1={inner.x}
        x2={inner.x + inner.width}
        y1={inner.y + inner.height}
        y2={inner.y + inner.height}
      />

      {value.map((tick) => (
        <text
          key={`value-${tick.offset}`}
          className={styles['tick']}
          x={inner.x - VALUE_LABEL_GAP}
          y={inner.y + tick.offset}
          textAnchor="end"
          dominantBaseline="middle"
        >
          {tick.label}
        </text>
      ))}

      {category.map((tick, index) => (index % categoryEvery === 0 ? (
        <text
          key={`category-${tick.label}-${tick.offset}`}
          className={styles['tick']}
          x={inner.x + tick.offset}
          y={inner.y + inner.height + CATEGORY_LABEL_BASELINE}
          textAnchor="middle"
        >
          {tick.label}
        </text>
      ) : null))}
    </g>
  );
}

'use client';

/* DonutChart: a pie with a hole, often carrying a summary value.
 *
 * "Ring thickness is a declared proportion of the radius" and "the centre value
 * is text, not an image". These two decisions are what separate this component
 * from the pie.
 *
 * The thickness is Crystal's `--cr-chart-ring-thickness`, declared once and not
 * chosen per chart, so a donut is recognisably the same object at every size. A
 * donut whose ring thinned as it grew would be a different component at each
 * size.
 *
 * The centre is real text in the document, so it is selectable, translatable and
 * read out. It is not a `<text>` inside the picture or part of an image. It is
 * not the total by default either. The middle of a donut is the most valuable
 * space in the chart, and it should hold what the chart is for, which only the
 * caller knows.
 */
import { type ReactNode } from 'react';
import { PieChart, type PieChartProps } from '../PieChart/PieChart.js';
import { chartGeometry } from '../../theme/chartGeometry.js';

export interface DonutChartProps extends Omit<PieChartProps, 'hole'> {
  /** As a proportion of the radius. Crystal's declared thickness by default. */
  hole?: number;
}

export function DonutChart({
  hole = 1 - chartGeometry.ringThickness, ...props
}: DonutChartProps): ReactNode {
  return <PieChart {...props} hole={hole} />;
}

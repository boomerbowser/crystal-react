'use client';

/* DonutChart — a pie with a hole, often carrying a summary value.
 *
 * "Ring thickness is a declared proportion of the radius" and "the centre value
 * is text, not an image". Both are the whole difference between this and the
 * pie, and both are decisions rather than styling.
 *
 * The thickness is Crystal's `--cr-chart-ring-thickness`, declared rather than
 * chosen per chart, so a donut is recognisably the same object at every size. A
 * donut whose ring thins as it grows is two different components.
 *
 * The centre is text in the document — real, selectable, translatable, read out
 * — rather than a `<text>` inside the picture or, worse, part of an image. It is
 * also not the total by default: the middle of a donut is the most valuable space
 * in the chart, and what belongs there is what the chart is *for*, which only the
 * caller knows.
 */
import { type ReactNode } from 'react';
import { PieChart, type PieChartProps } from '../PieChart/PieChart.js';
import { chartGeometry } from '../../theme/chartTokens.js';

export interface DonutChartProps extends Omit<PieChartProps, 'hole'> {
  /** As a proportion of the radius. Crystal's declared thickness by default. */
  hole?: number;
}

export function DonutChart({
  hole = 1 - chartGeometry.ringThickness, ...props
}: DonutChartProps): ReactNode {
  return <PieChart {...props} hole={hole} />;
}

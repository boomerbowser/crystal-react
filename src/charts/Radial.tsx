'use client';

/* Wedges: what a pie, a donut and a gauge all draw.
 *
 * "Segments separated by a hairline in the surface colour." A hairline in the
 * *surface* colour rather than in ink is the detail that matters: it is a gap
 * showing the ground through, not a border round each wedge, so two adjacent
 * segments read as two pieces of one circle rather than as two objects. Under
 * forced colours there is no surface colour to show, so the separation becomes a
 * real stroke — that is the one place the two are not the same thing.
 */
import { arc as d3arc, pie as d3pie } from 'd3-shape';
import { chartGeometry } from '../theme/chartGeometry.js';

export interface Wedge {
  name: string;
  value: number;
  index: number;
  path: string;
  /** Where a label belongs, if it fits. */
  centroid: [number, number];
  /** How much of the circle this is, 0 to 1. */
  share: number;
}

export interface WedgeOptions {
  radius: number;
  /** As a proportion of the radius. Zero is a pie. */
  hole?: number;
  /** Where the first wedge starts, in radians from twelve o'clock. */
  from?: number;
  /** How far round, in radians. A full circle by default. */
  sweep?: number;
}

/**
 * Wedges for a set of values, in the order given.
 *
 * The order is the caller's and is never sorted here. A pie sorted by size is a
 * different chart from a pie in the caller's order — months are months — and a
 * component that silently re-ordered would make "the third segment" mean two
 * different things in the picture and in the table beside it.
 */
export function wedges(
  values: readonly { name: string; value: number }[],
  { radius, hole = 0, from = 0, sweep = Math.PI * 2 }: WedgeOptions,
): Wedge[] {
  const total = values.reduce((sum, one) => sum + Math.max(0, one.value), 0);
  const layout = d3pie<{ name: string; value: number }>()
    .sort(null)
    .value((one) => Math.max(0, one.value))
    .startAngle(from)
    .endAngle(from + sweep);
  const inner = radius * hole;
  /* The gap is an angle, not a length, so it is the same width at every radius —
     which is what makes it read as a gap in one surface rather than as a wedge
     that tapers. */
  const generator = d3arc<{ startAngle: number; endAngle: number }>()
    .innerRadius(inner)
    .outerRadius(radius)
    .padAngle(chartGeometry.hairline * 2 / radius);
  return layout(values as { name: string; value: number }[]).map((slice, index) => ({
    name: values[index]!.name,
    value: values[index]!.value,
    index,
    path: generator(slice) ?? '',
    centroid: generator.centroid(slice) as [number, number],
    share: total === 0 ? 0 : Math.max(0, values[index]!.value) / total,
  }));
}

/** One arc, for a gauge or a ring: a track, or a value along it. */
export function arcPath(
  radius: number, thickness: number, from: number, to: number,
): string {
  const generator = d3arc<null>()
    .innerRadius(radius - thickness)
    .outerRadius(radius)
    .startAngle(from)
    .endAngle(to);
  return generator(null) ?? '';
}

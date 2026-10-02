/* The second channel.
 *
 * "Series are distinguishable without colour alone" is a clause the catalogue
 * puts on the line chart and means everywhere. Colour is the first channel and
 * it is not enough on its own: six hues sixty degrees apart do not survive
 * dichromatic vision, they do not survive a monochrome print, and under forced
 * colours the operating system may replace all six with one.
 *
 * Which second channel depends on what the mark is, and the answer is not the
 * same for a line as for a wedge:
 *
 * - Marks with an outline (lines, radar polygons, spark lines) carry a
 *   dash pattern. It is legible at one pixel and it survives every one of the
 *   three failures above.
 * - Marks with a point (scatter, line vertices) carry a shape.
 * - Marks that are areas (bars, wedges, cells, stages, rectangles) carry a
 *   label, not a hatch. Hatching an area at the sizes charts use is noise, and
 *   the catalogue already asks for the label in its own words on every one of
 *   them ("each segment is labelled with its value", "every stage states its
 *   absolute and relative value", "intensity is paired with a value"). The
 *   catalogue's wording for each mark is the specification for the label.
 *
 * Six of each, because the scale is six. A seventh series repeats the first
 * colour, which is exactly when the second channel stops being a courtesy.
 */
import { CHART_SERIES_COUNT } from '../theme/chartGeometry.js';

export { CHART_SERIES_COUNT };

/** The custom property carrying series `index`'s colour. Wraps at six. */
export function seriesColour(index: number): string {
  return `var(--cr-chart-series-${(index % CHART_SERIES_COUNT) + 1})`;
}

/* Dash patterns in multiples of the stroke, so they stay in proportion when the
   stroke scale changes. The first is solid: one series should not look like a
   series of something. */
const DASHES = ['', '7 4', '2 3', '11 4 2 4', '1 3', '9 3 1 3'];

/** `stroke-dasharray` for series `index`, or undefined for the solid first. */
export function seriesDash(index: number): string | undefined {
  return DASHES[index % DASHES.length] || undefined;
}

export type ChartMarker = 'circle' | 'square' | 'triangle' | 'diamond' | 'cross' | 'wedge';

const MARKERS: readonly ChartMarker[] = ['circle', 'square', 'triangle', 'diamond', 'cross', 'wedge'];

/** The point shape for series `index`. */
export function seriesMarker(index: number): ChartMarker {
  return MARKERS[index % MARKERS.length] as ChartMarker;
}

/**
 * The path of a marker, centred on the origin, `size` across.
 *
 * A path rather than a `<circle>` or a `<rect>` so that every marker is one
 * element with one set of attributes: a chart drawing six shapes through one
 * code path cannot get the fifth one wrong.
 */
export function markerPath(marker: ChartMarker, size: number): string {
  const r = size / 2;
  switch (marker) {
    case 'square':
      return `M${-r},${-r}H${r}V${r}H${-r}Z`;
    case 'triangle':
      return `M0,${-r}L${r},${r * 0.8}H${-r}Z`;
    case 'diamond':
      return `M0,${-r}L${r},0L0,${r}L${-r},0Z`;
    case 'cross': {
      const a = r * 0.38;
      return `M${-a},${-r}H${a}V${-a}H${r}V${a}H${a}V${r}H${-a}V${a}H${-r}V${-a}H${-a}Z`;
    }
    case 'wedge':
      return `M0,${r}L${r},${-r}H${-r}Z`;
    case 'circle':
    default:
      /* Two arcs rather than a <circle>, for the reason above. */
      return `M${-r},0a${r},${r} 0 1,0 ${r * 2},0a${r},${r} 0 1,0 ${-r * 2},0Z`;
  }
}

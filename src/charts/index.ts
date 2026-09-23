/* The chart kit: the shapes, the scales, the second channel and the two hooks
 * every chart in slice K shares. Exported because a product drawing a chart
 * Crystal has no recipe for should be able to draw it on the same frame, with
 * the same series colours, rather than starting a second system beside this one.
 */
export type { ChartSeries, ChartTableData, ChartFrame, ChartInsets } from './types.js';
export {
  CHART_SERIES_COUNT, seriesColour, seriesDash, seriesMarker, markerPath,
  type ChartMarker,
} from './channel.js';
export { Axes, type AxesProps, type AxisTick } from './Axes.js';
export { useChartFrame } from './useChartFrame.js';
/* `MarkProps` is deliberately not re-exported: `Highlight` already publishes a
   `MarkProps` for the `<mark>` element, and two things called that in one
   package is a name nobody can use. It reaches a caller through
   `MarkNavigation` instead, which is where it is wanted. */
export { useMarkNavigation, type MarkNavigation } from './useMarkNavigation.js';
export { useMarkTooltip, type MarkTooltip, type MarkTip } from './useMarkTooltip.js';
/* `drawnSeries` and `seriesLegend` are the public half of `ChartSeries.hidden`:
   without them a product can hide a series but cannot build the legend that
   turns it back on, and the prop would have no driver outside this package. */
export { drawnSeries, seriesLegend, type DrawnSeries } from './series.js';
export { extent, valueDomain, stackedDomain } from './scales.js';
export { MARK_TARGET } from './target.js';

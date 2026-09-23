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
export { useMarkNavigation, type MarkNavigation } from './useMarkNavigation.js';
export { extent, valueDomain, stackedDomain } from './scales.js';
export { MARK_TARGET } from './target.js';

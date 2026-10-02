/* The shapes every chart in this library speaks.
 *
 * One vocabulary rather than one per chart, because the surface underneath them
 * has to build a table from whatever it is given, and a surface that understood
 * twenty-four data shapes would understand none of them well.
 */

/** A named run of values, one per category. `null` is a gap, not a zero. */
export interface ChartSeries {
  name: string;
  values: readonly (number | null)[];
  /**
   * Not drawn. The series stays in the array. A chart's colours and dashes are
   * its position in this list, so a caller who hides a series by filtering it
   * out of the array repaints every series after it. The picture's meaning
   * does not change, but its appearance does, and the legend the reader is
   * matching against is now wrong. Hiding is a view state, so it is said here
   * rather than by removal.
   */
  hidden?: boolean;
}

/** The text equivalent a chart owes. */
export interface ChartTableData {
  columns: readonly string[];
  rows: readonly (readonly (string | number | null)[])[];
  /** What the table is of, when the chart's own name is not enough. */
  caption?: string;
}

/** The drawn box, in CSS pixels, and the plot area inside its gutters. */
export interface ChartFrame {
  width: number;
  height: number;
  inner: { x: number; y: number; width: number; height: number };
  /** False until the surface has measured itself. Nothing is wrong when it is
   *  false; the frame is the declared fallback and the drawing is valid. */
  measured: boolean;
}

export interface ChartInsets {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

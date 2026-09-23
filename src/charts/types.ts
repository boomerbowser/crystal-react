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

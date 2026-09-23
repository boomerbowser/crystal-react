/* Crystal 2.1.0's chart vocabulary, carried here until 2.1.0 is published.
 *
 * This is the R-19 situation again, and it is here for the same reason: the
 * specification describes something no consumer can obtain yet. Crystal 2.1.0
 * publishes a series scale — six categorical colours per palette per mode, every
 * one measured against both grounds of its mode — plus the stroke, point and
 * hairline scales its catalogue has named since 2.0 without ever shipping. This
 * library installs 2.0.0 from npm, which publishes none of it, so a chart styled
 * with `var(--cr-chart-series-1)` would paint nothing at all: a custom property
 * that resolves to nothing throws no error and logs no warning, which is the
 * failure `published-properties.test.tsx` exists to catch.
 *
 * What is duplicated here is deliberately the *output* and not the derivation.
 * Crystal computes these from each palette's seed hue in `build-tokens.cjs` and
 * asserts four things about the result across all twelve palette-and-mode
 * combinations; re-implementing that arithmetic here would be a second
 * implementation of a formula, which CONTRACT §1 forbids for the reason it
 * always gives — two of them diverge. A table of the values it produced cannot
 * diverge silently: it can only be stale, and `chartTokens.test.ts` says so the
 * moment the installed core starts publishing them itself.
 *
 * It removes itself. `chartTokens()` yields nothing for a property the installed
 * resolver already publishes, so the day the dependency moves to `^2.1.0` this
 * whole file becomes inert and R-20 deletes it. Nothing has to remember.
 */

interface ChartPalette {
  series: readonly string[];
  axis: string;
  grid: string;
}

/* Copied from `@crystal-ui/core@2.1.0`'s `core/tokens/crystal.json`,
   `palettes.<id>.modes.<mode>.chartSeries1..6`, `.chartAxis` and `.chartGrid`. */
const SCALES: Record<string, ChartPalette> = {
  'prism-light': {
    series: ['#9D45B2', '#C43444', '#956800', '#298800', '#008287', '#286CD8'],
    axis: '#624a9f',
    grid: 'rgba(23, 17, 48, 0.12)',
  },
  'prism-dark': {
    series: ['#D57BEA', '#FF7077', '#D59800', '#60BE48', '#00BBC2', '#6CA4FF'],
    axis: '#bfa3f8',
    grid: 'rgba(247, 243, 254, 0.16)',
  },
  'fuchsia-light': {
    series: ['#C33353', '#9B6400', '#4B8300', '#008380', '#0071D0', '#9549BB'],
    axis: '#813e7a',
    grid: 'rgba(33, 13, 37, 0.12)',
  },
  'fuchsia-dark': {
    series: ['#FF6D85', '#DE9200', '#76BB32', '#00BCB9', '#5AA8FF', '#CB7EF4'],
    axis: '#e295cd',
    grid: 'rgba(251, 241, 249, 0.16)',
  },
  'cobalt-light': {
    series: ['#7C54CD', '#BC3577', '#AD5700', '#707900', '#00856E', '#007BAC'],
    axis: '#44579c',
    grid: 'rgba(13, 21, 48, 0.12)',
  },
  'cobalt-dark': {
    series: ['#AD8DFF', '#F86DAA', '#F78000', '#A3AF00', '#00C09F', '#00B2F6'],
    axis: '#9cb2f4',
    grid: 'rgba(242, 245, 254, 0.16)',
  },
  'ion-light': {
    series: ['#0075C4', '#8F4CC0', '#C2335D', '#9F6200', '#588000', '#00837C'],
    axis: '#34667c',
    grid: 'rgba(8, 26, 37, 0.12)',
  },
  'ion-dark': {
    series: ['#4AAAFF', '#C481FA', '#FE6C8F', '#E48E00', '#83B81E', '#00BDB3'],
    axis: '#8ac4cf',
    grid: 'rgba(240, 247, 249, 0.16)',
  },
  'amethyst-light': {
    series: ['#AD3D9A', '#C43B15', '#867000', '#00884D', '#007F95', '#5761D8'],
    axis: '#69478f',
    grid: 'rgba(25, 16, 43, 0.12)',
  },
  'amethyst-dark': {
    series: ['#E773D0', '#FF7452', '#C2A200', '#00C471', '#00B8D6', '#8B9BFF'],
    axis: '#c6a0e5',
    grid: 'rgba(248, 243, 252, 0.16)',
  },
  'harbor-light': {
    series: ['#7955CF', '#BB367A', '#AE5600', '#727800', '#00856C', '#007BAA'],
    axis: '#787a84',
    grid: 'rgba(48, 50, 58, 0.12)',
  },
  'harbor-dark': {
    series: ['#AA8EFF', '#F76EAD', '#F87E08', '#A5AE00', '#00C09D', '#00B2F3'],
    axis: '#73757f',
    grid: 'rgba(228, 229, 240, 0.16)',
  },
};

/* `component.chart` and `component.progress` in the same release. Geometry, not
   colour, so it is the same table for every palette. */
const GEOMETRY: Record<string, string> = {
  '--cr-chart-stroke': '2px',
  '--cr-chart-hairline': '1px',
  '--cr-chart-point-min': '6px',
  '--cr-chart-point-max': '18px',
  '--cr-chart-bar-radius': '4px',
  '--cr-chart-cell-gap': '2px',
  '--cr-chart-ring-thickness': '0.32',
  '--cr-progress-ring-stroke': '8px',
};

/**
 * The same geometry as numbers, for the places a custom property cannot reach.
 *
 * A bar's corner radius is part of its path, a marker's size decides the
 * coordinates of its points, and an arc's thickness is an argument to the arc
 * generator — none of those is a CSS property that could read
 * `var(--cr-chart-bar-radius)`. So the values are here as well as there, from the
 * same release and in the same file, rather than as literals scattered through
 * twenty-four components.
 *
 * After the bump these become `crystalTokens['chart.barRadius']` and the rest,
 * from `tokens.generated.ts`, which is why they are named the same.
 */
export const chartGeometry = {
  stroke: 2,
  hairline: 1,
  pointMin: 6,
  pointMax: 18,
  barRadius: 4,
  cellGap: 2,
  ringThickness: 0.32,
  ringStroke: 8,
} as const;

/** How many series the scale tells apart by colour. A seventh repeats the first
 *  and must differ by another channel — Crystal's `component.chart.seriesCount`,
 *  and the reason `seriesChannel` exists. */
export const CHART_SERIES_COUNT = 6;

/**
 * The chart properties Crystal 2.1.0 publishes, for a palette and mode, minus
 * whatever the installed core already publishes itself.
 *
 * @param resolved what `resolver.resolve()` returned for this scope. A property
 *   present there is Crystal's, and this returns nothing for it.
 */
export function chartTokens(
  palette: string,
  mode: string,
  resolved: Record<string, unknown>,
): Record<string, string> {
  const scale = SCALES[`${palette}-${mode}`];
  const out: Record<string, string> = {};
  if (scale) {
    scale.series.forEach((hex, i) => { out[`--cr-chart-series-${i + 1}`] = hex; });
    out['--cr-chart-axis'] = scale.axis;
    out['--cr-chart-grid'] = scale.grid;
  }
  Object.assign(out, GEOMETRY);
  for (const name of Object.keys(out)) {
    if (name in resolved) delete out[name];
  }
  return out;
}

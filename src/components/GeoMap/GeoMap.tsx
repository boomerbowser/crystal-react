'use client';

/* GeoMap — values by region on a projected map.
 *
 * "Regions are reachable by keyboard and state their name and value; a table
 * equivalent is required." A map is the chart where the picture carries the
 * *identity* of each mark as well as its value — a reader who cannot see it has
 * no idea which shape is which — so every region is a mark that names itself,
 * and the table lists every region whether or not the join found a value for it.
 *
 * The topology and the join are the caller's, which is what the catalogue says
 * and is also the only workable boundary: a component that shipped a world
 * outline would ship one political opinion about borders and names, permanently,
 * to every product that used it. So `features` is GeoJSON the product chose, and
 * `values` is keyed by whatever property of it the product joins on.
 *
 * The intensity is Crystal's ramp, the same five steps the heatmap uses, with the
 * ink measured for each — a choropleth is a heatmap with an irregular grid.
 */
import { useMemo, type CSSProperties, type ReactNode } from 'react';
import { geoMercator, geoNaturalEarth1, geoPath, type GeoProjection } from 'd3-geo';
import { ChartSurface, type ChartSurfaceProps } from '../ChartSurface/ChartSurface.js';
import { useMarkNavigation } from '../../charts/useMarkNavigation.js';
import { intensityFill, intensityStep, INTENSITY_STEPS } from '../../charts/intensity.js';
import { cx } from '../../styles/cx.js';
import styles from './GeoMap.module.scss';

/* Structural only: the component reads an id and a name from each feature and
   hands the rest to `d3-geo`, so a caller's own GeoJSON types pass through. */
export interface GeoFeature {
  type: string;
  id?: string | number;
  properties?: Record<string, unknown> | null;
  geometry: unknown;
}

export type GeoProjectionName = 'mercator' | 'naturalEarth';

export interface GeoMapProps extends Omit<ChartSurfaceProps, 'children' | 'table'> {
  features: readonly GeoFeature[];
  /** Value per region, keyed the way `keyOf` reads a feature. */
  values: Readonly<Record<string, number>>;
  /** How a feature is identified. Its `id` by default. */
  keyOf?: (feature: GeoFeature) => string;
  /** How a region reads. Its key by default. */
  nameOf?: (feature: GeoFeature) => string;
  projection?: GeoProjectionName;
  domain?: [number, number];
  format?: (value: number) => string;
  table?: ChartSurfaceProps['table'];
}

const PROJECTIONS: Record<GeoProjectionName, () => GeoProjection> = {
  mercator: geoMercator,
  naturalEarth: geoNaturalEarth1,
};

export function GeoMap({
  features, values,
  keyOf = (feature) => String(feature.id ?? ''),
  nameOf = (feature) => String(feature.properties?.['name'] ?? feature.id ?? ''),
  projection = 'naturalEarth', domain, format = (value) => String(value),
  table, className, height = 320, ...surface
}: GeoMapProps): ReactNode {
  const marks = useMarkNavigation(features.length);
  const numbers = Object.values(values);
  const [low, high] = domain ?? [Math.min(0, ...numbers), Math.max(1, ...numbers)];

  /* Regions in a stable order, so the arrow keys walk the map the same way
     twice and the table reads in the same order as the keyboard. */
  const ordered = useMemo(
    () => [...features].sort((a, b) => nameOf(a).localeCompare(nameOf(b))),
    [features, nameOf],
  );

  return (
    <ChartSurface
      {...surface}
      height={height}
      insets={{ top: 8, right: 8, bottom: 8, left: 8 }}
      table={table ?? {
        columns: ['Region', 'Value'],
        rows: ordered.map((feature) => {
          const value = values[keyOf(feature)];
          return [nameOf(feature), value === undefined ? null : format(value)];
        }),
      }}
      empty={surface.empty ?? features.length === 0}
      className={cx(styles['chart'], className)}
    >
      {(frame) => {
        const { inner } = frame;
        const project = PROJECTIONS[projection]().fitSize(
          [Math.max(1, inner.width), Math.max(1, inner.height)],
          { type: 'FeatureCollection', features: features as never[] } as never,
        );
        const path = geoPath(project);

        return (
          <g transform={`translate(${inner.x},${inner.y})`} {...marks.containerProps}>
            {ordered.map((feature, index) => {
              const value = values[keyOf(feature)];
              const step = value === undefined ? 0 : intensityStep(value, low, high);
              return (
                <g
                  key={keyOf(feature) || nameOf(feature)}
                  {...marks.markProps(index)}
                  role="graphics-symbol"
                  aria-label={`${nameOf(feature)}, ${value === undefined ? 'no value' : format(value)}`}
                  className={styles['region']}
                  data-active={marks.active === index ? '' : undefined}
                  data-empty={step === 0 ? '' : undefined}
                  style={{
                    '--cell-fill': intensityFill(step),
                    '--cell-strength': String(step / INTENSITY_STEPS),
                  } as CSSProperties}
                >
                  <path className={styles['shape']} d={path(feature as never) ?? ''} />
                </g>
              );
            })}
          </g>
        );
      }}
    </ChartSurface>
  );
}

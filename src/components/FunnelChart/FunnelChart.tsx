'use client';

/* FunnelChart shows sequential stages narrowing toward an outcome.
 *
 * "Each stage states its absolute and relative value." A stage can be relative
 * to the first stage or to the one before. They are different numbers and
 * people mean different things by "conversion", so both are stated: "412, 34%
 * of the first stage, 68% of the one before".
 *
 * "Stages meet without gaps; labels sit outside when they do not fit." A funnel
 * is a single shape narrowing through its stages, so the stages share edges. A
 * gap between two would suggest something left the funnel other than by not
 * converting.
 *
 * Drawn as horizontal bands and not as a tapering trapezoid. A trapezoid
 * encodes each stage's value in an area, which people read least accurately. A
 * band encodes it in a width, which is a length, and people read lengths most
 * accurately. The outline still narrows, so it still looks like a funnel.
 */
import { type CSSProperties, type ReactNode } from 'react';
import { ChartSurface, type ChartSurfaceProps } from '../ChartSurface/ChartSurface.js';
import { seriesColour } from '../../charts/channel.js';
import { useMarkNavigation } from '../../charts/useMarkNavigation.js';
import { cx } from '../../styles/cx.js';
import styles from './FunnelChart.module.scss';

export interface FunnelStage {
  name: string;
  value: number;
}

export interface FunnelChartProps extends Omit<ChartSurfaceProps, 'children' | 'table'> {
  stages: readonly FunnelStage[];
  format?: (value: number) => string;
  formatShare?: (share: number) => string;
  table?: ChartSurfaceProps['table'];
}

export function FunnelChart({
  stages, format = (value) => String(value),
  formatShare = (share) => `${Math.round(share * 100)}%`,
  table, className, height = 280, ...surface
}: FunnelChartProps): ReactNode {
  const marks = useMarkNavigation(stages.length);
  const first = stages[0]?.value ?? 0;

  return (
    <ChartSurface
      {...surface}
      height={height}
      insets={{ top: 8, right: 8, bottom: 8, left: 8 }}
      table={table ?? {
        columns: ['Stage', 'Value', 'Of the first', 'Of the previous'],
        rows: stages.map((stage, index) => [
          stage.name,
          format(stage.value),
          formatShare(first === 0 ? 0 : stage.value / first),
          index === 0 ? '—' : formatShare(
            (stages[index - 1]?.value ?? 0) === 0 ? 0 : stage.value / stages[index - 1]!.value,
          ),
        ]),
      }}
      empty={surface.empty ?? stages.length === 0}
      className={cx(styles['chart'], className)}
    >
      {(frame) => {
        const { inner } = frame;
        const rows = Math.max(1, stages.length);
        const band = inner.height / rows;
        const widest = Math.max(1, ...stages.map((stage) => stage.value));

        return (
          <g {...marks.containerProps}>
            {stages.map((stage, index) => {
              const width = (stage.value / widest) * inner.width;
              const x = inner.x + (inner.width - width) / 2;
              const y = inner.y + index * band;
              const share = first === 0 ? 0 : stage.value / first;
              const previous = index === 0 ? null
                : (stages[index - 1]?.value ?? 0) === 0 ? 0 : stage.value / stages[index - 1]!.value;
              return (
                <g
                  key={stage.name}
                  {...marks.markProps(index)}
                  role="graphics-symbol"
                  aria-label={`${stage.name}, ${format(stage.value)}, ${formatShare(share)} of the `
                    + `first stage${previous === null ? '' : `, ${formatShare(previous)} of the one before`}`}
                  className={styles['stage']}
                  data-active={marks.active === index ? '' : undefined}
                  style={{ '--series-colour': seriesColour(index) } as CSSProperties}
                >
                  {/* Stages meet: each band is the full height of its row, so
                      there is no gap between one stage and the next. */}
                  <rect className={styles['fill']} x={x} y={y} width={width} height={band} />
                  {/* Inside when it fits and outside when it does not, as the
                      catalogue requires. The label is positioned from the
                      band's width, without measuring the text. */}
                  <text
                    className={styles['label']}
                    data-outside={width < inner.width * 0.34 ? '' : undefined}
                    x={width < inner.width * 0.34 ? x + width + 8 : inner.x + inner.width / 2}
                    y={y + band / 2}
                    textAnchor={width < inner.width * 0.34 ? 'start' : 'middle'}
                    dominantBaseline="middle"
                  >
                    {`${stage.name} · ${format(stage.value)} · ${formatShare(share)}`}
                  </text>
                </g>
              );
            })}
          </g>
        );
      }}
    </ChartSurface>
  );
}

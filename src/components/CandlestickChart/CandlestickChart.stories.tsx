import type { Meta, StoryObj } from '@storybook/react-vite';
import { CandlestickChart } from './CandlestickChart.js';

const series = (() => {
  const out = [];
  let price = 100;
  for (let i = 0; i < 20; i += 1) {
    const open = price;
    const drift = Math.sin(i / 2.2) * 4 + (i % 3 === 0 ? -2.5 : 1.5);
    const close = Math.round((open + drift) * 10) / 10;
    const high = Math.round((Math.max(open, close) + 1.8) * 10) / 10;
    const low = Math.round((Math.min(open, close) - 1.6) * 10) / 10;
    out.push({ period: `D${i + 1}`, open, high, low, close });
    price = close;
  }
  return out;
})();

const meta = {
  title: 'Charts/Candlestick chart',
  component: CandlestickChart,
  parameters: {
    docs: {
      description: {
        component:
          '"Rise and fall colour from the status tokens, never red and green alone." The second '
          + 'clause is the design: a candle that rose is drawn **hollow**, one that fell is '
          + 'drawn **filled**, and the colour sits on top of that. It is the convention the '
          + 'instrument has had since long before screens had colour, which is why this chart '
          + 'needs no dash or hatch invented for it — the second channel is already part of how '
          + 'a candle is drawn.\n\n'
          + '"Wick and body share one x centre; body has no radius." A candle is four numbers at '
          + 'one instant, and a rounded body would make the open and close read as approximate.',
      },
    },
  },
  args: {
    label: 'Price by day',
    candles: series,
    format: (value: number) => value.toFixed(1),
  },
} satisfies Meta<typeof CandlestickChart>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** A short series, where each candle is wide enough to read on its own. */
export const AFewPeriods: Story = { args: { candles: series.slice(0, 6) } };

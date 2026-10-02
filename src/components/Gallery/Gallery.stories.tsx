import type { Meta, StoryObj } from '@storybook/react-vite';
import { Gallery } from './Gallery.js';

/* Drawn and not fetched, because the gates run with no network. */
const plate = (hue: number, mark: string): string => `data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 120">`
  + `<rect width="160" height="120" fill="hsl(${hue} 45% 62%)"/>` /* crystal-allow-literal: sample photography, not a design value. The plates stand in for pictures a product would supply. */
  + `<text x="80" y="68" font-family="system-ui" font-size="32" fill="white" `
  + `text-anchor="middle">${mark}</text></svg>`,
)}`;

const items = [
  { id: 'a', label: 'Harbour at dusk', thumbnail: <img alt="" src={plate(268, '1')} width={160} />, caption: 'The east quay, October.' },
  { id: 'b', label: 'The long bridge', thumbnail: <img alt="" src={plate(196, '2')} width={160} />, caption: 'Low tide.' },
  { id: 'c', label: 'Rain on the quay', thumbnail: <img alt="" src={plate(24, '3')} width={160} />, caption: 'Ten minutes later.' },
  { id: 'd', label: 'Morning boats', thumbnail: <img alt="" src={plate(140, '4')} width={160} />, caption: 'Before six.' },
];

const meta = {
  title: 'Media/Gallery',
  component: Gallery,
  parameters: {
    docs: {
      description: {
        component:
          '**The thumbnails are one tab stop, not one per item.** Otherwise twelve photographs '
          + 'would be twelve stops between the control before the gallery and the control after '
          + 'it, which is the argument the charts make about marks. The strip is a listbox with a '
          + 'roving `tabindex`, and Enter opens what is focused.\n\n'
          + 'The viewer is `Lightbox`, so focus containment, Escape and focus restoration are '
          + 'React Aria\'s and are not rebuilt here. **Arrows in the viewer move between items; '
          + 'arrows inside a zoomed item pan it.** These are two different focus positions, '
          + 'because `Lightbox` puts the pan on a scroll container, so one key never has two '
          + 'meanings.\n\n'
          + 'The position is part of the viewer\'s accessible name, because a reader who cannot '
          + 'see the strip has no other way to know where in the set they are.',
      },
    },
  },
  args: { items, label: 'Photographs' },
} satisfies Meta<typeof Gallery>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ASet: Story = {};

export const ASetOfOne: Story = { args: { items: [items[0]!] } };

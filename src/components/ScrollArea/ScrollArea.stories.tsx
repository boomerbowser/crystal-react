import type { Meta, StoryObj } from '@storybook/react-vite';
import { ScrollArea } from './ScrollArea.js';
import { Card } from '../Card/Card.js';

const meta = {
  title: 'Layout/Scroll area',
  component: ScrollArea,
  parameters: {
    docs: {
      description: {
        component:
          'A bounded scrolling region carrying one of Crystal\'s two scrollbars. Frost is for '
          + 'panels and reading surfaces, because Frost is the intermediate surface and its '
          + 'scrollbar belongs to the panel the way the panel\'s own text does. Resin is for menus, '
          + 'popovers and compact scrollers, because Resin is the floating control plane and a '
          + 'scrollbar there is a control. The scroll contract comes with it: a swipe that '
          + 'reaches the end does not carry on into the page underneath, a gutter is reserved so '
          + 'content does not jump when the scrollbar appears, and the browser keeps its own '
          + 'gesture handling.\n\n'
          + 'The edge fade shows there is more beyond the edge. This matters most where the '
          + 'scrollbar is an overlay that does not appear until you are already scrolling. The '
          + 'fade is a mask, not a painted overlay, so the real material shows through it. The '
          + 'container\'s scroll padding matches its depth, so a focus ring never comes to rest '
          + 'underneath it.\n\n'
          + 'A scroll area becomes a tab stop only when it scrolls and holds nothing focusable. '
          + 'A scrollable region unreachable by keyboard fails WCAG, and a tab stop that is not '
          + 'needed only gets in the way.',
      },
    },
  },
} satisfies Meta<typeof ScrollArea>;

export default meta;
type Story = StoryObj<typeof meta>;

const paragraphs = [
  'Plastic is the foundation: opaque, and the only material that emits rather than refracts.',
  'Frost is the intermediate surface. Panels, sheets and long reading surfaces are Frost.',
  'Resin is the floating control plane, fixed at a 20% fill, and it never contains Resin.',
  'Haze is the readable content fill: 80% opaque, with a feathered perimeter on an isolated paint layer.',
  'Stone backs a label where it would otherwise sit on a busy surface.',
  'Mirage is the modal scrim, and a dialog is Haze over Mirage rather than Resin.',
  'Feathering applies to paint only. Text, icons, hit areas and focus rings stay crisp.',
  'Selection is carried by label weight. A check mark means validated or informational.',
];

/** A Frost scroll area: the default, and what a panel or a reading surface takes. */
export const Frost: Story = {
  args: { 'aria-label': 'Material notes' },
  render: (args) => (
    <Card aria-label="Materials">
      <ScrollArea {...args} style={{ maxHeight: '220px' }} /* crystal-allow-literal: story bound, so the area actually scrolls */>
        {paragraphs.map((text) => (
          <p key={text} style={{ marginBlock: '0 var(--cr-space)' }}>{text}</p>
        ))}
      </ScrollArea>
    </Card>
  ),
};

/** A Resin scroll area: a compact control plane, where the scrollbar is a control. */
export const Resin: Story = {
  args: { variant: 'resin', 'aria-label': 'Sections' },
  render: (args) => (
    <div
      className="cr-resin"
      style={{ borderRadius: 'var(--cr-radius)', padding: 'var(--cr-space)', maxWidth: '260px' }} /* crystal-allow-literal: story bound, a menu-width control plane */
    >
      <ScrollArea {...args} style={{ maxHeight: '180px' }} /* crystal-allow-literal: story bound, so the area actually scrolls */>
        {paragraphs.map((text) => (
          <p key={text} style={{ marginBlock: '0 var(--cr-space)' }}>{text.split('.')[0]}</p>
        ))}
      </ScrollArea>
    </div>
  ),
};

/** Horizontal, where the fade does most of its work: a row that continues past
 *  the edge looks finished without one. */
export const Horizontal: Story = {
  args: { axis: 'x', variant: 'resin', 'aria-label': 'Palettes' },
  render: (args) => (
    <ScrollArea {...args}>
      <div style={{ display: 'flex', gap: 'var(--cr-space)', width: 'max-content' }}>
        {['Prism', 'Bloom', 'Harbor', 'Ion', 'Ember', 'Moss'].map((name) => (
          <Card key={name} aria-label={name} style={{ minWidth: '160px' }} /* crystal-allow-literal: story bound, so the row overflows */>{name}</Card>
        ))}
      </div>
    </ScrollArea>
  ),
};

/** Content that is already reachable by keyboard gets no extra tab stop: the
 *  buttons are the way in, and a stop before them is one more press for nothing. */
export const AlreadyReachable: Story = {
  args: { 'aria-label': 'Actions' },
  render: (args) => (
    <ScrollArea {...args} style={{ maxHeight: '160px' }} /* crystal-allow-literal: story bound, so the area actually scrolls */>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--cr-space)' }}>
        {paragraphs.map((text) => (
          <button key={text} type="button" className="cr-control">{text.split(' ')[0]}</button>
        ))}
      </div>
    </ScrollArea>
  ),
};

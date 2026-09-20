import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { act } from 'react';
import { renderWithCrystal, screen } from '../../test/render.js';
import { Affix } from './Affix.js';

/* jsdom has no layout, so every rect is zero and the component would read
   "already past the threshold" for free. Driving the rect explicitly is what
   makes these tests about the component's decision rather than about jsdom. */
let top = 0;
const original = Element.prototype.getBoundingClientRect;

beforeEach(() => {
  top = 200;
  Element.prototype.getBoundingClientRect = function rect(this: Element): DOMRect {
    /* The content measures a height; the holder reports the scroll position. */
    const height = (this as HTMLElement).dataset['pinned'] !== undefined
      || this.className.includes('content') ? 48 : 48;
    return { top, bottom: top + height, height, width: 300, left: 0, right: 300, x: 0, y: top, toJSON: () => ({}) } as DOMRect;
  };
});

afterEach(() => { Element.prototype.getBoundingClientRect = original; });

const scroll = (to: number): void => {
  top = to;
  act(() => { window.dispatchEvent(new Event('scroll')); });
};

describe('Affix', () => {
  it('renders its content inline before the threshold', () => {
    renderWithCrystal(<Affix offset={0}><p>Filters</p></Affix>);
    expect(screen.getByText('Filters')).toBeTruthy();
    expect(screen.getByText('Filters').closest('[data-pinned]')).toBeNull();
  });

  it('pins once its natural position reaches the offset', async () => {
    renderWithCrystal(<Affix offset={16}><p>Filters</p></Affix>);
    scroll(8);
    await vi.waitFor(() => {
      expect(screen.getByText('Filters').closest('[data-pinned]')).not.toBeNull();
    });
  });

  it('tells its caller when it pins and when it releases', async () => {
    const onChange = vi.fn();
    renderWithCrystal(<Affix offset={16} onChange={onChange}><p>Filters</p></Affix>);
    scroll(8);
    await vi.waitFor(() => expect(onChange).toHaveBeenCalledWith(true));
    scroll(400);
    await vi.waitFor(() => expect(onChange).toHaveBeenCalledWith(false));
  });

  it('reports a change only when the state actually changes', async () => {
    const onChange = vi.fn();
    renderWithCrystal(<Affix offset={16} onChange={onChange}><p>Filters</p></Affix>);
    scroll(8);
    await vi.waitFor(() => expect(onChange).toHaveBeenCalledTimes(1));
    scroll(4);
    scroll(2);
    /* Still pinned. A handler that fires on every frame of a scroll is one a
       caller cannot use to do anything but the cheapest possible work. */
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('holds the placeholder open whether or not it is pinned', async () => {
    renderWithCrystal(<Affix offset={16}><p>Filters</p></Affix>);
    /* Found from the content rather than from the container's first child,
       which is the provider's wrapper. */
    const holder = screen.getByText('Filters').parentElement?.parentElement as HTMLElement;
    await vi.waitFor(() => expect(holder.style.blockSize).toBe('48px'));
    scroll(8);
    await vi.waitFor(() => {
      expect(screen.getByText('Filters').closest('[data-pinned]')).not.toBeNull();
    });
    /* The height is reserved in both states. Reserving it only while pinned is
       what makes the page jump — and then loop, because releasing restores the
       height, which scrolls the threshold back under the element. */
    expect(holder.style.blockSize).toBe('48px');
  });
});

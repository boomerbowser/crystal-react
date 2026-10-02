import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { expectNoAxeViolations } from '../../test/axe.js';
import { act, fireEvent, renderWithCrystal, screen } from '../../test/render.js';
import { ScrollArea } from './ScrollArea.js';

/* jsdom has no ResizeObserver, and the component's production path for "the
   content changed size" runs through one. This stub keeps its callbacks and
   `resize()` fires them, so a test can change the stubbed geometry and see the
   component react the way it does in a browser. */
const observers = new Set<() => void>();
const resize = () => act(() => { for (const callback of [...observers]) callback(); });

beforeEach(() => {
  observers.clear();
  (globalThis as { ResizeObserver?: unknown }).ResizeObserver = class {
    constructor(private readonly callback: () => void) { observers.add(this.callback); }
    observe() { /* every observed element shares the one callback */ }
    unobserve() { /* nothing to track */ }
    disconnect() { observers.delete(this.callback); }
  };
});

afterEach(() => { delete (globalThis as { ResizeObserver?: unknown }).ResizeObserver; });

/* jsdom lays nothing out: every element reports a client and scroll size of zero,
   so a scroll area there never overflows and every measurement below would assert
   the same "nothing to scroll" answer. These stub the four numbers the component
   reads, which is enough to exercise its edge decision without a real layout
   engine.
 */
function layout(
  element: HTMLElement,
  { size, content, position }: { size: number; content: number; position: number },
  axis: 'x' | 'y' = 'y',
) {
  const horizontal = axis === 'x';
  const define = (name: string, value: number, writable = false) =>
    Object.defineProperty(element, name, { configurable: true, writable, value });

  define(horizontal ? 'clientWidth' : 'clientHeight', size);
  define(horizontal ? 'clientHeight' : 'clientWidth', size);
  define(horizontal ? 'scrollWidth' : 'scrollHeight', content);
  define(horizontal ? 'scrollHeight' : 'scrollWidth', size);
  define(horizontal ? 'scrollLeft' : 'scrollTop', position, true);
}

/** Re-measure the way a real scroll does, through the component's own handler. */
function scrollTo(element: HTMLElement, position: number, axis: 'x' | 'y' = 'y') {
  Object.defineProperty(element, axis === 'x' ? 'scrollLeft' : 'scrollTop', {
    configurable: true, writable: true, value: position,
  });
  act(() => { fireEvent.scroll(element); });
}

describe('ScrollArea', () => {
  it('renders its children', () => {
    renderWithCrystal(<ScrollArea>Contents</ScrollArea>);
    expect(screen.getByText('Contents')).toBeInTheDocument();
  });

  it('has no accessibility violations', async () => {
    const { container } = renderWithCrystal(
      <ScrollArea aria-label="Release notes">Contents</ScrollArea>,
    );
    await expectNoAxeViolations(container);
  });

  /* The scrollbar is Crystal's, reached by class rather than restated in this
     package's CSS. Frost is the default because most scroll areas are panels. */
  it('takes the Frost scrollbar by default and the Resin one on request', () => {
    const { rerenderWithCrystal } = renderWithCrystal(<ScrollArea data-testid="a">C</ScrollArea>);
    expect(screen.getByTestId('a').className).toMatch(/\bcr-scroll-frost\b/);

    rerenderWithCrystal(<ScrollArea variant="resin" data-testid="a">C</ScrollArea>);
    const el = screen.getByTestId('a');
    expect(el.className).toMatch(/\bcr-scroll-resin\b/);
    expect(el.className).not.toMatch(/\bcr-scroll-frost\b/);
  });

  /* Crystal's CSS fades only when the attribute is present. A container that
     cannot scroll must therefore not carry it, or every short panel is faded at
     both ends for no reason. */
  it('carries no fade attribute when there is nothing to scroll', () => {
    renderWithCrystal(<ScrollArea data-testid="a">C</ScrollArea>);
    const el = screen.getByTestId('a');
    expect(el.dataset['crScroll']).toBeUndefined();
  });

  it('fades the far edge at the start, both in the middle, and the near edge at the end', () => {
    renderWithCrystal(<ScrollArea data-testid="a"><p>long</p></ScrollArea>);
    const el = screen.getByTestId('a');
    layout(el, { size: 100, content: 400, position: 0 });
    resize();
    expect(el.dataset['crScroll']).toBe('start');

    scrollTo(el, 150);
    expect(el.dataset['crScroll']).toBe('both');

    scrollTo(el, 300);
    expect(el.dataset['crScroll']).toBe('end');
  });

  /* Fractional layout means a container at its end can report a position a
     fraction short of the maximum. Without the tolerance the far edge stays
     faded at the bottom of every list. */
  it('counts a fractional pixel short of the end as the end', () => {
    renderWithCrystal(<ScrollArea data-testid="a"><p>long</p></ScrollArea>);
    const el = screen.getByTestId('a');
    layout(el, { size: 100, content: 400, position: 0 });
    scrollTo(el, 299.6);
    expect(el.dataset['crScroll']).toBe('end');
  });

  /* A right-to-left container counts scrollLeft down from zero, so a position
     read without a magnitude reports every RTL scroller as being at its start. */
  it('reads a right-to-left horizontal position by its magnitude', () => {
    renderWithCrystal(
      <ScrollArea axis="x" data-testid="a"><p>wide</p></ScrollArea>,
      { theme: { direction: 'rtl' } },
    );
    const el = screen.getByTestId('a');
    layout(el, { size: 100, content: 400, position: 0 }, 'x');
    scrollTo(el, -150, 'x');
    expect(el.dataset['crScroll']).toBe('both');
  });

  it('declares its axis so the fade runs along it', () => {
    const { rerenderWithCrystal } = renderWithCrystal(<ScrollArea data-testid="a">C</ScrollArea>);
    expect(screen.getByTestId('a').dataset['crScrollAxis']).toBe('y');

    rerenderWithCrystal(<ScrollArea axis="x" data-testid="a">C</ScrollArea>);
    expect(screen.getByTestId('a').dataset['crScrollAxis']).toBe('x');
  });

  /* Two crossed gradients darken the corners, so a two-axis area carries no fade
     and no fade attribute. */
  it('does not fade a two-axis area, or one that opts out', () => {
    const { rerenderWithCrystal } = renderWithCrystal(
      <ScrollArea axis="both" data-testid="a">C</ScrollArea>,
    );
    expect(screen.getByTestId('a').dataset['crScrollAxis']).toBeUndefined();

    rerenderWithCrystal(<ScrollArea fade={false} data-testid="a">C</ScrollArea>);
    expect(screen.getByTestId('a').dataset['crScrollAxis']).toBeUndefined();
  });

  /* A scrollable region holding nothing focusable is unreachable by keyboard.
     This is the WCAG failure axe calls `scrollable-region-focusable`. */
  it('becomes a tab stop only when it scrolls and holds nothing focusable', () => {
    renderWithCrystal(<ScrollArea data-testid="a"><p>text</p></ScrollArea>);
    const el = screen.getByTestId('a');
    expect(el.tabIndex).toBe(-1);

    layout(el, { size: 100, content: 400, position: 0 });
    resize();
    expect(el.tabIndex).toBe(0);
  });

  it('adds no tab stop when the content is already reachable', () => {
    renderWithCrystal(<ScrollArea data-testid="a"><button type="button">Go</button></ScrollArea>);
    const el = screen.getByTestId('a');
    layout(el, { size: 100, content: 400, position: 0 });
    resize();
    expect(el.tabIndex).toBe(-1);
  });

  /* A landmark without a name is noise in a screen reader's landmark list, so the
     area takes the `region` role only when it has a name. */
  it('is a region only when it is both a tab stop and named', () => {
    const { rerenderWithCrystal } = renderWithCrystal(
      <ScrollArea data-testid="a"><p>text</p></ScrollArea>,
    );
    const el = screen.getByTestId('a');
    layout(el, { size: 100, content: 400, position: 0 });
    resize();
    expect(el.getAttribute('role')).toBeNull();

    rerenderWithCrystal(
      <ScrollArea aria-label="Release notes" data-testid="a"><p>text</p></ScrollArea>,
    );
    resize();
    expect(screen.getByRole('region', { name: 'Release notes' })).toBe(el);
  });

  it('forwards a ref, merges a className, and still calls a consumer onScroll', () => {
    const ref = { current: null as HTMLDivElement | null };
    const seen: number[] = [];
    renderWithCrystal(
      <ScrollArea ref={ref} className="mine" data-testid="a" onScroll={() => seen.push(1)}>
        C
      </ScrollArea>,
    );
    const el = screen.getByTestId('a');
    expect(ref.current).toBe(el);
    expect(el.className).toMatch(/mine/);
    expect(el.className).toMatch(/\bcr-scroll-frost\b/);
    scrollTo(el, 10);
    expect(seen).toHaveLength(1);
  });

  /* Crystal's catalogue assigns this component no recipe. A library must not
     invent motion the design system did not specify. */
  it('plays no motion of its own', () => {
    renderWithCrystal(<ScrollArea data-testid="a">C</ScrollArea>);
    expect(screen.getByTestId('a').dataset['crMotionName']).toBeUndefined();
  });
});

/* The selection pill's structure (R-A8). jsdom has no layout, so where the pill
   stands and how it travels are measured in a browser by `verify:behaviour`;
   this checks what the hook puts in the document and takes out of it. */
import { describe, expect, it } from 'vitest';
import { renderWithCrystal as render, screen, waitFor } from '../test/render.js';
import { Dock } from '../components/Dock/Dock.js';
import { Tabs } from '../components/Tabs/Tabs.js';
import { SegmentedControl } from '../components/SegmentedControl/SegmentedControl.js';

const items = [
  { id: 'home', label: 'Home', href: '/' },
  { id: 'library', label: 'Library', href: '/library' },
];

describe('useTravelMotion', () => {
  it('puts one hidden pill first in the plane, as a list item inside a list', () => {
    const { container } = render(<Dock items={items} currentId="library" />);
    const list = container.querySelector('ul.cr-dock-inner');
    const pill = list?.firstElementChild;
    expect(pill?.tagName).toBe('LI');
    expect(pill?.className).toBe('cr-indicator pill');
    expect(pill?.getAttribute('aria-hidden')).toBe('true');
    expect(list?.querySelectorAll('.cr-indicator.pill')).toHaveLength(1);
    /* Hidden, so the list still announces its destinations and nothing else. */
    expect(screen.getAllByRole('listitem')).toHaveLength(items.length);
  });

  it('places the pill on the first render without travelling', () => {
    const { container } = render(<Dock items={items} currentId="library" />);
    const pill = container.querySelector<HTMLElement>('.cr-indicator.pill');
    expect(pill?.hasAttribute('data-placed')).toBe(true);
    expect(pill?.dataset['crMotionState']).toBe('instant');
    expect(pill?.hasAttribute('data-travelling')).toBe(false);
    /* The radius is the segment's computed corner, which jsdom does not
       compute; the browser gate compares it. */
    for (const name of ['x', 'y', 'width', 'height']) {
      expect(pill?.style.getPropertyValue(`--cr-pill-${name}`)).not.toBe('');
    }
  });

  it('draws no pill when nothing is selected, and places one when something is', async () => {
    const { container, rerender } = render(<Dock items={items} />);
    const pill = container.querySelector<HTMLElement>('.cr-indicator.pill');
    expect(pill?.hasAttribute('data-placed')).toBe(false);
    rerender(<Dock items={items} currentId="home" />);
    /* The selection is noticed by a mutation observer, after the commit. */
    await waitFor(() => expect(container.querySelector('.cr-indicator.pill')?.hasAttribute('data-placed')).toBe(true));
    expect(container.querySelector<HTMLElement>('.cr-indicator.pill')?.dataset['crMotionState']).toBe('instant');
  });

  it('puts the pill in a tab list outside React Aria\'s collection, once', () => {
    const { container } = render(
      <Tabs label="Sections" items={[{ id: 'a', label: 'A', content: 'a' }, { id: 'b', label: 'B', content: 'b' }]} />,
    );
    const list = screen.getByRole('tablist');
    expect(list.querySelectorAll('.cr-indicator.pill')).toHaveLength(1);
    expect(list.firstElementChild?.classList.contains('pill')).toBe(true);
    expect(screen.getAllByRole('tab')).toHaveLength(2);
    expect(container.querySelectorAll('.cr-indicator.pill')).toHaveLength(1);
  });

  it('puts the pill in a segmented control\'s strip, as a span', () => {
    const { container } = render(
      <SegmentedControl label="View" defaultValue="day" options={[{ value: 'day', label: 'Day' }, { value: 'week', label: 'Week' }]} />,
    );
    const pill = container.querySelector('.cr-dock > .cr-indicator.pill');
    expect(pill?.tagName).toBe('SPAN');
    expect(screen.getAllByRole('radio')).toHaveLength(2);
  });

  it('takes the pill out when the strip unmounts', () => {
    const { container, unmount } = render(<Dock items={items} currentId="home" />);
    const pill = container.querySelector('.cr-indicator.pill');
    unmount();
    expect(pill?.isConnected).toBe(false);
  });
});

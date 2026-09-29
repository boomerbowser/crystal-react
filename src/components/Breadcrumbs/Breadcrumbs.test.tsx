import { describe, expect, it, vi } from 'vitest';
import { expectNoAxeViolations } from '../../test/axe.js';
import { renderWithCrystal, screen, userEvent, within } from '../../test/render.js';
import { Breadcrumbs } from './Breadcrumbs.js';

const trail = [
  { id: 'home', label: 'Home', href: '/' },
  { id: 'library', label: 'Library', href: '/library' },
  { id: 'data', label: 'Data', href: '/library/data' },
  { id: 'reports', label: 'Reports', href: '/library/data/reports' },
  { id: 'q3', label: 'Q3' },
];

describe('Breadcrumbs', () => {
  it('has no accessibility violations', async () => {
    const { container } = renderWithCrystal(<Breadcrumbs items={trail} />);
    await expectNoAxeViolations(container);
  });

  it('has no accessibility violations when collapsed', async () => {
    const { container } = renderWithCrystal(<Breadcrumbs items={trail} maxItems={3} />);
    await expectNoAxeViolations(container);
  });

  it('is a named landmark holding an ordered list', () => {
    renderWithCrystal(<Breadcrumbs items={trail} label="You are here" />);
    const nav = screen.getByRole('navigation', { name: 'You are here' });
    expect(within(nav).getByRole('list')).toBeInTheDocument();
    expect(within(nav).getAllByRole('listitem')).toHaveLength(5);
  });

  /* A link to the page you are on promises something will happen. React Aria
     drops the href on the last child, and the current crumb is text. */
  it('ends in the current page, which is marked and is not a link', () => {
    renderWithCrystal(<Breadcrumbs items={trail} />);
    /* The element that says "Q3" is the crumb's text; the one marked current is
       the crumb it sits in. */
    const current = screen.getByText('Q3').closest('[aria-current]');
    expect(current).toHaveAttribute('aria-current', 'page');
    expect(current?.closest('a')).toBeNull();
    expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/');
  });

  /* The list structure carries the relationship. A chevron read out between
     every pair is noise, so the separators are hidden from the tree. */
  it('does not announce its separators', () => {
    renderWithCrystal(<Breadcrumbs items={trail} />);
    const nav = screen.getByRole('navigation');
    expect(nav.textContent).toBe('HomeLibraryDataReportsQ3');
  });

  it('does not collapse when maxItems is not given', () => {
    renderWithCrystal(<Breadcrumbs items={trail} />);
    expect(screen.getAllByRole('listitem')).toHaveLength(5);
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('collapses the middle, keeping the root and the current page', () => {
    renderWithCrystal(<Breadcrumbs items={trail} maxItems={3} />);
    expect(screen.getByRole('link', { name: 'Home' })).toBeInTheDocument();
    expect(screen.getByText('Q3').closest('[aria-current]')).toHaveAttribute('aria-current', 'page');
    expect(screen.queryByText('Library')).toBeNull();
    expect(screen.queryByText('Reports')).toBeNull();
  });

  /* A trail that simply truncates deletes navigation silently. Everything
     collapsed stays reachable, and the disclosure says how many it holds. */
  it('keeps every collapsed crumb reachable, and counts them', async () => {
    const user = userEvent.setup();
    renderWithCrystal(<Breadcrumbs items={trail} maxItems={3} />);
    const disclosure = screen.getByRole('button', { name: 'Show 3 hidden breadcrumbs' });
    await user.click(disclosure);
    const menu = await screen.findByRole('menu');
    const links = within(menu).getAllByRole('menuitem');
    expect(links.map((item) => item.textContent)).toEqual(['Library', 'Data', 'Reports']);
  });

  /* A collapsed crumb is still a destination, so it is a real anchor: middle
     click, open in a new tab and the status bar all come with the element. */
  it('renders a collapsed crumb as a link, not a button that navigates', async () => {
    const user = userEvent.setup();
    renderWithCrystal(<Breadcrumbs items={trail} maxItems={3} />);
    await user.click(screen.getByRole('button', { name: /hidden breadcrumb/ }));
    const menu = await screen.findByRole('menu');
    expect(within(menu).getByRole('menuitem', { name: 'Data' }).tagName).toBe('A');
    expect(within(menu).getByRole('menuitem', { name: 'Data' })).toHaveAttribute('href', '/library/data');
  });

  /* A collapse hides everything between the first and the last crumb, so a
     three-crumb trail would hide exactly one — and one crumb behind a disclosure
     saves no room and costs a click. The refusal is why the disclosure's label
     is always plural: the singular case cannot be reached. */
  it('refuses to collapse a trail that would hide only one crumb', () => {
    renderWithCrystal(<Breadcrumbs items={trail.slice(0, 3)} maxItems={1} />);
    expect(screen.getAllByRole('listitem')).toHaveLength(3);
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('hides two as soon as there are four', () => {
    renderWithCrystal(<Breadcrumbs items={trail.slice(0, 4)} maxItems={3} />);
    expect(screen.getByRole('button', { name: 'Show 2 hidden breadcrumbs' })).toBeInTheDocument();
  });

  it('calls onAction for a crumb that navigates in the client', async () => {
    const user = userEvent.setup();
    const onAction = vi.fn();
    renderWithCrystal(
      <Breadcrumbs items={[{ id: 'home', label: 'Home', onAction }, { id: 'now', label: 'Now' }]} />,
    );
    await user.click(screen.getByText('Home'));
    expect(onAction).toHaveBeenCalledOnce();
  });
});

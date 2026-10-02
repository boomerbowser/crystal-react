import { describe, expect, it } from 'vitest';
import { expectNoAxeViolations } from '../../test/axe.js';
import { renderWithCrystal, screen } from '../../test/render.js';
import { PageHeader } from './PageHeader.js';
import { Breadcrumbs } from '../Breadcrumbs/Breadcrumbs.js';
import { Button } from '../Button/Button.js';

describe('PageHeader', () => {
  /* "Contains the h1." The page's heading lives here. The screen draws none,
     and a state screen takes level 1 only once it has replaced the view. */
  it('carries the page heading at level one', () => {
    renderWithCrystal(<PageHeader title="Reports" />);
    expect(screen.getByRole('heading', { level: 1, name: 'Reports' })).toBeInTheDocument();
  });

  it('steps down where a view already has a heading above', () => {
    renderWithCrystal(<PageHeader title="Reports" titleAs="h2" />);
    expect(screen.getByRole('heading', { level: 2, name: 'Reports' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { level: 1 })).toBeNull();
  });

  /* Condensing makes the header take less room and removes nothing the reader
     needs. A header that dropped its actions once the reader scrolled would
     remove the controls at the moment they went looking for them.
   *
   * The assertions are structural, because that is all this environment can
   * check: the state is declared, and the title and actions are still rendered.
   * The description is hidden by a rule in a CSS module, and jsdom applies no
   * CSS, so `toBeInTheDocument` on it would pass whether the header condensed
   * or not. `verify:appearance`, which applies the stylesheet, checks that it
   * is invisible. */
  it('declares the condensed state and keeps the title and the actions', () => {
    renderWithCrystal(
      <PageHeader
        title="Reports"
        description="Everything you have built."
        actions={<Button>New report</Button>}
        isCondensed
        data-testid="header"
      />,
    );
    expect(screen.getByTestId('header')).toHaveAttribute('data-cr-state', 'condensed');
    expect(screen.getByRole('heading', { level: 1, name: 'Reports' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'New report' })).toBeInTheDocument();
  });

  it('is at rest until the view is scrolled', () => {
    renderWithCrystal(<PageHeader title="Reports" data-testid="header" />);
    expect(screen.getByTestId('header')).toHaveAttribute('data-cr-state', 'at-rest');
  });

  /* `Breadcrumbs` brings its own `<nav>`. Wrapping it in another would be two
     navigation landmarks around one list. */
  it('adds no second navigation landmark around the breadcrumbs', () => {
    renderWithCrystal(
      <PageHeader
        title="Q3 revenue"
        breadcrumbs={(
          <Breadcrumbs items={[{ id: 'reports', label: 'Reports', href: '/reports' }, { id: 'q3', label: 'Q3' }]} />
        )}
      />,
    );
    /* Asserted together: one landmark, and the crumbs inside it. One landmark
       alone is also true of a header that rendered no breadcrumbs. */
    expect(screen.getAllByRole('navigation')).toHaveLength(1);
    expect(screen.getByRole('link', { name: 'Reports' })).toBeInTheDocument();
    expect(screen.getByText('Q3').closest('[aria-current="page"]')).toBeInTheDocument();
  });

  it('has no axe violations', async () => {
    const { container } = renderWithCrystal(
      <PageHeader title="Reports" description="Everything you have built." actions={<Button>New</Button>} />,
    );
    await expectNoAxeViolations(container);
  });
});

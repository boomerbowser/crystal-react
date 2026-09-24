import { describe, expect, it } from 'vitest';
import { expectNoAxeViolations } from '../../test/axe.js';
import { renderWithCrystal, screen } from '../../test/render.js';
import { EmptyScreen } from './EmptyScreen.js';
import { Button } from '../Button/Button.js';

describe('EmptyScreen', () => {
  it('says what would be here and offers what creates it', () => {
    renderWithCrystal(
      <EmptyScreen title="No reports yet" actions={<Button>New report</Button>}>
        Reports you build will be listed here.
      </EmptyScreen>,
    );
    expect(screen.getByText('No reports yet')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'New report' })).toBeInTheDocument();
  });

  /* A view whose content region is empty is still that view: the page header
     goes on naming it, and the empty state labels its own group rather than
     competing for the document's one h1. The screens that replace a view
     outright — error, not found, permission — are the ones that take a heading. */
  it('does not claim the view heading', () => {
    renderWithCrystal(<EmptyScreen title="No reports yet" />);
    expect(screen.queryByRole('heading')).toBeNull();
  });

  /* The illustration is decoration. A reader told about it before being told
     what is missing has been given the ornament instead of the fact. */
  it('keeps the illustration out of the accessibility tree', () => {
    const { container } = renderWithCrystal(
      <EmptyScreen title="No reports yet" illustration={<svg data-testid="art" />} />,
    );
    expect(container.querySelector('[data-testid="art"]')?.closest('[aria-hidden="true"]'))
      .not.toBeNull();
  });

  it('has no axe violations', async () => {
    const { container } = renderWithCrystal(
      <EmptyScreen title="No reports yet" actions={<Button>New report</Button>} />,
    );
    await expectNoAxeViolations(container);
  });
});

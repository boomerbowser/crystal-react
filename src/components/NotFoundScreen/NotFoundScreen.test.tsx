import { describe, expect, it } from 'vitest';
import { expectNoAxeViolations } from '../../test/axe.js';
import { renderWithPrismata, screen } from '../../test/render.js';
import { NotFoundScreen } from './NotFoundScreen.js';
import { Button } from '../Button/Button.js';

describe('NotFoundScreen', () => {
  it('states what was not found', () => {
    renderWithPrismata(
      <NotFoundScreen title="That report does not exist" actions={<Button>All reports</Button>} />,
    );
    expect(screen.getByRole('heading', { level: 1, name: 'That report does not exist' }))
      .toBeInTheDocument();
  });

  /* "Offers a route onward", the half products tend to skip. `actions` is
     required: a 404 that says "not found" and stops leaves the reader with
     nowhere to go. The browser's back button is not a route the product
     offered. */
  it('requires the route onward and renders it', () => {
    renderWithPrismata(
      <NotFoundScreen title="That report does not exist" actions={<Button>All reports</Button>} />,
    );
    expect(screen.getByRole('button', { name: 'All reports' })).toBeInTheDocument();
  });

  /* Nothing failed. A missing thing is a fact about the address, and the news
     is not urgent enough to interrupt a screen reader. */
  it('is not announced as an alert', () => {
    renderWithPrismata(
      <NotFoundScreen title="That report does not exist" actions={<Button>All reports</Button>} />,
    );
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('has no axe violations', async () => {
    const { container } = renderWithPrismata(
      <NotFoundScreen title="That report does not exist" actions={<Button>All reports</Button>} />,
    );
    await expectNoAxeViolations(container);
  });
});

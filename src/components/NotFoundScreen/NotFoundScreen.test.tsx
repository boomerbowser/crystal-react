import { describe, expect, it } from 'vitest';
import { expectNoAxeViolations } from '../../test/axe.js';
import { renderWithCrystal, screen } from '../../test/render.js';
import { NotFoundScreen } from './NotFoundScreen.js';
import { Button } from '../Button/Button.js';

describe('NotFoundScreen', () => {
  it('states what was not found', () => {
    renderWithCrystal(
      <NotFoundScreen title="That report does not exist" actions={<Button>All reports</Button>} />,
    );
    expect(screen.getByRole('heading', { level: 1, name: 'That report does not exist' }))
      .toBeInTheDocument();
  });

  /* "Offers a route onward", which is the half products skip. `actions` is
     required: a 404 that says "not found" and stops has told the reader what
     they already knew and left them nowhere. The browser's back button is not a
     route the product offered — it is the one the reader had anyway. */
  it('requires the route onward and renders it', () => {
    renderWithCrystal(
      <NotFoundScreen title="That report does not exist" actions={<Button>All reports</Button>} />,
    );
    expect(screen.getByRole('button', { name: 'All reports' })).toBeInTheDocument();
  });

  /* Nothing failed. A missing thing is a fact about the address, not an error
     in the system, and interrupting a screen reader to say so is the component
     being more urgent than the news. */
  it('is not announced as an alert', () => {
    renderWithCrystal(
      <NotFoundScreen title="That report does not exist" actions={<Button>All reports</Button>} />,
    );
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('has no axe violations', async () => {
    const { container } = renderWithCrystal(
      <NotFoundScreen title="That report does not exist" actions={<Button>All reports</Button>} />,
    );
    await expectNoAxeViolations(container);
  });
});

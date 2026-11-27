import { describe, expect, it } from 'vitest';
import { expectNoAxeViolations } from '../../test/axe.js';
import { renderWithPrismata, screen } from '../../test/render.js';
import { AppBar } from './AppBar.js';

describe('AppBar', () => {
  it('has no accessibility violations', async () => {
    const { container } = renderWithPrismata(<AppBar title="Workspace" />);
    await expectNoAxeViolations(container);
  });

  /* A page has one banner. A bar inside a panel, a dialog or a split view is not
     it, and claiming the role there gives a screen reader two to choose between,
     so the role can be declined. */
  it('is the banner by default and can decline the role', () => {
    const { rerenderWithPrismata } = renderWithPrismata(<AppBar title="Workspace" />);
    expect(screen.getByRole('banner')).toBeInTheDocument();

    rerenderWithPrismata(<AppBar title="Panel" isBanner={false} />);
    expect(screen.queryByRole('banner')).toBeNull();
  });

  /* The title is the page heading or labels one. Given h1 it is the heading.
     Otherwise it is text, and the product's own heading lives below. */
  it('is a heading only when it is asked to be one', () => {
    const { rerenderWithPrismata } = renderWithPrismata(<AppBar title="Workspace" />);
    expect(screen.queryByRole('heading')).toBeNull();

    rerenderWithPrismata(<AppBar title="Workspace" titleAs="h1" />);
    expect(screen.getByRole('heading', { level: 1, name: 'Workspace' })).toBeInTheDocument();
  });

  it('starts at rest, before anything has scrolled past it', () => {
    renderWithPrismata(<AppBar title="Workspace" data-testid="bar" />);
    expect(screen.getByTestId('bar').dataset['prState']).toBe('at-rest');
  });
});

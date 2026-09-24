import { describe, expect, it } from 'vitest';
import { expectNoAxeViolations } from '../../test/axe.js';
import { renderWithCrystal, screen } from '../../test/render.js';
import { Screen } from './Screen.js';
import { AppShell } from '../AppShell/AppShell.js';
import { PageHeader } from '../PageHeader/PageHeader.js';
import { ErrorScreen } from '../ErrorScreen/ErrorScreen.js';

describe('Screen', () => {
  it('is the main landmark when nothing above it is', () => {
    renderWithCrystal(<Screen label="Reports">The reports.</Screen>);
    expect(screen.getByRole('main', { name: 'Reports' })).toBeInTheDocument();
  });

  /* "One main per view." `AppShell` already renders one, so a screen that always
     rendered its own would give a product two the moment it used both — a
     landmark list with two identical entries and no way to tell which holds the
     content. The screen asks instead of being told: the shell publishes its
     scrolling region, and the element it publishes is that `<main>`. */
  it('becomes a labelled section when a shell already owns the main', () => {
    renderWithCrystal(
      <AppShell>
        <Screen label="Reports">The reports.</Screen>
      </AppShell>,
    );
    expect(screen.getAllByRole('main')).toHaveLength(1);
    expect(screen.getByRole('region', { name: 'Reports' })).toBeInTheDocument();
  });

  /* Three components could each claim the document's one h1. The rule: the page
     header owns it, the screen never draws a heading, and a state screen takes
     level 1 only when it has replaced the view. Nested inside a screen that has
     a header, it steps down. */
  it('leaves exactly one h1 in a view that has a header and a state screen', () => {
    renderWithCrystal(
      <Screen label="Reports" header={<PageHeader title="Reports" />}>
        <ErrorScreen title="The report could not be built" headingLevel={2} />
      </Screen>,
    );
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Reports');
  });

  it('has no axe violations', async () => {
    const { container } = renderWithCrystal(
      <Screen label="Reports" header={<PageHeader title="Reports" />}>The reports.</Screen>,
    );
    await expectNoAxeViolations(container);
  });
});

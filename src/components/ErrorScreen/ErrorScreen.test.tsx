import { describe, expect, it } from 'vitest';
import { expectNoAxeViolations } from '../../test/axe.js';
import { renderWithCrystal, screen } from '../../test/render.js';
import { ErrorScreen } from './ErrorScreen.js';
import { OfflineScreen } from '../OfflineScreen/OfflineScreen.js';

describe('ErrorScreen', () => {
  it('states what failed as the view heading', () => {
    renderWithCrystal(<ErrorScreen title="The report could not be built">Try again in a moment.</ErrorScreen>);
    expect(screen.getByRole('heading', { level: 1, name: 'The report could not be built' }))
      .toBeInTheDocument();
  });

  /* A view that has replaced what the reader asked for warrants an assertive
     announcement. `Result` sets no role of its own, because it is used for
     successes too, and a success should not be announced as an alert. */
  it('announces assertively, where an offline screen announces politely', () => {
    const { unmount } = renderWithCrystal(<ErrorScreen title="It failed" />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
    unmount();

    renderWithCrystal(<OfflineScreen />);
    expect(screen.queryByRole('alert')).toBeNull();
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  /* "Never only a code." A screen that shows `0x80070005` and nothing else does
     not typecheck, because `title` is required and `code` is an extra. This test
     asserts that the code follows the sentence and does not replace it. */
  it('puts the reference after the sentence, never instead of it', () => {
    renderWithCrystal(
      <ErrorScreen title="The report could not be built" code="E_NO_ROWS">
        The source returned nothing.
      </ErrorScreen>,
    );
    const text = screen.getByRole('alert').textContent ?? '';
    expect(text).toContain('The report could not be built');
    expect(text.indexOf('The report could not be built')).toBeLessThan(text.indexOf('E_NO_ROWS'));
  });

  /* Level 1 is the default because this screen has replaced the view. Rendered
     into a region that still has a page header, it must be able to stop
     competing for the document's one h1. */
  it('drops to the level the surrounding view asks for', () => {
    renderWithCrystal(<ErrorScreen title="It failed" headingLevel={2} />);
    expect(screen.getByRole('heading', { level: 2, name: 'It failed' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { level: 1 })).toBeNull();
  });

  it('has no axe violations', async () => {
    const { container } = renderWithCrystal(
      <ErrorScreen title="It failed" code="E_NO_ROWS">The source returned nothing.</ErrorScreen>,
    );
    await expectNoAxeViolations(container);
  });
});

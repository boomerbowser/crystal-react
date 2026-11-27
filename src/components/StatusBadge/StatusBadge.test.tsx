import { describe, expect, it } from 'vitest';
import { expectNoAxeViolations } from '../../test/axe.js';
import { renderWithPrismata, screen } from '../../test/render.js';
import { prismataTokens } from '../../theme/tokens.generated.js';
import { StatusBadge } from './StatusBadge.js';

describe('StatusBadge', () => {
  /* "The word carries the meaning. Symbol and colour are reinforcement, never
     the only signal." A reader who hears both hears "exclamation mark, Action
     blocked". */
  it('announces the word and not the symbol', () => {
    renderWithPrismata(<StatusBadge status="danger">Action blocked</StatusBadge>);
    const symbol = screen.getByText(prismataTokens['feedback.light.danger.symbol']);
    expect(symbol).toHaveAttribute('aria-hidden', 'true');
    expect(screen.getByText('Action blocked')).not.toHaveAttribute('aria-hidden');
  });

  it('takes its symbols from Prismata rather than defining its own', () => {
    renderWithPrismata(<StatusBadge status="success">Ready</StatusBadge>);
    expect(screen.getByText(prismataTokens['feedback.light.success.symbol'])).toBeInTheDocument();
  });

  /* Neutral is the absence of a status rather than a fifth one, so it shows no
     glyph: a symbol would imply a meaning the state does not have. */
  it('shows no symbol for neutral', () => {
    renderWithPrismata(<StatusBadge status="neutral" data-testid="badge">Draft</StatusBadge>);
    /* This checks the symbol, which is what the rule is about, rather than the
       child count. The word has no wrapper span, because Prismata paints
       `span.pr-status > span` as the well and a span around the word would be
       painted as a second one. */
    expect(screen.getByTestId('badge').querySelector('[aria-hidden="true"]')).toBeNull();
    expect(screen.getByText('Draft')).toBeInTheDocument();
  });

  it('carries the status as data, so the tested pair is selected in CSS', () => {
    renderWithPrismata(<StatusBadge status="attention" data-testid="badge">Review needed</StatusBadge>);
    expect(screen.getByTestId('badge').dataset['status']).toBe('attention');
  });

  /* Nothing moves at rest. A badge that animated as the page settled would be
     ambient motion, which 2.0 withdrew deliberately. */
  it('plays nothing on mount and plays on a change to success', () => {
    const { rerenderWithPrismata } = renderWithPrismata(
      <StatusBadge status="success" data-testid="badge">Ready</StatusBadge>,
    );
    const badge = screen.getByTestId('badge');
    expect(badge.dataset['prMotionName'] ?? badge.dataset['prMotionState']).toBeUndefined();

    rerenderWithPrismata(<StatusBadge status="info" data-testid="badge">Information</StatusBadge>);
    rerenderWithPrismata(<StatusBadge status="success" data-testid="badge">Ready</StatusBadge>);
    const played = screen.getByTestId('badge');
    expect(played.dataset['prMotionName'] ?? played.dataset['prMotionState']).toBeDefined();
  });

  /* Only two of the five states carry a recipe in the catalogue. */
  it('plays nothing for a status the catalogue assigns no recipe', () => {
    const { rerenderWithPrismata } = renderWithPrismata(
      <StatusBadge status="success" data-testid="badge">Ready</StatusBadge>,
    );
    rerenderWithPrismata(<StatusBadge status="info" data-testid="badge">Information</StatusBadge>);
    const badge = screen.getByTestId('badge');
    expect(badge.dataset['prMotionName'] ?? badge.dataset['prMotionState']).toBeUndefined();
  });

  it('has no accessibility violations', async () => {
    const { container } = renderWithPrismata(<StatusBadge status="info">Information</StatusBadge>);
    await expectNoAxeViolations(container);
  });
});

import { describe, expect, it } from 'vitest';
import { expectNoAxeViolations } from '../../test/axe.js';
import { renderWithCrystal, screen } from '../../test/render.js';
import { crystalTokens } from '../../theme/tokens.generated.js';
import { StatusBadge } from './StatusBadge.js';

describe('StatusBadge', () => {
  /* "The word carries the meaning. Symbol and colour are reinforcement, never
     the only signal." A reader who hears both hears "exclamation mark, Action
     blocked". */
  it('announces the word and not the symbol', () => {
    renderWithCrystal(<StatusBadge status="danger">Action blocked</StatusBadge>);
    const symbol = screen.getByText(crystalTokens['feedback.light.danger.symbol']);
    expect(symbol).toHaveAttribute('aria-hidden', 'true');
    expect(screen.getByText('Action blocked')).not.toHaveAttribute('aria-hidden');
  });

  it('takes its symbols from Crystal rather than defining its own', () => {
    renderWithCrystal(<StatusBadge status="success">Ready</StatusBadge>);
    expect(screen.getByText(crystalTokens['feedback.light.success.symbol'])).toBeInTheDocument();
  });

  /* Neutral is the absence of a status rather than a fifth one, so it shows no
     glyph: a symbol would imply a meaning the state does not have. */
  it('shows no symbol for neutral', () => {
    renderWithCrystal(<StatusBadge status="neutral" data-testid="badge">Draft</StatusBadge>);
    expect(screen.getByTestId('badge').children).toHaveLength(1);
    expect(screen.getByText('Draft')).toBeInTheDocument();
  });

  it('carries the status as data, so the tested pair is selected in CSS', () => {
    renderWithCrystal(<StatusBadge status="attention" data-testid="badge">Review needed</StatusBadge>);
    expect(screen.getByTestId('badge').dataset['status']).toBe('attention');
  });

  /* Nothing moves at rest. A badge that animated as the page settled would be
     ambient motion, which 2.0 withdrew deliberately. */
  it('plays nothing on mount and plays on a change to success', () => {
    const { rerenderWithCrystal } = renderWithCrystal(
      <StatusBadge status="success" data-testid="badge">Ready</StatusBadge>,
    );
    const badge = screen.getByTestId('badge');
    expect(badge.dataset['crMotionName'] ?? badge.dataset['crMotionState']).toBeUndefined();

    rerenderWithCrystal(<StatusBadge status="info" data-testid="badge">Information</StatusBadge>);
    rerenderWithCrystal(<StatusBadge status="success" data-testid="badge">Ready</StatusBadge>);
    const played = screen.getByTestId('badge');
    expect(played.dataset['crMotionName'] ?? played.dataset['crMotionState']).toBeDefined();
  });

  /* Only two of the five states carry a recipe in the catalogue. */
  it('plays nothing for a status the catalogue assigns no recipe', () => {
    const { rerenderWithCrystal } = renderWithCrystal(
      <StatusBadge status="success" data-testid="badge">Ready</StatusBadge>,
    );
    rerenderWithCrystal(<StatusBadge status="info" data-testid="badge">Information</StatusBadge>);
    const badge = screen.getByTestId('badge');
    expect(badge.dataset['crMotionName'] ?? badge.dataset['crMotionState']).toBeUndefined();
  });

  it('has no accessibility violations', async () => {
    const { container } = renderWithCrystal(<StatusBadge status="info">Information</StatusBadge>);
    await expectNoAxeViolations(container);
  });
});

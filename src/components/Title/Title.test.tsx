import { describe, expect, it } from 'vitest';
import { renderWithPrismata, screen } from '../../test/render.js';
import { Title, Display, Lead } from './Title.js';

describe('Title', () => {
  /* The catalogue states this rule twice: the level is the document outline, the
     size is a step of the scale, and the two are chosen separately. If level also
     meant size, products would have to choose between a correct outline and a
     correct appearance, and they choose appearance. */
  it('separates the outline level from the size', () => {
    renderWithPrismata(<Title level={4} step="display">Loud but deep</Title>);
    const heading = screen.getByRole('heading', { level: 4, name: 'Loud but deep' });
    expect(heading.style.getPropertyValue('--pr-title-size')).toBe('var(--pr-text-display-size)');
  });

  it('gives a level a sensible step when none is chosen', () => {
    renderWithPrismata(<Title level={2}>Section</Title>);
    expect(screen.getByRole('heading', { level: 2 }).style.getPropertyValue('--pr-title-size'))
      .toBe('var(--pr-text-title-size)');
  });

  /* Exactly one per view, and it is the h1 unless the page says otherwise. */
  it('makes Display an h1 by default', () => {
    renderWithPrismata(<Display>The one statement</Display>);
    expect(screen.getByRole('heading', { level: 1, name: 'The one statement' })).toBeInTheDocument();
  });

  /* It reads like a heading but is a paragraph, so a sentence of standfirst copy
     stays out of the document outline. */
  it('keeps Lead a paragraph', () => {
    renderWithPrismata(<Lead data-testid="l">A standfirst</Lead>);
    expect(screen.getByTestId('l').tagName).toBe('P');
    expect(screen.queryByRole('heading')).toBeNull();
  });
});

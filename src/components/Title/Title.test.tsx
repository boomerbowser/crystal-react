import { describe, expect, it } from 'vitest';
import { renderWithCrystal, screen } from '../../test/render.js';
import { Title, Display, Lead } from './Title.js';

describe('Title', () => {
  /* The rule the catalogue states twice: the level is the document outline, the
     size is a step of the scale, and the two are chosen separately. A component
     where level also means size forces a choice between a correct outline and a
     correct appearance, and products choose appearance. */
  it('separates the outline level from the size', () => {
    renderWithCrystal(<Title level={4} step="display">Loud but deep</Title>);
    const heading = screen.getByRole('heading', { level: 4, name: 'Loud but deep' });
    expect(heading.style.getPropertyValue('--cr-title-size')).toBe('var(--cr-text-display-size)');
  });

  it('gives a level a sensible step when none is chosen', () => {
    renderWithCrystal(<Title level={2}>Section</Title>);
    expect(screen.getByRole('heading', { level: 2 }).style.getPropertyValue('--cr-title-size'))
      .toBe('var(--cr-text-title-size)');
  });

  /* Exactly one per view, and it is the h1 unless the page says otherwise. */
  it('makes Display an h1 by default', () => {
    renderWithCrystal(<Display>The one statement</Display>);
    expect(screen.getByRole('heading', { level: 1, name: 'The one statement' })).toBeInTheDocument();
  });

  /* It reads like a heading and is not one: putting a sentence of standfirst copy
     into the document outline is what this prevents. */
  it('keeps Lead a paragraph', () => {
    renderWithCrystal(<Lead data-testid="l">A standfirst</Lead>);
    expect(screen.getByTestId('l').tagName).toBe('P');
    expect(screen.queryByRole('heading')).toBeNull();
  });
});

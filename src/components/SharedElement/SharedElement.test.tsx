import { describe, expect, it } from 'vitest';
import { renderWithPrismata, screen } from '../../test/render.js';
import { SharedElement } from './SharedElement.js';

describe('SharedElement', () => {
  it('marks the shared identity so two views can be matched', () => {
    renderWithPrismata(<SharedElement id="photo-9" data-testid="s">x</SharedElement>);
    expect(screen.getByTestId('s').dataset['prShared']).toBe('photo-9');
  });

  /* The catalogue says removed entirely, not damped. A shared-element transition
     is an object crossing the viewport, and slowing it down still moves it. */
  it('is removed entirely under reduced motion, not slowed', () => {
    renderWithPrismata(<SharedElement id="photo-9" data-testid="s">x</SharedElement>, {
      theme: { reduceMotion: true },
    });
    const element = screen.getByTestId('s');
    expect(element.dataset['prShared']).toBeUndefined();
    expect(element.dataset['prMotionState']).toBe('instant');
  });
});

import { describe, expect, it } from 'vitest';
import { renderWithCrystal, screen } from '../../test/render.js';
import { AnimateOnScroll } from './AnimateOnScroll.js';

describe('AnimateOnScroll', () => {
  /* Content is present and readable before the animation runs, and is never
     revealed by it. A reader whose observer
     never fires, or whose JavaScript failed, must not get an invisible page. */
  it('renders its content readable, not hidden waiting to be revealed', () => {
    renderWithCrystal(<AnimateOnScroll><p>Body text</p></AnimateOnScroll>);
    const text = screen.getByText('Body text');
    expect(text).toBeVisible();
    expect(text.closest('div')?.style.opacity).not.toBe('0');
  });

  /* "Which recipes are allowed" is Crystal's half of this component, so a press
     recipe is refused with an error instead of being accepted and ignored. */
  it('refuses a recipe that is not an entry', () => {
    expect(() => renderWithCrystal(
      /* @ts-expect-error deliberately outside the allowed set */
      <AnimateOnScroll recipe="press"><p>x</p></AnimateOnScroll>,
    )).toThrow(/not an entry recipe/);
  });
});

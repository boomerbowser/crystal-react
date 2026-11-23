import { describe, expect, it } from 'vitest';
import userEvent from '@testing-library/user-event';
import { expectNoAxeViolations } from '../../test/axe.js';
import { renderWithCrystal, screen } from '../../test/render.js';
import { Carousel } from './Carousel.js';

const slides = [
  { id: 'a', label: 'Plastic', content: <p>The foundation.</p> },
  { id: 'b', label: 'Frost', content: <p>The diffused intermediate surface.</p> },
  { id: 'c', label: 'Resin', content: <p>The floating control plane.</p> },
];

describe('Carousel', () => {
  it('is a named group that says what it is', () => {
    renderWithCrystal(<Carousel slides={slides} label="Crystal materials" />);
    const group = screen.getByRole('group', { name: 'Crystal materials' });
    expect(group).toHaveAttribute('aria-roledescription', 'carousel');
  });

  /* "Indicators are buttons": a row of dots that cannot be pressed would be a
     progress readout that looks like a control. */
  it('gives every slide a pressable indicator, and marks the current one', async () => {
    renderWithCrystal(<Carousel slides={slides} label="Crystal materials" />);
    const indicators = slides.map((slide) => screen.getByRole('button', { name: slide.label }));
    expect(indicators).toHaveLength(3);
    expect(indicators[0]).toHaveAttribute('aria-current', 'true');
    expect(indicators[1]).not.toHaveAttribute('aria-current');

    await userEvent.click(indicators[2]!);
    expect(screen.getByRole('button', { name: 'Resin' })).toHaveAttribute('aria-current', 'true');
  });

  it('disables the step control at each end rather than hiding it', async () => {
    renderWithCrystal(<Carousel slides={slides} label="Crystal materials" />);
    expect(screen.getByRole('button', { name: /Previous slide/ })).toBeDisabled();
    expect(screen.getByRole('button', { name: /Next slide/ })).toBeEnabled();

    await userEvent.click(screen.getByRole('button', { name: 'Resin' }));
    expect(screen.getByRole('button', { name: /Next slide/ })).toBeDisabled();
  });

  /* The track is a scroll container, and a scroll container with nothing
     focusable inside it cannot be reached without a pointer. */
  it('makes the track a tab stop with the Resin scrollbar', () => {
    const { container } = renderWithCrystal(<Carousel slides={slides} label="Crystal materials" />);
    const track = container.querySelector('ul');
    expect(track).toHaveAttribute('tabindex', '0');
    expect(track?.className).toMatch(/cr-scroll-resin/);
  });

  it('keeps each slide in its set, so a reader knows where they are', () => {
    const { container } = renderWithCrystal(<Carousel slides={slides} label="Crystal materials" />);
    const items = [...container.querySelectorAll('li[aria-posinset]')];
    expect(items).toHaveLength(3);
    expect(items[1]).toHaveAttribute('aria-posinset', '2');
    expect(items[1]).toHaveAttribute('aria-setsize', '3');
  });

  /* The movement is the track's own scroll, not a recipe on the slide, so no
     slide carries a motion and a slide never turns in place. */
  it('moves the track and never animates a slide', async () => {
    const { container } = renderWithCrystal(<Carousel slides={slides} label="Crystal materials" />);
    await userEvent.click(screen.getByRole('button', { name: /Next slide/ }));
    for (const item of container.querySelectorAll('li')) {
      expect(item.dataset['crMotionName'] ?? item.dataset['crMotionState']).toBeUndefined();
    }
    expect(screen.getByRole('button', { name: slides[1]!.label })).toHaveAttribute('aria-current', 'true');
  });

  it('takes its spacing from the gap and padding props', () => {
    renderWithCrystal(<Carousel slides={slides} label="Crystal materials" gap="xl" padding="none" />);
    const group = screen.getByRole('group', { name: 'Crystal materials' });
    expect(group.style.getPropertyValue('--cr-carousel-gap')).toBe('var(--cr-spacing-xl)');
    expect(group.style.getPropertyValue('--cr-carousel-padding')).toBe('0');
  });

  it('has no accessibility violations', async () => {
    const { container } = renderWithCrystal(<Carousel slides={slides} label="Crystal materials" />);
    await expectNoAxeViolations(container);
  });
});

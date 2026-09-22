import { describe, expect, it, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { expectNoAxeViolations } from '../../test/axe.js';
import { renderWithCrystal, screen } from '../../test/render.js';
import { ImageCompare } from './ImageCompare.js';

const before = { src: '/before.jpg', alt: 'The façade before cleaning' };
const after = { src: '/after.jpg', alt: 'The façade after cleaning' };

describe('ImageCompare', () => {
  /* "The divider is a slider with a percentage value and keyboard steps." A
     divider that is only draggable is a control nobody without a pointer can
     use. */
  it('is a real slider with a percentage value', () => {
    renderWithCrystal(<ImageCompare before={before} after={after} label="Before and after cleaning" />);
    /* React Aria renders the thumb as a real `input type="range"`, so the value
       is the input's and the browser derives `aria-valuenow` from it. What is
       worth asserting is the text, which is the part a reader hears. */
    const slider = screen.getByRole('slider', { name: 'Before and after cleaning' }) as HTMLInputElement;
    expect(slider.value).toBe('50');
    expect(slider.min).toBe('0');
    expect(slider.max).toBe('100');
    /* "50%", not "5,000%" — `style: 'unit'` with the percent unit, because
       `style: 'percent'` multiplies by a hundred. */
    expect(slider).toHaveAttribute('aria-valuetext', '50%');
  });

  it('moves with the keyboard', async () => {
    const onChange = vi.fn();
    renderWithCrystal(
      <ImageCompare before={before} after={after} label="Before and after" onChange={onChange} />,
    );
    const slider = screen.getByRole('slider') as HTMLInputElement;
    slider.focus();
    await userEvent.keyboard('{ArrowRight}');
    expect(onChange).toHaveBeenCalled();
    expect(Number(slider.value)).toBeGreaterThan(50);
  });

  /* Two different pictures, so a reader told about one of them has been told
     half the comparison. */
  it('gives both pictures their own description', () => {
    renderWithCrystal(<ImageCompare before={before} after={after} label="Before and after" />);
    expect(screen.getByAltText('The façade before cleaning')).toBeInTheDocument();
    expect(screen.getByAltText('The façade after cleaning')).toBeInTheDocument();
  });

  it('has no accessibility violations', async () => {
    const { container } = renderWithCrystal(
      <ImageCompare before={before} after={after} label="Before and after cleaning" defaultValue={62} />,
    );
    await expectNoAxeViolations(container);
  });
});

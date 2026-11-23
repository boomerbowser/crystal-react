import { describe, expect, it } from 'vitest';
import { isRestingValue, releaseRestingStyles } from './useMotion.js';

describe('releasing resting styles', () => {
  it('recognises the values that draw nothing', () => {
    expect(isRestingValue('clipPath', 'inset(0%)')).toBe(true);
    expect(isRestingValue('clipPath', 'inset(0 0 0% 0 round 0px)')).toBe(true);
    expect(isRestingValue('clipPath', 'inset(0% 0% round 12px)')).toBe(true); // crystal-allow-literal: a recipe's value, under test
    expect(isRestingValue('clipPath', 'inset(8% 4% round 36px)')).toBe(false); // crystal-allow-literal: a recipe's value, under test
    expect(isRestingValue('opacity', 1)).toBe(true);
    expect(isRestingValue('opacity', '0')).toBe(false);
    expect(isRestingValue('transform', 'perspective(1200px) translateX(0) rotateY(0)')).toBe(true); // crystal-allow-literal: a recipe's value, under test
    expect(isRestingValue('transform', 'rotate(0) scale(1)')).toBe(true);
    expect(isRestingValue('transform', 'perspective(1200px) translateX(105%) rotateY(-8deg)')).toBe(false); // crystal-allow-literal: a recipe's value, under test
    expect(isRestingValue('transform', 'rotate(360deg)')).toBe(false);
  });

  /* The square clip a finished entrance left behind cut the element's shadow
     off in a hard rectangle. */
  it('hands a finished element back to its stylesheet', () => {
    const element = document.createElement('div');
    element.style.clipPath = 'inset(0%)';
    element.style.opacity = '0';
    releaseRestingStyles(element, { clipPath: ['inset(0 0 100% 0)', 'inset(0%)'], opacity: [1, 0] });
    expect(element.style.clipPath).toBe('');
    expect(element.style.opacity).toBe('0');
  });
});

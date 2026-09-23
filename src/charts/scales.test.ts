import { describe, expect, it } from 'vitest';
import { stackedDomain, valueDomain } from './scales.js';

const one = (values: (number | null)[]) => [{ name: 'One', values }];

describe('valueDomain', () => {
  /* A bar is a length, and a length read from a baseline that is not zero
     exaggerates every difference in the data. */
  it('includes zero for a chart of lengths', () => {
    expect(valueDomain(one([412, 418, 415]))).toEqual([0, 418]);
  });

  /* A line's marks are positions, and a series between 412 and 418 drawn from
     zero is a flat line that hides the whole story. */
  it('fits the data for a chart of positions', () => {
    const [low, high] = valueDomain(one([412, 418, 415]), { fromZero: false });
    expect(low).toBeGreaterThan(400);
    expect(high).toBeGreaterThan(418);
  });

  /* A fitted domain may leave zero out. It may not invent the other side of it:
     an axis offering −100 on a chart of counts is offering a reading no count
     can have. */
  it('does not pad a domain of counts below zero', () => {
    /* Padding that would cross zero stops at it. It does not snap *to* zero:
       a fitted domain is still fitted, and 0.6 is where the padding ran out. */
    expect(valueDomain(one([1, 12, 30]), { fromZero: false })[0]).toBe(0);
    expect(valueDomain(one([2, 12, 30]), { fromZero: false })[0]).toBeGreaterThan(0);
    expect(valueDomain(one([-30, -12, -1]), { fromZero: false })[1]).toBe(0);
  });

  it('gives a flat series a range to sit in', () => {
    expect(valueDomain(one([5, 5, 5]), { fromZero: false })).toEqual([4, 6]);
  });

  it('ignores gaps rather than treating them as zero', () => {
    expect(valueDomain(one([null, 8, null]), { fromZero: false })).toEqual([7, 9]);
  });
});

describe('stackedDomain', () => {
  /* Positive and negative stack away from zero in their own directions rather
     than cancelling: two series of +5 and −5 need ten units of axis, not none. */
  it('stacks each direction away from zero', () => {
    expect(stackedDomain([
      { name: 'Up', values: [5] },
      { name: 'Down', values: [-5] },
    ], 1)).toEqual([-5, 5]);
  });
});

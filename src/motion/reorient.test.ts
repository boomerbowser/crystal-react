import { describe, expect, it } from 'vitest';
import { getRecipe, reorientRecipe } from './useMotion.js';

const drawerIn = getRecipe('drawer-in')!;
const transforms = (recipe: typeof drawerIn) => recipe.keyframes.map((frame) => frame.transform);

describe('reorientRecipe', () => {
  /* The authored recipe runs in one direction, written with physical transforms.
     Every test below depends on this, so it is checked here: if Crystal
     reauthors `drawer-in`, this test fails first. */
  it('starts from a recipe that arrives from the right', () => {
    expect(transforms(drawerIn)[0]).toContain('translateX(105%)');
    expect(transforms(drawerIn)[0]).toContain('rotateY(-12deg)');
  });

  it('returns the recipe untouched when asked for nothing', () => {
    expect(reorientRecipe(drawerIn, {})).toBe(drawerIn);
  });

  it('mirrors the inline axis', () => {
    const mirrored = transforms(reorientRecipe(drawerIn, { mirrorInline: true }));
    expect(mirrored[0]).toContain('translateX(-105%)');
    expect(mirrored[0]).toContain('rotateY(12deg)');
    /* The overshoot frame flips with the rest of the movement: the panel that
       overshot 8px to the left now overshoots 8px to the right. The expected
       value is derived from the authored recipe, so the test checks mirroring
       without copying Crystal's numbers. */
    const authored = transforms(drawerIn)[1] ?? '';
    const signFlipped = authored
      .replace(/translateX\((-?)([^)]*)\)/, (_m, sign: string, v: string) => `translateX(${sign ? '' : '-'}${v})`)
      .replace(/rotateY\((-?)([^)]*)\)/, (_m, sign: string, v: string) => `rotateY(${sign ? '' : '-'}${v})`);
    expect(mirrored[1]).toBe(signFlipped);
  });

  it('mirrors back to the original when applied twice', () => {
    const there = reorientRecipe(drawerIn, { mirrorInline: true });
    const back = reorientRecipe(there, { mirrorInline: true });
    expect(transforms(back)).toEqual(transforms(drawerIn));
  });

  /* The sign flip on the rotation is the axis change: a positive rotation about
     Y and a positive rotation about X tip a panel toward opposite corners. */
  it('turns the movement onto the block axis', () => {
    const block = transforms(reorientRecipe(drawerIn, { toBlockAxis: true }));
    expect(block[0]).toContain('translateY(105%)');
    expect(block[0]).toContain('rotateX(12deg)');
    expect(block[0]).not.toContain('translateX');
    expect(block[0]).not.toContain('rotateY');
  });

  it('turns onto the block axis and back the other way together', () => {
    const block = transforms(reorientRecipe(drawerIn, { toBlockAxis: true, mirrorInline: true }));
    expect(block[0]).toContain('translateY(-105%)');
    expect(block[0]).toContain('rotateX(-12deg)');
  });

  /* Physics, offsets and everything that is not a direction are carried through.
     Reorienting changes only geometry, so there is never a second copy of the
     movement with its own spring. */
  it('carries the spring, the duration and the offsets through untouched', () => {
    const turned = reorientRecipe(drawerIn, { toBlockAxis: true, mirrorInline: true });
    expect(turned.spring).toEqual(drawerIn.spring);
    expect(turned.duration).toBe(drawerIn.duration);
    expect(turned.keyframes.map((frame) => frame.offset))
      .toEqual(drawerIn.keyframes.map((frame) => frame.offset));
  });

  /* Compared with the authored recipe instead of a number, because the
     perspective value belongs to Crystal and should not be copied here. */
  it('leaves perspective and every other transform function alone', () => {
    const authored = transforms(drawerIn);
    const turned = transforms(reorientRecipe(drawerIn, { mirrorInline: true }));
    const perspective = (value: string | undefined) => /perspective\([^)]*\)/.exec(value ?? '')?.[0];
    turned.forEach((frame, index) => {
      expect(perspective(frame)).toBe(perspective(authored[index]));
      expect(perspective(frame)).toBeDefined();
    });
  });

  it('leaves a recipe with no transforms alone', () => {
    const accordion = getRecipe('accordion-in')!;
    expect(reorientRecipe(accordion, { mirrorInline: true, toBlockAxis: true }).keyframes)
      .toEqual(accordion.keyframes);
  });
});

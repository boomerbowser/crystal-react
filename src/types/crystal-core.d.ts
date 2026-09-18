/* Entry points `@crystal/core` ships as plain JavaScript.
 *
 * Ambient declarations for the modules the design system exports but does not yet
 * type. Where it DOES ship types — `core/state`, `core/preferences` — they are
 * used directly and nothing is declared here, because a second description of the
 * same shape is exactly the drift CONTRACT §1 warns about. The right long-term
 * home for these is the design system itself; they live here until it ships them.
 */

/** A single step of a Crystal recipe. The vocabulary is deliberately narrow:
 *  transform, opacity and clip-path are the properties a compositor can animate
 *  without repainting, and they are also the ones that port to SwiftUI and
 *  Compose. */
interface CrystalKeyframe {
  readonly transform?: string;
  readonly opacity?: number;
  readonly clipPath?: string;
  readonly offset?: number;
}

interface CrystalRecipe {
  readonly id: string;
  readonly category: string;
  readonly label: string;
  readonly duration: number;
  readonly engine: 'Motion' | 'GSAP';
  readonly keyframes: readonly CrystalKeyframe[];
  readonly use: string;
  readonly reduced: string;
  readonly material?: string;
  readonly signature?: string;
  /** A recipe may declare the paint layer it animates, so feathering moves
   *  without the text on it moving. */
  readonly layer?: string;
}

interface CrystalAnimation {
  readonly finished: Promise<unknown>;
  cancel(): void;
}

declare module '@crystal/core/engines' {
  /** Play keyframes on an element. Cancelling always settles `finished` and
   *  restores any paint the animation owned. */
  export function frames(
    element: Element,
    keyframes: readonly CrystalKeyframe[],
    options: { duration: number; engine?: string; easing?: string; pseudoElement?: string },
  ): CrystalAnimation;
  export const versions: Readonly<{ motion: string; gsap: string }>;
}

declare module '@crystal/core/motion-recipes' {
  const catalogue: { readonly recipes: readonly CrystalRecipe[] };
  export default catalogue;
}

declare module '@crystal/core/flat' {
  const flat: {
    readonly default: Record<string, unknown>;
    readonly palettes: Record<string, unknown>;
  };
  export default flat;
}

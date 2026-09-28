/* Entry points `@crystal-ui/core` ships as plain JavaScript.
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
  /** The skeleton's luminance sweep (2.2.0). */
  readonly backgroundPosition?: string;
  readonly offset?: number;
}

interface CrystalSpring {
  readonly stiffness: number;
  readonly damping: number;
  readonly mass: number;
  readonly dampingRatio: number;
  readonly platform: {
    readonly web: { readonly stiffness: number; readonly damping: number; readonly mass: number };
    readonly swiftUI: { readonly response: number; readonly dampingFraction: number };
    readonly compose: { readonly dampingRatio: number; readonly stiffness: number };
  };
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
  /** Fitted upstream so the spring's settling time equals the authored duration.
   *  Absent on a travelling loop, which is linear by definition. */
  readonly spring?: CrystalSpring;
  /** A continuous indicator of pending work (2.2.0): repeats until stopped. Only
   *  `activity-turn`, `activity-travel` and `skeleton-sweep` carry it. */
  readonly loop?: boolean;
  readonly direction?: 'normal';
  readonly easing?: 'linear';
  /** A recipe that shows data and must never pass its value (2.2.0). */
  readonly overshoot?: 'never';
  /** Marks arriving in sequence (2.2.0): `step` ms apart, up to `maxMarks`;
   *  past that every mark arrives together. */
  readonly stagger?: { readonly step: number; readonly maxMarks: number };
}

interface CrystalAnimation {
  readonly finished: Promise<unknown>;
  cancel(): void;
}

declare module '@crystal-ui/core/engines' {
  /** Play keyframes on an element. Cancelling always settles `finished` and
   *  restores any paint the animation owned. */
  export function frames(
    element: Element,
    keyframes: readonly CrystalKeyframe[],
    options: { duration: number; engine?: string; easing?: string; pseudoElement?: string },
  ): CrystalAnimation;
  export const versions: Readonly<{ motion: string; gsap: string }>;
}

declare module '@crystal-ui/core/motion-recipes' {
  const catalogue: { readonly recipes: readonly CrystalRecipe[] };
  export default catalogue;
}

declare module '@crystal-ui/core/flat' {
  const flat: {
    readonly default: Record<string, unknown>;
    readonly palettes: Record<string, unknown>;
  };
  export default flat;
}

'use client';

/* Typography context.
 *
 * Crystal specifies a reading rhythm — Manrope at 16/24 — rather than a full type
 * scale, so that is what this exposes: the family, the reading size and the
 * leading, all from tokens, plus the steps derived from them.
 *
 * The steps are *derived*, not invented, and the derivation is Crystal's: each is
 * a ratio of the reading size, held in `semantic.typography.scale`, so changing
 * `typography.readingSize` upstream moves the whole scale rather than leaving six
 * hard-coded sizes behind. The ratios lived here first, which was a type scale
 * one platform library could see and the others could not — the same argument
 * CONTRACT §1 makes about values generally.
 *
 * The same values reach CSS as `--cr-text-<step>-size`, `-leading` and
 * `-tracking`, published by the resolver, so a stylesheet does not have to go
 * through this hook to use the scale.
 */
import { useMemo } from 'react';
import crystalFlat from '@crystal/core/flat' with { type: 'json' };
import { useCrystalTheme } from './CrystalProvider.js';
import { crystalTokens } from './tokens.generated.js';

/** Named steps, largest to smallest. `body` is Crystal's reading size exactly. */
export type TypographyStep = 'display' | 'title' | 'heading' | 'subheading' | 'body' | 'caption';

/* The scale is Crystal's, read from the tokens. It used to be three tables here:
   six ratios, six leadings and six trackings, which is a type scale living in one
   platform library where the other platforms cannot see it. CONTRACT §1 is about
   exactly that, and the derivation moved upstream. */
const SCALE = (crystalFlat as unknown as {
  typography: { scale: Record<TypographyStep, { ratio: number; leading: number; tracking: string }> };
}).typography.scale;

export interface TypographyStepValues {
  fontSize: string;
  lineHeight: string;
  letterSpacing: string;
}

export interface CrystalTypography {
  /** The resolved font family stack. */
  family: string;
  /** Crystal's reading size in px. */
  readingSize: number;
  /** Crystal's reading leading in px — the 16/24 rhythm. */
  readingLeading: number;
  /** Every step, resolved. */
  steps: Record<TypographyStep, TypographyStepValues>;
  /** One step, resolved. */
  step: (name: TypographyStep) => TypographyStepValues;
}

const px = (value: string): number => Number.parseFloat(value) || 0;

/**
 * The resolved typography for this scope.
 *
 * Density is honoured: `compact` tightens leading, never the size. Shrinking text
 * at higher density would trade legibility for space, which Crystal does not do —
 * density tightens spacing, and never touches a 44px target or a reading size.
 */
export function useTypography(): CrystalTypography {
  const { density } = useCrystalTheme();

  return useMemo(() => {
    const family = crystalTokens['typography.family'];
    const readingSize = px(crystalTokens['typography.readingSize']);
    const readingLeading = px(crystalTokens['typography.readingLeading']);
    const leadingScale = density === 'compact' ? 0.92 : 1;

    const steps = {} as Record<TypographyStep, TypographyStepValues>;
    for (const name of Object.keys(SCALE) as TypographyStep[]) {
      const scale = SCALE[name];
      steps[name] = {
        fontSize: `${Math.round(readingSize * scale.ratio * 100) / 100}px`,
        lineHeight: String(Math.round(scale.leading * leadingScale * 1000) / 1000),
        letterSpacing: scale.tracking,
      };
    }

    return {
      family,
      readingSize,
      readingLeading,
      steps,
      step: (name: TypographyStep) => steps[name],
    };
  }, [density]);
}

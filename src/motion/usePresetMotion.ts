'use client';

/* Crystal's material presets as Motion for React props.
 *
 * `usePreset` plays a preset imperatively and resolves when it settles, which
 * suits a caller that awaits an exit before unmounting. Inside `AnimatePresence`,
 * where the library holds elements mounted for their exit, Motion needs
 * `initial`, `animate` and `exit` targets and drives the lifecycle itself.
 *
 * This hook is the declarative half. It computes the same keyframes from the same
 * core module (`@crystal-ui/core/core/presets`, never a copy) and returns them
 * as Motion targets. The environment (travel and depth tokens, the duration and
 * easing tokens) is read once after mount, so the first render is stable under
 * server rendering and hydration. A surface that is open on the first paint
 * appears without movement, following the rule every other component here
 * follows: nothing plays on a mount that is not an arrival.
 */
import { useEffect, useRef, useState } from 'react';
import type { TargetAndTransition } from 'motion/react';
import presets from '@crystal-ui/core/core/presets';
import type { CrystalPresetName, CrystalFlowDirection } from '@crystal-ui/core/core/presets';
import { useCrystalTheme } from '../theme/CrystalProvider.js';

export interface UsePresetMotionOptions {
  /**
   * A dismissal that fades instead of falling. True for anything anchored to the
   * page (a dialog, a Haze card, a Stone backing), and false for something
   * floating above it, which drops away.
   */
  readonly anchored?: boolean;
  /** Which edge a Mirage wash flows from. */
  readonly from?: CrystalFlowDirection;
  /**
   * Whether the surface the props are spread onto is currently open. When given,
   * the arrival plays only for an opening that began after the environment was
   * read. A surface that is already open on the first render appears in place
   * instead of jumping to its first keyframe when the environment arrives a
   * render later. Exits are unaffected. Omit it for a surface that is always
   * mounted after its parent.
   */
  readonly active?: boolean;
}

/** A Motion target: per-property values plus its own transition. */
export type PresetTarget = TargetAndTransition;

export interface PresetMotionProps {
  initial?: PresetTarget;
  animate?: PresetTarget;
  exit?: PresetTarget;
}

interface Environment {
  readonly limit: number;
  readonly depth: number;
  readonly travel: Readonly<Record<string, number>>;
  readonly base: Readonly<Record<string, number>>;
  readonly ease: Readonly<Record<'enter' | 'exit', readonly number[] | undefined>>;
}

/** Read a `--cr-*` number from the resolved theme, falling back to Crystal's own default. */
function readNumber(styles: CSSStyleDeclaration, token: string, fallback: number): number {
  const value = Number.parseFloat(styles.getPropertyValue(`--cr-${token}`));
  return Number.isFinite(value) ? value : fallback;
}

/** Parses `cubic-bezier(a, b, c, d)` into `[a, b, c, d]`. Anything else is left to Motion's default. */
function readEase(styles: CSSStyleDeclaration, role: 'enter' | 'exit'): readonly number[] | undefined {
  const match = /cubic-bezier\(([^)]+)\)/.exec(styles.getPropertyValue(`--cr-ease-${role}`));
  if (!match?.[1]) return undefined;
  const numbers = match[1].split(',').map((n) => Number.parseFloat(n));
  return numbers.length === 4 && numbers.every(Number.isFinite) ? numbers : undefined;
}

function readEnvironment(): Environment {
  const styles = getComputedStyle(document.documentElement);
  const travel: Record<string, number> = {};
  for (const role of ['panel', 'floating', 'exit', 'feather', 'content']) {
    travel[role] = readNumber(styles, `travel-${role}`, 24);
  }
  /* The fallbacks are Crystal's own published durations (material 1000ms,
     liquid 1400ms, flow 1200ms, departure 650ms), so a page that has not loaded
     the generated theme still moves at Crystal's timing and not at a flat
     second. A flat 1000ms fallback, as in `usePreset`, makes a dismissal half
     again as long as the specification in a document without the theme. */
  const base: Record<string, number> = {};
  for (const [token, fallback] of [['material', 1000], ['liquid', 1400], ['flow', 1200], ['departure', 650]] as const) {
    base[token] = readNumber(styles, token, fallback);
  }
  return {
    limit: readNumber(styles, 'motion-max-travel', 50),
    depth: readNumber(styles, 'travel-depth', 50),
    travel,
    base,
    ease: { enter: readEase(styles, 'enter'), exit: readEase(styles, 'exit') },
  };
}

/**
 * Frame offsets become Motion's `times`. Crystal authors an offset only on the
 * frames that need one (a Mirage wash marks its middle at 0.58), so the ends
 * are filled in. A frame list with no offsets at all is left to Motion to space
 * evenly.
 */
function resolveTimes(frames: readonly Record<string, unknown>[]): number[] | undefined {
  if (!frames.some((frame) => typeof frame['offset'] === 'number')) return undefined;
  const times = frames.map((frame, index) => {
    if (index === 0) return 0;
    if (index === frames.length - 1) return 1;
    return typeof frame['offset'] === 'number' ? frame['offset'] : Number.NaN;
  });
  return times.every(Number.isFinite) ? times : undefined;
}

function target(
  name: CrystalPresetName,
  env: Environment,
  options: UsePresetMotionOptions,
  resolveDuration: (base: number) => number,
): { first: PresetTarget; target: PresetTarget } | undefined {
  const clamp = (value: number): number => Math.min(env.limit, Math.max(0, value));
  const built = presets.presetKeyframes(name, {
    travel: clamp(env.travel[presets.travelRole(name)] ?? 24),
    depth: clamp(env.depth),
    ...(options.anchored === undefined ? {} : { anchored: options.anchored }),
    ...(options.from ? { from: options.from } : {}),
    /* The clip-path wash, not the registered-property one. Motion animates a
       `clip-path` string directly, while a custom property would have to be
       registered with it. The geometry and tokens are the same. */
    softFlow: false,
  });
  if (!built.keyframes.length) return undefined;

  const properties = new Set<string>();
  for (const frame of built.keyframes) {
    for (const key of Object.keys(frame)) if (key !== 'offset') properties.add(key);
  }
  const first: Record<string, unknown> = {};
  const values: Record<string, unknown> = {};
  for (const property of properties) {
    const series = built.keyframes.map((frame) => frame[property] ?? null);
    values[property] = series;
    first[property] = series[0];
  }
  const times = resolveTimes(built.keyframes);
  const ease = env.ease[built.easing];
  const duration = resolveDuration(env.base[built.duration] ?? 1000) / 1000;
  /* The preset module types its frames loosely, because it is shared with the
     Swift and Kotlin generators, so a cast is needed here for Motion's types.
     Every property it emits is one Motion animates: opacity, transform, clipPath. */
  return {
    first: first as PresetTarget,
    target: {
      ...values,
      transition: { duration, ...(ease ? { ease } : {}), ...(times ? { times } : {}) },
    } as PresetTarget,
  };
}

/**
 * Motion props for a material's arrival and departure.
 *
 * `enter` supplies `initial` and `animate`; `exit` supplies `exit`. Either may be
 * null. Under reduced motion, or before the environment has been read, the
 * result is empty and the surface appears without movement. A preset never
 * carries the state change itself.
 */
export function usePresetMotion(
  enter: CrystalPresetName | null,
  exit: CrystalPresetName | null,
  options: UsePresetMotionOptions = {},
): PresetMotionProps {
  const { resolveDuration, reduceMotion } = useCrystalTheme();
  const [env, setEnv] = useState<Environment | null>(null);
  useEffect(() => { setEnv(readEnvironment()); }, []);

  /* Whether the current opening began with the environment already read. Decided
     at the render where `active` turns true and held until it turns false, so a
     surface open on the first render never gains `animate` mid-flight. Motion
     would animate it from where it is to the first keyframe, and a scrim at full
     opacity would blink to nothing and wash back in. */
  const previousActive = useRef<boolean | undefined>(undefined);
  const arrivalArmed = useRef(false);
  const { active } = options;
  if (active !== undefined) {
    if (active && previousActive.current !== true) arrivalArmed.current = env !== null;
    if (!active) arrivalArmed.current = false;
    previousActive.current = active;
  }
  const mayEnter = active === undefined || arrivalArmed.current;

  if (!env || reduceMotion) return {};

  const props: PresetMotionProps = {};
  if (enter && mayEnter) {
    const built = target(enter, env, options, resolveDuration);
    if (built) { props.initial = built.first; props.animate = built.target; }
  }
  if (exit) {
    const built = target(exit, env, options, resolveDuration);
    if (built) props.exit = built.target;
  }
  return props;
}

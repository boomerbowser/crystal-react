'use client';

/* The travelling selection pill (R-A8, Crystal's D-37).
 *
 * Crystal 2.6.0 draws a strip's selection as one `.cr-indicator.pill` behind
 * the selected segment, inside the plane that holds the segments, and moves it
 * with `selection-travel` when the choice changes. Core's stylesheet reads the
 * pill's box from five properties (`--cr-pill-x`, `-y`, `-width`, `-height`,
 * `-radius`) and draws it only once it carries `data-placed`; from then on the
 * selected segment gives its fill and shadow to the pill and keeps its ink and
 * its weight. This hook is that contract for React: it renders the pill,
 * measures the selected segment, writes the five properties and plays the
 * recipe. Core's `CrystalMotion.travel()` is the same thing for a page without
 * React, and the two are measured against each other.
 *
 * What moves it, and what does not:
 *
 *   - The first placement never travels. A strip that mounts with a segment
 *     chosen did not change its choice.
 *   - A change a person made travels: a press, a click or a key inside the
 *     strip, followed by the selection changing. A change with no person
 *     behind it (a route the product changed, a form reset, a value set from
 *     outside) places the pill where it belongs without moving it. This is
 *     narrower than `useChangeMotion`, which plays for any change of value,
 *     and it is R-A8's acceptance: a pill crossing a strip is the largest
 *     movement a strip makes, and it should answer a hand, not a server.
 *   - A resize, a font arriving or a label changing length re-places the pill
 *     without moving it.
 *   - Reduced motion places it at once.
 *
 * The selection is read from the DOM, not from React state, because React Aria
 * owns it in tabs and radio groups. A mutation observer on the plane notices
 * the selection attribute moving, which is also how a change from outside
 * React is caught.
 *
 * The recipe is played through Motion with its fitted spring, as `useMotion`
 * plays every other recipe. Unlike the others it animates `width`, `height`
 * and `border-radius` as well as `transform`: a scale would squash the pill's
 * round ends, and Crystal's motion conserves volume (sx × sy = 1), which a
 * one-axis scale does not. The pill is absolutely positioned, so its size
 * changing reflows nothing around it.
 *
 * The two labels' ink crosses on the pill's clock, as core's does: holding the
 * arriving label's ink until the pill lands left it light on the light primary
 * of a dark palette, where it all but disappeared (measured in Chromium on 8
 * November 2026). Weight is not animated; it changes with the semantics.
 */
import {
  useCallback, useEffect, useLayoutEffect, useRef, useState, type RefCallback,
} from 'react';
import { useAnimate } from 'motion/react';
import { getRecipe, transitionFor } from './useMotion.js';
import { useCrystalTheme } from '../theme/CrystalProvider.js';

/* Server rendering has no layout to measure, and React warns about a layout
   effect there. The pill is placed on the client, before the first paint. */
const useIsomorphicLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

/* How long after a press or a key a selection change still counts as the
   person's. React Aria changes the selection in the same task as the event, and
   a client-side route usually commits within a frame or two; a second leaves
   room for a slow one without letting an unrelated later change travel. */
const INTENT_MS = 1000;

/* The attributes a selection moves with: a tab, a toggle, a link to the current
   page, and React Aria's radio label. */
const SELECTION_ATTRIBUTES = ['aria-selected', 'aria-pressed', 'aria-checked', 'aria-current', 'data-selected'];

const PILL_PROPERTIES = ['transform', 'width', 'height', 'border-radius'] as const;

export interface TravelMotion {
  /** Attach to the plane that holds the segments: `.cr-dock`, `.cr-dock-inner`
   *  or `.cr-group`. The hook puts the pill in it and measures inside it. */
  readonly planeRef: RefCallback<HTMLElement>;
}

/**
 * The selection pill for one strip.
 *
 * `recipe` names the recipe where it is bound, so the manifest reads it at the
 * call site; it is always `selection-travel`. `selected` finds the segment that
 * carries the selection inside the plane.
 */
export function useTravelMotion(recipe: 'selection-travel', selected: string): TravelMotion {
  const [plane, setPlane] = useState<HTMLElement | null>(null);
  /* `useAnimate`'s scope is not used for a selector, only for its animate,
     which stops what it started when the strip unmounts. */
  const [, animate] = useAnimate();
  const element = useRef<HTMLElement | null>(null);
  /* Read through a ref, so a re-render of the strip (a new theme object, a new
     `resolveDuration`) does not make a new `place` and re-place the pill
     partway through a travel. */
  const theme = useCrystalTheme();
  const motion = useRef(theme);
  motion.current = theme;
  const intent = useRef(Number.NEGATIVE_INFINITY);
  const chosen = useRef<HTMLElement | null>(null);
  const running = useRef<Array<{ stop: () => void }>>([]);
  const inked = useRef<HTMLElement[]>([]);
  /* A resize during a travel, which the travel cannot follow: it measured its
     destination when it began. The pill is re-placed when it lands. */
  const stale = useRef(false);

  const planeRef = useCallback<RefCallback<HTMLElement>>((node) => { setPlane(node); }, []);

  /* Motion leaves its final values inline. They are cleared, so the pill
     follows the five properties and a label follows the stylesheet (a theme
     change after a travel would otherwise keep the old ink). */
  const settle = useCallback(() => {
    for (const control of running.current) control.stop();
    running.current = [];
    const pill = element.current;
    if (pill) for (const property of PILL_PROPERTIES) pill.style.removeProperty(property);
    for (const label of inked.current) label.style.removeProperty('color');
    inked.current = [];
    pill?.removeAttribute('data-travelling');
  }, []);

  const place = useCallback((travel: boolean) => {
    const pill = element.current;
    if (!plane || !pill) return;
    const target = plane.querySelector<HTMLElement>(selected);
    if (!target) {
      /* Nothing is selected, so nothing is drawn, and the next selection is a
         first placement. */
      settle();
      pill.removeAttribute('data-placed');
      chosen.current = null;
      return;
    }

    const box = plane.getBoundingClientRect();
    const at = (rect: DOMRect) => ({
      x: rect.left - box.left - plane.clientLeft,
      y: rect.top - box.top - plane.clientTop,
      width: rect.width,
      height: rect.height,
    });
    const next = at(target.getBoundingClientRect());
    /* Where the pill is seen, which mid-flight is not where it was placed, so a
       second choice turns it rather than snapping it back first. */
    const seen = pill.hasAttribute('data-placed') ? at(pill.getBoundingClientRect()) : null;
    const before = seen ? getComputedStyle(pill).borderRadius : '';
    const departing = chosen.current;
    chosen.current = target;
    settle();

    const corners = getComputedStyle(target).borderRadius;
    for (const [key, value] of Object.entries(next)) pill.style.setProperty(`--cr-pill-${key}`, `${value}px`);
    pill.style.setProperty('--cr-pill-radius', corners);
    pill.setAttribute('data-placed', '');

    const authored = getRecipe(recipe);
    const dx = seen ? seen.x - next.x : 0;
    const dy = seen ? seen.y - next.y : 0;
    const moved = seen !== null && (Math.abs(dx) >= 0.5 || Math.abs(dy) >= 0.5
      || Math.abs(seen.width - next.width) >= 0.5 || Math.abs(seen.height - next.height) >= 0.5);
    const { reduceMotion, resolveDuration } = motion.current;
    if (!travel || !seen || !moved || !authored || reduceMotion || resolveDuration(authored.duration) === 0) {
      /* A re-placement that moved nothing (the label that grew when it was
         chosen, measured again after the travel) leaves the record of the
         travel as it was. */
      if (seen && !moved && !travel) return;
      pill.dataset['crMotionName'] = recipe;
      pill.dataset['crMotionState'] = 'instant';
      return;
    }

    const transition = transitionFor(authored, resolveDuration(authored.duration), 0, 2, undefined);
    pill.dataset['crMotionName'] = recipe;
    pill.dataset['crMotionState'] = 'running';
    pill.dataset['crMotionTravel'] = String(Math.round(Math.hypot(dx, dy)));
    pill.setAttribute('data-travelling', '');
    const controls = [animate(pill, {
      transform: [`translate(${dx}px, ${dy}px)`, 'translate(0px, 0px)'],
      width: [`${seen.width}px`, `${next.width}px`],
      height: [`${seen.height}px`, `${next.height}px`],
      borderRadius: [before, corners],
    }, transition)];
    if (departing && departing !== target && departing.isConnected) {
      const selectedInk = getComputedStyle(target).color;
      const stripInk = getComputedStyle(departing).color;
      if (selectedInk !== stripInk) {
        controls.push(animate(target, { color: [stripInk, selectedInk] }, transition));
        controls.push(animate(departing, { color: [selectedInk, stripInk] }, transition));
        inked.current = [target, departing];
      }
    }
    running.current = controls;
    stale.current = false;
    void Promise.all(controls).then(() => {
      if (running.current !== controls) return;
      running.current = [];
      settle();
      pill.dataset['crMotionState'] = 'finished';
      if (stale.current) { stale.current = false; place(false); }
    }, () => { /* stopped by the next travel, which owns the pill now */ });
  }, [plane, selected, recipe, animate, settle]);

  /* The pill is the hook's own element, not React's. React Aria renders a tab
     list's children from its collection, so nothing can be written among the
     tabs, and a portal into the list left an orphaned pill behind when the
     collection re-rendered (two pills, measured in Storybook). Made here, it is
     the plane's first child (an `li` in a list, so the list stays valid), and
     the first placement happens before the first paint, so the per-segment fill
     never shows and then hands over. */
  useIsomorphicLayoutEffect(() => {
    if (!plane) return undefined;
    const pill = document.createElement(plane.tagName === 'UL' || plane.tagName === 'OL' ? 'li' : 'span');
    pill.className = 'cr-indicator pill';
    pill.setAttribute('aria-hidden', 'true');
    plane.prepend(pill);
    element.current = pill;
    place(false);
    return () => {
      settle();
      pill.remove();
      if (element.current === pill) element.current = null;
      chosen.current = null;
    };
  }, [plane, place, settle]);

  /* A person's press or key inside the strip. Captured, so a segment that stops
     propagation still counts. */
  useEffect(() => {
    if (!plane) return undefined;
    const mark = () => { intent.current = performance.now(); };
    plane.addEventListener('pointerdown', mark, true);
    plane.addEventListener('keydown', mark, true);
    return () => {
      plane.removeEventListener('pointerdown', mark, true);
      plane.removeEventListener('keydown', mark, true);
    };
  }, [plane]);

  /* The selection moving. A mutation observer's callback runs before the next
     paint, so the pill never sits behind the old segment for a frame. */
  useEffect(() => {
    if (!plane || typeof MutationObserver === 'undefined') return undefined;
    const observer = new MutationObserver(() => {
      const target = plane.querySelector<HTMLElement>(selected);
      if (target === chosen.current) return;
      const person = performance.now() - intent.current < INTENT_MS;
      intent.current = Number.NEGATIVE_INFINITY;
      place(person);
    });
    observer.observe(plane, { subtree: true, attributes: true, attributeFilter: SELECTION_ATTRIBUTES });
    return () => observer.disconnect();
  }, [plane, selected, place]);

  /* A resize, a font arriving or a label changing length. Never during a
     travel, which measured its destination when it began and ends there. */
  useEffect(() => {
    if (!plane || typeof ResizeObserver === 'undefined') return undefined;
    const observer = new ResizeObserver(() => {
      if (running.current.length === 0) place(false);
      else stale.current = true;
    });
    /* The plane, and every segment in it: a strip as wide as its container
       does not change size when one of its labels does. */
    observer.observe(plane);
    for (const child of plane.querySelectorAll<HTMLElement>(':scope > *, :scope > * > *')) observer.observe(child);
    return () => observer.disconnect();
  }, [plane, selected, place]);

  return { planeRef };
}

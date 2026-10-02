/* The props React Aria gives Crystal React, which docgen cannot see.
 *
 * ## Why this file exists
 *
 * Storybook generates a Controls panel from docgen output. Nearly every
 * callback and state flag this library exposes is inherited (`ButtonProps` is
 * `Omit<AriaButtonProps, …>` plus three props of its own), and the extractor
 * this Storybook runs reads a component's own interface without resolving what
 * it extends. `react-docgen` with `makeFsImporter()`, which is how
 * `@storybook/react-vite` invokes it, returns five props for `Button`:
 * `children, variant, shape, className, style`. No `onPress`, no `isDisabled`.
 *
 * Both configuration routes out of that are closed, tried on 21 September
 * 2026:
 *
 * - `reactDocgen: 'react-docgen-typescript'`. The package executes
 *   `ts.JsxEmit.React` at module scope, and TypeScript 7's main entry exports
 *   only `version` and `versionMajorMinor`, because the compiler API moved
 *   behind `typescript/unstable/*`. It throws
 *   `Cannot read properties of undefined` on `require`, before any
 *   configuration of it is read. This is the package itself, not the Vite
 *   plugin that wraps it.
 * - Pinning TypeScript 5.x for those two packages only. `typescript` is a peer
 *   of both, auto-installed from the root, and pnpm's `overrides` and
 *   `packageExtensions` both govern dependency resolution rather than peer
 *   resolution: the store holds one TypeScript, 7.0.2, and both packages
 *   resolve to it.
 *
 * Writing an extractor on the compiler API is closed for the same reason as
 * the first: there is no stable compiler API in TypeScript 7 to write it
 * against.
 *
 * ## What this is instead, and why it cannot go stale
 *
 * One table of the inherited props, described once. A story names the ones its
 * component has; the description, the control shape and the panel grouping come
 * from here.
 *
 * A table like this can become a second, stale copy of the specification,
 * which is the objection R-17 raises against hand-writing `argTypes`. The
 * guard is that naming a prop the component does not have is a compile error.
 * `ariaArgTypes` is generic over the component's own props type and constrains
 * its arguments to `Extract<keyof P, AriaProp>`, so
 * `ariaArgTypes<ButtonProps>('onSelectionChange')` does not typecheck. The
 * compiler provides the link docgen would have provided, and `pnpm typecheck`
 * enforces it.
 *
 * That is narrower than real docgen: it cannot discover that `Button` has
 * `onPress`, only refuse the claim that it has `onSelectionChange`. Discovery
 * comes back the day either route above opens.
 */
import { fn } from 'storybook/test';
import type { InputType } from 'storybook/internal/types';

/* Grouped the way a reviewer reads them rather than the way React Aria declares
   them: what it tells you, what state it is in, what it selects, what it says. */
const EVENTS = 'Events';
const STATE = 'State';
const SELECTION = 'Selection';
const CONTENT = 'Content';

/** Every React Aria prop Crystal React re-exposes, described once. */
export const ARIA_PROPS = {
  /* Events. Each becomes a spy in `ariaActions`, so the Actions panel shows
     what fired and with what. For a library whose subject is behaviour, an
     empty Actions panel is most of R-17. */
  onPress: {
    description: 'Fired on click, Enter, Space and touch. React Aria unifies the three, which is why this is not `onClick`.',
    table: { category: EVENTS },
  },
  onAction: {
    description: 'A collection item was chosen. Carries the item’s `key`, not an event.',
    table: { category: EVENTS },
  },
  onSelectionChange: {
    description: 'The selection moved. Carries a `Selection`, which is a `Set` of keys or the string `all`.',
    table: { category: EVENTS },
  },
  onOpenChange: {
    description: 'An overlay opened or closed, from any cause including Escape and a click outside.',
    table: { category: EVENTS },
  },
  onExpandedChange: {
    description: 'Disclosure state moved. Distinct from selection: a row can be expanded without being selected.',
    table: { category: EVENTS },
  },
  onChange: {
    description: 'The value changed. Carries the value, never the DOM event.',
    table: { category: EVENTS },
  },
  onSubmit: { description: 'The form was submitted and passed validation.', table: { category: EVENTS } },
  onFocusChange: { description: 'Focus entered or left. Boolean, not a focus event.', table: { category: EVENTS } },
  onHoverChange: {
    description: 'Pointer hover began or ended. React Aria suppresses this for touch, so it does not fire on a tap.',
    table: { category: EVENTS },
  },

  /* State. Booleans a reviewer should be able to flip and watch. */
  isDisabled: {
    description: 'Disabled. Still reachable by a screen reader, unlike `hidden`, because a control that vanishes cannot explain why it is unavailable.',
    control: 'boolean', table: { category: STATE },
  },
  isReadOnly: {
    description: 'Value cannot be edited, but the control is still focusable and copyable. Not the same as disabled.',
    control: 'boolean', table: { category: STATE },
  },
  isRequired: { description: 'Required. Announced, and never carried by the asterisk alone.', control: 'boolean', table: { category: STATE } },
  isInvalid: {
    description: 'Failed validation. Crystal pairs this with a message: colour never carries the meaning alone.',
    control: 'boolean', table: { category: STATE },
  },
  isIndeterminate: { description: 'Neither checked nor unchecked: a parent whose children disagree.', control: 'boolean', table: { category: STATE } },
  isOpen: { description: 'Overlay visibility, controlled. Pair with `onOpenChange`.', control: 'boolean', table: { category: STATE } },
  autoFocus: {
    description: 'Takes focus on mount. Worth being sparing with: focus that moves without being asked is focus a reader has to find again.',
    control: 'boolean', table: { category: STATE },
  },

  /* Selection. */
  selectionMode: {
    description: 'How many things may be selected at once.',
    control: 'inline-radio', options: ['none', 'single', 'multiple'], table: { category: SELECTION },
  },
  disallowEmptySelection: { description: 'The last selected item cannot be deselected.', control: 'boolean', table: { category: SELECTION } },
  /* Collections are structure rather than settings: a JSON editor over one is
     a control a reviewer can only break. Same judgement as `items`. */
  selectedKeys: { description: 'Controlled selection.', control: false, table: { category: SELECTION } },
  defaultSelectedKeys: { description: 'Uncontrolled initial selection.', control: false, table: { category: SELECTION } },
  disabledKeys: { description: 'Items that cannot be chosen. They stay announced.', control: false, table: { category: SELECTION } },

  /* Content. */
  label: { description: 'The accessible name. Visible wherever there is room for it.', control: 'text', table: { category: CONTENT } },
  description: { description: 'Help text, associated by `aria-describedby` rather than placed near it.', control: 'text', table: { category: CONTENT } },
  errorMessage: { description: 'Shown and announced when `isInvalid`.', control: 'text', table: { category: CONTENT } },
  placeholder: {
    description: 'A hint inside an empty field. Never a substitute for `label`, because it disappears exactly when a reader needs it.',
    control: 'text', table: { category: CONTENT },
  },
} as const satisfies Record<string, InputType>;

/** A prop name this file describes. */
export type AriaProp = keyof typeof ARIA_PROPS;

/**
 * The callbacks, named once and explicitly.
 *
 * This is a flat list rather than a derivation from the table by category
 * because `scripts/verify-stories.mjs` has to know the same set and reads this
 * file as text. A regex over a nested object literal is an unreliable way to
 * learn it: a lazy match over one single-line entry swallows the entries after
 * it. A flat list is greppable, and the assertion below keeps it in agreement
 * with the table rather than a second copy.
 */
export const ARIA_EVENTS = [
  'onPress', 'onAction', 'onSelectionChange', 'onOpenChange', 'onExpandedChange',
  'onChange', 'onSubmit', 'onFocusChange', 'onHoverChange',
] as const satisfies readonly (keyof typeof ARIA_PROPS)[];

const EVENT_PROPS = new Set<string>(ARIA_EVENTS);

/* The list and the table must agree in both directions, checked when this
   module loads, so Storybook, every story test and the gate all pay for it.
   A name in the list that is not in the `Events` category, or a prop in that
   category that is not in the list, means a callback stops getting a spy with
   no other warning. The `satisfies` above catches only a name that is not a
   prop at all. */
for (const [name, spec] of Object.entries(ARIA_PROPS)) {
  const categorised = (spec as InputType).table?.category === EVENTS;
  if (categorised !== EVENT_PROPS.has(name)) {
    throw new Error(
      `react-aria.ts: ${name} is ${categorised ? 'in' : 'not in'} the Events category but `
      + `${EVENT_PROPS.has(name) ? 'is' : 'is not'} in ARIA_EVENTS. The two must agree.`,
    );
  }
}

/**
 * Which inherited props this component has, and for each whether it gets a
 * panel entry. Every one must be mentioned, `false` to leave it out.
 *
 * ```ts
 * argTypes: {
 *   ...ariaArgTypes<ButtonProps>({ onPress: true, isDisabled: true, autoFocus: false,
 *                                  onFocusChange: false, onHoverChange: false }),
 *   variant: { … },
 * }
 * ```
 *
 * `Record<Extract<keyof P, AriaProp>, boolean>` does both halves of the job
 * docgen would have done:
 *
 * - It refuses a prop the component does not have. `onSelectionChange` on a
 *   `Button` does not compile.
 * - It refuses to let you omit one it does have. Leave out `onHoverChange` and
 *   the compiler reports the property as missing, so a control cannot go
 *   absent unnoticed, which is the complaint in R-17: panels that were empty
 *   and nothing noticed.
 *
 * The compiler resolves `extends` where docgen does not, so `keyof P` is the
 * inherited surface. The error enumerates it, so filling one of these in is a
 * matter of reading what tsc printed rather than reading React Aria's types.
 *
 * `false` is the escape hatch: an `autoFocus` toggle on every story would be
 * noise. Writing it records that the omission was a decision somebody typed.
 */
export function ariaArgTypes<P>(
  which: Record<Extract<keyof P, AriaProp>, boolean>,
): Partial<Record<AriaProp, InputType>> {
  const out: Partial<Record<AriaProp, InputType>> = {};
  for (const [name, wanted] of Object.entries(which)) {
    if (!wanted) continue;
    const key = name as AriaProp;
    /* `action` rather than a control for a callback, so it lands in the Actions
       panel. Declared here once rather than in each story. */
    out[key] = EVENT_PROPS.has(name) ? { ...ARIA_PROPS[key], action: name } : { ...ARIA_PROPS[key] };
  }
  return out;
}

/**
 * `fn()` spies for the callbacks among them, for `args`.
 *
 * A spy rather than a no-op: the Actions panel shows the call, and a `play`
 * function can assert against it. Constrained the same way, so the spy and the
 * component cannot disagree about what the callback is called. Non-events are
 * rejected: a spy on `isDisabled` would be a boolean that is a function.
 */
export function ariaActions<P>(
  ...names: Extract<keyof P, AriaProp>[]
): Partial<Record<AriaProp, ReturnType<typeof fn>>> {
  const out: Partial<Record<AriaProp, ReturnType<typeof fn>>> = {};
  for (const name of names) {
    if (!EVENT_PROPS.has(name as string)) {
      throw new Error(`ariaActions: ${String(name)} is not a callback, so a spy on it would be wrong.`);
    }
    out[name as AriaProp] = fn();
  }
  return out;
}

'use client';

/* SortSelect — an ordering, announced when it changes.
 *
 * "A select **whose current ordering is announced on change**."
 *
 * That sentence exists because of what a sort control does to the page around
 * it. Pressing it silently rewrites a list of products that the reader is not
 * looking at — a sighted reader sees the list flip and knows it worked; a reader
 * using a screen reader hears the select close and then nothing, and has to
 * navigate back into the list to find out whether anything happened. The select
 * itself announces its own value, but a select's value and "the list beneath you
 * has been reordered" are not the same statement.
 *
 * So the ordering is said, in a polite live region, on a change and never on
 * mount — a list that arrives sorted has not been reordered.
 *
 * **Said after the reorder, not before it.** This component does not own the
 * list, so the only moment it can honestly claim the list has moved is when the
 * handler that moves it has finished. Most orderings are a round trip to a
 * server, and announcing on the press would be announcing a state of the world
 * that has not arrived yet — a reader told "sorted by newest" who then arrives
 * at the old list has been told something false by the one thing in the page
 * whose job was to tell them the truth. So `onSelectionChange` may return a
 * promise, and the announcement waits for it.
 *
 * If it rejects, nothing is said: a sort that failed is the product's to report,
 * and this component saying it succeeded would be worse than silence.
 *
 * Everything else is `Select`. This is deliberately thin: the field materials,
 * the trigger geometry, the listbox, the keyboard behaviour and the validation
 * recipes all already exist, and a second select that drew its own would be a
 * second select to keep in step.
 */
import { useCallback, useRef, useState, type ReactNode } from 'react';
import type { Key } from 'react-aria-components';
import { Select, type SelectOption, type SelectProps } from '../Select/Select.js';
import { VisuallyHidden } from '../VisuallyHidden/VisuallyHidden.js';

export interface SortSelectProps extends Omit<SelectProps, 'label' | 'onSelectionChange'> {
  /** What is being ordered. Defaults to "Sort by". */
  label?: ReactNode;
  /**
   * Reorder the list. May return a promise; the announcement waits for it, so
   * a server-side ordering is announced when it has actually happened rather
   * than when it was asked for.
   */
  onSelectionChange?: (value: Key | null) => void | Promise<void>;
  /**
   * What is said when the ordering changes, given the chosen option's label.
   * Default English.
   */
  announce?: (ordering: string) => string;
}

export function SortSelect({
  label = 'Sort by', options, announce, onSelectionChange, ...props
}: SortSelectProps): React.JSX.Element {
  const [said, setSaid] = useState('');
  /* Held in a ref so the callback below does not have to be rebuilt whenever the
     caller passes a new closure — the same reason `Toast` holds `onDismiss`. */
  const notify = useRef(onSelectionChange);
  notify.current = onSelectionChange;

  const change = useCallback((key: Key | null) => {
    /* The previous announcement is stale the moment another ordering is asked
       for, and a live region still holding it would be read as the answer to
       the press that has just happened. */
    setSaid('');
    const chosen = options.find((one: SelectOption) => one.value === key);
    void Promise.resolve(notify.current?.(key)).then(
      () => {
        /* No option, nothing to say. A cleared selection is not an ordering. */
        if (chosen === undefined) return;
        setSaid((announce ?? ((ordering) => `Sorted by ${ordering}`))(String(chosen.label)));
      },
      /* A sort that failed is the product's to report. */
      () => {},
    );
  }, [announce, options]);

  return (
    <>
      <Select {...props} label={label} options={options} onSelectionChange={change} />
      <VisuallyHidden role="status">{said}</VisuallyHidden>
    </>
  );
}

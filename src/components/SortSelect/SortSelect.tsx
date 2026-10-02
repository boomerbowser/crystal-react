'use client';

/* SortSelect.
 *
 * An ordering, announced when it changes.
 *
 * "A select whose current ordering is announced on change."
 *
 * Pressing a sort control silently rewrites a list of products that the reader
 * is not looking at. A sighted reader sees the list flip and knows it worked. A
 * screen reader user hears the select close and then nothing, and has to
 * navigate back into the list to find out whether anything happened. The select
 * announces its own value, which does not tell the reader that the list beneath
 * them has been reordered.
 *
 * So the ordering is announced in a polite live region on a change, and never on
 * mount, because a list that arrives sorted has not been reordered.
 *
 * The announcement comes after the reorder. This component does not own the
 * list, so it can only claim the list has moved once the handler that moves it
 * has finished. Most orderings are a round trip to a server, and announcing on
 * the press could tell a reader "sorted by newest" before they arrive at the old
 * list. So `onSelectionChange` may return a promise, and the announcement waits
 * for it.
 *
 * If it rejects, nothing is said. A sort that failed is the product's to report,
 * and this component must not say it succeeded.
 *
 * Everything else is `Select`. The field materials, the trigger geometry, the
 * listbox, the keyboard behaviour and the validation recipes already exist
 * there, and a second select that drew its own would have to be kept in step.
 */
import { useCallback, useRef, useState, type ReactNode } from 'react';
import type { Key } from 'react-aria-components';
import { Select, type SelectOption, type SelectProps } from '../Select/Select.js';
import { VisuallyHidden } from '../VisuallyHidden/VisuallyHidden.js';

export interface SortSelectProps extends Omit<SelectProps, 'label' | 'onSelectionChange'> {
  /** What is being ordered. Defaults to "Sort by". */
  label?: ReactNode;
  /**
   * Reorder the list. May return a promise. The announcement waits for it, so
   * a server-side ordering is announced when it has happened, not when it was
   * asked for.
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
     caller passes a new closure. `Toast` holds `onDismiss` for the same reason. */
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

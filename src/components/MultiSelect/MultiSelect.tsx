'use client';

/* MultiSelect.
 *
 * A field whose value is a set of chips, and a filterable listbox that toggles
 * them.
 *
 * **Why this is not built on React Aria's `Select` or `ComboBox`.** Both of them
 * own the selection of the listbox they contain, and both replace it. Nesting a
 * `ListBox selectionMode="multiple"` inside either renders a listbox with no
 * `aria-multiselectable` and every option `aria-selected="false"` — silently, and
 * with no warning. The first version of this component did exactly that, so it
 * announced nothing as selected, and the `[data-selected]` rule that carries
 * Crystal's label weight never matched either: the selection was invisible in
 * both directions at once.
 *
 * So the listbox stands on its own inside a popover, where it keeps its own
 * multiple selection, and the trigger is a plain disclosure beside the chips.
 * The trigger reports `aria-haspopup="dialog"` because that is what it opens — a
 * filter field and a list — and saying "listbox" would be a description of the
 * half of it we wish were true.
 *
 * The accessibility question is which of the two is the control, and the answer
 * decides everything else: **the listbox is**, and the chips are a rendering of
 * its value with their own remove buttons. That is why the chips are not
 * focusable stops of their own. A field with six selected values would otherwise
 * be seven tab stops before the next field, and a keyboard user tabbing through a
 * form would walk the contents of every answer they had already given. The
 * catalogue's requirement — "removal must be reachable by keyboard" — is met by
 * each chip's remove button being reachable *within* the field, not by every chip
 * being a stop.
 *
 * The shell grows in whole line steps, because a field that grows by a fraction
 * of a line as each chip wraps makes the whole form jump.
 */
import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import {
  DialogTrigger, Dialog, Button, Popover, ListBox, ListBoxItem,
  SearchField, Input,
} from 'react-aria-components';
import { cx } from '../../styles/cx.js';
import { Chip } from '../Chip/Chip.js';
import { VisuallyHidden } from '../VisuallyHidden/VisuallyHidden.js';
import { useInvalidMotion } from '../FormField/useInvalidMotion.js';
import type { SelectOption } from '../Select/Select.js';
import styles from './MultiSelect.module.scss';
import { useDistributedErrors } from '../FormField/useDistributedErrors.js';
import { FormValue } from '../FormField/FormValue.js';

const ChevronIcon = (
  <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
    <path d="M6 9l6 6 6-6" />
  </svg>
);

export interface MultiSelectProps {
  label: ReactNode;
  options: readonly SelectOption[];
  value?: readonly string[];
  defaultValue?: readonly string[];
  onChange?: (value: readonly string[]) => void;
  description?: ReactNode;
  errorMessage?: ReactNode;
  placeholder?: string;
  /**
   * The most that may be chosen. At the limit the unchosen options are disabled
   * rather than hidden, so the list does not change shape under the reader, and
   * the field says what has happened. This is the catalogue's `at-limit` state.
   */
  maxSelected?: number;
  /** Whether typing narrows the list. On by default; a short list does not need it. */
  isFilterable?: boolean;
  isDisabled?: boolean;
  isInvalid?: boolean;
  /**
   * The field's name in a form. Without it the field cannot be submitted, and a
   * `Form` distributing a server's errors has no name to match it against — so
   * the field sits there looking untouched while the server objects.
   */
  name?: string;
  className?: string;
}

export function MultiSelect({
  label, options, value, defaultValue = [], onChange, description, errorMessage,
  placeholder = 'Choose any', maxSelected, isFilterable = true,
  isDisabled = false, isInvalid, name, className,
}: MultiSelectProps): React.JSX.Element {
  const [uncontrolled, setUncontrolled] = useState<readonly string[]>(defaultValue);
  const [query, setQuery] = useState('');
  const selected = value ?? uncontrolled;
  const validation = useDistributedErrors(name, errorMessage, isInvalid);
  const invalid = validation.isInvalid;
  const shellScope = useInvalidMotion(invalid);
  const listRef = useRef<HTMLDivElement>(null);
  /* The popover measures and anchors itself against the trigger it was given,
     and the trigger is now the disclosure button — which, with three chips in
     the shell, is whatever narrow strip they left over. Anchoring there would
     open a 32px-wide list under the chevron. The shell is what the field looks
     like, so the shell is what the popover is told to follow. */
  const shellRef = useRef<HTMLDivElement>(null);

  const labelId = useId();
  const valueId = useId();
  const descriptionId = useId();
  const errorId = useId();

  const set = (next: readonly string[]) => {
    if (value === undefined) setUncontrolled(next);
    onChange?.(next);
  };

  const labelFor = (id: string): ReactNode =>
    options.find((option) => option.value === id)?.label ?? id;
  const textFor = (id: string): string => {
    const found = labelFor(id);
    return typeof found === 'string' ? found : id;
  };

  const needle = query.trim().toLowerCase();
  const visible = needle === ''
    ? options
    : options.filter((option) => textFor(option.value).toLowerCase().includes(needle));

  const atLimit = maxSelected !== undefined && selected.length >= maxSelected;

  /* A filter hides options; it must not deselect them. React Aria reports the
     selection of the collection it can see, so the keys currently filtered out
     have to be carried across by hand or narrowing the list would silently empty
     the field. */
  const receive = (keys: Iterable<unknown>): void => {
    const shown = new Set(visible.map((option) => option.value));
    const chosen = new Set([...keys].map(String));
    const next = options
      .map((option) => option.value)
      .filter((id) => (shown.has(id) ? chosen.has(id) : selected.includes(id)));
    if (maxSelected !== undefined && next.length > maxSelected) return;
    set(next);
  };

  /* Down from the filter goes into the list, which is the movement a filter
     field implies. Tab reaches it too; this is the one that does not require
     leaving the keyboard's reading position. */
  const intoList = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'ArrowDown') return;
    event.preventDefault();
    listRef.current?.focus();
  };

  const messageIds = [
    description ? descriptionId : undefined,
    validation.message ? errorId : undefined,
    valueId,
  ].filter(Boolean).join(' ');

  return (
    <div className={cx(styles['field'], className)} {...(isDisabled ? { 'data-disabled': true } : {})}>
      <span id={labelId} className={cx(styles['label'])}>{label}</span>
      <DialogTrigger>
        {/* The shell is a div, not the trigger. The chips inside it are buttons,
            and a button inside a button is not a thing a browser can render. */}
        <div
          ref={(node: HTMLDivElement | null) => {
            (shellScope as unknown as { current: HTMLDivElement | null }).current = node;
            shellRef.current = node;
          }}
          className={cx(styles['shell'])}
          {...(invalid ? { 'data-invalid': true } : {})}
        >
          {selected.map((id) => (
            <Chip
              key={id}
              {...(isDisabled
                ? {}
                : { onRemove: () => set(selected.filter((each) => each !== id)) })}
              removeLabel={`Remove ${textFor(id)}`}
            >
              {labelFor(id)}
            </Chip>
          ))}
          {/* Fills the rest of the shell, so the whole empty area opens the list
              rather than only the chevron. */}
          <Button
            isDisabled={isDisabled}
            aria-labelledby={`${labelId} ${valueId}`}
            {...(messageIds ? { 'aria-describedby': messageIds } : {})}
            className={cx(styles['opener'], 'cr-bare')}
          >
            {selected.length === 0
              ? <span className={cx(styles['placeholder'])}>{placeholder}</span>
              : <span className={cx(styles['spacer'])} />}
            <span className={cx(styles['disclosure'])} aria-hidden="true">{ChevronIcon}</span>
          </Button>
        </div>

        {/* The state of the field, spoken as part of the trigger's name rather
            than left to the chips — which are not tab stops, so a keyboard user
            never lands on them to hear them counted. */}
        <VisuallyHidden as="span" id={valueId}>
          {selected.length === 0
            ? 'nothing chosen'
            : `${selected.length} chosen: ${selected.map(textFor).join(', ')}`}
          {maxSelected !== undefined ? `, at most ${maxSelected}` : ''}
        </VisuallyHidden>

        <Popover triggerRef={shellRef} className={cx(styles['popover'])}>
          <Dialog aria-labelledby={labelId} className={cx(styles['dialog'])}>
            {isFilterable ? (
              <SearchField
                aria-label={`Filter ${typeof label === 'string' ? label : 'options'}`}
                value={query}
                onChange={setQuery}
                className={cx(styles['search'])}
              >
                <Input
                  autoFocus
                  placeholder="Filter"
                  onKeyDown={intoList}
                  className={cx(styles['searchInput'])}
                />
              </SearchField>
            ) : null}
            {atLimit ? (
              <p role="status" className={cx(styles['limit'])}>
                {maxSelected} chosen, the most allowed. Remove one to choose another.
              </p>
            ) : null}
            <ListBox
              ref={listRef}
              aria-labelledby={labelId}
              items={visible}
              selectionMode="multiple"
              selectedKeys={new Set(selected)}
              onSelectionChange={(keys) => receive(keys === 'all' ? visible.map((o) => o.value) : keys)}
              disabledKeys={visible
                .filter((option) => option.isDisabled || (atLimit && !selected.includes(option.value)))
                .map((option) => option.value)}
              renderEmptyState={() => (
                <p className={cx(styles['empty'])}>No options match “{query}”.</p>
              )}
              className={cx(styles['list'], 'cr-scroll-frost')}
            >
              {(option: SelectOption) => (
                <ListBoxItem
                  id={option.value}
                  textValue={textFor(option.value)}
                  className={cx(styles['option'])}
                >
                  {option.label}
                </ListBoxItem>
              )}
            </ListBox>
          </Dialog>
        </Popover>
      </DialogTrigger>
      {description ? (
        <span id={descriptionId} className={cx(styles['description'])}>{description}</span>
      ) : null}
      <FormValue name={name} value={selected} />
      {validation.message ? (
        <span id={errorId} role="alert" className={cx(styles['error'])}>{validation.message}</span>
      ) : null}
    </div>
  );
}

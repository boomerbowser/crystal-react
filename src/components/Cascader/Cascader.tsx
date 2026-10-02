'use client';

/* Cascader.
 *
 * Progressive columns narrow a hierarchical choice, such as country, then
 * region, then city. Each column is a real listbox, so the arrow keys work within a level and
 * the whole control is reachable without a pointer.
 *
 * The composed value is announced as a path. The catalogue requires it, and it
 * is why this is not three separate selects. The answer is
 * "United Kingdom / Scotland / Edinburgh", and a reader who hears only
 * "Edinburgh" has lost the part that disambiguates it. The trigger shows the
 * path and announces the path.
 *
 * A branch is marked as one. Without a marker, an option that opens another
 * column looks the same as an option that is the answer, and a reader cannot
 * tell whether choosing it finishes or continues. So a branch carries a chevron,
 * hidden from assistive technology, and visually hidden text saying it opens a
 * further list.
 */
import { useId, useState, type ReactNode } from 'react';
import {
  DialogTrigger, Button,  Dialog, ListBox, ListBoxItem, type Selection,
} from 'react-aria-components';
import { cx } from '../../styles/cx.js';
import { ArrivingPopover } from '../../overlays/ArrivingPopover.js';
import { useFieldMotion } from '../FormField/useInvalidMotion.js';
import { VisuallyHidden } from '../VisuallyHidden/VisuallyHidden.js';
import styles from './Cascader.module.scss';

const ChevronIcon = (
  <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
    <path d="M9 6l6 6-6 6" />
  </svg>
);

const DownIcon = (
  <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
    <path d="M6 9l6 6 6-6" />
  </svg>
);

export interface CascaderNode {
  value: string;
  label: string;
  /** A branch. Absent or empty means this is an answer. */
  children?: readonly CascaderNode[];
  isDisabled?: boolean;
}

export interface CascaderProps {
  label: ReactNode;
  /** The hierarchy. Lazy loading is the product's job. Pass a deeper tree when it arrives. */
  options: readonly CascaderNode[];
  /** The chosen path, outermost first. */
  value?: readonly string[];
  defaultValue?: readonly string[];
  onChange?: (path: readonly string[]) => void;
  description?: ReactNode;
  errorMessage?: ReactNode;
  placeholder?: string;
  /** What separates the levels when the path is shown and announced. */
  separator?: string;
  /**
   * What each column is a list of, such as `['Country', 'Region', 'City']`. Only
   * the product knows this. Without it, a column is named after the option it
   * hangs from, which is less precise.
   */
  columnLabels?: readonly string[];
  isDisabled?: boolean;
  className?: string;
}

function childrenAt(options: readonly CascaderNode[], path: readonly string[]): readonly CascaderNode[][] {
  const columns: CascaderNode[][] = [[...options]];
  let level: readonly CascaderNode[] = options;

  for (const step of path) {
    const node = level.find((each) => each.value === step);
    if (!node?.children?.length) break;
    columns.push([...node.children]);
    level = node.children;
  }
  return columns;
}

function labelsFor(options: readonly CascaderNode[], path: readonly string[]): string[] {
  const labels: string[] = [];
  let level: readonly CascaderNode[] = options;

  for (const step of path) {
    const node = level.find((each) => each.value === step);
    if (!node) break;
    labels.push(node.label);
    level = node.children ?? [];
  }
  return labels;
}

export function Cascader({
  label, options, value, defaultValue = [], onChange, description, errorMessage,
  placeholder = 'Choose', separator = ' / ', columnLabels, isDisabled = false, className,
}: CascaderProps): React.JSX.Element {
  const [uncontrolled, setUncontrolled] = useState<readonly string[]>(defaultValue);
  const path = value ?? uncontrolled;
  const labelId = useId();
  /* The trigger is the field's shell, so it plays the field recipes (R-A3):
     field-focus when it takes focus, field-invalid and field-valid when the
     error appears and goes. The cascader is invalid exactly when it is given
     an error message; it is not a React Aria field, so there is no resolved
     validity to read instead. */
  const isInvalid = Boolean(errorMessage);
  const [shellScope, playShell] = useFieldMotion(isInvalid);

  const set = (next: readonly string[]) => {
    if (value === undefined) setUncontrolled(next);
    onChange?.(next);
  };

  const columns = childrenAt(options, path);
  const chosen = labelsFor(options, path);
  /* Show the whole path. "Edinburgh" alone loses what disambiguates it. */
  const shown = chosen.join(separator);

  /* A column's name gives its subject. Without a name from the caller, a column
     is named after the option it hangs from, so moving into the children of
     "Scotland" announces "Scotland". A depth name such as "Level 2" is the last
     fallback. */
  const columnName = (depth: number): string => columnLabels?.[depth]
    ?? (depth === 0
      ? (typeof label === 'string' ? label : 'Options')
      : chosen[depth - 1] ?? `Level ${depth + 1}`);

  return (
    <div className={cx(styles['field'], className)}>
      <span id={labelId} className={cx(styles['label'])}>{label}</span>
      <DialogTrigger>
        <Button
          ref={shellScope as never}
          aria-labelledby={labelId}
          isDisabled={isDisabled}
          onFocus={() => { void playShell('field-focus'); }}
          {...(isInvalid ? { 'data-invalid': true } : {})}
          className={cx(styles['shell'], 'cr-field-shell', styles['trigger'])}
        >
          <span className={cx(styles['value'], shown ? undefined : styles['placeholder'])}>
            {shown || placeholder}
          </span>
          <span className={cx(styles['disclosure'])} aria-hidden="true">{DownIcon}</span>
        </Button>
        <ArrivingPopover recipe="menu-in" exit="menu-out" className={cx(styles['popover'], 'cr-frost')}>
          <Dialog aria-labelledby={labelId}>
            {columns.map((column, depth) => (
              <ListBox
                key={depth}
                aria-label={columnName(depth)}
                items={column}
                selectionMode="single"
                selectedKeys={path[depth] ? new Set([path[depth]!]) : new Set<string>()}
                onSelectionChange={(keys: Selection) => {
                  const [chosen] = keys === 'all' ? [] : [...keys];
                  if (chosen === undefined) return;
                  set([...path.slice(0, depth), String(chosen)]);
                }}
                disabledKeys={column.filter((node) => node.isDisabled).map((node) => node.value)}
                className={cx(styles['column'], 'cr-scroll-frost')}
              >
                {(node: CascaderNode) => {
                  const isBranch = Boolean(node.children?.length);
                  return (
                    <ListBoxItem
                      id={node.value}
                      /* `textValue` keeps typeahead on the label alone, so typing
                         "Uni" still finds it. */
                      textValue={node.label}
                      className={cx(styles['option'])}
                    >
                      <span>{node.label}</span>
                      {/* A branch says in its name that it opens something, so
                          a reader can tell whether choosing finishes or
                          continues. It is text because React Aria's collection
                          items do not forward arbitrary ARIA attributes, and
                          the chevron is hidden from assistive technology. */}
                      {isBranch ? (
                        <>
                          <VisuallyHidden as="span">, opens a further list</VisuallyHidden>
                          <span className={cx(styles['branch'])} aria-hidden="true">{ChevronIcon}</span>
                        </>
                      ) : null}
                    </ListBoxItem>
                  );
                }}
              </ListBox>
            ))}
          </Dialog>
        </ArrivingPopover>
      </DialogTrigger>
      {description ? <span className={cx(styles['description'])}>{description}</span> : null}
      {errorMessage ? <span role="alert" className={cx(styles['error'])}>{errorMessage}</span> : null}
    </div>
  );
}

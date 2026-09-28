'use client';

/* Cascader.
 *
 * Progressive columns narrowing a hierarchical choice — country, then region,
 * then city. Each column is a real listbox, which is what makes the arrow keys
 * work within a level and the whole thing reachable without a pointer.
 *
 * **The composed value is announced as a path.** That is the catalogue's
 * requirement and the reason this is not simply three selects: the answer is
 * "United Kingdom / Scotland / Edinburgh", and a reader who hears only
 * "Edinburgh" has lost the part that disambiguates it. The trigger shows the
 * path and announces the path.
 *
 * A branch says it is one. An option that opens another column and an option that
 * is the answer look identical without a marker, and a reader then cannot tell
 * whether choosing it finishes or continues — so a branch carries a chevron and
 * `aria-haspopup`.
 */
import { useId, useState, type ReactNode } from 'react';
import {
  DialogTrigger, Button,  Dialog, ListBox, ListBoxItem, type Selection,
} from 'react-aria-components';
import { cx } from '../../styles/cx.js';
import { ArrivingPopover } from '../../overlays/ArrivingPopover.js';
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
  /** The hierarchy. Lazy loading is the product's — pass a deeper tree when it arrives. */
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
   * What each column is a list *of* — `['Country', 'Region', 'City']`. Only the
   * product knows this; without it a column is named after the option it hangs
   * from, which is better than its depth but less precise.
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

  const set = (next: readonly string[]) => {
    if (value === undefined) setUncontrolled(next);
    onChange?.(next);
  };

  const columns = childrenAt(options, path);
  const chosen = labelsFor(options, path);
  /* The path, not the leaf. "Edinburgh" alone has lost what disambiguates it. */
  const shown = chosen.join(separator);

  /* Columns were named "Top level", "Level 2", "Level 3" — a reader arriving in
     the third column learned its position and not its subject. Failing a name
     from the caller, a column is named after the option it hangs from, so moving
     into the children of "Scotland" announces "Scotland" and not "Level 2". */
  const columnName = (depth: number): string => columnLabels?.[depth]
    ?? (depth === 0
      ? (typeof label === 'string' ? label : 'Options')
      : chosen[depth - 1] ?? `Level ${depth + 1}`);

  return (
    <div className={cx(styles['field'], className)}>
      <span id={labelId} className={cx(styles['label'])}>{label}</span>
      <DialogTrigger>
        <Button
          aria-labelledby={labelId}
          isDisabled={isDisabled}
          className={cx(styles['shell'], 'cr-field-shell', styles['trigger'])}
        >
          <span className={cx(styles['value'], shown ? undefined : styles['placeholder'])}>
            {shown || placeholder}
          </span>
          <span className={cx(styles['disclosure'])} aria-hidden="true">{DownIcon}</span>
        </Button>
        <ArrivingPopover recipe="menu-in" className={cx(styles['popover'], 'cr-frost')}>
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
                      {/* A branch says it opens something, in the name rather
                          than as an attribute: without it a reader cannot tell
                          whether choosing finishes or continues. It is text
                          because React Aria's collection items do not forward
                          arbitrary ARIA attributes, and a silent chevron is a
                          picture of a promise. */}
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

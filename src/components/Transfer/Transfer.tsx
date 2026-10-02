'use client';

/* Transfer.
 *
 * Two lists and the controls between them. The catalogue requires that the
 * keyboard can move items without drag.
 *
 * So this is two listboxes and a pair of buttons instead of a drag-and-drop
 * surface. Dragging between two lists is unavailable to a keyboard user,
 * unreliable for anyone whose pointer is not steady, and invisible to a screen
 * reader. Items are selected in a list and moved with a named control, which
 * every input method can reach.
 *
 * Each list is separately named, because "available" and "chosen" carry the
 * component's meaning and a reader who cannot see the layout has only the names
 * to go on. Moves are announced for the same reason. Without an announcement, a
 * screen reader user hears nothing when an item leaves one list and appears in
 * another.
 */
import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { ListBox, ListBoxItem, type Selection } from 'react-aria-components';
import { cx } from '../../styles/cx.js';
import { useMotion } from '../../motion/useMotion.js';
import { Arrival } from '../../motion/Arrival.js';
import { Button } from '../Button/Button.js';
import { VisuallyHidden } from '../VisuallyHidden/VisuallyHidden.js';
import styles from './Transfer.module.scss';

export interface TransferItem {
  value: string;
  label: string;
  isDisabled?: boolean;
}

export interface TransferProps {
  /** Everything that can be chosen. */
  items: readonly TransferItem[];
  /** Which are currently chosen. */
  value?: readonly string[];
  defaultValue?: readonly string[];
  onChange?: (value: readonly string[]) => void;
  /** What the left list is. Its name, not a heading. */
  sourceLabel?: string;
  /** What the right list is. */
  targetLabel?: string;
  isDisabled?: boolean;
  className?: string;
  /** What to say when a list is empty. */
  emptyMessage?: ReactNode;
}

export function Transfer({
  items, value, defaultValue = [], onChange,
  sourceLabel = 'Available', targetLabel = 'Chosen',
  isDisabled = false, className, emptyMessage = 'Nothing here',
}: TransferProps): React.JSX.Element {
  const [uncontrolled, setUncontrolled] = useState<readonly string[]>(defaultValue);
  const chosen = value ?? uncontrolled;
  const [sourceSelection, setSourceSelection] = useState<Selection>(new Set());
  const [targetSelection, setTargetSelection] = useState<Selection>(new Set());
  const [announcement, setAnnouncement] = useState('');
  const sourceId = useId();
  const targetId = useId();

  const set = useCallback((next: readonly string[]) => {
    if (value === undefined) setUncontrolled(next);
    onChange?.(next);
  }, [value, onChange]);

  const available = items.filter((item) => !chosen.includes(item.value));
  const selected = items.filter((item) => chosen.includes(item.value));
  /* An item that has just been moved into a list arrives there with `list-in`.
     The items each list loads with do not. This is decided by what each list
     held after the last render. The item leaving the other list goes from React
     Aria's collection at once, so there is nothing to play `list-out` on. */
  const held = useRef<Map<string, Set<string>> | null>(null);
  const isNew = (list: string, value: string): boolean =>
    held.current !== null && !(held.current.get(list)?.has(value) ?? false);
  useEffect(() => {
    held.current = new Map([
      [sourceId, new Set(available.map((item) => item.value))],
      [targetId, new Set(selected.map((item) => item.value))],
    ]);
  });

  const keysOf = (selection: Selection, pool: readonly TransferItem[]) =>
    (selection === 'all' ? pool.map((item) => item.value) : [...selection].map(String));

  const move = (direction: 'in' | 'out') => {
    const moving = direction === 'in'
      ? keysOf(sourceSelection, available)
      : keysOf(targetSelection, selected);
    if (moving.length === 0) return;

    set(direction === 'in'
      ? [...chosen, ...moving]
      : chosen.filter((each) => !moving.includes(each)));

    /* Announced, because otherwise a screen reader user hears nothing when an
       item leaves one list and appears in another. */
    setAnnouncement(
      `${moving.length} ${moving.length === 1 ? 'item' : 'items'} moved to ${direction === 'in' ? targetLabel : sourceLabel}`,
    );
    setSourceSelection(new Set());
    setTargetSelection(new Set());
  };

  const panel = (
    heading: string,
    headingId: string,
    pool: readonly TransferItem[],
    selection: Selection,
    onSelectionChange: (next: Selection) => void,
  ) => (
    <div className={cx(styles['panel'])}>
      <div className={cx(styles['panelHead'])}>
        {/* The name is the heading alone. Pointing at the whole row would make
            the list's name "Available 3", which changes every time an item
            moves and so cannot be referred to. */}
        <span id={headingId}>{heading}</span>
        <span className={cx(styles['panelCount'])}>{pool.length}</span>
      </div>
      <ListBox
        aria-labelledby={headingId}
        selectionMode="multiple"
        selectedKeys={selection}
        onSelectionChange={onSelectionChange}
        disabledKeys={pool.filter((item) => item.isDisabled).map((item) => item.value)}
        items={pool}
        className={cx(styles['list'], 'cr-scroll-frost')}
        renderEmptyState={() => <div className={cx(styles['empty'])}>{emptyMessage}</div>}
      >
        {(item: TransferItem) => (
          <ListBoxItem id={item.value} textValue={item.label} className={cx(styles['item'])}>
            <ItemLabel arriving={isNew(headingId, item.value)}>{item.label}</ItemLabel>
          </ListBoxItem>
        )}
      </ListBox>
    </div>
  );

  return (
    <div className={cx(styles['transfer'], className)}>
      {panel(sourceLabel, sourceId, available, sourceSelection, setSourceSelection)}
      {/* Named controls instead of a drag, so every input method reaches them. */}
      <div className={cx(styles['controls'])}>
        <Button
          variant="quiet"
          isDisabled={isDisabled}
          onPress={() => move('in')}
          aria-label={`Move to ${targetLabel}`}
        >
          →
        </Button>
        <Button
          variant="quiet"
          isDisabled={isDisabled}
          onPress={() => move('out')}
          aria-label={`Move to ${sourceLabel}`}
        >
          ←
        </Button>
      </div>
      {panel(targetLabel, targetId, selected, targetSelection, setTargetSelection)}
      <VisuallyHidden as="div" role="status" aria-live="polite">{announcement}</VisuallyHidden>
    </div>
  );
}

/* An item's words, arriving once when the item has just been moved into this
   list. On the label, because React Aria owns the option element. */
function ItemLabel({ arriving, children }: { arriving: boolean; children: ReactNode }): React.JSX.Element {
  const [scope, play] = useMotion();
  return (
    <span ref={scope as never} className={cx(styles['itemLabel'])}>
      {arriving ? <Arrival play={play} recipe="list-in" /> : null}
      {children}
    </span>
  );
}

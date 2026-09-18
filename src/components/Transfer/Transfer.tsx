'use client';

/* Transfer.
 *
 * Two lists and the controls between them. The catalogue's requirement is the one
 * that decides the whole design: **keyboard must move items without drag.**
 *
 * That is why this is two listboxes and a pair of buttons rather than a
 * drag-and-drop surface. Dragging between two lists is the obvious gesture and it
 * is unavailable to a keyboard user, unreliable for anyone whose pointer is not
 * steady, and invisible to a screen reader — so it is not the mechanism. Items are
 * selected in a list and moved with a named control, which every route can reach.
 *
 * Each list is separately named, because "available" and "chosen" are the whole
 * meaning of the component and a reader who cannot see the layout has only the
 * names to go on. Moves are announced for the same reason: an item silently
 * leaving one list and appearing in another is, to a screen reader, nothing
 * happening.
 */
import { useCallback, useId, useState, type ReactNode } from 'react';
import { ListBox, ListBoxItem, type Selection } from 'react-aria-components';
import { cx } from '../../styles/cx.js';
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

    /* Announced, because an item silently leaving one list and appearing in
       another is nothing happening to a screen reader. */
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
            moves — a name that is partly a running total is a name nobody can
            refer to. */}
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
            {item.label}
          </ListBoxItem>
        )}
      </ListBox>
    </div>
  );

  return (
    <div className={cx(styles['transfer'], className)}>
      {panel(sourceLabel, sourceId, available, sourceSelection, setSourceSelection)}
      {/* Named controls rather than a drag: every route reaches these. */}
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

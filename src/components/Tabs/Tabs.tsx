'use client';

/* Tabs.
 *
 * React Aria owns `role="tablist"` / `tab` / `tabpanel`, the roving tab stop,
 * arrow keys with Home and End, the `aria-controls` and `aria-labelledby` pair
 * between a tab and its panel, and the automatic-versus-manual activation
 * distinction. Crystal owns the material and the one semantic rule.
 *
 * Selection is weight and the primary fill, as Crystal's dock draws a selected
 * control. The tab is heavier and filled, so selection never rests on colour
 * alone. The strip is Crystal's `.cr-dock`, shared with the segmented control
 * through `styles/_strip.scss`. The material is the same and the semantics differ.
 * A segmented control picks a value and announces as a radio group; a tab list
 * picks a view and promises a panel will change. The catalogue rules out
 * borrowing one for the other by name: "never `aria-selected` outside a
 * tablist".
 *
 * The panel plays `tab-in` on arrival. That is movement somebody started by
 * pressing the tab, which is the only kind Crystal has. Nothing moves at rest.
 */
import { useEffect, useId, useRef, type ReactNode } from 'react';
import {
  Tabs as AriaTabs,
  TabList,
  Tab,
  TabPanel as AriaTabPanel,
  type TabsProps as AriaTabsProps,
  type Key,
} from 'react-aria-components';
import { cx } from '../../styles/cx.js';
import { useMotion } from '../../motion/useMotion.js';
import styles from './Tabs.module.scss';

export interface TabItem {
  /** Identifies the tab and its panel. Stable across renders. */
  id: string;
  label: ReactNode;
  content: ReactNode;
  isDisabled?: boolean;
}

export interface TabsProps extends Omit<AriaTabsProps, 'className' | 'style' | 'children'> {
  /** The tabs, in reading order. */
  items: readonly TabItem[];
  /**
   * Names the tab list. Several tablists on one page are indistinguishable to a
   * screen reader without it, so it is required rather than optional.
   */
  label: ReactNode;
  /**
   * Show the label above the strip. It then names the list by reference rather
   * than by `aria-label`, so the visible text and the announced name cannot
   * drift apart. A rich label also works, which an `aria-label` cannot carry.
   */
  labelVisible?: boolean;
  className?: string;
}

export function Tabs({
  items, label, labelVisible = false, className, ...props
}: TabsProps): React.JSX.Element {
  const labelId = useId();
  /* Only a string can become an `aria-label`. A hidden rich label would be
     dropped silently and leave the list unnamed, so it is shown instead. */
  const nameable = typeof label === 'string' ? label : undefined;
  const visible = labelVisible || nameable === undefined;

  return (
    <AriaTabs {...props} className={cx(styles['tabs'], className)}>
      {visible ? <span id={labelId} className={cx(styles['label'])}>{label}</span> : null}
      <TabList
        className={cx(styles['strip'], 'cr-dock')}
        items={items}
        {...(visible ? { 'aria-labelledby': labelId } : { 'aria-label': nameable })}
      >
        {(item: TabItem) => (
          <Tab
            id={item.id}
            className={cx(styles['tab'])}
            {...(item.isDisabled === undefined ? {} : { isDisabled: item.isDisabled })}
          >
            {item.label}
          </Tab>
        )}
      </TabList>
      {items.map((item) => (
        <TabPanel key={item.id} id={item.id}>{item.content}</TabPanel>
      ))}
    </AriaTabs>
  );
}

/** One panel, playing `tab-in` when it becomes the shown one. */
function TabPanel({ id, children }: { id: Key; children: ReactNode }): React.JSX.Element {
  const [scope, play] = useMotion();
  /* RAC unmounts a hidden panel, so mounting is arrival and an effect that runs
     once per mount plays exactly once per arrival. Keying the effect on the
     selected tab instead would replay the panel already on screen every time any
     tab changed. The ref survives the double-invoked effect in StrictMode. */
  const played = useRef(false);
  useEffect(() => {
    if (played.current) return;
    played.current = true;
    play('tab-in');
  }, [play]);

  return (
    <AriaTabPanel id={id} ref={scope as never} className={cx(styles['panel'])}>
      {children}
    </AriaTabPanel>
  );
}

'use client';

/* SettingsBlock — grouped preferences, saved as they change or all at once.
 *
 * "Each group is a labelled region; **unsaved changes are announced before
 * navigation**." States: `at-rest`, `dirty`, `saving`, `saved`.
 *
 * Which settings exist, and when they apply, are the product's. The block owns
 * the two promises:
 *
 *   - **Each group is a region named by its heading**, so a screen reader's
 *     landmark list is the settings page's table of contents.
 *   - **Unsaved changes are said before the reader can lose them.** Three
 *     routes out, three answers:
 *       1. Becoming dirty is announced once, politely — "Unsaved changes" —
 *          and the save bar says the same in words beside Save and Discard.
 *       2. Leaving the document — closing the tab, reloading, following an
 *          ordinary link — is the browser's to ask about, and the block asks it
 *          to while there is anything unsaved (`beforeunload`).
 *       3. Leaving through the product's own router is invisible to the
 *          browser, so the router asks the block: it sets `isLeaving` when it
 *          intercepts a navigation, and the block puts up an alert dialog —
 *          save and leave, discard and leave, or stay — and reports the choice.
 *          A stray click on the scrim does not dismiss it; Escape stays.
 *
 * `saveMode="immediate"` is for settings that apply as they change: there is no
 * save bar, and saving and saved are announced as each change lands.
 *
 * Nothing moves at rest. Saving is carried by the busy state of the controls.
 */
import { useEffect, useId, type ReactNode } from 'react';
import { Button } from '../Button/Button.js';
import { Dialog } from '../Dialog/Dialog.js';
import { VisuallyHidden } from '../VisuallyHidden/VisuallyHidden.js';
import { cx } from '../../styles/cx.js';
import styles from './SettingsBlock.module.scss';

export type SettingsState = 'at-rest' | 'dirty' | 'saving' | 'saved';
export type LeaveChoice = 'save' | 'discard' | 'stay';

export interface SettingsGroup {
  id: string;
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
}

export interface SettingsBlockProps {
  title: ReactNode;
  headingLevel?: 1 | 2 | 3;
  groups: readonly SettingsGroup[];
  state?: SettingsState;
  /** `deferred` collects changes behind a save bar; `immediate` applies each as it is made. */
  saveMode?: 'deferred' | 'immediate';
  onSave?: () => void;
  onDiscard?: () => void;
  /** Set by the product's router when it has held a navigation away while dirty. */
  isLeaving?: boolean;
  /** What the reader chose in the leaving dialog. The router proceeds or not. */
  onLeaveChoice?: (choice: LeaveChoice) => void;
  /** Ask the browser to confirm closing or reloading while dirty. On by default. */
  guardUnload?: boolean;
  unsavedLabel?: string;
  savingLabel?: string;
  savedLabel?: string;
  /** The leaving dialog's question. */
  leavingMessage?: ReactNode;
  className?: string;
}

export function SettingsBlock({
  title, headingLevel = 2, groups, state = 'at-rest', saveMode = 'deferred', onSave, onDiscard,
  isLeaving = false, onLeaveChoice, guardUnload = true,
  unsavedLabel = 'Unsaved changes', savingLabel = 'Saving', savedLabel = 'Saved',
  leavingMessage = 'Save your changes before you leave, or discard them.', className,
}: SettingsBlockProps): React.JSX.Element {
  const Heading = `h${headingLevel}` as 'h2';
  const Group = `h${headingLevel + 1}` as 'h3';
  const headingId = useId();
  const unsaved = state === 'dirty' || state === 'saving';

  /* The browser's own question, for leaving the document while work is unsaved. */
  useEffect(() => {
    if (!guardUnload || !unsaved) return;
    const hold = (event: BeforeUnloadEvent): void => {
      event.preventDefault();
      /* Older engines read the return value rather than the prevented default. */
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', hold);
    return () => { window.removeEventListener('beforeunload', hold); };
  }, [guardUnload, unsaved]);

  const said = state === 'dirty' ? unsavedLabel : state === 'saving' ? savingLabel : state === 'saved' ? savedLabel : '';
  const showBar = saveMode === 'deferred' && state !== 'at-rest';

  return (
    <section aria-labelledby={headingId} data-cr-state={state} className={cx(styles['settings'], className)}>
      <Heading id={headingId} className={cx(styles['heading'])}>{title}</Heading>

      {groups.map((group) => (
        <SettingsRegion key={group.id} group={group} Heading={Group} />
      ))}

      {showBar ? (
        <div className={cx(styles['bar'])}>
          <span className={cx(styles['barState'])}>{said}</span>
          {state === 'dirty' || state === 'saving' ? (
            <>
              <Button variant="quiet" isDisabled={state === 'saving'} onPress={() => { onDiscard?.(); }}>Discard</Button>
              <Button variant="primary" isDisabled={state === 'saving'} onPress={() => { onSave?.(); }}>Save</Button>
            </>
          ) : null}
        </div>
      ) : null}

      {/* Polite, present from the first frame, so the first change is heard. */}
      <VisuallyHidden role="status">{said}</VisuallyHidden>

      <Dialog
        title={unsavedLabel}
        role="alertdialog"
        isOpen={isLeaving && unsaved}
        isDismissable={false}
        onOpenChange={(open) => { if (!open) onLeaveChoice?.('stay'); }}
      >
        <p className={cx(styles['leaving'])}>{leavingMessage}</p>
        <div className={cx(styles['leavingActions'])}>
          <Button variant="quiet" onPress={() => { onLeaveChoice?.('stay'); }}>Stay</Button>
          <Button variant="quiet" onPress={() => { onLeaveChoice?.('discard'); }}>Discard and leave</Button>
          <Button variant="primary" onPress={() => { onLeaveChoice?.('save'); }}>Save and leave</Button>
        </div>
      </Dialog>
    </section>
  );
}

function SettingsRegion({ group, Heading }: { group: SettingsGroup; Heading: 'h3' }): React.JSX.Element {
  const id = useId();
  return (
    <section aria-labelledby={id} className={cx(styles['group'], 'cr-haze')}>
      <Heading id={id} className={cx(styles['groupHeading'])}>{group.title}</Heading>
      {group.description ? <p className={cx(styles['description'])}>{group.description}</p> : null}
      <div className={cx(styles['fields'])}>{group.children}</div>
    </section>
  );
}

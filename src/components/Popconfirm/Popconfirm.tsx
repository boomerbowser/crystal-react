'use client';

/* Popconfirm: a small popover asking for confirmation next to the control that
 * triggered it.
 *
 * "**Focus moves into the popover, returns to the trigger on dismiss, and
 * Escape cancels.**" All three come from `Popover`, which is React Aria's
 * `Popover` and `Dialog`; this component is the action row and one decision.
 *
 * The decision: focus lands on Cancel, not on Confirm. A confirmation exists
 * because the action is hard to undo, and a dialog that puts the destructive
 * choice under the key the reader is already pressing has asked a question whose
 * default answer is yes. Cancel is also what Escape does and what clicking away
 * does, so the focused control and the three ways out all agree. A reader who
 * means it presses Tab once.
 *
 * "The consequence, its wording and whether a full dialog is warranted instead"
 * is the product's. This component is for actions whose consequence fits in a
 * sentence. Anything that needs a paragraph, a list of what will be lost, or a
 * typed confirmation is a dialog.
 *
 * `pending` disables both controls and says why, because a confirmation that
 * can be pressed twice has confirmed twice.
 */
import { useRef, type ReactNode } from 'react';
import { Popover, PopoverTrigger } from '../Popover/Popover.js';
import { Button } from '../Button/Button.js';
import styles from './Popconfirm.module.scss';

export interface PopconfirmProps {
  /** What is being asked. Shown, and the popover's accessible name. */
  label: string;
  /** What will happen, in one sentence. More than that wants a dialog. */
  description?: ReactNode;
  /** The control that opens it. */
  children: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Paint the confirm as destructive. Never the only signal: the words say it
   *  too. */
  destructive?: boolean;
  /** In flight. Both controls are disabled and the state is announced. */
  pending?: boolean;
  /** What the reader is waiting for. */
  pendingLabel?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function Popconfirm({
  label, description, children, confirmLabel = 'Confirm', cancelLabel = 'Cancel',
  destructive = false, pending = false, pendingLabel = 'Working', onConfirm, onCancel,
  isOpen, onOpenChange,
}: PopconfirmProps): ReactNode {
  /* Focus goes here on open. React Aria focuses the dialog's first tabbable
     element by default, which would be Confirm; the note above says why focus
     belongs on Cancel. */
  const cancel = useRef<HTMLButtonElement>(null);

  return (
    <PopoverTrigger
      {...(isOpen === undefined ? {} : { isOpen })}
      {...(onOpenChange ? { onOpenChange } : {})}
    >
      {children}
      <Popover label={label} hasArrow className={styles['popconfirm'] ?? ''}>
        <div className={styles['body']}>
          <p className={styles['question']}>{label}</p>
          {description ? <p className={styles['description']}>{description}</p> : null}
          <div className={styles['actions']}>
            <Button
              ref={cancel}
              autoFocus
              variant="quiet"
              isDisabled={pending}
              onPress={() => onCancel?.()}
              slot="close"
            >
              {cancelLabel}
            </Button>
            <Button
              variant={destructive ? 'danger' : 'primary'}
              isDisabled={pending}
              onPress={() => onConfirm?.()}
              /* Both controls close it. Without this an uncontrolled caller
                 confirms and the popover stays open, still asking. In the
                 controlled case React Aria routes through `onOpenChange`, so a
                 caller holding it open while `pending` still can. */
              slot="close"
            >
              {pending ? pendingLabel : confirmLabel}
            </Button>
          </div>
          {/* Announced as well as drawn. The label on the button changed, and
              not every screen reader reports a changed label on a control that
              already had focus. */}
          <span role="status" className={styles['announcement']}>
            {pending ? pendingLabel : null}
          </span>
        </div>
      </Popover>
    </PopoverTrigger>
  );
}

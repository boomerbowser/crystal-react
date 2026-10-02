'use client';

/* Toast: a transient floating notification with a message and one action.
 *
 * "Auto-dismiss must never remove the only route to an action." A toast that
 * carries the only "Undo" and removes it after four seconds only helps people
 * who happened to be looking. So the two are mutually exclusive in the type:
 * `ToastOptions` is a union where a toast with an `action` cannot have a
 * `duration` and a toast with a `duration` cannot have an `action`. A type error
 * is caught at compile time, where a runtime warning is only read after
 * shipping.
 *
 * "Polite live region; an urgent toast is assertive." The provider owns two
 * regions, one polite and one assertive, both empty from the first render. Each
 * toast's words are copied into the one it asked for. The toast itself has no
 * live role, for two reasons:
 *
 *   - Screen readers may never announce a region created at the same moment as
 *     the text inside it, and that is a common reason a toast system goes
 *     silent.
 *   - `role="status"` on an `<li>` replaces its `listitem` role, so the `<ol>`
 *     has no `<li>` children at all. A toast is a list item and an
 *     announcement, and those are two elements.
 *
 * "Stacked with a 12px offset", newest nearest the edge. The whole stack is an
 * `<ol>`, so a reader tabbing in is told how many toasts there are.
 *
 * `toast-in` plays on arrival and `toast-out` on the way out. The exit is
 * awaited before the toast unmounts, using `useMotion`'s promise. Removing the
 * node on the state change would play the exit recipe into a detached element.
 */
import {
  createContext, useCallback, useContext, useEffect, useId, useMemo, useRef, useState,
  type ReactNode,
} from 'react';
import { STATUS_SYMBOL, type FeedbackStatus } from '../../feedback/status.js';
import { useMotion } from '../../motion/useMotion.js';
import { cx } from '../../styles/cx.js';
import styles from './Toast.module.scss';

interface ToastCommon {
  /** Supplied by the caller to replace an existing toast, or generated. */
  id?: string;
  status?: FeedbackStatus;
  /** What happened. */
  title: ReactNode;
  /** More, if a sentence is not enough. */
  description?: ReactNode;
  /** Interrupt. Reserved for something that cannot wait. */
  urgent?: boolean;
}

/** A toast that offers a way to act, and therefore does not take itself away. */
export interface ToastWithAction extends ToastCommon {
  action: ReactNode;
  duration?: never;
}

/** A toast that says something and goes. */
export interface ToastAutoDismissed extends ToastCommon {
  /** Milliseconds. `null` keeps it until it is dismissed. */
  duration?: number | null;
  action?: never;
}

/**
 * The catalogue's rule, as a type: a toast carrying the only route to an action
 * cannot also be given a lifespan.
 */
export type ToastOptions = ToastWithAction | ToastAutoDismissed;

interface LiveToast extends ToastCommon {
  id: string;
  action?: ReactNode;
  duration?: number | null;
}

export interface ToastController {
  show: (toast: ToastOptions) => string;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastController | null>(null);

/** The stack, the region and the announcements. One per application. */
export function ToastProvider({
  children, defaultDuration = 6000, label = 'Notifications',
}: {
  children: ReactNode;
  /** How long a toast with no `duration` of its own stays. */
  defaultDuration?: number;
  /** What the stack is called, for a reader who tabs into it. */
  label?: string;
}): ReactNode {
  const [toasts, setToasts] = useState<readonly LiveToast[]>([]);
  /* What the regions are currently saying. Separate from the stack, because a
     toast being dismissed should not re-announce the one behind it. */
  const [polite, setPolite] = useState('');
  const [assertive, setAssertive] = useState('');
  const counter = useRef(0);
  const prefix = useId();

  const dismiss = useCallback((id: string) => {
    setToasts((all) => all.filter((one) => one.id !== id));
  }, []);

  const show = useCallback((toast: ToastOptions): string => {
    counter.current += 1;
    const id = toast.id ?? `${prefix}-${counter.current}`;
    /* The type forbids an action and a duration together, so this reads
       whichever one is there. A toast with an action never gets a lifespan:
       the type's rule, applied again where the value is used. */
    const live: LiveToast = 'action' in toast && toast.action !== undefined
      ? { ...toast, id, duration: null }
      : { ...toast, id, duration: toast.duration === undefined ? defaultDuration : toast.duration };
    setToasts((all) => [...all.filter((one) => one.id !== id), live]);
    const said = [toast.title, toast.description]
      .filter((part) => typeof part === 'string')
      .join('. ');
    if (said) (toast.urgent ? setAssertive : setPolite)(said);
    return id;
  }, [defaultDuration, prefix]);

  const controller = useMemo(() => ({ show, dismiss }), [show, dismiss]);

  return (
    <ToastContext.Provider value={controller}>
      {children}
      {/* Both regions are here and empty from the first render, so a message
          arriving is a change the platform announces. Screen readers may never
          read a region created at the same moment as its text. */}
      <div className={styles['announcement']} role="status" aria-live="polite">{polite}</div>
      <div className={styles['announcement']} role="alert" aria-live="assertive">{assertive}</div>
      <ol className={styles['stack']} aria-label={label} tabIndex={-1}>
        {toasts.map((toast) => (
          <Toast key={toast.id} {...toast} onDismiss={() => dismiss(toast.id)} />
        ))}
      </ol>
    </ToastContext.Provider>
  );
}

/** Raise and dismiss toasts. Throws outside a `ToastProvider`, so a toast
 *  cannot silently go nowhere. */
export function useToasts(): ToastController {
  const controller = useContext(ToastContext);
  if (!controller) {
    throw new Error('useToasts must be used inside a <ToastProvider>.');
  }
  return controller;
}

export interface ToastProps extends ToastCommon {
  id?: string;
  action?: ReactNode;
  duration?: number | null;
  onDismiss: () => void;
  dismissLabel?: string;
}

/** One toast. Exported so it can be shown on its own. In an application it is
 *  raised through `useToasts` instead of rendered by hand. */
export function Toast({
  status = 'info', title, description, action, duration = null, urgent = false,
  onDismiss, dismissLabel,
}: ToastProps): ReactNode {
  const [scope, play] = useMotion();
  const leaving = useRef(false);

  useEffect(() => { void play('toast-in'); }, [play]);

  /* `onDismiss` is a new closure on every provider render, and the provider
     re-renders whenever any toast arrives or leaves. If `leave` depended on it
     directly, the lifespan effect below would restart its timer every time
     another toast appeared, and in a busy stack the oldest toast could outlive
     them all. With `onDismiss` held in a ref, `leave` is stable and each
     toast's clock is its own. */
  const dismiss = useRef(onDismiss);
  dismiss.current = onDismiss;

  const leave = useCallback(() => {
    if (leaving.current) return;
    leaving.current = true;
    /* Awaited, then removed. `useMotion`'s promise makes the exit recipe
       possible. Unmounting on the state change would play `toast-out` into a
       node that is no longer in the document. */
    void play('toast-out').then(() => dismiss.current());
  }, [play]);

  useEffect(() => {
    if (duration === null || duration === undefined) return undefined;
    const timer = setTimeout(leave, duration);
    return () => clearTimeout(timer);
  }, [duration, leave]);

  return (
    <li
      /* `AnimationScope` is typed as `Element`. Every other caller of
         `useMotion` on a non-div uses the same cast. */
      ref={scope as never}
      className={cx(styles['toast'], 'cr-frost')}
      data-status={status}
      /* No live role here. `role="status"` on an `<li>` replaces its `listitem`
         role, and then the stack is a list with nothing in it. The provider's
         two regions make the announcement, and they exist before there is
         anything to say. */
      data-urgent={urgent ? '' : undefined}
    >
      <span aria-hidden="true" className={styles['well']}>{STATUS_SYMBOL[status]}</span>
      <div className={styles['content']}>
        <p className={styles['title']}>{title}</p>
        {description ? <p className={styles['description']}>{description}</p> : null}
      </div>
      {action ? <div className={styles['action']}>{action}</div> : null}
      <button
        type="button"
        className={cx(styles['dismiss'], 'cr-bare')}
        aria-label={dismissLabel ?? (typeof title === 'string' ? `Dismiss: ${title}` : 'Dismiss')}
        onClick={leave}
      >
        <span aria-hidden="true">{'×'}</span>
      </button>
    </li>
  );
}

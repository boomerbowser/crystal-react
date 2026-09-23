'use client';

/* Toast — a transient floating notification with a message and one action.
 *
 * "**Auto-dismiss must never remove the only route to an action.**" A toast that
 * carries the only "Undo" and takes it away after four seconds is a control that
 * exists for people who happened to be looking. So the two are made mutually
 * exclusive *in the type*: `ToastOptions` is a union where a toast with an
 * `action` cannot have a `duration` and a toast with a `duration` cannot have an
 * `action`. It is not a runtime warning, because a runtime warning is a thing
 * somebody reads after shipping.
 *
 * "Polite live region; an urgent toast is assertive." **Two** regions, owned by
 * the provider and empty from the first render — one polite, one assertive —
 * with each toast's words copied into whichever it asked for. Not a live role on
 * the toast itself, for two separate reasons, and the second one cost a test:
 *
 *   - A region created at the same moment as the text inside it is a region
 *     screen readers may never announce, which is the classic way a toast system
 *     ends up silent.
 *   - `role="status"` on an `<li>` **replaces** its `listitem` role, so the
 *     stack stops being a list with items in it — and then the `<ol>` has no
 *     `<li>` children at all. Axe caught that on the first run of these stories.
 *     A toast is a list item *and* an announcement, and those are two elements.
 *
 * "Stacked with a 12px offset", newest nearest the edge, and the whole stack is
 * a `<ol>` — three toasts are a list of three things, and a reader tabbing in
 * should be told how many.
 *
 * `toast-in` on arrival, `toast-out` on the way out — and the exit is *awaited*
 * before the toast unmounts. `useMotion`'s promise exists for exactly this; a
 * component that removed the node on the state change would play the exit
 * recipe into a detached element.
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
    /* An action and a duration cannot both be present — the type forbids it —
       so this reads whichever one is there. A toast with an action never gets a
       lifespan, which is the rule the type is enforcing, restated where the
       value is actually used. */
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
      {/* Both regions are here from the first render, empty, so that a message
          arriving is a *change* the platform announces. A region created at the
          same moment as its text is one screen readers may never read. */}
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

/** Raise and dismiss toasts. Throws outside a `ToastProvider`, because a toast
 *  that silently goes nowhere is worse than one that never compiled. */
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

/** One toast. Exported so it can be seen on its own; in an application it is
 *  raised through `useToasts` rather than rendered by hand. */
export function Toast({
  status = 'info', title, description, action, duration = null, urgent = false,
  onDismiss, dismissLabel,
}: ToastProps): ReactNode {
  const [scope, play] = useMotion();
  const leaving = useRef(false);

  useEffect(() => { void play('toast-in'); }, [play]);

  /* `onDismiss` is a new closure on every provider render, and the provider
     re-renders whenever *any* toast arrives or leaves. Depending on it directly
     made `leave` new every time, which made the lifespan effect below tear its
     timer down and start it again — so a toast's countdown restarted every time
     another toast appeared, and in a busy stack the oldest one could outlive
     them all. Held in a ref, `leave` is stable and each toast's clock is its
     own. */
  const dismiss = useRef(onDismiss);
  dismiss.current = onDismiss;

  const leave = useCallback(() => {
    if (leaving.current) return;
    leaving.current = true;
    /* Awaited, then removed. `useMotion`'s promise is what makes an exit recipe
       possible: unmounting on the state change would play `toast-out` into a
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
      /* `AnimationScope` is typed as `Element`; the cast is what every other
         caller of `useMotion` on a non-div does. */
      ref={scope as never}
      className={cx(styles['toast'])}
      data-status={status}
      /* No live role here. `role="status"` on an `<li>` replaces its `listitem`
         role, and then the stack is a list with nothing in it — axe caught that
         on the first run of these stories. The announcement is the provider's
         two regions, which exist before there is anything to say. */
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
        className={styles['dismiss']}
        aria-label={dismissLabel ?? (typeof title === 'string' ? `Dismiss: ${title}` : 'Dismiss')}
        onClick={leave}
      >
        <span aria-hidden="true">{'×'}</span>
      </button>
    </li>
  );
}

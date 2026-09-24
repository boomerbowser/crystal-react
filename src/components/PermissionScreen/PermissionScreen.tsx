'use client';

/* PermissionScreen — access is denied, or must be granted.
 *
 * "Says **which** permission and **why**; the request is a real button."
 * States: `denied`, `requesting`. There is no `at-rest`, and that is the shape
 * of the component: a permission screen is always in one of two situations.
 *
 * `permission` and `children` carry the two halves the catalogue names, and both
 * are required. "You do not have access" names neither: the reader cannot tell
 * whether to ask an administrator, switch account, or stop trying. Naming the
 * permission is also what makes the screen actionable by somebody else — the
 * person who can grant it needs to know what to grant.
 *
 * **`requesting` is a busy state, not a second screen.** While the request is in
 * flight the button is disabled and the region is `aria-busy`, so the reader is
 * not told the whole view changed when only its button did. The request is a
 * real button because a permission granted by a link is a permission granted by
 * anything that follows links.
 */
import { type HTMLAttributes, type ReactNode } from 'react';
import { Result } from '../Result/Result.js';
import { Button } from '../Button/Button.js';
import { cx } from '../../styles/cx.js';
import styles from './PermissionScreen.module.scss';

export interface PermissionScreenProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  /** Which permission. Required; see the note above. */
  permission: ReactNode;
  /** Why it is needed. Required. */
  children: ReactNode;
  /** Whether the request is in flight. */
  isRequesting?: boolean;
  /** Ask for it. Omitted where the reader cannot grant it themselves. */
  onRequest?: () => void;
  requestLabel?: ReactNode;
  /** Anything else to offer — going back, switching account. */
  actions?: ReactNode;
  headingLevel?: 1 | 2 | 3 | 4 | 5 | 6;
}

export function PermissionScreen({
  permission, children, isRequesting = false, onRequest,
  requestLabel = 'Request access', actions, headingLevel = 1, className, ...props
}: PermissionScreenProps): React.JSX.Element {
  return (
    <div
      {...props}
      aria-busy={isRequesting || undefined}
      className={cx(styles['screen'], className)}
    >
      <Result
        outcome="unauthorised"
        title={permission}
        headingLevel={headingLevel}
        className={cx(styles['card'])}
        actions={(
          <>
            {onRequest === undefined ? null : (
              <Button onPress={onRequest} isDisabled={isRequesting}>
                {isRequesting ? 'Requesting…' : requestLabel}
              </Button>
            )}
            {actions}
          </>
        )}
      >
        {children}
      </Result>
    </div>
  );
}

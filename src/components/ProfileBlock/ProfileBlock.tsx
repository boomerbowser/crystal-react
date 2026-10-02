'use client';

/* ProfileBlock: identity, avatar, contact details and account actions.
 *
 * "Destructive actions confirm and say what they remove." States:
 * `at-rest`, `editing`, `saving`.
 *
 * The profile model is the product's. The block owns the confirmation, and
 * makes the product say what is removed:
 *
 *   - An action is destructive because it says what it removes. Giving an
 *     action `removes` makes it destructive: pressing it opens an alert dialog
 *     titled with the action, whose body is that sentence or list, and whose
 *     confirm button is the danger variant and repeats the action's name. There
 *     is no way to build a confirmation here that only asks "Are you sure?".
 *   - Focus lands on Cancel, as it does in `Popconfirm`, because the default
 *     answer to a question about losing something is no. Escape cancels too.
 *   - Editing is the product's form in the block's frame. The details give way
 *     to the product's fields; Save hands over their values, saving holds them,
 *     and the return to the details says "Profile saved".
 *
 * "Haze content fill on the surrounding material": the profile is a Haze card
 * on whatever the page gives it.
 */
import { useEffect, useId, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { Form } from 'react-aria-components';
import { Avatar } from '../Avatar/Avatar.js';
import { Button } from '../Button/Button.js';
import { Dialog } from '../Dialog/Dialog.js';
import { VisuallyHidden } from '../VisuallyHidden/VisuallyHidden.js';
import { cx } from '../../styles/cx.js';
import styles from './ProfileBlock.module.scss';

export type ProfileState = 'at-rest' | 'editing' | 'saving';

export interface ProfileDetail {
  label: ReactNode;
  value: ReactNode;
}

export interface ProfileAction {
  id: string;
  /** "Sign out everywhere", "Delete account". Also the confirm button's name. */
  label: string;
  onPress: () => void;
  /**
   * What the action removes, in the reader's terms. Giving it makes the action
   * destructive: it is confirmed in a dialog that says this before it runs.
   */
  removes?: ReactNode;
}

export interface ProfileBlockProps {
  name: string;
  /** What sits under the name, such as a role, a handle or an address. */
  subtitle?: ReactNode;
  avatarSrc?: string;
  details?: readonly ProfileDetail[];
  actions?: readonly ProfileAction[];
  state?: ProfileState;
  /** Offer "Edit profile". The product moves `state` to `editing`. */
  onEdit?: () => void;
  /** The product's fields, shown while editing. Name them: Save hands over their values. */
  editor?: ReactNode;
  onSave?: (values: FormData) => void;
  onCancelEdit?: () => void;
  headingLevel?: 2 | 3;
  className?: string;
}

export function ProfileBlock({
  name, subtitle, avatarSrc, details = [], actions = [], state = 'at-rest', onEdit, editor, onSave, onCancelEdit,
  headingLevel = 2, className,
}: ProfileBlockProps): React.JSX.Element {
  const Heading = `h${headingLevel}` as 'h2';
  const headingId = useId();
  /* Which action is being confirmed stays set while the dialog leaves, so its
     words do not empty out during the exit. */
  const [confirming, setConfirming] = useState<ProfileAction | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const editing = state === 'editing' || state === 'saving';

  /* "Saving" while it saves; "Profile saved" once the details come back. */
  const [said, setSaid] = useState('');
  const was = useRef(state);
  useEffect(() => {
    if (state === 'saving') setSaid('Saving');
    else if (was.current === 'saving' && state === 'at-rest') setSaid('Profile saved');
    else setSaid('');
    was.current = state;
  }, [state]);

  const submit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    if (state === 'saving') return;
    onSave?.(new FormData(event.currentTarget));
  };

  return (
    <section aria-labelledby={headingId} data-cr-state={state} className={cx(styles['profile'], 'cr-haze', className)}>
      <div className={cx(styles['identity'])}>
        <Avatar size="xl" name={name} {...(avatarSrc ? { src: avatarSrc } : {})} />
        <div className={cx(styles['who'])}>
          <Heading id={headingId} className={cx(styles['name'])}>{name}</Heading>
          {subtitle ? <p className={cx(styles['subtitle'])}>{subtitle}</p> : null}
        </div>
        {onEdit && !editing ? <Button variant="quiet" onPress={onEdit}>Edit profile</Button> : null}
      </div>

      {editing ? (
        <Form onSubmit={submit} aria-busy={state === 'saving' || undefined} className={cx(styles['editor'])}>
          <fieldset disabled={state === 'saving'} className={cx(styles['fields'])}>{editor}</fieldset>
          <div className={cx(styles['row'])}>
            <Button variant="quiet" isDisabled={state === 'saving'} onPress={() => { onCancelEdit?.(); }}>Cancel</Button>
            <Button type="submit" variant="primary" isDisabled={state === 'saving'}>Save</Button>
          </div>
        </Form>
      ) : details.length > 0 ? (
        <dl className={cx(styles['details'])}>
          {details.map((detail, index) => (
            <div key={index} className={cx(styles['detail'])}>
              <dt className={cx(styles['term'])}>{detail.label}</dt>
              <dd className={cx(styles['value'])}>{detail.value}</dd>
            </div>
          ))}
        </dl>
      ) : null}

      {actions.length > 0 ? (
        <div className={cx(styles['row'], styles['actions'])}>
          {actions.map((action) => (
            <Button
              key={action.id}
              variant={action.removes ? 'danger' : 'quiet'}
              isDisabled={editing}
              onPress={() => { if (action.removes) { setConfirming(action); setIsConfirming(true); } else action.onPress(); }}
            >
              {action.label}
            </Button>
          ))}
        </div>
      ) : null}

      <VisuallyHidden role="status">{said}</VisuallyHidden>

      <Dialog
        title={confirming ? `${confirming.label}?` : ''}
        role="alertdialog"
        isOpen={isConfirming}
        onOpenChange={setIsConfirming}
      >
        <div className={cx(styles['removes'])}>{confirming?.removes}</div>
        <div className={cx(styles['row'])}>
          <Button variant="quiet" autoFocus onPress={() => { setIsConfirming(false); }}>Cancel</Button>
          <Button
            variant="danger"
            onPress={() => { setIsConfirming(false); confirming?.onPress(); }}
          >
            {confirming?.label ?? ''}
          </Button>
        </div>
      </Dialog>
    </section>
  );
}

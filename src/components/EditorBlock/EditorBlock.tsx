'use client';

/* EditorBlock: a rich text surface with its toolbar, and its save state.
 *
 * "**The toolbar is a real toolbar with one tab stop; formatting state is
 * announced.**" States: `at-rest`, `focus-visible`, `dirty`, `saving`, `saved`.
 *
 * The engine and its schema belong to the product, and `RichTextSurface`
 * already takes whatever editor a product brings. The block adds what sits
 * around a document:
 *
 *   - One tab stop for the toolbar. It is React Aria's toolbar: Tab reaches it
 *     once, the arrow keys move along it, and Tab again leaves for the text.
 *   - Formatting state is announced wherever the reader is. On the toolbar each
 *     control is `aria-pressed`, which a screen reader speaks as it is reached
 *     and as it flips. In the text the toolbar is out of reach, and a shortcut
 *     such as Ctrl+B changes a format silently. So while focus is in the text,
 *     a change to the active formats is announced politely, coalesced into one
 *     sentence such as "Bold on" or "Italic off, Code on".
 *   - Save state is in words. "Unsaved changes", "Saving" and "Saved" are shown
 *     beside Save and announced as they change. Ctrl+S or Cmd+S saves from
 *     anywhere in the block while there is something to save. The keys are
 *     printed beside the button and describe it, so the shortcut is read with
 *     the button's name. `aria-keyshortcuts` is not used, because React Aria's
 *     button does not pass it through and only a screen reader would expose it.
 *
 * "Haze surface in a Frost frame": the block is the Frost frame, and the surface
 * is `RichTextSurface`'s Haze, under its toolbar.
 *
 * A complete editor, such as `RichTextEditor` from `@crystal-ui/react/editor`,
 * brings its own surface, toolbar and announcements, so it is given as `editor`
 * and the block hosts it as it is, adding only the frame and the save state
 * (R-T7). Wrapped in a second surface it would draw two toolbars.
 */
import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { RichTextSurface, type FormatAction } from '../RichTextSurface/RichTextSurface.js';
import { Button } from '../Button/Button.js';
import { Kbd } from '../Kbd/Kbd.js';
import { VisuallyHidden } from '../VisuallyHidden/VisuallyHidden.js';
import { cx } from '../../styles/cx.js';
import styles from './EditorBlock.module.scss';

export type EditorState = 'at-rest' | 'dirty' | 'saving' | 'saved';

export interface EditorBlockProps {
  /** Names the editor, and its toolbar. */
  label: string;
  /** The formatting controls, each reporting whether the selection has it. */
  actions?: readonly FormatAction[];
  /** The editable region, which the block puts on its own surface under the
   *  toolbar `actions` describe. It owns the document; it should be named by
   *  `label`. */
  children?: ReactNode;
  /** A complete editor with its own surface and toolbar, such as
   *  `RichTextEditor`, hosted as it is. Given instead of `children` and
   *  `actions`. */
  editor?: ReactNode;
  state?: EditorState;
  onSave?: () => void;
  unsavedLabel?: string;
  savingLabel?: string;
  savedLabel?: string;
  className?: string;
}

const isMac = (): boolean => typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform);

export function EditorBlock({
  label, actions = [], children, editor, state = 'at-rest', onSave,
  unsavedLabel = 'Unsaved changes', savingLabel = 'Saving', savedLabel = 'Saved', className,
}: EditorBlockProps): React.JSX.Element {
  const frame = useRef<HTMLDivElement>(null);
  const keysId = useId();
  const mac = isMac();
  const words = state === 'dirty' ? unsavedLabel : state === 'saving' ? savingLabel : state === 'saved' ? savedLabel : '';

  /* What the polite region says: the save state as it changes, and a change to
     the active formats while the reader is in the text. */
  const [said, setSaid] = useState('');
  const saidState = useRef(state);
  useEffect(() => {
    if (state !== saidState.current) setSaid(words);
    saidState.current = state;
  }, [state, words]);

  const formats = useRef<ReadonlyMap<string, boolean> | null>(null);
  useEffect(() => {
    const now = new Map(actions.map((action) => [action.id, action.isActive === true]));
    const before = formats.current;
    formats.current = now;
    if (!before) return;
    const changes = actions
      .filter((action) => before.has(action.id) && before.get(action.id) !== now.get(action.id))
      .map((action) => `${action.label} ${now.get(action.id) ? 'on' : 'off'}`);
    if (changes.length === 0) return;
    /* On the toolbar, `aria-pressed` on the focused control already says it. */
    const focused = document.activeElement;
    const inText = frame.current?.contains(focused) === true && focused?.closest('[role="toolbar"]') === null;
    if (inText) setSaid(changes.join(', '));
  }, [actions]);

  const shortcut = (event: KeyboardEvent<HTMLDivElement>): void => {
    if (event.key.toLowerCase() !== 's' || !(mac ? event.metaKey : event.ctrlKey)) return;
    event.preventDefault();
    if (state === 'dirty') onSave?.();
  };

  return (
    <div
      ref={frame}
      onKeyDown={shortcut}
      data-cr-state={state}
      aria-busy={state === 'saving' || undefined}
      className={cx(styles['editor'], 'cr-frost', className)}
    >
      {editor === undefined ? (
        <RichTextSurface label={label} actions={actions} className={cx(styles['surface'])}>
          {children}
        </RichTextSurface>
      ) : (
        <div className={cx(styles['surface'])}>{editor}</div>
      )}
      <div className={cx(styles['bar'])}>
        <span className={cx(styles['state'])}>{words}</span>
        {onSave ? (
          <>
            <span id={keysId} className={cx(styles['keys'])}>
              {mac ? <Kbd name="Command">⌘</Kbd> : <Kbd>Ctrl</Kbd>}
              <Kbd>S</Kbd>
            </span>
            <Button variant="primary" isDisabled={state !== 'dirty'} aria-describedby={keysId} onPress={onSave}>
              Save
            </Button>
          </>
        ) : null}
      </div>
      <VisuallyHidden role="status">{said}</VisuallyHidden>
    </div>
  );
}

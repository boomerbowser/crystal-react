'use client';

/* RichTextSurface and Mentions.
 *
 * Crystal owns the chrome and the product owns the engine. The catalogue states
 * the split: "product: the entire editing engine, serialisation and paste
 * handling". An editor is a document model, a paste pipeline and a
 * serialisation format, and those decisions belong to the application.
 *
 * This ships the toolbar, the frame, the surface and the active-format
 * treatment, and takes whatever editor a product brings: TipTap, Lexical,
 * ProseMirror, or a plain `contenteditable`. The plan's dependency table names
 * `@tiptap/react` as the choice if the library needed an engine. The catalogue
 * does not require one, and a bundled editor would be a large dependency
 * imposed on every consumer for a component most of them will not use.
 *
 * The one accessibility rule the chrome owns is the toolbar's: active
 * formatting is `aria-pressed`. A bold button that looks pressed but announces
 * as an ordinary button leaves a screen reader user unable to tell whether their
 * selection is already bold, and the toolbar exists to show the state of the
 * selection.
 *
 * Since 2 October 2026 the surface also carries Crystal's format vocabulary and
 * its touch behaviour, whatever engine renders into it:
 *
 *   - The document is styled with the shared reading vocabulary (headings,
 *     lists, checklists, quotations, code, and the marks: underline,
 *     strikethrough, insertions, deletions, highlights, keys, sub- and
 *     superscript), so it reads the same while edited as after it is published
 *     through `Prose`. The caret is the primary ink; the selection is a primary
 *     tint that stays distinct from a highlight.
 *   - `toolbar` takes any further controls, such as the block-type menu an
 *     engine binding renders. `@crystal-ui/react/editor` is one such binding.
 *   - On a touch screen the toolbar moves below the text and sticks above the
 *     on-screen keyboard (`useKeyboardInset`), so the formatting a person is
 *     using is in reach of a thumb and never under the keyboard. A phone
 *     keyboard has no Tab or Ctrl+B, so on touch the toolbar is the only way to
 *     indent a list or bold a word.
 *
 * The frame wears Crystal's `.cr-field-shell`: the Resin surround with the Haze
 * well, as the catalogue's `field` surface says. Until that date it painted its
 * own copy of Resin and its own Haze, which drifted from the recipe.
 *
 * `Mentions` follows the same split. Crystal owns the popover, the rows and the
 * inserted token. The product owns the trigger characters, the data and the
 * insertion, because only the document model knows where a mention goes.
 */
import { useId, useState, type CSSProperties, type ReactNode } from 'react';
import { cx } from '../../styles/cx.js';
import { AnimatePresence } from 'motion/react';
import { usePresenceMotion } from '../../motion/ListPresence.js';
import { Toolbar } from '../Toolbar/Toolbar.js';
import { IconButton } from '../IconButton/IconButton.js';
import { VisuallyHidden } from '../VisuallyHidden/VisuallyHidden.js';
import styles from './RichTextSurface.module.scss';
import { useDistributedErrors } from '../FormField/useDistributedErrors.js';
import { useKeyboardInset } from './useKeyboardInset.js';
import { useFieldMotion } from '../FormField/useInvalidMotion.js';

export interface FormatAction {
  id: string;
  /** What it does, such as "Bold" or "Bulleted list". The control's accessible name. */
  label: string;
  icon: ReactNode;
  /** Whether the current selection already has this format. Becomes `aria-pressed`. */
  isActive?: boolean;
  isDisabled?: boolean;
  onToggle: () => void;
}

export interface RichTextSurfaceProps {
  label: ReactNode;
  /** The formatting controls. Each reports whether the selection already has it. */
  actions?: readonly FormatAction[];
  description?: ReactNode;
  errorMessage?: ReactNode;
  isReadOnly?: boolean;
  isInvalid?: boolean;
  /**
   * The field's name, used only to match a server's errors. Unlike the other
   * fields here this does not submit anything, because this component holds no
   * value: the editor lives in `children` and owns the document, the paste
   * pipeline and the serialisation. Whatever renders there puts a value in the
   * form, through a hidden input of its own or its own submit handling.
   */
  name?: string;
  className?: string;
  /** More toolbar controls after `actions`, such as a block-type menu. */
  toolbar?: ReactNode;
  /**
   * Where the toolbar sits. `auto` puts it above the text on a fine pointer and
   * below it, clear of the on-screen keyboard, on a coarse one.
   */
  toolbarPlacement?: 'auto' | 'top' | 'bottom';
  /** Class for the editable surface, for an engine that needs its own hook. */
  surfaceClassName?: string;
  /**
   * The editor. Whatever renders here owns the document, the paste pipeline and
   * the serialisation. Crystal renders only the frame around it.
   */
  children: ReactNode;
}

export function RichTextSurface({
  label, actions = [], description, errorMessage, isReadOnly = false,
  isInvalid, name, className, toolbar, toolbarPlacement = 'auto', surfaceClassName, children,
}: RichTextSurfaceProps): React.JSX.Element {
  const labelId = useId();
  const validation = useDistributedErrors(name, errorMessage, isInvalid);
  const invalid = validation.isInvalid;
  /* The keyboard inset is read only while the editor has focus, which is the
     only time a keyboard can be open for it. */
  const [focused, setFocused] = useState(false);
  const keyboard = useKeyboardInset(focused);
  /* `field-focus` when focus arrives from outside the field, and the validity
     recipes when it changes, as every other Crystal field plays them. Moving
     between the toolbar and the text is not arriving, so it plays nothing. */
  const [scope, play] = useFieldMotion(invalid);
  const hasToolbar = actions.length > 0 || toolbar !== undefined;

  return (
    <div className={cx(styles['field'], className)}>
      <span id={labelId} className={cx(styles['label'])}>{label}</span>
      <div
        ref={scope as never}
        className={cx(styles['frame'], 'cr-field-shell')}
        data-toolbar={toolbarPlacement}
        style={{ '--cr-keyboard-inset': `${keyboard}px` } as CSSProperties}
        onFocus={(event) => {
          setFocused(true);
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) play('field-focus');
        }}
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setFocused(false);
        }}
        {...(invalid ? { 'data-invalid': true } : {})}
      >
        {hasToolbar ? (
          <Toolbar aria-label={`Formatting for ${typeof label === 'string' ? label : 'the editor'}`} className={cx(styles['toolbar'])}>
            {actions.map((action) => (
              /* aria-pressed, not a class. A bold button that looks pressed but
                 announces as an ordinary button leaves a reader unable to tell
                 whether their selection is already bold. */
              <IconButton
                key={action.id}
                label={action.label}
                icon={action.icon}
                /* Passed only when the product has decided. `isSelected={false}`
                   makes the selection controlled, so an action that does not
                   report its own state would be frozen off and could not
                   toggle. */
                {...(action.isActive !== undefined ? { isSelected: action.isActive } : {})}
                {...(action.isDisabled !== undefined ? { isDisabled: action.isDisabled } : {})}
                onPress={action.onToggle}
              />
            ))}
            {toolbar}
          </Toolbar>
        ) : null}
        <div
          className={cx(styles['surface'], 'cr-scroll-frost', surfaceClassName)}
          {...(isReadOnly ? { 'data-readonly': true } : {})}
        >
          {children}
        </div>
      </div>
      {description ? <span className={cx(styles['description'])}>{description}</span> : null}
      {validation.message ? <span role="alert" className={cx(styles['error'])}>{validation.message}</span> : null}
    </div>
  );
}

export interface MentionOption {
  value: string;
  label: string;
  description?: ReactNode;
}

export interface MentionsProps {
  /** The text surface the popover attaches to. */
  children: ReactNode;
  /** Whether the trigger character has been typed and a list is being offered. */
  isOpen: boolean;
  /** What matches what has been typed since the trigger. */
  options: readonly MentionOption[];
  /** Which row is highlighted. Announced through the surface's own semantics. */
  highlightedValue?: string;
  /** Called when a row is chosen. Insertion is the product's, because only it knows the document. */
  onSelect: (option: MentionOption) => void;
  isLoading?: boolean;
  emptyMessage?: ReactNode;
  /** Names the list of suggestions. A listbox with no name is announced as a
   *  list of nothing in particular. */
  label?: string;
  className?: string;
}

export function Mentions({
  children, isOpen, options, highlightedValue, onSelect,
  isLoading = false, emptyMessage = 'No matches', label = 'Suggestions', className,
}: MentionsProps): React.JSX.Element {
  return (
    <div className={cx(className)}>
      {children}
      {/* The suggestions arrive with `menu-in` and leave with `menu-out`. */}
      <AnimatePresence initial={false}>
        {isOpen ? (
          <Suggestions key="suggestions">
            {isLoading ? (
              <div role="status" aria-live="polite" className={cx(styles['state'])}>Searching</div>
            ) : options.length === 0 ? (
              <div className={cx(styles['state'])}>{emptyMessage}</div>
            ) : (
              /* The text surface points at this listbox and focus does not move
                 into it, because typing must continue while the list is open.
                 The combobox follows the same rule. */
              <ul role="listbox" aria-label={label} className={cx(styles['list'])}>
                {options.map((option) => (
                  <li
                    key={option.value}
                    id={`mention-${option.value}`}
                    role="option"
                    aria-selected={option.value === highlightedValue}
                    className={cx(styles['option'])}
                    {...(option.value === highlightedValue ? { 'data-focused': true } : {})}
                    onMouseDown={(event) => { event.preventDefault(); onSelect(option); }}
                  >
                    {option.label}
                  </li>
                ))}
              </ul>
            )}
          </Suggestions>
        ) : null}
      </AnimatePresence>
      {/* The catalogue asks for the inserted value to be announced, because a
          token appearing in a document is otherwise silent. */}
      <VisuallyHidden as="div" role="status" aria-live="polite">
        {isOpen && options.length > 0 ? `${options.length} matches` : ''}
      </VisuallyHidden>
    </div>
  );
}

function Suggestions({ children }: { children: ReactNode }): React.JSX.Element {
  const presence = usePresenceMotion('menu-in', 'menu-out');
  return <div ref={presence as never} className={cx(styles['popover'], 'cr-frost', 'cr-scroll-frost')}>{children}</div>;
}

'use client';

/* RichTextSurface and Mentions.
 *
 * **Crystal owns the chrome; the product owns the engine.** That is the
 * catalogue's split, in its own words — "product: the entire editing engine,
 * serialisation and paste handling" — and it is the right one. An editor is a
 * document model, a paste pipeline and a serialisation format, and a design
 * system with an opinion about any of those has taken a decision that belongs to
 * the application.
 *
 * So this ships the toolbar, the frame, the surface and the active-format
 * treatment, and takes whatever editor a product brings — TipTap, Lexical,
 * ProseMirror, a plain `contenteditable`. The plan's dependency table names
 * `@tiptap/react` as the choice *if* the library needed an engine; reading the
 * catalogue, it does not, and a bundled editor would be a large dependency
 * imposed on every consumer for a component most of them will not use.
 *
 * The one accessibility rule the chrome owns is the toolbar's: **active
 * formatting is `aria-pressed`.** A bold button that looks pressed and announces
 * as an ordinary button leaves a screen reader user unable to tell whether their
 * selection is already bold — and the whole point of a formatting toolbar is
 * telling you the state of what you have selected.
 *
 * `Mentions` is the other half of the same idea: Crystal owns the popover, the
 * rows and the inserted token; the product owns the trigger characters, the data
 * and the insertion, because where a mention goes in a document is a question
 * only the document model can answer.
 */
import { useId, type ReactNode } from 'react';
import { cx } from '../../styles/cx.js';
import { AnimatePresence } from 'motion/react';
import { usePresenceMotion } from '../../motion/ListPresence.js';
import { Toolbar } from '../Toolbar/Toolbar.js';
import { IconButton } from '../IconButton/IconButton.js';
import { VisuallyHidden } from '../VisuallyHidden/VisuallyHidden.js';
import styles from './RichTextSurface.module.scss';
import { useDistributedErrors } from '../FormField/useDistributedErrors.js';

export interface FormatAction {
  id: string;
  /** What it does — "Bold", "Bulleted list". The control's accessible name. */
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
   * The field's name, **for matching a server's errors only**. Unlike the other
   * fields here this does not submit anything, because this component holds no
   * value: the editor lives in `children` and owns the document, the paste
   * pipeline and the serialisation. Whatever renders there is what puts a value
   * in the form — a hidden input of its own, or its own submit handling.
   */
  name?: string;
  className?: string;
  /**
   * The editor. Whatever renders here owns the document, the paste pipeline and
   * the serialisation — Crystal renders the frame around it and nothing else.
   */
  children: ReactNode;
}

export function RichTextSurface({
  label, actions = [], description, errorMessage, isReadOnly = false,
  isInvalid, name, className, children,
}: RichTextSurfaceProps): React.JSX.Element {
  const labelId = useId();
  const validation = useDistributedErrors(name, errorMessage, isInvalid);
  const invalid = validation.isInvalid;

  return (
    <div className={cx(styles['field'], className)}>
      <span id={labelId} className={cx(styles['label'])}>{label}</span>
      <div className={cx(styles['frame'])} {...(invalid ? { 'data-invalid': true } : {})}>
        {actions.length > 0 ? (
          <Toolbar aria-label={`Formatting for ${typeof label === 'string' ? label : 'the editor'}`} className={cx(styles['toolbar'])}>
            {actions.map((action) => (
              /* aria-pressed, not a class. A bold button that looks pressed and
                 announces as an ordinary button leaves a reader unable to tell
                 whether their selection is already bold — which is the only thing
                 a formatting toolbar is for. */
              <IconButton
                key={action.id}
                label={action.label}
                icon={action.icon}
                /* Said only when the product has decided. `isSelected={false}`
                   is not "this is off" but "I own whether it is on", so an
                   action that does not report its own state was frozen off and
                   could not toggle itself at all. */
                {...(action.isActive !== undefined ? { isSelected: action.isActive } : {})}
                {...(action.isDisabled !== undefined ? { isDisabled: action.isDisabled } : {})}
                onPress={action.onToggle}
              />
            ))}
          </Toolbar>
        ) : null}
        <div
          className={cx(styles['surface'], 'cr-scroll-frost')}
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
  /** Called when a row is chosen. Insertion is the product's — only it knows the document. */
  onSelect: (option: MentionOption) => void;
  isLoading?: boolean;
  emptyMessage?: ReactNode;
  className?: string;
}

export function Mentions({
  children, isOpen, options, highlightedValue, onSelect,
  isLoading = false, emptyMessage = 'No matches', className,
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
              /* A listbox the text surface points at rather than one focus moves
                 into: typing must continue while the list is open, which is the
                 same rule the combobox follows. */
              <ul role="listbox" className={cx(styles['list'])}>
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
      {/* The inserted value is announced, which the catalogue asks for: a token
          appearing in a document is otherwise silent. */}
      <VisuallyHidden as="div" role="status" aria-live="polite">
        {isOpen && options.length > 0 ? `${options.length} matches` : ''}
      </VisuallyHidden>
    </div>
  );
}

function Suggestions({ children }: { children: ReactNode }): React.JSX.Element {
  const presence = usePresenceMotion('menu-in', 'menu-out');
  return <div ref={presence as never} className={cx(styles['popover'], 'cr-scroll-frost')}>{children}</div>;
}

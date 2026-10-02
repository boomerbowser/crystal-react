'use client';

/* CommandPalette.
 *
 * React Aria's `Autocomplete` is the primitive. The implementation plan chose
 * it over `cmdk` because it is the same combobox that already carries
 * `ComboBox` in this library, so there is one keyboard model to get right, and
 * no second dependency whose licence and maintenance have to be tracked.
 *
 * Focus never leaves the search field. The list is navigated with the arrow
 * keys while the caret stays where you are typing, and the highlighted row is
 * named by `aria-activedescendant`. If real focus moves into the list, typing
 * stops working and the user has to arrow back up to keep searching. React Aria
 * calls this virtual focus and `Autocomplete` provides it. Crystal must not undo
 * it.
 *
 * ## Three materials, and the catalogue names each
 *
 * "Mirage scrim, Haze decision surface, Resin field shell." The palette is a
 * surface you read and decide from, so it is Haze, and the Mirage beneath lifts
 * it off the page with no added elevation. The search field inside it is a
 * control, so it is Resin: a control plane on a content fill. That is the
 * ordinary field stack, and is not Resin inside Resin.
 *
 * ## Searching, empty and loading are three different things
 *
 * A list showing nothing looks the same as one still loading, and both look
 * like a broken palette. Each state says which it is, in text, and the loading
 * state is announced, because a spinner is not.
 */
import { useEffect, useMemo, useRef, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  Modal,
  ModalOverlay,
  Dialog as AriaDialog,
  Autocomplete,
  SearchField,
  Input,
  Label,
  ListBox,
  ListBoxItem,
  ListBoxSection,
  Header,
  Keyboard,
  Text,
  useFilter,
  type ModalOverlayProps,
  type Key,
} from 'react-aria-components';
import { useMotion } from '../../motion/useMotion.js';
import { usePresetMotion } from '../../motion/usePresetMotion.js';
import { VisuallyHidden } from '../VisuallyHidden/VisuallyHidden.js';
import { cx } from '../../styles/cx.js';
import { PresenceExit } from '../../motion/PresenceExit.js';
import styles from './CommandPalette.module.scss';

const SearchIcon = (
  <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
    <circle cx="11" cy="11" r="7" />
    <path d="M20 20l-4.2-4.2" />
  </svg>
);

export interface Command {
  id: string;
  label: string;
  /** Shown beneath the label and announced with it. */
  description?: ReactNode;
  /** The keystroke that does the same thing, shown and announced as a shortcut. */
  shortcut?: string;
  icon?: ReactNode;
  /** Which group it belongs to. Commands with no section are listed first. */
  section?: string;
  isDisabled?: boolean;
}

export interface CommandPaletteProps extends Omit<ModalOverlayProps,
  'className' | 'children' | 'style' | 'onAnimationStart' | 'onAnimationEnd' | 'onAnimationIteration'> {
  /** Every command the palette can run. The product owns this registry. */
  commands: readonly Command[];
  /** Run when a command is chosen. The palette does not close itself; the product decides. */
  onAction: (id: Key) => void;
  /** What the field asks for. Also the palette's accessible name. */
  label?: string;
  placeholder?: string;
  /**
   * The registry is still arriving. The palette says so in text, because an
   * empty list looks the same as "nothing matched".
   */
  isLoading?: boolean;
  /** What to say when the search matches nothing. */
  emptyMessage?: ReactNode;
  className?: string;
}

type OverlayProps = Omit<ModalOverlayProps, 'onAnimationStart' | 'onAnimationEnd' | 'onAnimationIteration'>;
const MotionOverlay = motion.create(
  ModalOverlay as React.ForwardRefExoticComponent<OverlayProps & React.RefAttributes<HTMLDivElement>>,
);

/** Groups in first-appearance order, ungrouped commands first. */
export function groupCommands(commands: readonly Command[]): { section?: string; commands: Command[] }[] {
  const groups: { section?: string; commands: Command[] }[] = [];
  const bySection = new Map<string, { section?: string; commands: Command[] }>();
  for (const command of commands) {
    const key = command.section ?? '';
    let group = bySection.get(key);
    if (!group) {
      group = command.section === undefined ? { commands: [] } : { section: command.section, commands: [] };
      bySection.set(key, group);
      groups.push(group);
    }
    group.commands.push(command);
  }
  /* Ungrouped first, then the rest in the order the registry declared them. The
     registry's order is a product decision, usually most-used first, so it is
     not sorted alphabetically here. */
  return groups.sort((a, b) => Number(a.section !== undefined) - Number(b.section !== undefined));
}

export function CommandPalette({
  commands, onAction, label = 'Run a command', placeholder = 'Search commands',
  isLoading = false, emptyMessage = 'No matching commands', className, ...props
}: CommandPaletteProps): React.JSX.Element {
  /* Locale-aware and accent-insensitive. A plain `toLowerCase().includes` fails
     for every reader whose language has more than one way of writing the same
     letter. */
  const { contains } = useFilter({ sensitivity: 'base' });
  const groups = useMemo(() => groupCommands(commands), [commands]);
  /* The recipe scales the whole palette, so it plays on the surface. */
  const [scope, play] = useMotion();
  /* The catalogue puts the palette on a Mirage scrim, and Mirage washes in and
     withdraws with Crystal's `mirage` and `mirage-out`, from the preset module. */
  const wash = usePresetMotion('mirage', 'mirage-out', { active: props.isOpen === true });

  return (
    <AnimatePresence>
      {props.isOpen ? (
        <MotionOverlay
          {...props}
          isOpen
          className={cx(styles['scrim'])}
          {...wash}
        >
          <Modal className={cx(styles['holder'])}>
            <AriaDialog
              ref={scope as never}
              aria-label={label}
              className={cx(styles['palette'], className)}
            >
              <Sweep play={play} />
              {/* And `menu-out` as it closes: the palette is inside
                  `AnimatePresence` for its scrim, which waits for this too. */}
              <PresenceExit play={play} recipe="menu-out" />
              <Autocomplete filter={contains}>
                {/* A real `<label>`, hidden, instead of an `aria-label`, and
                    never both. The two compose into `aria-labelledby` pointing
                    at the input and the label, which gives the field the wrong
                    name. A label element is also the one a click can focus. */}
                <SearchField className={cx(styles['field'], 'cr-field-shell')} autoFocus>
                  <VisuallyHidden as="span"><Label>{label}</Label></VisuallyHidden>
                  <span className={cx(styles['searchIcon'])} aria-hidden="true">{SearchIcon}</span>
                  <Input placeholder={placeholder} className={cx(styles['input'])} />
                </SearchField>

                {/* Announced as well as shown. A spinner says nothing to a
                    screen reader, and "nothing here" and "not finished yet"
                    are different answers. */}
                {isLoading ? (
                  <div className={cx(styles['status'])} role="status">Loading commands…</div>
                ) : (
                  <ListBox
                    className={cx(styles['results'], 'cr-scroll-resin')}
                    aria-label={label}
                    /* Each row runs its command. Nothing stays selected, because
                       a palette runs actions and is not a list you pick from. */
                    selectionMode="none"
                    onAction={onAction}
                    renderEmptyState={() => (
                      <div className={cx(styles['status'])} role="status">{emptyMessage}</div>
                    )}
                  >
                    {groups.map((group) => (
                      <ListBoxSection
                        key={group.section ?? '—'}
                        className={cx(styles['section'])}
                        {...(group.section ? { 'aria-label': group.section } : {})}
                      >
                        {group.section
                          ? <Header className={cx(styles['heading'])}>{group.section}</Header>
                          : null}
                        {group.commands.map((command) => (
                          <ListBoxItem
                            key={command.id}
                            id={command.id}
                            textValue={command.label}
                            className={cx(styles['row'])}
                            {...(command.isDisabled === undefined ? {} : { isDisabled: command.isDisabled })}
                          >
                            {command.icon
                              ? <span className={cx(styles['icon'])} aria-hidden="true">{command.icon}</span>
                              : null}
                            <span className={cx(styles['labels'])}>
                              <Text slot="label" className={cx(styles['label'])}>{command.label}</Text>
                              {command.description
                                ? <Text slot="description" className={cx(styles['description'])}>{command.description}</Text>
                                : null}
                            </span>
                            {/* `Keyboard` is announced as the shortcut, so a
                                screen reader says "Open settings, Control
                                comma" and does not run the two together. */}
                            {command.shortcut
                              ? <Keyboard className={cx(styles['shortcut'])}>{command.shortcut}</Keyboard>
                              : null}
                          </ListBoxItem>
                        ))}
                      </ListBoxSection>
                    ))}
                  </ListBox>
                )}
              </Autocomplete>
            </AriaDialog>
          </Modal>
        </MotionOverlay>
      ) : null}
    </AnimatePresence>
  );
}

/** Plays `menu-in` once, on the mount that is the arrival. */
function Sweep({ play }: { play: (name: string) => void }): null {
  const played = useRef(false);
  useEffect(() => {
    if (played.current) return;
    played.current = true;
    play('menu-in');
  }, [play]);
  return null;
}

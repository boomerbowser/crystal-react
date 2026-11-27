'use client';

/* Slash commands: type "/" in the text and pick what the block should become.
 *
 * The block menu of a document editor in the manner of Notion: "/" at the
 * start of a line, or after a space, opens a list of block types under the
 * caret; typing filters it ("/head" leaves the headings); the arrow keys move
 * through it, Enter or Tab applies, and Escape closes it and leaves the "/"
 * as typed. Focus never leaves the text, so the caret and everything typed stay
 * where they were.
 *
 * For a screen reader the text field becomes the menu's owner while it is open,
 * the combobox pattern on a textbox: `aria-expanded`, `aria-controls` and
 * `aria-activedescendant` on the editable element, pointing at a `listbox`
 * whose options are the commands. The option the arrows reach is announced as
 * it is reached, and nothing else is said. The menu is Frost, as every surface
 * that opens over content is (R15e).
 *
 * Built on TipTap's `@tiptap/suggestion`, the plugin its own mention and emoji
 * extensions use. The plugin reports where the "/" is and what follows it; the
 * menu is a small store this module owns, rendered by React.
 */
import { Extension, type Editor, type Range } from '@tiptap/core';
import { PluginKey } from '@tiptap/pm/state';
import { Suggestion } from '@tiptap/suggestion';
import { useEffect, useId, useSyncExternalStore, type ReactNode } from 'react';
import { BLOCK_TYPES, FORMAT_ICONS, LISTS, type FormatId } from '../components/RichTextSurface/formats.js';
import { cx } from '../styles/cx.js';
import styles from './RichTextEditor.module.scss';

export interface SlashCommand {
  id: string;
  label: string;
  /** Words that also find it: "/h2" and "/title" both reach a heading. */
  keywords: readonly string[];
  icon?: ReactNode;
  /** The format it stands for, so a subset editor offers only its own. */
  format?: FormatId;
  run: (editor: Editor, range: Range) => void;
}

const heading = (level: 2 | 3 | 4) => (editor: Editor, range: Range) => {
  editor.chain().focus().deleteRange(range).setHeading({ level }).run();
};

const label = (id: FormatId): string => [...BLOCK_TYPES, ...LISTS].find((format) => format.id === id)?.label ?? id;

const HeadingGlyph = ({ level }: { level: number }): ReactNode => (
  <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
    <text x="12" y="16.5" textAnchor="middle" fontSize="12" fontWeight="800" fill="currentColor" stroke="none">{`H${level}`}</text>
  </svg>
);

const DividerGlyph = (
  <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true"><path d="M4 12h16" /></svg>
);

/** Every command, in menu order. */
export const SLASH_COMMANDS: readonly SlashCommand[] = [
  {
    id: 'paragraph', format: 'paragraph', label: 'Text', keywords: ['paragraph', 'plain', 'text'],
    icon: FORMAT_ICONS.paragraph,
    run: (editor, range) => { editor.chain().focus().deleteRange(range).setParagraph().run(); },
  },
  { id: 'heading-2', format: 'heading-2', label: label('heading-2'), keywords: ['h2', 'title', 'heading'], icon: <HeadingGlyph level={2} />, run: heading(2) },
  { id: 'heading-3', format: 'heading-3', label: label('heading-3'), keywords: ['h3', 'subheading', 'heading'], icon: <HeadingGlyph level={3} />, run: heading(3) },
  { id: 'heading-4', format: 'heading-4', label: label('heading-4'), keywords: ['h4', 'minor', 'heading'], icon: <HeadingGlyph level={4} />, run: heading(4) },
  {
    id: 'bullet-list', format: 'bullet-list', label: label('bullet-list'), keywords: ['bullet', 'unordered', 'list', 'ul'],
    icon: FORMAT_ICONS['bullet-list'],
    run: (editor, range) => { editor.chain().focus().deleteRange(range).toggleBulletList().run(); },
  },
  {
    id: 'ordered-list', format: 'ordered-list', label: label('ordered-list'), keywords: ['numbered', 'ordered', 'list', 'ol'],
    icon: FORMAT_ICONS['ordered-list'],
    run: (editor, range) => { editor.chain().focus().deleteRange(range).toggleOrderedList().run(); },
  },
  {
    id: 'checklist', format: 'checklist', label: label('checklist'), keywords: ['todo', 'task', 'checkbox', 'check'],
    icon: FORMAT_ICONS.checklist,
    run: (editor, range) => { editor.chain().focus().deleteRange(range).toggleTaskList().run(); },
  },
  {
    id: 'blockquote', format: 'blockquote', label: label('blockquote'), keywords: ['quote', 'blockquote', 'citation'],
    icon: FORMAT_ICONS.blockquote,
    run: (editor, range) => { editor.chain().focus().deleteRange(range).setParagraph().setBlockquote().run(); },
  },
  {
    id: 'code-block', format: 'code-block', label: label('code-block'), keywords: ['code', 'pre', 'snippet'],
    icon: FORMAT_ICONS['code-block'],
    run: (editor, range) => { editor.chain().focus().deleteRange(range).setCodeBlock().run(); },
  },
  {
    id: 'divider', label: 'Divider', keywords: ['rule', 'line', 'separator', 'hr', 'divider'],
    icon: DividerGlyph,
    run: (editor, range) => { editor.chain().focus().deleteRange(range).setHorizontalRule().run(); },
  },
];

/** The commands that match what was typed after the "/". */
export function matchCommands(commands: readonly SlashCommand[], query: string): SlashCommand[] {
  const words = query.trim().toLowerCase();
  if (!words) return [...commands];
  return commands.filter((command) => command.label.toLowerCase().includes(words)
    || command.keywords.some((keyword) => keyword.startsWith(words)));
}

/* The menu's state, kept outside React so the ProseMirror plugin can drive it
   and React can read it. */
export interface SlashState {
  open: boolean;
  items: SlashCommand[];
  index: number;
  rect: DOMRect | null;
  range: Range | null;
}

const CLOSED: SlashState = { open: false, items: [], index: 0, rect: null, range: null };

export interface SlashStore {
  get: () => SlashState;
  set: (next: SlashState) => void;
  subscribe: (listener: () => void) => () => void;
  /** Whether "/" opens the menu at all, read at each keystroke. */
  enabled: () => boolean;
}

export function createSlashStore(enabled: () => boolean): SlashStore {
  let state = CLOSED;
  const listeners = new Set<() => void>();
  return {
    get: () => state,
    set: (next) => { state = next; for (const listener of listeners) listener(); },
    subscribe: (listener) => { listeners.add(listener); return () => { listeners.delete(listener); }; },
    enabled,
  };
}

const slashKey = new PluginKey('prismataSlashCommands');

/** The TipTap extension. `commands` is the set the menu offers. */
export function slashCommandsExtension(store: SlashStore, commands: () => readonly SlashCommand[]) {
  return Extension.create({
    name: 'prismataSlashCommands',
    addProseMirrorPlugins() {
      const { editor } = this;
      return [
        Suggestion<SlashCommand, SlashCommand>({
          editor,
          pluginKey: slashKey,
          char: '/',
          /* After a space or at the start of a line, so a "/" in a URL or a
             fraction is only a character. */
          allowedPrefixes: [' '],
          allow: ({ state }) => store.enabled() && !state.selection.$from.parent.type.spec.code,
          items: ({ query }) => matchCommands(commands(), query),
          command: ({ editor: current, range, props }) => { props.run(current, range); },
          render: () => ({
            onStart: (props) => {
              store.set({ open: true, items: props.items, index: 0, rect: props.clientRect?.() ?? null, range: props.range });
            },
            onUpdate: (props) => {
              const before = store.get();
              store.set({
                open: true,
                items: props.items,
                index: Math.min(before.index, Math.max(0, props.items.length - 1)),
                rect: props.clientRect?.() ?? before.rect,
                range: props.range,
              });
            },
            onKeyDown: ({ event }) => {
              const now = store.get();
              if (!now.open) return false;
              if (event.key === 'Escape') { store.set(CLOSED); return true; }
              if (now.items.length === 0) return false;
              if (event.key === 'ArrowDown') {
                store.set({ ...now, index: (now.index + 1) % now.items.length });
                return true;
              }
              if (event.key === 'ArrowUp') {
                store.set({ ...now, index: (now.index - 1 + now.items.length) % now.items.length });
                return true;
              }
              if (event.key === 'Enter' || event.key === 'Tab') {
                const chosen = now.items[now.index];
                if (chosen && now.range) {
                  store.set(CLOSED);
                  chosen.run(editor, now.range);
                }
                return true;
              }
              return false;
            },
            onExit: () => { store.set(CLOSED); },
          }),
        }),
      ];
    },
  });
}

/** The menu, rendered under the "/" while it is open. */
export function SlashMenu({ store, editor }: { store: SlashStore; editor: Editor }): ReactNode {
  const state = useSyncExternalStore(store.subscribe, store.get, store.get);
  const id = useId();
  const optionId = (index: number) => `${id}-option-${index}`;

  /* The text field owns the menu while it is open, so a screen reader hears
     the option the arrows reach without focus leaving the text. */
  useEffect(() => {
    const field = editor.view.dom as HTMLElement;
    if (state.open && state.items.length > 0) {
      field.setAttribute('aria-expanded', 'true');
      field.setAttribute('aria-controls', `${id}-list`);
      field.setAttribute('aria-activedescendant', optionId(state.index));
    } else {
      field.removeAttribute('aria-expanded');
      field.removeAttribute('aria-controls');
      field.removeAttribute('aria-activedescendant');
    }
  });

  /* The option the arrows reach stays in view in a long list. */
  useEffect(() => {
    if (!state.open) return;
    const option = globalThis.document?.getElementById(optionId(state.index));
    option?.scrollIntoView?.({ block: 'nearest' });
  });

  if (!state.open || !state.rect) return null;

  return (
    <div
      className={cx('pr-frost', styles['slash'])}
      style={{ insetBlockStart: `${state.rect.bottom + 6}px`, insetInlineStart: `${state.rect.left}px` }}
    >
      {state.items.length === 0 ? (
        <p className={styles['slashEmpty']}>No matching blocks</p>
      ) : (
        <ul id={`${id}-list`} role="listbox" aria-label="Turn into" className={styles['slashList']}>
          {state.items.map((command, index) => (
            /* A pointer picks with a press; mousedown is cancelled so the text
               keeps focus and the caret stays where it was. The keyboard
               reaches the options through the text field, as described above. */
            // eslint-disable-next-line jsx-a11y/click-events-have-key-events -- the keys are the text field's, through aria-activedescendant
            <li
              key={command.id}
              id={optionId(index)}
              role="option"
              aria-selected={index === state.index}
              className={styles['slashOption']}
              data-active={index === state.index ? '' : undefined}
              onMouseDown={(event) => { event.preventDefault(); }}
              onMouseEnter={() => { store.set({ ...store.get(), index }); }}
              onClick={() => {
                if (!state.range) return;
                store.set({ ...store.get(), open: false });
                command.run(editor, state.range);
              }}
            >
              <span aria-hidden="true" className={styles['slashIcon']}>{command.icon}</span>
              <span>{command.label}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

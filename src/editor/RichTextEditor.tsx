'use client';

/* RichTextEditor: Crystal's rich text surface with an engine bound to it.
 *
 * `RichTextSurface` is engine-agnostic by the catalogue's rule ("the entire
 * editing engine, serialisation and paste handling" is the product's), and it
 * stays that way. This is the optional half: a binding of TipTap 3
 * (ProseMirror) to Crystal's format vocabulary, shipped from its own entry
 * point, `@crystal-ui/react/editor`, with TipTap as optional peer dependencies.
 * A product that never imports it never installs or bundles an editor. Whether
 * a design-system library should ship a binding at all is Crystal's open
 * decision D-30; this exists because Meridian's own review of the text element
 * asked for headings, lists, checklists, underline, strikethrough and touch
 * support, and an engine-agnostic surface cannot give a product any of them.
 *
 * What it does, beyond the surface:
 *
 *   - The whole format vocabulary (`formats.tsx`): a block-type menu
 *     (paragraph, three heading levels, quotation, code block), the marks
 *     (bold, italic, underline, strikethrough, inline code, highlight, link,
 *     subscript, superscript), the three lists including a checklist of real
 *     checkboxes, indent and outdent, undo and redo. `formats` chooses a subset.
 *   - Formatting state follows the caret. Every mark is a toggle with
 *     `aria-pressed`, and the block-type control names the block the caret is
 *     in, read from the engine on every transaction.
 *   - A change made by a keyboard shortcut is announced politely ("Bold on"),
 *     because the toolbar that would show it is out of reach while typing.
 *   - The caret is helped where ProseMirror helps it: a gap cursor lets the
 *     caret stop between two blocks that are not text (two code blocks, a list
 *     and a rule), a drop cursor shows where a drag will land, and Markdown
 *     input rules turn "## ", "- ", "1. ", "[ ] ", "> " and "```" into the
 *     block they mean as they are typed.
 *   - A selection toolbar (Frost, R15e) floats over highlighted text with the
 *     commonest marks. Alt+F10 moves focus from the text to the toolbar, as in
 *     every desktop word processor, and Escape returns it.
 *   - Touch: the surface puts the toolbar below the text and above the
 *     on-screen keyboard; indent, outdent, undo and redo are on it because a
 *     phone keyboard has none of their keys.
 *   - `name` writes the document as HTML to a hidden input, so the editor
 *     submits with its form like any other field.
 */
import {
  forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState,
  type ReactNode,
} from 'react';
import { DialogTrigger } from 'react-aria-components';
import {
  EditorContent, useEditor, useEditorState, type Editor, type Extensions, type Content,
} from '@tiptap/react';
import { BubbleMenu } from '@tiptap/react/menus';
import { StarterKit } from '@tiptap/starter-kit';
import { TaskItem, TaskList } from '@tiptap/extension-list';
import { Highlight } from '@tiptap/extension-highlight';
import { Subscript } from '@tiptap/extension-subscript';
import { Superscript } from '@tiptap/extension-superscript';
import { Placeholder } from '@tiptap/extensions';
import { RichTextSurface } from '../components/RichTextSurface/RichTextSurface.js';
import {
  BLOCK_TYPES, HISTORY, LISTS, MARKS, STRUCTURE, displayShortcut,
  type BlockType, type FormatDefinition, type FormatId,
} from '../components/RichTextSurface/formats.js';
import { IconButton } from '../components/IconButton/IconButton.js';
import { Button } from '../components/Button/Button.js';
import { Menu, MenuGroup, MenuItem, MenuTrigger } from '../components/Menu/Menu.js';
import { Popover } from '../components/Popover/Popover.js';
import { TextInput } from '../components/TextInput/TextInput.js';
import { VisuallyHidden } from '../components/VisuallyHidden/VisuallyHidden.js';
import { cx } from '../styles/cx.js';
import styles from './RichTextEditor.module.scss';

export interface RichTextEditorValue {
  html: string;
  json: ReturnType<Editor['getJSON']>;
  text: string;
}

export interface RichTextEditorProps {
  /** The field's visible label. */
  label: ReactNode;
  description?: ReactNode;
  errorMessage?: ReactNode;
  isInvalid?: boolean;
  isReadOnly?: boolean;
  /** The document to start from: HTML, or TipTap JSON. Uncontrolled. */
  defaultValue?: Content;
  /** Called after every change, with the document in three forms. */
  onChange?: (value: RichTextEditorValue) => void;
  /** Submits the document as HTML under this name, like any other field. */
  name?: string;
  /** The prompt shown in an empty document. */
  placeholder?: string;
  /** The formats to offer, by id. All of them when omitted. */
  formats?: readonly FormatId[];
  /** The selection toolbar over highlighted text. On by default. */
  selectionToolbar?: boolean;
  /** Where the toolbar sits; see `RichTextSurface`. */
  toolbarPlacement?: 'auto' | 'top' | 'bottom';
  /** Extensions added to Crystal's, for a product's own nodes or marks. */
  extensions?: Extensions;
  autoFocus?: boolean;
  className?: string;
}

/** The engine, for a product that needs to drive it directly. */
export interface RichTextEditorHandle {
  editor: Editor | null;
}

const isApplePlatform = (): boolean => typeof navigator !== 'undefined'
  && /Mac|iPhone|iPad|iPod/.test(navigator.platform || navigator.userAgent);

/* Which block the caret is in, as one of Crystal's block types. */
function blockTypeOf(editor: Editor): BlockType {
  if (editor.isActive('heading', { level: 2 })) return 'heading-2';
  if (editor.isActive('heading', { level: 3 })) return 'heading-3';
  if (editor.isActive('heading', { level: 4 })) return 'heading-4';
  if (editor.isActive('codeBlock')) return 'code-block';
  if (editor.isActive('blockquote')) return 'blockquote';
  return 'paragraph';
}

const MARK_NAME: Record<string, string> = {
  bold: 'bold', italic: 'italic', underline: 'underline', strike: 'strike', code: 'code',
  highlight: 'highlight', link: 'link', subscript: 'subscript', superscript: 'superscript',
};

const LIST_NAME: Record<string, string> = {
  'bullet-list': 'bulletList', 'ordered-list': 'orderedList', checklist: 'taskList',
};

function setBlockType(editor: Editor, type: BlockType): void {
  const chain = editor.chain().focus();
  switch (type) {
    case 'heading-2': chain.setHeading({ level: 2 }).run(); break;
    case 'heading-3': chain.setHeading({ level: 3 }).run(); break;
    case 'heading-4': chain.setHeading({ level: 4 }).run(); break;
    case 'blockquote': chain.setParagraph().setBlockquote().run(); break;
    case 'code-block': chain.setCodeBlock().run(); break;
    default: chain.setParagraph().unsetBlockquote().run(); break;
  }
}

function toggleMark(editor: Editor, id: string): void {
  const chain = editor.chain().focus();
  switch (id) {
    case 'bold': chain.toggleBold().run(); break;
    case 'italic': chain.toggleItalic().run(); break;
    case 'underline': chain.toggleUnderline().run(); break;
    case 'strike': chain.toggleStrike().run(); break;
    case 'code': chain.toggleCode().run(); break;
    case 'highlight': chain.toggleHighlight().run(); break;
    /* Subscript and superscript exclude each other, as they do in print. */
    case 'subscript': chain.unsetSuperscript().toggleSubscript().run(); break;
    case 'superscript': chain.unsetSubscript().toggleSuperscript().run(); break;
    default: break;
  }
}

function toggleList(editor: Editor, id: string): void {
  const chain = editor.chain().focus();
  if (id === 'bullet-list') chain.toggleBulletList().run();
  else if (id === 'ordered-list') chain.toggleOrderedList().run();
  else if (id === 'checklist') chain.toggleTaskList().run();
}

/* The item type the caret's list is made of, for indent and outdent. */
function listItemType(editor: Editor): 'listItem' | 'taskItem' | null {
  if (editor.isActive('taskItem')) return 'taskItem';
  if (editor.isActive('listItem')) return 'listItem';
  return null;
}

/* The words a shortcut-made change is announced in. */
const SPOKEN: Record<string, string> = Object.fromEntries(
  [...MARKS, ...LISTS].map((format) => [format.id, format.label]),
);

/** Link editing: a popover with the address, opened from the toolbar, from the
 *  selection toolbar and with Mod+K. */
function LinkControl({ editor, isActive, isOpen, onOpenChange }: {
  editor: Editor; isActive: boolean; isOpen: boolean; onOpenChange: (open: boolean) => void;
}): ReactNode {
  const [href, setHref] = useState('');
  useEffect(() => {
    if (isOpen) setHref((editor.getAttributes('link')['href'] as string | undefined) ?? '');
  }, [isOpen, editor]);

  const apply = (): void => {
    const value = href.trim();
    const chain = editor.chain().focus().extendMarkRange('link');
    if (value) chain.setLink({ href: value }).run();
    else chain.unsetLink().run();
    onOpenChange(false);
  };

  return (
    <DialogTrigger isOpen={isOpen} onOpenChange={onOpenChange}>
      <IconButton label="Link" icon={MARKS.find((mark) => mark.id === 'link')!.icon} isSelected={isActive} />
      <Popover label="Link" placement="bottom">
        <form
          className={styles['link']}
          onSubmit={(event) => { event.preventDefault(); apply(); }}
        >
          <TextInput
            label="Address"
            type="url"
            inputMode="url"
            value={href}
            onChange={setHref}
            placeholder="https://"
            autoFocus
          />
          <div className={styles['linkActions']}>
            {isActive ? (
              <Button
                variant="quiet"
                onPress={() => { editor.chain().focus().extendMarkRange('link').unsetLink().run(); onOpenChange(false); }}
              >
                Remove link
              </Button>
            ) : null}
            <Button variant="primary" type="submit">Apply</Button>
          </div>
        </form>
      </Popover>
    </DialogTrigger>
  );
}

export const RichTextEditor = forwardRef<RichTextEditorHandle, RichTextEditorProps>(function RichTextEditor({
  label, description, errorMessage, isInvalid, isReadOnly = false, defaultValue = '', onChange, name,
  placeholder, formats, selectionToolbar = true, toolbarPlacement = 'auto', extensions = [],
  autoFocus = false, className,
}, ref): ReactNode {
  const offered = useMemo(() => new Set<FormatId>(formats ?? [
    ...BLOCK_TYPES, ...MARKS, ...LISTS, ...STRUCTURE, ...HISTORY,
  ].map((format) => format.id)), [formats]);
  const offer = (list: readonly FormatDefinition[]): FormatDefinition[] => list.filter((format) => offered.has(format.id));

  const [html, setHtml] = useState('');
  const [said, setSaid] = useState('');
  const [linkOpen, setLinkOpen] = useState(false);
  /* Whether the last change came from the keyboard inside the text, which is
     when it has to be announced: the toolbar showing it is out of reach. */
  const typedFormat = useRef(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3, 4] },
        link: { openOnClick: false, autolink: true, linkOnPaste: true, defaultProtocol: 'https' },
      }),
      TaskList,
      /* Nested checklists, as nested bulleted lists are. */
      TaskItem.configure({ nested: true }),
      Highlight,
      Subscript,
      Superscript,
      Placeholder.configure({ placeholder: placeholder ?? '' }),
      ...extensions,
    ],
    content: defaultValue,
    editable: !isReadOnly,
    autofocus: autoFocus,
    /* Rendered on the client after mount, so the server and the first client
       render agree. */
    immediatelyRender: false,
    editorProps: {
      attributes: {
        role: 'textbox',
        'aria-multiline': 'true',
        ...(typeof label === 'string' ? { 'aria-label': label } : {}),
        ...(isInvalid ? { 'aria-invalid': 'true' } : {}),
      },
      handleKeyDown: (view, event) => {
        /* Alt+F10 goes to the toolbar, the convention every word processor
           shares; Mod+K opens the link control. */
        if (event.altKey && event.key === 'F10') {
          event.preventDefault();
          view.dom.closest('[data-toolbar]')?.querySelector<HTMLElement>('[role="toolbar"] button:not([disabled])')?.focus();
          return true;
        }
        if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k' && offered.has('link')) {
          event.preventDefault();
          setLinkOpen(true);
          return true;
        }
        typedFormat.current = event.metaKey || event.ctrlKey;
        return false;
      },
    },
    onUpdate: ({ editor: current, transaction }) => {
      const value = { html: current.getHTML(), json: current.getJSON(), text: current.getText() };
      setHtml(value.html);
      /* TipTap also emits an update when editability is set, which happens on
         mount, with a transaction that changes nothing. Reporting it made
         `onChange` say the document was edited before anyone typed, so a
         product marking it dirty showed "Unsaved changes" on load. Only a
         change to the document is reported. */
      if (transaction.docChanged) onChange?.(value);
    },
    onCreate: ({ editor: current }) => setHtml(current.getHTML()),
  });

  useImperativeHandle(ref, () => ({ editor }), [editor]);

  useEffect(() => { editor?.setEditable(!isReadOnly); }, [editor, isReadOnly]);

  /* The formatting state at the caret, read on every transaction. */
  const state = useEditorState({
    editor,
    selector: ({ editor: current }) => {
      if (!current) return null;
      const active: Record<string, boolean> = {};
      for (const mark of MARKS) active[mark.id] = current.isActive(MARK_NAME[mark.id]!);
      for (const list of LISTS) active[list.id] = current.isActive(LIST_NAME[list.id]!);
      const item = listItemType(current);
      return {
        active,
        block: blockTypeOf(current),
        canIndent: item ? current.can().sinkListItem(item) : false,
        canOutdent: item ? current.can().liftListItem(item) : false,
        canUndo: current.can().undo(),
        canRedo: current.can().redo(),
      };
    },
  });

  /* Announce a format a shortcut changed while focus was in the text. */
  const previous = useRef<Record<string, boolean> | null>(null);
  useEffect(() => {
    if (!state) return;
    const before = previous.current;
    previous.current = state.active;
    if (!before || !typedFormat.current) return;
    typedFormat.current = false;
    const changes = Object.keys(state.active)
      .filter((id) => before[id] !== state.active[id] && SPOKEN[id])
      .map((id) => `${SPOKEN[id]} ${state.active[id] ? 'on' : 'off'}`);
    if (changes.length) setSaid(changes.join(', '));
  }, [state]);

  /* A press on a toolbar is seen as it happens, so it is not announced as
     well; only a shortcut typed in the text is. */
  const run = useCallback((fn: (current: Editor) => void) => {
    typedFormat.current = false;
    if (editor) fn(editor);
  }, [editor]);

  if (!editor || !state) {
    /* Before the engine mounts: the field and its label, so the page does not
       jump and the label is there for a reader from the first paint. */
    return (
      <RichTextSurface
        label={label}
        {...(description ? { description } : {})}
        isReadOnly={isReadOnly}
        className={cx(styles['editor'], className)}
      >
        <div className={styles['placeholderBody']} />
      </RichTextSurface>
    );
  }

  const blockTypes = offer(BLOCK_TYPES);
  const currentBlock = BLOCK_TYPES.find((type) => type.id === state.block)!;
  const marks = offer(MARKS).filter((mark) => mark.id !== 'link');
  const lists = offer(LISTS);
  const structure = offer(STRUCTURE);
  const history = offer(HISTORY);

  const toolbar = isReadOnly ? undefined : (
    <>
      {blockTypes.length > 1 ? (
        <MenuTrigger>
          {/* Bare: the toolbar sits on the field shell's Resin, and Resin never
              contains Resin. It keeps the 48px target and the focus ring. */}
          <Button variant="quiet" aria-label={`Block type, ${currentBlock.label}`} className={cx(styles['blockType'], 'cr-bare')}>
            <span aria-hidden="true">{currentBlock.label}</span>
            <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true" className={styles['chevron']}><path d="m6 9 6 6 6-6" /></svg>
          </Button>
          <Menu label="Block type">
            <MenuGroup
              selectionMode="single"
              selectedKey={state.block}
              onSelectionChange={(key) => run((current) => setBlockType(current, key as BlockType))}
            >
              {blockTypes.map((type) => (
                <MenuItem key={type.id} id={type.id} {...(type.shortcut ? { shortcut: displayShortcut(type.shortcut, isApplePlatform()) } : {})}>
                  <span className={styles[`preview-${type.id}`]}>{type.label}</span>
                </MenuItem>
              ))}
            </MenuGroup>
          </Menu>
        </MenuTrigger>
      ) : null}
      {blockTypes.length > 1 && (marks.length || offered.has('link')) ? <span role="separator" aria-orientation="vertical" /> : null}
      {marks.map((mark) => (
        <IconButton
          key={mark.id}
          label={mark.label}
          icon={mark.icon}
          isSelected={state.active[mark.id] === true}
          onPress={() => run((current) => toggleMark(current, mark.id))}
        />
      ))}
      {offered.has('link') ? (
        <LinkControl editor={editor} isActive={state.active['link'] === true} isOpen={linkOpen} onOpenChange={setLinkOpen} />
      ) : null}
      {lists.length ? <span role="separator" aria-orientation="vertical" /> : null}
      {lists.map((list) => (
        <IconButton
          key={list.id}
          label={list.label}
          icon={list.icon}
          isSelected={state.active[list.id] === true}
          onPress={() => run((current) => toggleList(current, list.id))}
        />
      ))}
      {structure.map((format) => (
        <IconButton
          key={format.id}
          label={format.label}
          icon={format.icon}
          isDisabled={format.id === 'indent' ? !state.canIndent : !state.canOutdent}
          onPress={() => run((current) => {
            const item = listItemType(current);
            if (!item) return;
            if (format.id === 'indent') current.chain().focus().sinkListItem(item).run();
            else current.chain().focus().liftListItem(item).run();
          })}
        />
      ))}
      {history.length ? <span role="separator" aria-orientation="vertical" /> : null}
      {history.map((format) => (
        <IconButton
          key={format.id}
          label={format.label}
          icon={format.icon}
          isDisabled={format.id === 'undo' ? !state.canUndo : !state.canRedo}
          onPress={() => run((current) => {
            if (format.id === 'undo') current.chain().focus().undo().run();
            else current.chain().focus().redo().run();
          })}
        />
      ))}
    </>
  );

  /* The selection toolbar carries the first four marks and the link: what a
     person reaches for with text already selected. */
  const quick = marks.slice(0, 4);

  return (
    <div className={cx(styles['editor'], className)}>
      <RichTextSurface
        label={label}
        {...(description ? { description } : {})}
        {...(errorMessage ? { errorMessage } : {})}
        {...(isInvalid !== undefined ? { isInvalid } : {})}
        {...(name ? { name } : {})}
        isReadOnly={isReadOnly}
        toolbarPlacement={toolbarPlacement}
        {...(toolbar ? { toolbar } : {})}
      >
        <EditorContent editor={editor} className={styles['content']} />
      </RichTextSurface>

      {selectionToolbar && !isReadOnly ? (
        <BubbleMenu
          editor={editor}
          className={cx(styles['selection'], 'cr-frost')}
          options={{ placement: 'top', offset: 8, flip: true, shift: { padding: 8 } }}
          shouldShow={({ editor: current, from, to }) => from !== to && !current.isActive('codeBlock') && current.isFocused}
        >
          {/* Escape hands focus back to the text, where the selection still is. */}
          {/* eslint-disable-next-line jsx-a11y/interactive-supports-focus -- the toolbar's buttons are its tab stops */}
          <div
            role="toolbar"
            aria-label="Selection formatting"
            className={styles['selectionBar']}
            onKeyDown={(event) => { if (event.key === 'Escape') { event.preventDefault(); editor.commands.focus(); } }}
          >
            {quick.map((mark) => (
              <IconButton
                key={mark.id}
                label={mark.label}
                icon={mark.icon}
                isSelected={state.active[mark.id] === true}
                onPress={() => run((current) => toggleMark(current, mark.id))}
              />
            ))}
            {offered.has('link') ? (
              <IconButton
                label="Link"
                icon={MARKS.find((mark) => mark.id === 'link')!.icon}
                isSelected={state.active['link'] === true}
                onPress={() => setLinkOpen(true)}
              />
            ) : null}
          </div>
        </BubbleMenu>
      ) : null}

      {name ? <input type="hidden" name={name} value={html} /> : null}
      <VisuallyHidden role="status" aria-live="polite">{said}</VisuallyHidden>
    </div>
  );
});

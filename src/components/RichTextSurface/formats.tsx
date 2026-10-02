/* Crystal's format vocabulary: what a rich text surface can offer, in what
 * groups, under which names, keys and glyphs.
 *
 * It is engine-agnostic. `RichTextSurface` takes `FormatAction`s from whatever
 * engine a product binds, and `@crystal-ui/react/editor` binds TipTap to this
 * same list. A product binding Lexical or a plain `contenteditable` reads its
 * names, shortcuts and icons from here, so every editor built on Crystal offers
 * the same formats in the same order with the same words.
 *
 * The glyphs are Crystal's icon set where it has one (bold, italic, underline,
 * strikethrough, code, highlighter, superscript, checklist, indent, outdent,
 * code block, paragraph). Six it does not have (link, the two lists,
 * subscript, quotation, undo and redo) are drawn here on the same 24px grid and
 * stroke, until the set carries them (core task C-I1).
 */
import type { ReactNode } from 'react';

export type BlockType =
  | 'paragraph' | 'heading-2' | 'heading-3' | 'heading-4'
  | 'blockquote' | 'code-block';

export type MarkFormat =
  | 'bold' | 'italic' | 'underline' | 'strike' | 'code' | 'highlight'
  | 'link' | 'subscript' | 'superscript';

export type ListFormat = 'bullet-list' | 'ordered-list' | 'checklist';

export type StructureFormat = 'indent' | 'outdent';

export type HistoryFormat = 'undo' | 'redo';

export type FormatId = BlockType | MarkFormat | ListFormat | StructureFormat | HistoryFormat;

export interface FormatDefinition {
  id: FormatId;
  /** The control's accessible name and the word a product can translate. */
  label: string;
  /** Written the way `aria-keyshortcuts` and the tooltip read it; `Mod` is
   *  Command on Apple platforms and Control elsewhere. */
  shortcut?: string;
  icon?: ReactNode;
}

const glyph = (...children: ReactNode[]): ReactNode => (
  <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">{children}</svg>
);

export const FORMAT_ICONS: Record<Exclude<FormatId, 'heading-2' | 'heading-3' | 'heading-4'>, ReactNode> = {
  /* Crystal's icon set. */
  bold: glyph(<path key="a" d="M6 12h9a4 4 0 0 1 0 8H7a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h7a4 4 0 0 1 0 8" />),
  italic: glyph(<path key="a" d="M19 4h-9M14 20H5M15 4 9 20" />),
  underline: glyph(<path key="a" d="M6 4v6a6 6 0 0 0 12 0V4M4 20h16" />),
  strike: glyph(<path key="a" d="M16 4H9a3 3 0 0 0-2.83 4M14 12a4 4 0 0 1 0 8H6M4 12h16" />),
  code: glyph(<path key="a" d="m16 18 6-6-6-6M8 6l-6 6 6 6" />),
  highlight: glyph(<path key="a" d="m9 11-6 6v3h9l3-3" />, <path key="b" d="m22 12-4.6 4.6a2 2 0 0 1-2.8 0l-5.2-5.2a2 2 0 0 1 0-2.8L14 4" />),
  superscript: glyph(<path key="a" d="m4 19 8-8M12 19l-8-8M20 12h-4c0-1.5.44-2 1.5-2.5S20 8.33 20 7c0-.47-.17-.93-.48-1.29a2.1 2.1 0 0 0-2.62-.44c-.42.24-.74.61-.9 1.06" />),
  checklist: glyph(<path key="a" d="M13 5h8M13 12h8M13 19h8m-18-2 2 2 4-4" />, <rect key="b" x="3" y="4" width="6" height="6" rx="1" />),
  indent: glyph(<path key="a" d="M21 5H11M21 12H11M21 19H11M3 8l4 4-4 4" />),
  outdent: glyph(<path key="a" d="M21 5H11M21 12H11M21 19H11M7 8l-4 4 4 4" />),
  'code-block': glyph(<path key="a" d="m10 9-3 3 3 3M14 15l3-3-3-3" />, <rect key="b" x="3" y="3" width="18" height="18" rx="2" />),
  paragraph: glyph(<path key="a" d="M13 4v16M17 4v16M19 4H9.5a4.5 4.5 0 0 0 0 9H13" />),
  /* Drawn here on the same grid and stroke (C-I1). */
  link: glyph(<path key="a" d="M10 14a4.5 4.5 0 0 0 6.36 0l3.18-3.18a4.5 4.5 0 0 0-6.36-6.36L11.6 6.04M14 10a4.5 4.5 0 0 0-6.36 0l-3.18 3.18a4.5 4.5 0 0 0 6.36 6.36l1.58-1.58" />),
  'bullet-list': glyph(<path key="a" d="M9 6h12M9 12h12M9 18h12" />, <circle key="b" cx="4" cy="6" r="1" />, <circle key="c" cx="4" cy="12" r="1" />, <circle key="d" cx="4" cy="18" r="1" />),
  'ordered-list': glyph(<path key="a" d="M10 6h11M10 12h11M10 18h11M4 4v4M3 4h1M3 14h2.5L3 17.5h2.5" />),
  subscript: glyph(<path key="a" d="m4 5 8 8M12 5l-8 8M20 19h-4c0-1.5.44-2 1.5-2.5S20 15.33 20 14c0-.47-.17-.93-.48-1.29a2.1 2.1 0 0 0-2.62-.44c-.42.24-.74.61-.9 1.06" />),
  blockquote: glyph(<path key="a" d="M4 11h4v6H4zM4 11c0-3 1.5-5 4-6M14 11h4v6h-4zM14 11c0-3 1.5-5 4-6" />),
  undo: glyph(<path key="a" d="M9 14 4 9l5-5M4 9h10.5a5.5 5.5 0 0 1 0 11H11" />),
  redo: glyph(<path key="a" d="m15 14 5-5-5-5M20 9H9.5a5.5 5.5 0 0 0 0 11H13" />),
};

/** The block types, in the order the block-type menu lists them. Headings stop
 *  at four: the page's own title is the first level, and a document deeper than
 *  four is a document to restructure. */
export const BLOCK_TYPES: readonly FormatDefinition[] = [
  { id: 'paragraph', label: 'Paragraph', shortcut: 'Mod+Alt+0', icon: FORMAT_ICONS.paragraph },
  { id: 'heading-2', label: 'Heading', shortcut: 'Mod+Alt+2' },
  { id: 'heading-3', label: 'Subheading', shortcut: 'Mod+Alt+3' },
  { id: 'heading-4', label: 'Minor heading', shortcut: 'Mod+Alt+4' },
  { id: 'blockquote', label: 'Quotation', shortcut: 'Mod+Shift+B', icon: FORMAT_ICONS.blockquote },
  { id: 'code-block', label: 'Code block', shortcut: 'Mod+Alt+C', icon: FORMAT_ICONS['code-block'] },
];

/** The marks, in toolbar order. The first four are the selection toolbar's. */
export const MARKS: readonly FormatDefinition[] = [
  { id: 'bold', label: 'Bold', shortcut: 'Mod+B', icon: FORMAT_ICONS.bold },
  { id: 'italic', label: 'Italic', shortcut: 'Mod+I', icon: FORMAT_ICONS.italic },
  { id: 'underline', label: 'Underline', shortcut: 'Mod+U', icon: FORMAT_ICONS.underline },
  { id: 'strike', label: 'Strikethrough', shortcut: 'Mod+Shift+S', icon: FORMAT_ICONS.strike },
  { id: 'code', label: 'Inline code', shortcut: 'Mod+E', icon: FORMAT_ICONS.code },
  { id: 'highlight', label: 'Highlight', shortcut: 'Mod+Shift+H', icon: FORMAT_ICONS.highlight },
  { id: 'link', label: 'Link', shortcut: 'Mod+K', icon: FORMAT_ICONS.link },
  { id: 'subscript', label: 'Subscript', shortcut: 'Mod+,', icon: FORMAT_ICONS.subscript },
  { id: 'superscript', label: 'Superscript', shortcut: 'Mod+.', icon: FORMAT_ICONS.superscript },
];

export const LISTS: readonly FormatDefinition[] = [
  { id: 'bullet-list', label: 'Bulleted list', shortcut: 'Mod+Shift+8', icon: FORMAT_ICONS['bullet-list'] },
  { id: 'ordered-list', label: 'Numbered list', shortcut: 'Mod+Shift+7', icon: FORMAT_ICONS['ordered-list'] },
  { id: 'checklist', label: 'Checklist', shortcut: 'Mod+Shift+9', icon: FORMAT_ICONS.checklist },
];

/** Indent and outdent are on the toolbar because a phone keyboard has no Tab:
 *  without them a list cannot be nested on a touch screen at all. */
export const STRUCTURE: readonly FormatDefinition[] = [
  { id: 'outdent', label: 'Outdent', shortcut: 'Shift+Tab', icon: FORMAT_ICONS.outdent },
  { id: 'indent', label: 'Indent', shortcut: 'Tab', icon: FORMAT_ICONS.indent },
];

/** Undo and redo are on the toolbar for the same reason: a touch keyboard has
 *  no Ctrl+Z, and shaking a phone to undo is not something a person finds. */
export const HISTORY: readonly FormatDefinition[] = [
  { id: 'undo', label: 'Undo', shortcut: 'Mod+Z', icon: FORMAT_ICONS.undo },
  { id: 'redo', label: 'Redo', shortcut: 'Mod+Shift+Z', icon: FORMAT_ICONS.redo },
];

/** Every format, for a product that wants to offer a subset by id. */
export const FORMAT_VOCABULARY: readonly FormatDefinition[] = [
  ...BLOCK_TYPES, ...MARKS, ...LISTS, ...STRUCTURE, ...HISTORY,
];

/** `Mod` resolved for the reader's platform, for display. */
export function displayShortcut(shortcut: string, isApple: boolean): string {
  return shortcut
    .replace(/Mod/g, isApple ? '⌘' : 'Ctrl')
    .replace(/Alt/g, isApple ? '⌥' : 'Alt')
    .replace(/Shift/g, isApple ? '⇧' : 'Shift')
    .replace(/\+/g, isApple ? '' : '+');
}

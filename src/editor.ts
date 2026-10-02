/* @crystal-ui/react/editor: Crystal's rich text surface with TipTap bound to it.
 *
 * Its own entry point, so the engine is paid for only by a product that imports
 * it. TipTap is an optional peer dependency: install `@tiptap/react`,
 * `@tiptap/pm`, `@tiptap/core`, `@tiptap/starter-kit`, `@tiptap/extension-list`,
 * `@tiptap/extension-highlight`, `@tiptap/extension-subscript`,
 * `@tiptap/extension-superscript` and `@tiptap/extensions` alongside it. The
 * engine-agnostic surface and the format vocabulary stay in the main entry, for
 * a product that binds another engine. See `docs/proposals/2026-10-02-media-text-and-recipe-parity.md`.
 */
export * from './editor/index.js';

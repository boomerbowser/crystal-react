import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
/* Vitest 5 takes the browser provider as an object from its own package rather
   than as the string 'playwright' it accepted before. */
import { playwright } from '@vitest/browser-playwright';

/* Two projects, because the two ask different questions.
 *
 * `unit` is jsdom, which is fast but has specific limits. It applies CSS
 * modules but does not expand shorthands into longhands and does not resolve a
 * custom property, and it reports every box as zero. Hit-target size, scroll-spy
 * behaviour and material rendering cannot be verified here.
 *
 * `storybook` runs each story in a real Chromium, mounts it through the same
 * `preview.ts` a reviewer sees, and runs its `play` function, which is what the
 * Interactions panel shows. It can exercise keyboard interaction. The five
 * browser gates (`verify-targets`, `verify-behaviour`, `verify-appearance`,
 * `verify-materials` and `verify-theme`) drive a browser only for the stories
 * they name. This project puts the same capability behind every story.
 */
export default defineConfig({
  test: {
    projects: [
      {
        plugins: [react()],
        test: {
          name: 'unit',
          environment: 'jsdom',
          globals: true,
          setupFiles: ['./src/test/setup.ts'],
          css: true,
          include: ['src/**/*.test.{ts,tsx}'],
          /* `afterEach` hooks run in declaration order rather than Vitest's
             default reverse. The setup file's teardown has to run before
             Testing Library's unmount; see the note in `src/test/setup.ts` for
             what is left behind otherwise. */
          sequence: { hooks: 'list' },
        },
      },
      {
        plugins: [storybookTest({ configDir: '.storybook' })],
        /* Declared up front so Vite does not discover TipTap while the first
           editor story is loading and reload the page under the test runner,
           which fails every story file loaded at that moment. */
        optimizeDeps: {
          include: [
            '@tiptap/react', '@tiptap/react/menus', '@tiptap/starter-kit', '@tiptap/extension-list',
            '@tiptap/extension-highlight', '@tiptap/extension-subscript', '@tiptap/extension-superscript',
            '@tiptap/extensions', '@tiptap/pm/state', '@tiptap/pm/view', '@tiptap/pm/model',
          ],
        },
        test: {
          name: 'storybook',
          /* No setup file. `@storybook/addon-vitest` has applied `preview.ts`'s
             project annotations itself since Storybook 10.3, so a
             `setProjectAnnotations` call here would be a second source of the
             same configuration. The addon warns about that, and the two copies
             could drift apart. */
          browser: {
            enabled: true,
            headless: true,
            provider: playwright(),
            instances: [{ browser: 'chromium' }],
          },
        },
      },
    ],
  },
});

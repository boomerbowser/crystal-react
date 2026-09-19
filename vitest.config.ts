import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
/* Vitest 5 takes the browser provider as an object from its own package rather
   than as the string 'playwright' it accepted before. */
import { playwright } from '@vitest/browser-playwright';

/* Two projects, because the two ask different questions.
 *
 * **unit** is jsdom, and it is fast and blind in a specific way. It applies CSS
 * modules but does not expand shorthands into longhands and does not resolve a
 * custom property; it reports every box as zero. Most of this library's worst
 * defects passed it — a 36px hit target with 419 tests green, three scroll-spy
 * defects with twelve, every Resin surface missing its optical rims.
 *
 * **storybook** runs each story in a real Chromium, mounts it through the same
 * `preview.ts` a reviewer sees, and runs its `play` function. That is the
 * Interactions panel, and it is the first thing here that can watch a keyboard.
 * The four `verify-*.mjs` gates already drive a browser; this puts the same
 * capability behind every story rather than behind nine hand-written probes.
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
             default reverse. The setup file's teardown has to run *before*
             Testing Library's unmount, and reversed it ran after — see the note
             in `src/test/setup.ts` for what that leaves behind. */
          sequence: { hooks: 'list' },
        },
      },
      {
        plugins: [storybookTest({ configDir: '.storybook' })],
        test: {
          name: 'storybook',
          /* No setup file. `@storybook/addon-vitest` has applied `preview.ts`'s
             project annotations itself since Storybook 10.3, so a
             `setProjectAnnotations` call here is a second source of the same
             configuration — it warns about exactly that, and the two would drift
             the first time one of them was edited. */
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

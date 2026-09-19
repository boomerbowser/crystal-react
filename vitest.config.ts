import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    css: true,
    /* `afterEach` hooks run in declaration order rather than Vitest's default
       reverse. The setup file's teardown has to run *before* Testing Library's
       unmount, and reversed it ran after — see the note in `src/test/setup.ts`
       for what that leaves behind. */
    sequence: { hooks: 'list' },
  },
});

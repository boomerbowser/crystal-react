/* Library build.
 *
 * `preserveModules` rather than a single bundle: a consumer importing Button
 * should not pull the date picker's internationalisation tables with it. That
 * matters more here than in most libraries, because the catalogue is large and
 * the heaviest components are the ones fewest applications use.
 */
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

/* `import.meta.dirname` rather than `__dirname`: Vite's native config loader
   does not provide the CommonJS globals, and warns that relying on them will
   break when it becomes the default. */
const here = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: resolve(here, 'src/index.ts'),
      formats: ['es', 'cjs'],
      fileName: (format, name) => `${name}.${format === 'es' ? 'js' : 'cjs'}`,
    },
    rollupOptions: {
      /* Everything the consumer resolves themselves. `@crystal/core` is
         external on principle, not only for size: CONTRACT §1 says a library
         consumes Crystal's generated values rather than carrying a copy, and
         bundling it would inline a second copy of the token set that could then
         drift from the installed one. */
      external: (id) => /^(react|react-dom|react\/|react-dom\/|react-aria|react-aria-components|react-stately|@react-|@internationalized\/|@crystal\/core|motion|motion-dom|motion-utils|qrcode\.react|react-imask|imask)/.test(id),
      output: {
        preserveModules: true,
        preserveModulesRoot: 'src',
        assetFileNames: 'styles[extname]',
      },
    },
    sourcemap: true,
    /* The library must not inline Crystal's values into JS as literals; they
       arrive through generated tokens and custom properties. */
    cssCodeSplit: false,
    emptyOutDir: true,
  },
});

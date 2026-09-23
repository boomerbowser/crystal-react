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
      /* Everything the consumer resolves themselves. `@crystal-ui/core` is
         external on principle, not only for size: CONTRACT §1 says a library
         consumes Crystal's generated values rather than carrying a copy, and
         bundling it would inline a second copy of the token set that could then
         drift from the installed one.

         The `d3-*` modules and their own dependencies are here for the ordinary
         reason: they are dependencies, a consumer installs them once, and a copy
         inlined here would be a second one beside whatever else in the
         application already uses them. `check-bundle.mjs` caught them the first
         time the charts were built, which is the third dependency that list has
         been missing and the reason the check exists. */
      external: (id) => /^(react|react-dom|react\/|react-dom\/|react-aria|react-aria-components|react-stately|@react-|@internationalized\/|@crystal-ui\/core|motion|motion-dom|motion-utils|qrcode\.react|react-imask|imask|d3-[a-z]+|internmap|delaunator|robust-predicates)/.test(id),
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

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
      /* Three entry points. Blocks ship from their own (`@crystal-ui/react/blocks`),
         because a block is a starting point products are expected to fork, not
         a stable API (§4.2), and a product should be able to see which kind it
         is importing. The main entry exports blocks too.

         The editor ships from its own (`@crystal-ui/react/editor`) and the main
         entry does not export it, because it binds TipTap, an optional peer
         dependency: a product that never imports it never installs or bundles
         an editor engine. */
      entry: {
        index: resolve(here, 'src/index.ts'),
        blocks: resolve(here, 'src/blocks.ts'),
        editor: resolve(here, 'src/editor.ts'),
      },
      formats: ['es', 'cjs'],
      fileName: (format, name) => `${name}.${format === 'es' ? 'js' : 'cjs'}`,
    },
    rollupOptions: {
      /* Everything the consumer resolves themselves. `@crystal-ui/core` is
         external because CONTRACT §1 says a library consumes Crystal's generated
         values rather than carrying a copy; bundling it would inline a second
         copy of the token set that could drift from the installed one.

         The `d3-*` modules and their own dependencies are dependencies that a
         consumer installs once, and a copy inlined here would sit beside
         whatever else in the application already uses them. `check-bundle.mjs`
         fails when a dependency is missing from this list. */
      external: (id) => /^(react|react-dom|react\/|react-dom\/|react-aria|react-aria-components|react-stately|@react-|@internationalized\/|@crystal-ui\/core|motion|motion-dom|motion-utils|qrcode\.react|react-imask|imask|d3-[a-z]+|internmap|delaunator|robust-predicates|@tiptap\/|@floating-ui\/)/.test(id),
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

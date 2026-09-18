/* Jest configuration, for the compatibility suite only.
 *
 * Vitest is the library's test runner. This exists so the claim "works with
 * Jest" is checkable rather than assumed: it runs the same component tests
 * through Jest's resolver, transform and environment, which is where the
 * differences actually bite — ESM-style `.js` specifiers in TypeScript imports,
 * SCSS module resolution, and `import.meta`.
 */
module.exports = {
  displayName: 'jest-compat',
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/src'],
  testMatch: ['**/*.jest.test.tsx'],
  setupFilesAfterEnv: ['<rootDir>/src/test/setup.jest.ts'],
  transform: {
    /* Presets are passed inline rather than left to Babel's config discovery.
       With "type": "module" in package.json, babel.config.cjs was not being
       picked up, and Babel silently transformed without the TypeScript preset —
       which fails at the first generic rather than at the first type
       annotation, so the error pointed at a context creation and not at the
       missing preset. */
    '^.+\\.(t|j)sx?$': ['babel-jest', {
      presets: [
        ['@babel/preset-env', { targets: { node: 'current' } }],
        ['@babel/preset-react', { runtime: 'automatic' }],
        /* Babel is pinned to 7.x to match the core babel-jest resolves. With
           preset-typescript 8 against core 7 the preset did not engage at all:
           the file was parsed as plain JavaScript, so
           `createContext<T | null>(null)` became a chain of comparisons and
           failed at runtime with "CrystalTheme is not defined" — an error
           pointing at the context creation rather than at the version skew. */
        '@babel/preset-typescript',
      ],
    }],
  },
  moduleNameMapper: {
    /* SCSS modules become an identity proxy: `styles.button` returns "button",
       which is all a behaviour test needs and avoids compiling Sass twice. */
    '\\.(css|scss)$': 'identity-obj-proxy',
    /* TypeScript source uses ESM-style `.js` specifiers, which Jest's CommonJS
       resolver does not follow to the `.ts` file. Vite and tsc both do. */
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  transformIgnorePatterns: [
    /* React Aria and Motion ship ESM that Jest must transform rather than skip. */
    'node_modules/(?!(.pnpm/)?(react-aria-components|@react-aria|@react-stately|@react-types|@internationalized|motion|motion-dom|motion-utils|@swc)/)',
  ],
};

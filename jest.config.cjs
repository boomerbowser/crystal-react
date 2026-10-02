/* Jest configuration, for the compatibility suite only.
 *
 * Vitest is the library's test runner. This configuration checks the claim
 * "works with Jest" by running the same component tests through Jest's
 * resolver, transform and environment. Those are where the two runners differ:
 * ESM-style `.js` specifiers in TypeScript imports, SCSS module resolution, and
 * `import.meta`.
 */
module.exports = {
  displayName: 'jest-compat',
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/src'],
  testMatch: ['**/*.jest.test.tsx'],
  setupFilesAfterEnv: ['<rootDir>/src/test/setup.jest.ts'],
  transform: {
    /* Presets are passed inline rather than left to Babel's config discovery.
       With "type": "module" in package.json, babel.config.cjs is not picked up,
       and Babel transforms without the TypeScript preset. That fails at the
       first generic, so the error points at a context creation instead of the
       missing preset. */
    '^.+\\.(t|j)sx?$': ['babel-jest', {
      presets: [
        ['@babel/preset-env', { targets: { node: 'current' } }],
        ['@babel/preset-react', { runtime: 'automatic' }],
        /* Babel is pinned to 7.x to match the core babel-jest resolves. With
           preset-typescript 8 against core 7 the preset does not engage: the
           file is parsed as plain JavaScript, `createContext<T | null>(null)`
           becomes a chain of comparisons, and it fails at runtime with
           "CrystalTheme is not defined", pointing at the context creation
           instead of the version skew. */
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

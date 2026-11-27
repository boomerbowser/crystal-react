import type { NextConfig } from 'next';

/* The site is a static export of server-rendered pages: every fact on it is read
   from the installed `@prismata/core` at build time, so there is nothing to
   compute per request. */
const config: NextConfig = {
  output: 'export',
  trailingSlash: true,
  reactStrictMode: true,
};

export default config;

import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import '@prismata/core/theme';
import '@prismata/core/css';
import '@prismata/react/styles.css';
import './site.css';
import { PrismataProvider } from '@prismata/react';
import { coreVersion } from '../lib/prismata';

export const metadata: Metadata = {
  title: { default: 'Prismata React', template: '%s · Prismata React' },
  description: 'The Prismata Design System for React: components, surfaces and the code that runs.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <PrismataProvider palette="prism" mode="system" className="pr-plastic site">
          <header className="site-header">
            <a href="/" className="site-name">Prismata React</a>
            <nav aria-label="Site">
              <a className="pr-nav-item" href="/surfaces/">Surfaces</a>
              <a className="pr-nav-item" href="/libraries/">Libraries</a>
            </nav>
          </header>
          <main id="main" className="site-main">{children}</main>
          <footer className="site-footer">Built against @prismata/core {coreVersion}.</footer>
        </PrismataProvider>
      </body>
    </html>
  );
}

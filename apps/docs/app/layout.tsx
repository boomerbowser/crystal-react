import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import '@crystal-ui/core/theme';
import '@crystal-ui/core/css';
import '@crystal-ui/react/styles.css';
import './site.css';
import { CrystalProvider } from '@crystal-ui/react';
import { coreVersion } from '../lib/crystal';

export const metadata: Metadata = {
  title: { default: 'Crystal React', template: '%s · Crystal React' },
  description: 'The Crystal Design System for React: components, surfaces and the code that runs.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <CrystalProvider palette="prism" mode="system" className="cr-plastic site">
          <header className="site-header">
            <a href="/" className="site-name">Crystal React</a>
            <nav aria-label="Site">
              <a className="cr-nav-item" href="/surfaces/">Surfaces</a>
            </nav>
          </header>
          <main id="main" className="site-main">{children}</main>
          <footer className="site-footer">Built against @crystal-ui/core {coreVersion}.</footer>
        </CrystalProvider>
      </body>
    </html>
  );
}

import { describe, expect, it } from 'vitest';
import { renderWithPrismata } from '../../test/render.js';
import { GlobalStyles } from './GlobalStyles.js';
import prismataFlat from '@prismata/core/flat' with { type: 'json' };

/* From Prismata's own token file, not typed in: a literal hex keeps passing after
   the palette changes underneath it. */
const harbourDarkCanvas = (prismataFlat as {
  palettes: Record<string, { modes: Record<string, Record<string, string>> }>;
}).palettes['harbor']!.modes['dark']!['canvas'];

describe('GlobalStyles', () => {
  /* Setting `background: var(--pr-canvas)` on body paints nothing. The
     properties live on the provider's scope, body is above it, and custom
     properties inherit downward only. */
  it('copies the resolved properties onto the document rather than referencing them', () => {
    const { unmount } = renderWithPrismata(<GlobalStyles />, {
      theme: { palette: 'harbor', mode: 'dark' },
    });
    const root = document.documentElement;
    expect(root.style.getPropertyValue('--pr-canvas')).toBe(harbourDarkCanvas);
    expect(root.style.colorScheme).toBe('dark');
    expect(document.body.style.background).toBe('var(--pr-canvas)');

    /* A Prismata island that mounts and unmounts must not permanently change a
       host page. */
    unmount();
    expect(root.style.getPropertyValue('--pr-canvas')).toBe('');
    expect(document.body.style.background).toBe('');
  });

  it('leaves the document alone when told to', () => {
    renderWithPrismata(<GlobalStyles paintDocument={false} />);
    expect(document.documentElement.style.getPropertyValue('--pr-canvas')).toBe('');
  });
});

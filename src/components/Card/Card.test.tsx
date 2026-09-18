import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { expectNoAxeViolations } from '../../test/axe.js';
import { CrystalProvider } from '../../theme/CrystalProvider.js';
import { Card } from './Card.js';

const renderWithCrystal = (ui: React.ReactNode) =>
  render(<CrystalProvider>{ui}</CrystalProvider>);

describe('Card', () => {
  it('renders its children', () => {
    renderWithCrystal(<Card>Contents</Card>);
    expect(screen.getByText('Contents')).toBeInTheDocument();
  });

  it('has no accessibility violations', async () => {
    const { container } = renderWithCrystal(<Card aria-label="Summary">Contents</Card>);
    await expectNoAxeViolations(container);
  });

  /* A landmark without a name is noise in a screen reader's landmark list, so the
     region is earned by having one rather than granted by default. */
  it('is a plain div until it is named, then a region', () => {
    const { container, rerender } = renderWithCrystal(<Card>Contents</Card>);
    expect(container.querySelector('section')).toBeNull();
    expect(screen.queryByRole('region')).toBeNull();

    rerender(<CrystalProvider><Card aria-label="Summary">Contents</Card></CrystalProvider>);
    expect(screen.getByRole('region', { name: 'Summary' })).toBeInTheDocument();
  });

  it('forwards a ref and merges a className rather than replacing it', () => {
    const ref = { current: null as HTMLElement | null };
    /* Queried by test id, not by container.firstElementChild — that is the
       provider's scope element, and asserting against it passes vacuously. */
    renderWithCrystal(<Card ref={ref} className="mine" data-testid="card">C</Card>);
    expect(ref.current).toBeInstanceOf(HTMLElement);
    const el = screen.getByTestId('card');
    expect(el.className).toMatch(/mine/);
    /* Crystal's own class must survive a consumer className, or the material is
       silently lost the first time someone adds a margin. */
    expect(el.className.split(' ').length).toBeGreaterThan(1);
  });

  /* Card carries no recipe in Crystal's catalogue. A library must not invent
     motion the design system did not specify. */
  it('plays no motion of its own', () => {
    renderWithCrystal(<Card data-testid="card">C</Card>);
    expect(screen.getByTestId('card').dataset['crMotionName']).toBeUndefined();
  });
});

import { describe, expect, it } from 'vitest';
import { expectNoAxeViolations } from '../../test/axe.js';
import { renderWithCrystal, screen } from '../../test/render.js';
import { ThemeIcon } from './ThemeIcon.js';

describe('ThemeIcon', () => {
  /* Hidden so an anchor beside a heading that already says the same thing is not
     read twice. */
  it('is hidden until it is the only carrier of meaning', () => {
    const { rerenderWithCrystal } = renderWithCrystal(
      <ThemeIcon data-testid="icon"><svg /></ThemeIcon>,
    );
    expect(screen.getByTestId('icon')).toHaveAttribute('aria-hidden', 'true');
    expect(screen.queryByRole('img')).toBeNull();

    rerenderWithCrystal(<ThemeIcon label="Archived" data-testid="icon"><svg /></ThemeIcon>);
    expect(screen.getByRole('img', { name: 'Archived' })).toBeInTheDocument();
  });

  /* It looks exactly like an icon button, so the difference has to be in its
     behaviour. */
  it('is not a control', () => {
    renderWithCrystal(<ThemeIcon label="Archived"><svg /></ThemeIcon>);
    expect(screen.queryByRole('button')).toBeNull();
    expect(screen.getByRole('img', { name: 'Archived' })).not.toHaveAttribute('tabindex');
  });

  it('has no accessibility violations', async () => {
    const { container } = renderWithCrystal(
      <ThemeIcon label="Archived" shape="circle" variant="surface"><svg /></ThemeIcon>,
    );
    await expectNoAxeViolations(container);
  });
});

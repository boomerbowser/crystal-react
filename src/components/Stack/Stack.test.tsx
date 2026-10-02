import { describe, expect, it } from 'vitest';
import { expectNoAxeViolations } from '../../test/axe.js';
import { renderWithCrystal, screen } from '../../test/render.js';
import { Stack, Group } from './Stack.js';

describe('Stack and Group', () => {
  it('renders children and has no accessibility violations', async () => {
    const { container } = renderWithCrystal(<Stack><p>One</p><p>Two</p></Stack>);
    expect(screen.getByText('One')).toBeInTheDocument();
    await expectNoAxeViolations(container);
  });

  /* The gap is a custom property so seven steps do not become seven classes.
     The value must be Crystal's token, never a number this library chose. */
  it('takes its gap from Crystal\'s scale, as a custom property', () => {
    renderWithCrystal(<Stack gap="lg" data-testid="s">x</Stack>);
    expect(screen.getByTestId('s').style.getPropertyValue('--cr-stack-gap'))
      .toBe('var(--cr-spacing-lg)');
  });

  /* `space` is the density-aware padding step, which is separate from the steps
     on the scale. A stack matching a card's padding asks for it by name. */
  it('offers the density-aware padding step by name', () => {
    renderWithCrystal(<Stack gap="space" data-testid="s">x</Stack>);
    expect(screen.getByTestId('s').style.getPropertyValue('--cr-stack-gap')).toBe('var(--cr-space)');
  });

  it('treats none as a real zero rather than a missing value', () => {
    renderWithCrystal(<Stack gap="none" data-testid="s">x</Stack>);
    expect(screen.getByTestId('s').style.getPropertyValue('--cr-stack-gap')).toBe('0');
  });

  /* A layout component that introduces a landmark tells assistive technology
     about a grouping that exists only visually. */
  it('is presentational by default and takes a real element when the grouping is real', () => {
    const { rerenderWithCrystal } = renderWithCrystal(<Stack data-testid="s">x</Stack>);
    expect(screen.getByTestId('s').tagName).toBe('DIV');
    expect(screen.queryByRole('list')).toBeNull();

    rerenderWithCrystal(<Stack as="ul" data-testid="s"><li>x</li></Stack>);
    expect(screen.getByRole('list')).toBe(screen.getByTestId('s'));
  });

  it('wraps by default as a Group and can be told not to', () => {
    const { rerenderWithCrystal } = renderWithCrystal(<Group data-testid="g">x</Group>);
    const wrapping = screen.getByTestId('g').className;
    rerenderWithCrystal(<Group wrap={false} data-testid="g">x</Group>);
    expect(screen.getByTestId('g').className.split(' ').length)
      .toBeLessThan(wrapping.split(' ').length);
  });
});

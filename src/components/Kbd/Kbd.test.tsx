import { describe, expect, it } from 'vitest';
import { expectNoAxeViolations } from '../../test/axe.js';
import { renderWithCrystal, screen } from '../../test/render.js';
import { Kbd } from './Kbd.js';

describe('Kbd', () => {
  it('is a real kbd element', () => {
    const { container } = renderWithCrystal(<Kbd>Enter</Kbd>);
    expect(container.querySelector('kbd')).toHaveTextContent('Enter');
  });

  /* A cap reading "⌘" tells a screen-reader user nothing and a Windows user the
     wrong thing, so the spelled name is what is announced. */
  it('announces the spelled name when the cap shows a symbol', () => {
    const { container } = renderWithCrystal(<Kbd name="Command">⌘</Kbd>);
    expect(screen.getByText('⌘')).toHaveAttribute('aria-hidden', 'true');
    expect(container.querySelector('kbd')).toHaveTextContent('Command');
  });

  it('has no accessibility violations', async () => {
    const { container } = renderWithCrystal(
      <p>Press <Kbd name="Command">⌘</Kbd> and <Kbd>K</Kbd>.</p>,
    );
    await expectNoAxeViolations(container);
  });
});

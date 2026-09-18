import { describe, expect, it } from 'vitest';
import { renderWithCrystal, screen } from '../../test/render.js';
import { Container } from './Container.js';

describe('Container', () => {
  /* The catalogue says it "must not introduce a landmark", which is the whole
     accessibility contract of a width decision. */
  it('introduces no landmark', () => {
    renderWithCrystal(<Container data-testid="c">x</Container>);
    expect(screen.getByTestId('c').tagName).toBe('DIV');
    expect(screen.queryByRole('main')).toBeNull();
    expect(screen.queryByRole('region')).toBeNull();
  });

  /* Two ceilings for two reasons: how wide the page gets, and how wide a line of
     prose gets before it stops being readable. A single size scale blurs that. */
  it('has a separate reading ceiling from the shell ceiling', () => {
    const { rerenderWithCrystal } = renderWithCrystal(<Container data-testid="c">x</Container>);
    expect(screen.getByTestId('c').style.getPropertyValue('--cr-container-max')).toBe('');

    rerenderWithCrystal(<Container width="reading" data-testid="c">x</Container>);
    expect(screen.getByTestId('c').style.getPropertyValue('--cr-container-max'))
      .toBe('var(--cr-layout-reading-max)');
  });
});

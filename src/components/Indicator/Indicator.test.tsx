import { describe, expect, it } from 'vitest';
import { expectNoAxeViolations } from '../../test/axe.js';
import { renderWithCrystal, screen } from '../../test/render.js';
import { Indicator } from './Indicator.js';

describe('Indicator', () => {
  /* "The real control supplies the state; the mark only shows it." */
  it('says nothing, because the control beside it already does', () => {
    renderWithCrystal(<Indicator state="invalid" data-testid="mark" />);
    expect(screen.getByTestId('mark')).toHaveAttribute('aria-hidden', 'true');
  });

  it('carries the state as data, so one rule per state selects the fill', () => {
    renderWithCrystal(<Indicator state="current" data-testid="mark" />);
    expect(screen.getByTestId('mark').dataset['state']).toBe('current');
  });

  it('takes the field size when it is on a field', () => {
    const { rerenderWithCrystal } = renderWithCrystal(<Indicator state="field-idle" data-testid="mark" />);
    const plain = screen.getByTestId('mark').className;
    rerenderWithCrystal(<Indicator state="field-idle" onField data-testid="mark" />);
    expect(screen.getByTestId('mark').className).not.toBe(plain);
  });

  it('is empty, so nothing inside it can become a target', () => {
    renderWithCrystal(<Indicator state="busy" data-testid="mark" />);
    expect(screen.getByTestId('mark')).toBeEmptyDOMElement();
  });

  it('has no accessibility violations beside the control it describes', async () => {
    const { container } = renderWithCrystal(
      <label>
        Name
        <input aria-invalid="true" />
        <Indicator state="invalid" onField />
      </label>,
    );
    await expectNoAxeViolations(container);
  });
});

import { describe, expect, it, vi } from 'vitest';
import { expectNoAxeViolations } from '../../test/axe.js';
import { renderWithCrystal, screen, userEvent } from '../../test/render.js';
import { Slider, RangeSlider } from './Slider.js';

describe('Slider', () => {
  /* React Aria renders a native `input type="range"`, which carries its value and
     bounds natively. React Aria leaves `aria-valuenow` off, so the test asserts
     the native attributes instead. */
  it('has no accessibility violations and announces its bounds', async () => {
    const { container } = renderWithCrystal(
      <Slider label="Volume" defaultValue={40} minValue={0} maxValue={100} />,
    );
    const slider = screen.getByRole('slider', { name: 'Volume' }) as HTMLInputElement;
    expect(slider.value).toBe('40');
    expect(slider.min).toBe('0');
    expect(slider.max).toBe('100');
    await expectNoAxeViolations(container);
  });

  /* A slider whose value is a price must announce "£24", not "24". Asserting
     only that aria-valuetext is non-empty would pass with the unit on the screen
     and missing from the announcement, so the test checks for the unit. */
  it('announces the value with its unit, not only shows it', () => {
    renderWithCrystal(
      <Slider
        label="Price"
        defaultValue={24}
        formatOptions={{ style: 'currency', currency: 'GBP' }}
      />,
    );
    const announced = screen.getByRole('slider', { name: 'Price' }).getAttribute('aria-valuetext') ?? '';
    expect(announced).toContain('£');
    /* The visible output is the same string, so the two cannot drift. */
    expect(document.querySelector('output')?.textContent).toBe(announced);
  });

  it('steps from the keyboard', async () => {
    const onChange = vi.fn();
    renderWithCrystal(<Slider label="Volume" defaultValue={40} onChange={onChange} />);
    screen.getByRole('slider', { name: 'Volume' }).focus();
    await userEvent.keyboard('{ArrowRight}');
    expect(onChange).toHaveBeenCalledWith(41);
  });
});

describe('RangeSlider', () => {
  /* Two sliders with distinct names. One control with two handles announces one
     value, so a reader moving the lower bound is told the upper one. */
  it('is two sliders, each announcing its own bound', () => {
    renderWithCrystal(
      <RangeSlider
        label="Price"
        defaultValue={[20, 80]}
        startLabel="Minimum price"
        endLabel="Maximum price"
        formatOptions={{ style: 'currency', currency: 'GBP' }}
      />,
    );
    const [lower, upper] = screen.getAllByRole('slider') as HTMLInputElement[];
    /* Each carries its own name as well as the group's, so a reader moving one
       bound is told which bound it is. */
    expect(lower?.getAttribute('aria-label')).toBe('Minimum price');
    expect(upper?.getAttribute('aria-label')).toBe('Maximum price');
    expect(lower?.value).toBe('20');
    expect(upper?.value).toBe('80');
    /* Each end announces with the unit too. */
    expect(lower?.getAttribute('aria-valuetext') ?? '').toContain('£');
  });
});

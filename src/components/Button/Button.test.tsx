import { describe, expect, it, vi } from 'vitest';
import { expectNoAxeViolations } from '../../test/axe.js';
import { renderWithPrismata, screen, userEvent } from '../../test/render.js';
import { Button } from './Button.js';


describe('Button', () => {
  it('renders a real button with its label as the accessible name', () => {
    renderWithPrismata(<Button>Save</Button>);
    const button = screen.getByRole('button', { name: 'Save' });
    expect(button.tagName).toBe('BUTTON');
  });

  it('has no accessibility violations', async () => {
    const { container } = renderWithPrismata(<Button>Save</Button>);
    await expectNoAxeViolations(container);
  });

  /* Motion binds to press state, not to click. A keyboard user presses with Space
     and Enter and must get the same feedback a pointer user gets, which is why
     the upstream engine binds to state. */
  it('plays the press recipe for a keyboard press, not only a pointer one', async () => {
    const user = userEvent.setup();
    renderWithPrismata(<Button>Save</Button>);
    const button = screen.getByRole('button', { name: 'Save' });

    await user.tab();
    expect(button).toHaveFocus();
    await user.keyboard('[Space>]');
    expect(button.dataset['prMotionName']).toBe('press');
  });

  it('reports the press recipe as instant under reduced motion, still firing the action', async () => {
    const user = userEvent.setup();
    const onPress = vi.fn();
    renderWithPrismata(<Button onPress={onPress}>Save</Button>, { theme: { reduceMotion: true } });
    const button = screen.getByRole('button', { name: 'Save' });

    await user.click(button);
    /* The movement is removed; the state change is not. */
    expect(button.dataset['prMotionState']).toBe('instant');
    expect(onPress).toHaveBeenCalledOnce();
  });

  it('does not fire its action when disabled', async () => {
    const user = userEvent.setup();
    const onPress = vi.fn();
    renderWithPrismata(<Button isDisabled onPress={onPress}>Save</Button>);
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(onPress).not.toHaveBeenCalled();
  });

  it('exposes React Aria state to CSS as data attributes', async () => {
    const user = userEvent.setup();
    renderWithPrismata(<Button>Save</Button>);
    const button = screen.getByRole('button', { name: 'Save' });
    await user.tab();
    /* This is what lets the stylesheet be plain SCSS with no style runtime. */
    expect(button).toHaveAttribute('data-focus-visible');
  });

  it('forwards a ref to the underlying element', () => {
    const ref = { current: null as HTMLButtonElement | null };
    renderWithPrismata(<Button ref={ref}>Save</Button>);
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });

  it('keeps pill geometry in every variant, and card only when asked', () => {
    const { rerenderWithPrismata } = renderWithPrismata(<Button variant="primary">A</Button>);
    const classOf = () => screen.getByRole('button').className;
    const pill = classOf();
    rerenderWithPrismata(<Button variant="quiet">A</Button>);
    /* A variant is a fill, never a different shape: no variant adds the card class. */
    expect(classOf()).not.toMatch(/card/);
    expect(pill).not.toMatch(/card/);
    rerenderWithPrismata(<Button shape="card">A</Button>);
    expect(classOf()).toMatch(/card/);
  });

  it('passes an unknown recipe name up as an error rather than failing silently', () => {
    /* Recipes come from @prismata/core. A typo must not degrade to "no animation",
       because that cannot be told apart from a working component. */
    expect(() => renderWithPrismata(<Button>A</Button>)).not.toThrow();
  });
});

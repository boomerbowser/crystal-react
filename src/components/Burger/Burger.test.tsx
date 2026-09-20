import { describe, expect, it, vi } from 'vitest';
import { useState } from 'react';
import { renderWithCrystal, screen, userEvent } from '../../test/render.js';
import { Burger } from './Burger.js';

function Controlled({ label }: { label?: string }): React.JSX.Element {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Burger isOpen={open} onOpenChange={setOpen} controls="nav" {...(label ? { label } : {})} />
      <nav id="nav" hidden={!open}>menu</nav>
    </>
  );
}

describe('Burger', () => {
  it('has a name, an expanded state and something it controls', () => {
    renderWithCrystal(<Controlled />);
    const button = screen.getByRole('button', { name: 'Navigation' });
    expect(button.getAttribute('aria-expanded')).toBe('false');
    expect(button.getAttribute('aria-controls')).toBe('nav');
  });

  it('announces the state through aria-expanded, and keeps its name', async () => {
    const user = userEvent.setup();
    renderWithCrystal(<Controlled />);
    const button = screen.getByRole('button', { name: 'Navigation' });
    await user.click(button);
    expect(button.getAttribute('aria-expanded')).toBe('true');
    /* The name must not become "Close navigation". Changing it re-announces
       the control as a different element to a reader who tabs back to it, and
       aria-expanded already carries the state in the place assistive
       technology looks for it. */
    expect(screen.getByRole('button', { name: 'Navigation' })).toBe(button);
  });

  it('is operable from the keyboard', async () => {
    const user = userEvent.setup();
    renderWithCrystal(<Controlled />);
    await user.tab();
    const button = screen.getByRole('button', { name: 'Navigation' });
    expect(document.activeElement).toBe(button);
    await user.keyboard('{Enter}');
    expect(button.getAttribute('aria-expanded')).toBe('true');
  });

  it('reports each press to its caller', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    renderWithCrystal(<Burger isOpen={false} onOpenChange={onOpenChange} />);
    await user.click(screen.getByRole('button'));
    expect(onOpenChange).toHaveBeenCalledWith(true);
  });

  it('takes the name it is given', () => {
    renderWithCrystal(<Controlled label="Sections" />);
    expect(screen.getByRole('button', { name: 'Sections' })).toBeTruthy();
  });
});

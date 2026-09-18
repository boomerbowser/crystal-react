import { describe, expect, it, vi } from 'vitest';
import { expectNoAxeViolations } from '../../test/axe.js';
import { renderWithCrystal, screen, userEvent } from '../../test/render.js';
import { MaskInput } from './MaskInput.js';

describe('MaskInput', () => {
  it('has no accessibility violations', async () => {
    const { container } = renderWithCrystal(
      <MaskInput label="Card number" mask="0000 0000 0000 0000" id="card" />,
    );
    await expectNoAxeViolations(container);
  });

  /* The mask is a display of the value, not the value. A form that receives
     "(555) 012-3456" where the API wants "5550123456" has pushed the formatting
     problem to the server, and the server will disagree about it. */
  it('reports the raw value and shows the formatted one', async () => {
    const onChange = vi.fn();
    renderWithCrystal(
      <MaskInput label="Phone" mask="(000) 000-0000" onChange={onChange} id="phone" />,
    );
    const field = screen.getByLabelText('Phone');
    await userEvent.type(field, '5550123456');

    expect(onChange).toHaveBeenLastCalledWith('5550123456');
    expect((field as HTMLInputElement).value).toBe('(555) 012-3456');
  });
});

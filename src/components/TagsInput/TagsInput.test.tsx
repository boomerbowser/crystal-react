import { describe, expect, it, vi } from 'vitest';
import { expectNoAxeViolations } from '../../test/axe.js';
import { renderWithCrystal, screen, userEvent } from '../../test/render.js';
import { TagsInput } from './TagsInput.js';

describe('TagsInput', () => {
  it('has no accessibility violations', async () => {
    const { container } = renderWithCrystal(<TagsInput label="Topics" defaultValue={['design']} />);
    await expectNoAxeViolations(container);
  });

  it('commits a value on a delimiter', async () => {
    const onChange = vi.fn();
    renderWithCrystal(<TagsInput label="Topics" onChange={onChange} />);
    await userEvent.type(screen.getByLabelText('Topics'), 'design,');
    expect(onChange).toHaveBeenLastCalledWith(['design']);
  });

  /* A chip appearing is a visual event. Without an announcement the field appears
     to swallow what was typed. */
  it('announces an addition and a removal', async () => {
    renderWithCrystal(<TagsInput label="Topics" />);
    await userEvent.type(screen.getByLabelText('Topics'), 'design{Enter}');
    expect(screen.getByRole('status').textContent).toContain('design added');

    await userEvent.click(screen.getByRole('button', { name: 'Remove design' }));
    expect(screen.getByRole('status').textContent).toContain('design removed');
  });

  /* "Nothing happened" is the worst possible answer to a keypress. */
  it('refuses a duplicate and says why', async () => {
    renderWithCrystal(<TagsInput label="Topics" defaultValue={['design']} />);
    await userEvent.type(screen.getByLabelText('Topics'), 'design{Enter}');
    expect(screen.getByRole('alert').textContent).toContain('already here');
  });

  it('refuses past the limit and says why', async () => {
    renderWithCrystal(<TagsInput label="Topics" defaultValue={['a', 'b']} maxTags={2} />);
    await userEvent.type(screen.getByLabelText('Topics'), 'c{Enter}');
    expect(screen.getByRole('alert').textContent).toMatch(/most you can add/);
  });

  /* Removing the last chip destroys the element that had focus, and the browser
     then focuses the body — which drops a keyboard user out of the form. */
  it('returns focus to the entry after a removal', async () => {
    renderWithCrystal(<TagsInput label="Topics" defaultValue={['design']} />);
    await userEvent.click(screen.getByRole('button', { name: 'Remove design' }));
    expect(document.activeElement).toBe(screen.getByLabelText('Topics'));
  });

  /* The gesture every field of this shape has, and the one people reach for. */
  it('removes the last chip on backspace in an empty field', async () => {
    const onChange = vi.fn();
    renderWithCrystal(<TagsInput label="Topics" defaultValue={['a', 'b']} onChange={onChange} />);
    const entry = screen.getByLabelText('Topics');
    entry.focus();
    await userEvent.keyboard('{Backspace}');
    expect(onChange).toHaveBeenLastCalledWith(['a']);
  });
});

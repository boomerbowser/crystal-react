import { describe, expect, it, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { expectNoAxeViolations } from '../../test/axe.js';
import { renderWithCrystal, screen } from '../../test/render.js';
import { MultiSelect } from './MultiSelect.js';

/* The accessible name as a reader assembles it, rather than as a matcher
   summarises it — a matcher given a wrong expectation here still passed. */
const describedName = (element: HTMLElement): string =>
  (element.getAttribute('aria-labelledby') ?? '')
    .split(' ')
    .map((id) => document.getElementById(id)?.textContent ?? '')
    .join(' ');

const TAGS = [
  { value: 'design', label: 'Design' },
  { value: 'research', label: 'Research' },
  { value: 'writing', label: 'Writing' },
  { value: 'legacy', label: 'Legacy', isDisabled: true },
];

const open = async () => {
  await userEvent.click(screen.getByRole('button', { name: /Tags/ }));
  return screen.getByRole('listbox');
};

describe('MultiSelect', () => {
  /* The two assertions that matter, and the two the component never had. The
     first version nested its listbox inside React Aria's `Select`, which owns
     and replaces the selection of whatever listbox it contains: the rendered
     listbox had no `aria-multiselectable` and every option read
     `aria-selected="false"`, however many chips were on screen. */
  it('announces itself as multi-selectable, and says which options are chosen', async () => {
    renderWithCrystal(<MultiSelect label="Tags" options={TAGS} defaultValue={['design']} />);
    const list = await open();

    expect(list.getAttribute('aria-multiselectable')).toBe('true');
    expect(screen.getByRole('option', { name: 'Design' }).getAttribute('aria-selected')).toBe('true');
    expect(screen.getByRole('option', { name: 'Writing' }).getAttribute('aria-selected')).toBe('false');
  });

  it('toggles an option and reports the whole set', async () => {
    const onChange = vi.fn();
    renderWithCrystal(
      <MultiSelect label="Tags" options={TAGS} defaultValue={['design']} onChange={onChange} />,
    );
    await open();
    await userEvent.click(screen.getByRole('option', { name: 'Writing' }));
    expect(onChange).toHaveBeenLastCalledWith(['design', 'writing']);
  });

  /* A filter hides options; it must not deselect them. React Aria reports the
     selection of the collection it can see, so a narrowed list would otherwise
     empty the field of everything the filter had scrolled past. */
  it('keeps selections that the filter has hidden', async () => {
    renderWithCrystal(<MultiSelect label="Tags" options={TAGS} defaultValue={['design']} />);
    await open();

    await userEvent.type(screen.getByRole('searchbox', { name: /Filter/ }), 'writ');
    expect(screen.queryByRole('option', { name: 'Design' })).toBeNull();
    await userEvent.click(screen.getByRole('option', { name: 'Writing' }));

    await userEvent.clear(screen.getByRole('searchbox', { name: /Filter/ }));
    expect(screen.getByRole('option', { name: 'Design' }).getAttribute('aria-selected')).toBe('true');
    expect(screen.getByRole('option', { name: 'Writing' }).getAttribute('aria-selected')).toBe('true');
  });

  it('says so when nothing matches', async () => {
    renderWithCrystal(<MultiSelect label="Tags" options={TAGS} />);
    await open();
    await userEvent.type(screen.getByRole('searchbox', { name: /Filter/ }), 'zzz');
    expect(screen.getByText(/No options match/)).toBeInTheDocument();
  });

  /* The catalogue's `at-limit` state. The options are disabled rather than
     removed, so the list does not change shape under the reader. */
  it('stops at the limit and says why', async () => {
    renderWithCrystal(
      <MultiSelect label="Tags" options={TAGS} defaultValue={['design']} maxSelected={1} />,
    );
    await open();
    expect(screen.getByRole('status').textContent).toContain('the most allowed');
    expect(screen.getByRole('option', { name: 'Writing' }).getAttribute('aria-disabled')).toBe('true');
    /* And the one already chosen stays available, so it can be given back. */
    expect(screen.getByRole('option', { name: 'Design' }).getAttribute('aria-disabled')).not.toBe('true');
  });

  /* Chips are not tab stops — six values would be seven stops before the next
     field — so the count belongs in the trigger's name, which is reached. */
  it('carries the selection in the trigger name', () => {
    renderWithCrystal(
      <MultiSelect label="Tags" options={TAGS} defaultValue={['design', 'writing']} />,
    );
    const trigger = screen.getByRole('button', { name: /Tags/ });
    expect(trigger.getAttribute('aria-label')).toBeNull();
    expect(trigger.textContent).not.toContain('2 chosen');
    expect(describedName(trigger)).toContain('Tags');
    expect(describedName(trigger)).toContain('2 chosen: Design, Writing');
  });

  it('removes a chip from within the field', async () => {
    const onChange = vi.fn();
    renderWithCrystal(
      <MultiSelect label="Tags" options={TAGS} defaultValue={['design', 'writing']} onChange={onChange} />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Remove Design' }));
    expect(onChange).toHaveBeenLastCalledWith(['writing']);
  });

  /* Down from the filter is the movement a filter field implies. */
  it('moves from the filter into the list with the down arrow', async () => {
    renderWithCrystal(<MultiSelect label="Tags" options={TAGS} />);
    await open();
    screen.getByRole('searchbox', { name: /Filter/ }).focus();
    await userEvent.keyboard('{ArrowDown}');
    expect(screen.getByRole('searchbox', { name: /Filter/ })).not.toBe(document.activeElement);
  });

  it('has no axe violations, closed or open', async () => {
    const { container } = renderWithCrystal(
      <MultiSelect
        label="Tags"
        options={TAGS}
        defaultValue={['design']}
        description="Pick as many as apply"
      />,
    );
    await expectNoAxeViolations(container);
    await open();
    await expectNoAxeViolations(document.body);
  });
});

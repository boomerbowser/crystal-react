import { describe, expect, it, vi } from 'vitest';
import { expectNoAxeViolations } from '../../test/axe.js';
import { renderWithCrystal, screen, userEvent, waitFor, within } from '../../test/render.js';
import { TextInput } from '../TextInput/TextInput.js';
import { CrudFormBlock, type CrudFormBlockProps, type CrudFormState } from './CrudFormBlock.js';

const sections: CrudFormBlockProps['sections'] = [
  {
    id: 'details',
    title: 'Details',
    description: 'How the project appears to the team.',
    children: (
      <>
        <TextInput name="name" label="Project name" defaultValue="Harbour" />
        <TextInput name="code" label="Project code" />
      </>
    ),
  },
  { id: 'owner', title: 'Owner', children: <TextInput name="owner" label="Owner email" type="email" /> },
];

const props: CrudFormBlockProps = { title: 'Edit project', sections, onSubmit: () => {}, onCancel: () => {} };

describe('CrudFormBlock', () => {
  it('puts each section in a group named by its legend', () => {
    renderWithCrystal(<CrudFormBlock {...props} />);
    const details = screen.getByRole('group', { name: 'Details' });
    expect(within(details).getByRole('textbox', { name: 'Project name' })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Owner' })).toBeInTheDocument();
  });

  it('hands the product the named values on submit', async () => {
    const onSubmit = vi.fn();
    renderWithCrystal(<CrudFormBlock {...props} onSubmit={onSubmit} />);
    await userEvent.type(screen.getByRole('textbox', { name: 'Project code' }), 'HB-1');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    const values = onSubmit.mock.calls[0]![0] as FormData;
    expect(values.get('name')).toBe('Harbour');
    expect(values.get('code')).toBe('HB-1');
  });

  /* The opinion, half one: errors summarise at the top and link to their fields. */
  it('summarises the errors at the top, takes focus there, and links each to its field', async () => {
    const errors = { code: 'Enter a project code', owner: 'Enter an email address' };
    renderWithCrystal(<CrudFormBlock {...props} errors={errors} state="error" />);
    const summary = screen.getByRole('region', { name: 'There are 2 problems' });
    await waitFor(() => { expect(summary).toHaveFocus(); });
    /* The same messages reach the fields, from the same object. */
    expect(screen.getByRole('textbox', { name: 'Project code' })).toHaveAttribute('aria-invalid', 'true');
    await userEvent.click(within(summary).getByRole('link', { name: 'Enter an email address' }));
    expect(screen.getByRole('textbox', { name: 'Owner email' })).toHaveFocus();
  });

  /* Half two: submission state is announced. */
  it.each([
    ['validating', 'Checking'],
    ['submitting', 'Saving'],
    ['saved', 'Saved'],
    ['error', 'Not saved'],
  ] as const)('says %s in the one polite region', (state, said) => {
    renderWithCrystal(<CrudFormBlock {...props} state={state} />);
    expect(screen.getByRole('status')).toHaveTextContent(said);
  });

  it('says nothing at rest, from a region that is already there', () => {
    renderWithCrystal(<CrudFormBlock {...props} />);
    expect(screen.getByRole('status')).toHaveTextContent('');
  });

  it('holds the form while it checks or saves, and marks it busy', async () => {
    const onSubmit = vi.fn();
    renderWithCrystal(<CrudFormBlock {...props} onSubmit={onSubmit} state="submitting" />);
    expect(screen.getByRole('textbox', { name: 'Project name' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Save' }).closest('form')).toHaveAttribute('aria-busy', 'true');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('shows saved in a word as well as saying it', () => {
    renderWithCrystal(<CrudFormBlock {...props} state="saved" savedLabel="All changes saved" />);
    expect(screen.getAllByText('All changes saved')).toHaveLength(2);
  });

  it('alerts a failure that belongs to no field', () => {
    renderWithCrystal(<CrudFormBlock {...props} state="error" errorMessage="The server could not be reached." />);
    expect(screen.getByRole('alert')).toHaveTextContent('The server could not be reached.');
  });

  it('offers cancel only when the product can take it', () => {
    renderWithCrystal(<CrudFormBlock title="New project" sections={sections} onSubmit={() => {}} />);
    expect(screen.queryByRole('button', { name: 'Cancel' })).toBeNull();
  });

  it.each(['at-rest', 'validating', 'submitting', 'saved', 'error'] satisfies CrudFormState[])(
    'has no axe violations %s',
    async (state) => {
      const errors = state === 'error' ? { code: 'Enter a project code' } : {};
      const { container } = renderWithCrystal(
        <CrudFormBlock {...props} state={state} errors={errors} errorMessage="Not saved. Try again." />,
      );
      await expectNoAxeViolations(container);
    },
  );
});

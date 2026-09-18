import { describe, expect, it, vi } from 'vitest';
import { expectNoAxeViolations } from '../../test/axe.js';
import { renderWithCrystal, screen, userEvent } from '../../test/render.js';
import { RichTextSurface, Mentions } from './RichTextSurface.js';

const BoldIcon = <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5h6a4 4 0 010 8H7z" /></svg>;

describe('RichTextSurface', () => {
  it('has no accessibility violations', async () => {
    const { container } = renderWithCrystal(
      <RichTextSurface label="Notes"><div contentEditable suppressContentEditableWarning>Text</div></RichTextSurface>,
    );
    await expectNoAxeViolations(container);
  });

  /* A bold button that looks pressed and announces as an ordinary button leaves
     a reader unable to tell whether their selection is already bold — which is
     the only thing a formatting toolbar is for. */
  it('reports active formatting with aria-pressed', async () => {
    const onToggle = vi.fn();
    renderWithCrystal(
      <RichTextSurface
        label="Notes"
        actions={[{ id: 'bold', label: 'Bold', icon: BoldIcon, isActive: true, onToggle }]}
      >
        <div contentEditable suppressContentEditableWarning>Text</div>
      </RichTextSurface>,
    );
    const bold = screen.getByRole('button', { name: 'Bold' });
    expect(bold.getAttribute('aria-pressed')).toBe('true');

    await userEvent.click(bold);
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  /* The toolbar is one tab stop with arrows inside it, as everywhere in Crystal. */
  it('groups the formatting actions into one toolbar', () => {
    renderWithCrystal(
      <RichTextSurface
        label="Notes"
        actions={[{ id: 'bold', label: 'Bold', icon: BoldIcon, onToggle: () => undefined }]}
      >
        <div contentEditable suppressContentEditableWarning>Text</div>
      </RichTextSurface>,
    );
    expect(screen.getByRole('toolbar', { name: /Formatting for Notes/ })).toBeInTheDocument();
  });
});

describe('Mentions', () => {
  /* A listbox the text surface points at rather than one focus moves into:
     typing has to continue while the list is open. */
  it('offers a listbox without taking focus from the surface', async () => {
    const onSelect = vi.fn();
    renderWithCrystal(
      <Mentions
        isOpen
        options={[{ value: 'ada', label: 'Ada Lovelace' }]}
        highlightedValue="ada"
        onSelect={onSelect}
      >
        <textarea aria-label="Comment" defaultValue="@ad" />
      </Mentions>,
    );
    const surface = screen.getByRole('textbox', { name: 'Comment' });
    surface.focus();

    expect(screen.getByRole('listbox')).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Ada Lovelace' }).getAttribute('aria-selected')).toBe('true');
    expect(document.activeElement).toBe(surface);
  });

  it('says when nothing matches', () => {
    renderWithCrystal(
      <Mentions isOpen options={[]} onSelect={() => undefined} emptyMessage="Nobody by that name">
        <textarea aria-label="Comment" />
      </Mentions>,
    );
    expect(screen.getByText('Nobody by that name')).toBeInTheDocument();
  });
});

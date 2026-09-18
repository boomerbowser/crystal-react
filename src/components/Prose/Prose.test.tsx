import { describe, expect, it } from 'vitest';
import { expectNoAxeViolations } from '../../test/axe.js';
import { renderWithCrystal, screen, userEvent } from '../../test/render.js';
import { Prose, Blockquote, Abbr } from './Prose.js';
import { ProseList, Cite } from '../ProseList/ProseList.js';

describe('Prose', () => {
  it('styles content it did not lay out, without changing its structure', async () => {
    const { container } = renderWithCrystal(
      <Prose>
        <h2>A heading</h2>
        <p>A paragraph.</p>
        <ul><li>One</li><li>Two</li></ul>
      </Prose>,
    );
    expect(screen.getByRole('heading', { level: 2, name: 'A heading' })).toBeInTheDocument();
    expect(screen.getByRole('list').querySelectorAll('li')).toHaveLength(2);
    await expectNoAxeViolations(container);
  });
});

describe('Blockquote', () => {
  /* `cite` names a work, not a person. Putting the person inside it tells a
     screen reader the person is a publication. */
  it('marks the work and leaves the person as text', () => {
    renderWithCrystal(
      <Blockquote attribution="Ada Lovelace" source="Notes on the Analytical Engine" data-testid="q">
        <p>The Analytical Engine weaves algebraic patterns.</p>
      </Blockquote>,
    );
    const cite = screen.getByTestId('q').querySelector('cite');
    expect(cite?.textContent).toContain('Notes on the Analytical Engine');
    expect(cite?.querySelector('cite')).toBeNull();
  });

  it('carries the source URL on the quotation itself', () => {
    renderWithCrystal(
      <Blockquote sourceUrl="https://example.com/notes" data-testid="q"><p>Quoted.</p></Blockquote>,
    );
    expect(screen.getByTestId('q').getAttribute('cite')).toBe('https://example.com/notes');
  });
});

describe('Abbr', () => {
  /* An expansion shown only on hover is no use without a pointer, so the
     catalogue asks for a tab stop. */
  it('is focusable, so the expansion is reachable without a pointer', async () => {
    renderWithCrystal(<Abbr expansion="Cascading Style Sheets" data-testid="a">CSS</Abbr>);
    const abbr = screen.getByTestId('a');
    expect(abbr.getAttribute('title')).toBe('Cascading Style Sheets');

    await userEvent.tab();
    expect(document.activeElement).toBe(abbr);
  });
});

describe('ProseList', () => {
  /* A real ul or ol is the whole requirement: the count and the nesting are
     announced because the element carries them. */
  it('is a real list, marked or not', () => {
    const { rerenderWithCrystal } = renderWithCrystal(
      <ProseList><li>One</li><li>Two</li></ProseList>,
    );
    expect(screen.getByRole('list').tagName).toBe('UL');

    rerenderWithCrystal(<ProseList ordered><li>One</li></ProseList>);
    expect(screen.getByRole('list').tagName).toBe('OL');

    /* Unmarked removes the marker and keeps the semantics: still a list of N. */
    rerenderWithCrystal(<ProseList unmarked><li>One</li><li>Two</li></ProseList>);
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
  });

  it('renders a standalone citation', () => {
    renderWithCrystal(<Cite>Notes on the Analytical Engine</Cite>);
    expect(screen.getByText('Notes on the Analytical Engine').tagName).toBe('CITE');
  });
});

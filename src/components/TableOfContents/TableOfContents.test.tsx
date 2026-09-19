import { describe, expect, it, vi } from 'vitest';
import { expectNoAxeViolations } from '../../test/axe.js';
import { renderWithCrystal, screen, userEvent, within } from '../../test/render.js';
import { TableOfContents, useHeadingInView, type TocEntry } from './TableOfContents.js';

const entries: TocEntry[] = [
  { id: 'materials', label: 'Materials', level: 2 },
  { id: 'frost', label: 'Frost', level: 3 },
  { id: 'resin', label: 'Resin', level: 3 },
  { id: 'motion', label: 'Motion', level: 2 },
];

describe('TableOfContents', () => {
  it('has no accessibility violations', async () => {
    const { container } = renderWithCrystal(
      <TableOfContents entries={entries} activeId="frost" />,
    );
    await expectNoAxeViolations(container);
  });

  it('is a named landmark holding an ordered list of links', () => {
    renderWithCrystal(<TableOfContents entries={entries} label="On this page" />);
    const nav = screen.getByRole('navigation', { name: 'On this page' });
    expect(within(nav).getByRole('list')).toBeInTheDocument();
    expect(within(nav).getAllByRole('link')).toHaveLength(4);
  });

  it('links each entry to its heading', () => {
    renderWithCrystal(<TableOfContents entries={entries} />);
    expect(screen.getByRole('link', { name: 'Frost' })).toHaveAttribute('href', '#frost');
  });

  /* `location`, not `page`. Every entry here points at the document being read,
     so `page` would be true of all of them and would say nothing. */
  it('marks where you are with aria-current="location"', () => {
    renderWithCrystal(<TableOfContents entries={entries} activeId="frost" />);
    expect(screen.getByRole('link', { name: 'Frost' })).toHaveAttribute('aria-current', 'location');
    expect(screen.getByRole('link', { name: 'Resin' }).getAttribute('aria-current')).toBeNull();
  });

  it('marks nothing when no entry is active', () => {
    const { container } = renderWithCrystal(<TableOfContents entries={entries} />);
    expect(container.querySelectorAll('[aria-current]')).toHaveLength(0);
  });

  /* Indentation is relative to the shallowest heading present, so a document
     whose headings start at h2 is not indented by a level it does not have. */
  it('indents from the shallowest level in the document, not from h1', () => {
    renderWithCrystal(<TableOfContents entries={entries} />);
    const depthOf = (name: string) => {
      const link = screen.getByRole('link', { name });
      return Number((link as HTMLElement).style.getPropertyValue('--cr-toc-level'));
    };
    expect(depthOf('Materials')).toBe(0);
    expect(depthOf('Frost')).toBe(1);
    expect(depthOf('Motion')).toBe(0);
  });

  it('hands navigation to the product when it asks for it', async () => {
    const user = userEvent.setup();
    const onNavigate = vi.fn();
    renderWithCrystal(<TableOfContents entries={entries} onNavigate={onNavigate} />);
    await user.click(screen.getByRole('link', { name: 'Resin' }));
    expect(onNavigate).toHaveBeenCalledWith('resin');
  });

  /* A modified click is the reader asking the browser for a new tab or window.
     Intercepting it takes that choice away, and a table of contents is exactly
     where somebody opens a section beside what they are reading. */
  it('leaves a modified click to the browser', async () => {
    const user = userEvent.setup();
    const onNavigate = vi.fn();
    renderWithCrystal(<TableOfContents entries={entries} onNavigate={onNavigate} />);
    await user.keyboard('{Meta>}');
    await user.click(screen.getByRole('link', { name: 'Resin' }));
    await user.keyboard('{/Meta}');
    expect(onNavigate).not.toHaveBeenCalled();
  });

  it('follows the fragment itself when no handler is given', () => {
    renderWithCrystal(<TableOfContents entries={entries} />);
    const link = screen.getByRole('link', { name: 'Resin' });
    /* No click handler at all, rather than one that calls preventDefault and
       then does nothing — which is how a link silently stops working. */
    expect(link).toHaveAttribute('href', '#resin');
  });

  it('never marks the active entry with a check', () => {
    renderWithCrystal(<TableOfContents entries={entries} activeId="frost" />);
    const link = screen.getByRole('link', { name: 'Frost' });
    expect(link.textContent).not.toMatch(/[✓✔]/);
    expect(link.querySelector('svg')).toBeNull();
  });
});

describe('useHeadingInView', () => {
  /* What is checked here is the guard, and nothing more. The hook is geometry:
     it reads every heading's position against a line a fifth of the way down the
     scrolling box. jsdom reports every rect as zero, so there is no geometry to
     read and an assertion about which heading wins would be an assertion about
     jsdom. The behaviour is verified in a real browser by
     `scripts/verify-behaviour.mjs`, which walks the scroll and records what the
     marking does — and which found three separate defects the first time it ran.

     It earns its place because "the page this annotates must not crash" is a
     real requirement and a cheap one to break: ids that match nothing is the
     normal state of a document that has not rendered its headings yet. */
  it('marks nothing, and does not throw, when no heading matches', () => {
    let seen: string | undefined = 'unset';
    function Probe(): null {
      seen = useHeadingInView(['nothing-here', 'nor-this']);
      return null;
    }
    renderWithCrystal(<Probe />);
    expect(seen).toBeUndefined();
  });

  it('marks nothing for an empty list', () => {
    let seen: string | undefined = 'unset';
    function Probe(): null {
      seen = useHeadingInView([]);
      return null;
    }
    renderWithCrystal(<Probe />);
    expect(seen).toBeUndefined();
  });
});

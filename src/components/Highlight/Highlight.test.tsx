import { describe, expect, it } from 'vitest';
import { renderWithCrystal, screen } from '../../test/render.js';
import { Highlight, Mark } from './Highlight.js';

describe('Highlight', () => {
  it('marks the matches with a real mark element', () => {
    renderWithCrystal(<Highlight query="crystal" data-testid="h">Crystal is a design system</Highlight>);
    const marks = screen.getByTestId('h').querySelectorAll('mark');
    expect(marks).toHaveLength(1);
    expect(marks[0]?.textContent).toBe('Crystal');
  });

  /* The whole string stays readable as one sentence. Splitting it into an array
     of fragments is how a screen reader ends up reading it as fragments. */
  it('leaves the sentence readable as one string', () => {
    renderWithCrystal(<Highlight query="design" data-testid="h">Crystal is a design system</Highlight>);
    expect(screen.getByTestId('h').textContent).toBe('Crystal is a design system');
  });

  /* A query is somebody's typing, not a pattern. Without escaping, a search for
     "c++" or "(" throws — a crash on an input a person is allowed to make. */
  it('treats the query as text rather than as a pattern', () => {
    expect(() => renderWithCrystal(
      <Highlight query="c++ (" data-testid="h">Written in c++ (mostly)</Highlight>,
    )).not.toThrow();
    expect(screen.getByTestId('h').textContent).toBe('Written in c++ (mostly)');
  });

  it('marks nothing for an empty query', () => {
    renderWithCrystal(<Highlight query="" data-testid="h">Nothing to find</Highlight>);
    expect(screen.getByTestId('h').querySelectorAll('mark')).toHaveLength(0);
  });

  it('renders a standalone mark', () => {
    renderWithCrystal(<Mark>match</Mark>);
    expect(screen.getByText('match').tagName).toBe('MARK');
  });
});

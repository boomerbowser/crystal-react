import { describe, expect, it } from 'vitest';
import { renderWithCrystal, screen } from '../../test/render.js';
import { Text } from './Text.js';

describe('Text', () => {
  it('renders a paragraph at the reading size by default', () => {
    renderWithCrystal(<Text data-testid="t">Body</Text>);
    const el = screen.getByTestId('t');
    expect(el.tagName).toBe('P');
    /* `body` is the reading size exactly, so it declares no override. The
       stylesheet's default is the token. */
    expect(el.style.getPropertyValue('--cr-text-size')).toBe('');
  });

  it('takes a step from Crystal\'s scale rather than a size', () => {
    renderWithCrystal(<Text step="caption" data-testid="t">Small</Text>);
    expect(screen.getByTestId('t').style.getPropertyValue('--cr-text-size'))
      .toBe('var(--cr-text-caption-size)');
  });

  /* Clipping removes the text from sight and not from the DOM, so a screen reader
     still reads it, but a sighted reader loses it. `title` is the way back. */
  it('keeps the full value reachable when it truncates', () => {
    renderWithCrystal(<Text truncate data-testid="t">A sentence long enough to clip</Text>);
    expect(screen.getByTestId('t').getAttribute('title')).toBe('A sentence long enough to clip');
  });

  it('does not invent a title it cannot build', () => {
    renderWithCrystal(<Text truncate data-testid="t"><span>Rich</span> content</Text>);
    expect(screen.getByTestId('t').getAttribute('title')).toBeNull();
  });

  /* A line that means something is the element that says so, so a screen
     reader can announce a deletion; a decoration alone is only a look. */
  it('renders the edit elements, and decorates without inventing meaning', () => {
    const { container } = renderWithCrystal(
      <>
        <Text as="del">£40</Text>
        <Text as="ins">£45</Text>
        <Text as="span" decoration="underline">Label</Text>
      </>,
    );
    expect(container.querySelector('del')).toHaveTextContent('£40');
    expect(container.querySelector('ins')).toHaveTextContent('£45');
    const label = screen.getByText('Label');
    expect(label.tagName).toBe('SPAN');
    expect(label.className).toMatch(/underline/);
  });
});

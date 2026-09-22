import { describe, expect, it } from 'vitest';
import { expectNoAxeViolations } from '../../test/axe.js';
import { renderWithCrystal, screen } from '../../test/render.js';
import { Caption } from './Caption.js';

const media = <img src="/harbour.jpg" alt="A harbour at first light" />;

describe('Caption', () => {
  it('renders a real figure and figcaption', () => {
    const { container } = renderWithCrystal(<Caption caption="Sunrise, 5:40am">{media}</Caption>);
    expect(container.querySelector('figure > figcaption')).toHaveTextContent('Sunrise, 5:40am');
  });

  /* "A caption never replaces alt text; the two say different things." Both are
     present, and they are not the same sentence. */
  it('leaves the media\'s own alt text alone', () => {
    renderWithCrystal(<Caption caption="Sunrise, 5:40am">{media}</Caption>);
    expect(screen.getByAltText('A harbour at first light')).toBeInTheDocument();
    expect(screen.getByText('Sunrise, 5:40am')).toBeInTheDocument();
  });

  /* Hidden is not absent. The text stays in the document and stays associated
     with the figure; it leaves the visual composition only. */
  it('keeps a hidden caption in the accessibility tree', () => {
    const { container } = renderWithCrystal(
      <Caption caption="Sunrise, 5:40am" captionHidden>{media}</Caption>,
    );
    const figcaption = container.querySelector('figcaption');
    expect(figcaption).toHaveTextContent('Sunrise, 5:40am');
    expect(figcaption).not.toHaveAttribute('aria-hidden');
  });

  /* Nothing moves at rest: an overlaid caption animating as the page settled
     would be ambient motion. */
  it('plays nothing on mount and plays when the caption moves over the media', () => {
    const { container, rerenderWithCrystal } = renderWithCrystal(
      <Caption caption="Sunrise, 5:40am" overlaid>{media}</Caption>,
    );
    const first = container.querySelector('figcaption');
    expect(first?.dataset['crMotionName'] ?? first?.dataset['crMotionState']).toBeUndefined();

    rerenderWithCrystal(<Caption caption="Sunrise, 5:40am">{media}</Caption>);
    rerenderWithCrystal(<Caption caption="Sunrise, 5:40am" overlaid>{media}</Caption>);
    const played = container.querySelector('figcaption');
    expect(played?.dataset['crMotionName'] ?? played?.dataset['crMotionState']).toBeDefined();
  });

  it('has no accessibility violations', async () => {
    const { container } = renderWithCrystal(
      <Caption caption="Sunrise, 5:40am" overlaid>{media}</Caption>,
    );
    await expectNoAxeViolations(container);
  });
});

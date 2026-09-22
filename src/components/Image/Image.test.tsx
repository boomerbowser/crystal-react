import { describe, expect, it } from 'vitest';
import { expectNoAxeViolations } from '../../test/axe.js';
import { fireEvent, renderWithCrystal, screen } from '../../test/render.js';
import { Image } from './Image.js';

describe('Image', () => {
  /* The most common layout shift on the web is an image arriving and pushing the
     paragraph below it down the page. */
  it('reserves the ratio before anything loads', () => {
    const { container } = renderWithCrystal(
      <Image src="/harbour.jpg" alt="A harbour" ratio={16 / 9} />,
    );
    const box = container.querySelector('span');
    expect(box?.getAttribute('style')).toMatch(/aspect-ratio/);
  });

  it('moves from loading to loaded, and to error when the picture fails', () => {
    const { container } = renderWithCrystal(<Image src="/harbour.jpg" alt="A harbour" />);
    const box = container.querySelector('span') as HTMLElement;
    expect(box.dataset['state']).toBe('loading');
    fireEvent.error(container.querySelector('img') as HTMLImageElement);
    expect(box.dataset['state']).toBe('error');
  });

  it('shows the fallback instead of a broken picture', () => {
    const { container } = renderWithCrystal(
      <Image src="/harbour.jpg" alt="A harbour" fallback="Photograph unavailable" />,
    );
    fireEvent.error(container.querySelector('img') as HTMLImageElement);
    expect(screen.getByText('Photograph unavailable')).toBeInTheDocument();
    expect(container.querySelector('img')).toBeNull();
  });

  /* Movement somebody started: the picture arriving is the thing that happened. */
  it('plays nothing until the picture arrives', () => {
    const { container } = renderWithCrystal(<Image src="/harbour.jpg" alt="A harbour" />);
    const box = container.querySelector('span') as HTMLElement;
    expect(box.dataset['crMotionName'] ?? box.dataset['crMotionState']).toBeUndefined();
    fireEvent.load(container.querySelector('img') as HTMLImageElement);
    expect(box.dataset['crMotionName'] ?? box.dataset['crMotionState']).toBeDefined();
  });

  it('starts again when the source changes', () => {
    const { container, rerenderWithCrystal } = renderWithCrystal(
      <Image src="/a.jpg" alt="A" />,
    );
    fireEvent.load(container.querySelector('img') as HTMLImageElement);
    expect((container.querySelector('span') as HTMLElement).dataset['state']).toBe('loaded');
    rerenderWithCrystal(<Image src="/b.jpg" alt="B" />);
    expect((container.querySelector('span') as HTMLElement).dataset['state']).toBe('loading');
  });

  /* Empty alt is decorative; absent alt is announced as a filename. The prop is
     required so the author has to choose. */
  it('carries the alt it was given, including an empty one', () => {
    const { container } = renderWithCrystal(<Image src="/rule.svg" alt="" />);
    expect(container.querySelector('img')).toHaveAttribute('alt', '');
  });

  it('has no accessibility violations', async () => {
    const { container } = renderWithCrystal(
      <Image src="/harbour.jpg" alt="A harbour at first light" ratio={3 / 2} />,
    );
    await expectNoAxeViolations(container);
  });
});

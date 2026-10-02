import { describe, expect, it } from 'vitest';
import { expectNoAxeViolations } from '../../test/axe.js';
import { renderWithCrystal, screen } from '../../test/render.js';
import { Skeleton, SkeletonBox } from './Skeleton.js';

const placeholder = (
  <>
    <SkeletonBox shape="title" />
    <SkeletonBox />
    <SkeletonBox width="60%" />
  </>
);

describe('Skeleton', () => {
  /* "aria-hidden … must not be read as content." A screen reader meeting three
     placeholder lines would be read three paragraphs of nothing. */
  it('keeps the shapes out of the accessibility tree', () => {
    const { container } = renderWithCrystal(
      <Skeleton loading placeholder={placeholder}>Real content</Skeleton>,
    );
    const shapes = container.querySelector('[aria-hidden="true"]');
    expect(shapes).not.toBeNull();
    expect(shapes!.querySelectorAll('[data-shape]')).toHaveLength(3);
  });

  /* One live region for the whole placeholder, so twelve lines are not
     announced twelve times. */
  it('announces what is loading exactly once', () => {
    renderWithCrystal(
      <Skeleton loading placeholder={placeholder} label="Loading invoices" />,
    );
    const said = screen.getAllByRole('status');
    expect(said).toHaveLength(1);
    expect(said[0]).toHaveTextContent('Loading invoices');
  });

  /* It wraps the content instead of being replaced by it, so `skeleton-resolve`
     has something to play on. A skeleton swapped out by its caller has already
     unmounted when the data arrives. */
  it('shows the real content in the same place once it arrives', () => {
    const { rerender } = renderWithCrystal(
      <Skeleton loading placeholder={placeholder}>Real content</Skeleton>,
    );
    expect(screen.queryByText('Real content')).toBeNull();
    rerender(<Skeleton loading={false} placeholder={placeholder}>Real content</Skeleton>);
    expect(screen.getByText('Real content')).toBeInTheDocument();
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('has no axe violations', async () => {
    const { container } = renderWithCrystal(
      <Skeleton loading placeholder={placeholder} label="Loading invoices" />,
    );
    await expectNoAxeViolations(container);
  });
});

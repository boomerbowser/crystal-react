import { beforeEach, describe, expect, it, vi } from 'vitest';
import { expectNoAxeViolations } from '../../test/axe.js';
import { renderWithCrystal, screen, userEvent, within } from '../../test/render.js';
import { TreeView, type TreeNode } from './TreeView.js';

/* The motion hook is replaced rather than observed. `useMotion` drives the
   animation imperatively through Motion's `useAnimate`, which does nothing in
   jsdom, so watching for a visual effect would be watching for nothing — and a
   test that cannot fail is the thing this project keeps finding. What matters
   here is *when* Crystal asks for an animation, and that is exactly what this
   records. */
const play = vi.fn();
vi.mock('../../motion/useMotion.js', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../motion/useMotion.js')>()),
  useMotion: () => [{ current: null }, play],
}));

beforeEach(() => { play.mockClear(); });

const items: TreeNode[] = [
  {
    id: 'src',
    label: 'src',
    children: [
      { id: 'components', label: 'components', children: [{ id: 'button', label: 'Button.tsx' }] },
      { id: 'styles', label: 'styles' },
    ],
  },
  { id: 'readme', label: 'README.md' },
];

const expanded = ['src', 'components'];

describe('TreeView', () => {
  it('has no accessibility violations', async () => {
    const { container } = renderWithCrystal(
      <TreeView label="Files" items={items} defaultExpandedKeys={expanded} />,
    );
    await expectNoAxeViolations(container);
  });

  /* A `treegrid`, not a `tree`, and deliberately: a `treeitem` in the plain tree
     pattern must not contain independently focusable widgets, and Crystal's row
     contains the disclosure button the catalogue also asks for. Everything the
     catalogue specifies by behaviour — level, expansion, arrow-key navigation —
     is here. See the note in TreeView.tsx and M-3 in the design system tracker. */
  it('is a named treegrid of rows', () => {
    renderWithCrystal(<TreeView label="Files" items={items} />);
    expect(screen.getByRole('treegrid', { name: 'Files' })).toBeInTheDocument();
    expect(screen.getAllByRole('row').length).toBeGreaterThan(0);
    expect(screen.queryByRole('tree')).toBeNull();
  });

  /* Depth is announced, not just drawn. A reader who cannot see the indentation
     gets the level from ARIA, and a reader who can gets both. */
  it('reports the level of every row', () => {
    renderWithCrystal(<TreeView label="Files" items={items} defaultExpandedKeys={expanded} />);
    expect(screen.getByRole('row', { name: /^src/ })).toHaveAttribute('aria-level', '1');
    expect(screen.getByRole('row', { name: /^components/ })).toHaveAttribute('aria-level', '2');
    expect(screen.getByRole('row', { name: /Button\.tsx/ })).toHaveAttribute('aria-level', '3');
  });

  /* The indentation is drawn from the same number ARIA reports, so the two
     cannot disagree — which is the failure mode of indenting with nested
     wrappers while announcing a level computed somewhere else. */
  it('indents from the level it announces', () => {
    renderWithCrystal(<TreeView label="Files" items={items} defaultExpandedKeys={expanded} />);
    const depthOf = (name: RegExp) => {
      const item = screen.getByRole('row', { name });
      const row = item.querySelector<HTMLElement>('[style*="--cr-tree-level"]');
      return Number(row?.style.getPropertyValue('--cr-tree-level'));
    };
    expect(depthOf(/^src/)).toBe(0);
    expect(depthOf(/^components/)).toBe(1);
    expect(depthOf(/Button\.tsx/)).toBe(2);
  });

  it('reports whether a row is expanded, and only for rows that can be', () => {
    renderWithCrystal(<TreeView label="Files" items={items} defaultExpandedKeys={['src']} />);
    expect(screen.getByRole('row', { name: /^src/ })).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('row', { name: /^components/ })).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getByRole('row', { name: /README/ }).getAttribute('aria-expanded')).toBeNull();
  });

  it('hides a collapsed row’s children', () => {
    renderWithCrystal(<TreeView label="Files" items={items} />);
    expect(screen.queryByRole('row', { name: /^components/ })).toBeNull();
    expect(screen.getByRole('row', { name: /README/ })).toBeInTheDocument();
  });

  it('expands with the right arrow and collapses with the left', async () => {
    const user = userEvent.setup();
    renderWithCrystal(<TreeView label="Files" items={items} />);
    await user.tab();
    const src = screen.getByRole('row', { name: /^src/ });
    expect(src).toHaveFocus();
    await user.keyboard('{ArrowRight}');
    expect(src).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('row', { name: /^components/ })).toBeInTheDocument();
    await user.keyboard('{ArrowLeft}');
    expect(src).toHaveAttribute('aria-expanded', 'false');
  });

  /* A row that both expands and selects on one press makes one of the two
     unreachable, and nothing can tell the reader which they are about to get. */
  it('expands from the chevron without selecting the row', async () => {
    const user = userEvent.setup();
    renderWithCrystal(
      <TreeView label="Files" items={items} selectionMode="single" />,
    );
    const src = screen.getByRole('row', { name: /^src/ });
    const chevron = within(src).getAllByRole('button')[0]!;
    await user.click(chevron);
    expect(src).toHaveAttribute('aria-expanded', 'true');
    expect(src.getAttribute('aria-selected')).toBe('false');
  });

  it('selects a row, and never with a check mark', async () => {
    const user = userEvent.setup();
    renderWithCrystal(<TreeView label="Files" items={items} selectionMode="single" />);
    const readme = screen.getByRole('row', { name: /README/ });
    await user.click(readme);
    expect(readme).toHaveAttribute('aria-selected', 'true');
    expect(readme.textContent).not.toMatch(/[✓✔]/);
    expect(readme.getAttribute('aria-checked')).toBeNull();
  });

  it('skips a disabled row', () => {
    renderWithCrystal(
      <TreeView label="Files" items={[{ id: 'a', label: 'A', isDisabled: true }, { id: 'b', label: 'B' }]} />,
    );
    expect(screen.getByRole('row', { name: 'A' })).toHaveAttribute('aria-disabled', 'true');
    expect(screen.getByRole('row', { name: 'B' }).getAttribute('aria-disabled')).toBeNull();
  });

  /* Nothing in Crystal moves at rest, so a row that was there when the tree
     appeared plays nothing, and a row revealed by expanding plays `accordion-in`.
     The whole design rests on React running effects bottom-up — a row mounting
     with the tree runs its effect before the tree's, a row mounting later runs
     after — so the claim is checked directly rather than described. */
  it('animates a revealed row and not the rows it rendered with', async () => {
    const user = userEvent.setup();
    renderWithCrystal(<TreeView label="Files" items={items} />);
    expect(play).not.toHaveBeenCalled();

    await user.click(within(screen.getByRole('row', { name: /^src/ })).getAllByRole('button')[0]!);
    expect(screen.getByRole('row', { name: /^components/ })).toBeInTheDocument();
    expect(play).toHaveBeenCalledWith('accordion-in');
  });

  it('calls onSelectionChange with the row that was chosen', async () => {
    const user = userEvent.setup();
    const onSelectionChange = vi.fn();
    renderWithCrystal(
      <TreeView label="Files" items={items} selectionMode="single" onSelectionChange={onSelectionChange} />,
    );
    await user.click(screen.getByRole('row', { name: /README/ }));
    expect(onSelectionChange).toHaveBeenCalledOnce();
    expect([...onSelectionChange.mock.calls[0]![0] as Set<string>]).toEqual(['readme']);
  });
});

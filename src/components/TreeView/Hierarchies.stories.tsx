import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { ScrollArea } from '../ScrollArea/ScrollArea.js';
import { useMemo, useState } from 'react';
import { TreeView, type TreeNode } from './TreeView.js';
import { TableOfContents, useHeadingInView } from '../TableOfContents/TableOfContents.js';
import { Stack } from '../Stack/Stack.js';
import { Text } from '../Text/Text.js';
import { Title } from '../Title/Title.js';

const FolderIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 7a1 1 0 0 1 1-1h5l2 2h9a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z" />
  </svg>
);

const files: TreeNode[] = [
  {
    id: 'src',
    label: 'src',
    icon: FolderIcon,
    children: [
      {
        id: 'components',
        label: 'components',
        icon: FolderIcon,
        children: [
          { id: 'button', label: 'Button.tsx' },
          { id: 'tree', label: 'TreeView.tsx' },
        ],
      },
      { id: 'styles', label: 'styles', icon: FolderIcon, children: [{ id: 'tokens', label: '_tokens.scss' }] },
      { id: 'index', label: 'index.ts' },
    ],
  },
  { id: 'readme', label: 'README.md' },
  { id: 'licence', label: 'LICENSE', isDisabled: true },
];

const meta = {
  title: 'Navigation/Hierarchies',
  /* Without this docgen has nothing to read and Storybook generates no
     controls at all — the message Meridian screenshotted. This file shows
     several components together; the one named here is its subject, and the
     others are the context it is normally seen in. */
  component: TreeView,
  args: { items: files, label: 'Project files' },
  parameters: {
    docs: {
      description: {
        component:
          '**Both mark their current row with label weight, and neither puts anything in the '
          + 'leading space.** That space is already carrying meaning in both components — it is '
          + 'the depth — so a mark there would be read as a level rather than as a state.\n\n'
          + '**The tree is a `treegrid`.** A `treeitem` in the plain tree pattern must not contain '
          + 'independently focusable widgets, and Crystal\'s row contains the disclosure button the '
          + 'catalogue asks for. Level, expansion and full arrow-key navigation are all present; '
          + 'only the role names differ, and the divergence is recorded rather than hidden.\n\n'
          + '**Rows revealed by expanding play `accordion-in`; rows present on first render play '
          + 'nothing.** Nothing in Crystal moves at rest, and a tree animating itself into '
          + 'existence on page load is exactly that.\n\n'
          + '**The table of contents is controlled.** The catalogue puts "which headings are '
          + 'collected, scroll spy thresholds" with the product, so the component is told which '
          + 'entry is active and `useHeadingInView` ships beside it for products that want the '
          + 'default answer.',
      },
    },
  },
} satisfies Meta<typeof TreeView>;

export default meta;
type Story = StoryObj<typeof meta>;



export const Files: Story = {
  render: () => (
    <div style={{ maxWidth: '320px' }} /* crystal-allow-literal: story bound, a sidebar width */>
      <TreeView label="Files" items={files} selectionMode="single" defaultExpandedKeys={['src']} />
    </div>
  ),
};

/* The keyboard model gets a story of its own, and the separation is deliberate.
 *
 * A `play` function runs whenever the story *loads*, not only under the test
 * runner, so a browser gate that opens a story with one is measuring whatever
 * the play is in the middle of doing. This started on `Files`, and
 * `verify-targets` — which probes that story — reported three 320×44 tree rows
 * whose own centre did not belong to them. Nothing was wrong with the rows; the
 * gate had arrived while the play was still pressing keys.
 *
 * So: a story that a measurement gate probes does not carry a play function, and
 * a story with a play function is not probed. */
export const Keyboard: Story = {
  name: 'Keyboard navigation',
  render: () => (
    <div style={{ maxWidth: '320px' }} /* crystal-allow-literal: story bound, a sidebar width */>
      <TreeView label="Files" items={files} selectionMode="single" defaultExpandedKeys={['src']} />
    </div>
  ),
  /* A tree's keyboard model, watched rather than asserted about. The unit tests
     check what React Aria reports; this checks what a person pressing Down and
     then Left actually gets, which is the half jsdom cannot answer — it has no
     layout, so it cannot tell a collapsed row from a hidden one. */
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const rows = () => canvas.getAllByRole('row');
    await step('Down moves to the next row', async () => {
      const first = rows()[0]!;
      await userEvent.click(first);
      await expect(first).toHaveFocus();
      await userEvent.keyboard('{ArrowDown}');
      await expect(rows()[1]).toHaveFocus();
    });
    await step('Left collapses the expanded parent rather than moving', async () => {
      const parent = canvas.getAllByRole('row').find(
        (row) => row.getAttribute('aria-expanded') === 'true',
      );
      await expect(parent).toBeTruthy();
      await userEvent.click(parent!);
      await userEvent.keyboard('{ArrowLeft}');
      await expect(parent).toHaveAttribute('aria-expanded', 'false');
      /* Put it back. A `play` function runs when the story *loads*, not only
         under the test runner, so whatever it leaves behind is what every other
         browser gate then measures. This one collapsed the tree and walked away,
         and `verify-targets` quietly dropped from 29 probes to 26 — it was still
         green, and it was measuring three fewer rows. A play function that
         changes what a story shows has to hand it back. */
      await userEvent.keyboard('{ArrowRight}');
      await expect(parent).toHaveAttribute('aria-expanded', 'true');
      /* And wait for the rows to finish arriving. Re-expanding is not enough:
         the revealed rows animate in, and while they are doing it they are
         part-transparent and offset, so `elementsFromPoint` does not land on
         them. `verify-targets` then reported three 320×44 rows whose own centre
         did not belong to them — a real-looking failure caused entirely by
         being asked mid-animation. Waited on the rows' own opacity rather than
         on a duration, so it tracks the motion speed rather than guessing it. */
      await waitFor(async () => {
        for (const row of canvas.getAllByRole('row')) {
          await expect(getComputedStyle(row).opacity).toBe('1');
        }
      }, { timeout: 4000 });
    });
  },
};

/* Expand `src` and watch the revealed rows arrive. Reload and watch nothing
   move: the rows that were already open do not animate themselves in. */
export const ExpandingIsMotion: Story = {
  render: () => (
    <div style={{ maxWidth: '320px' }} /* crystal-allow-literal: story bound, a sidebar width */>
      <TreeView label="Files" items={files} selectionMode="single" />
    </div>
  ),
};

const sections = [
  { id: 'materials', label: 'Materials', level: 2 },
  { id: 'frost', label: 'Frost', level: 3 },
  { id: 'resin', label: 'Resin', level: 3 },
  { id: 'motion', label: 'Motion', level: 2 },
  { id: 'timings', label: 'Timings', level: 3 },
];

/* The scroll spy is the half of this component no unit test can see: jsdom has
   no IntersectionObserver and reports every rect as zero. Scroll the column. */
export const ScrollSpy: Story = {
  render: function ScrollSpyStory() {
    const ids = useMemo(() => sections.map((section) => section.id), []);
    const [root, setRoot] = useState<HTMLElement | null>(null);
    const active = useHeadingInView(ids, { root });

    return (
      <div style={{ display: 'flex', gap: 'var(--cr-space)', alignItems: 'start' }}>
        {/* The library's own scroll region rather than a hand-rolled one. A
            column of headings and paragraphs holds nothing focusable, so without
            a tab stop of its own a keyboard cannot scroll it at all — which is
            what this story shipped as, and what `ScrollArea` already knows how
            to avoid. A story that hand-rolls what the library provides also
            stops being an example of it. */}
        <ScrollArea
          ref={setRoot}
          aria-label="Specification sections"
          style={{ maxHeight: '320px', maxWidth: '420px', paddingInlineEnd: 'var(--cr-space)' }} /* crystal-allow-literal: story bound, so the column actually scrolls */
        >
          <Stack gap="lg">
            {sections.map((section) => (
              <Stack key={section.id} gap="xs">
                <Title id={section.id} level={section.level === 2 ? 2 : 3}>{section.label}</Title>
                <Text>
                  Crystal&rsquo;s {String(section.label).toLowerCase()} are specified once and read
                  everywhere. This paragraph exists to give the column something to scroll.
                </Text>
                <Text>
                  A second paragraph, for the same reason. The entry beside this heading takes
                  weight as the heading crosses the reading line a fifth of the way down.
                </Text>
              </Stack>
            ))}
          </Stack>
        </ScrollArea>
        <TableOfContents entries={sections} {...(active ? { activeId: active } : {})} />
      </div>
    );
  },
};

export const Contents: Story = {
  render: () => <TableOfContents entries={sections} activeId="resin" />,
};

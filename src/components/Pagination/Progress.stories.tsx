import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, fn, userEvent, within } from 'storybook/test';
import { only } from '../../../.storybook/environment.js';
import { Pagination } from './Pagination.js';
import { Stepper } from '../Stepper/Stepper.js';

const steps = [
  { id: 'account', label: 'Account', description: 'Who is signing up', state: 'complete' as const },
  { id: 'plan', label: 'Plan', description: 'What they are buying', state: 'current' as const },
  { id: 'billing', label: 'Billing', description: 'How they are paying', state: 'upcoming' as const },
  { id: 'review', label: 'Review', description: 'Before anything is charged', state: 'upcoming' as const },
];

const meta = {
  title: 'Navigation/Pagination and steps',
  component: Pagination,
  args: {
    total: 12,
    page: 4,
    siblings: 1,
    'aria-label': 'Results',
    onPageChange: fn(),
  },
  argTypes: {
    total: { control: { type: 'number', min: 1 }, table: { category: 'Pagination' } },
    page: { control: { type: 'number', min: 1 }, table: { category: 'Pagination' } },
    siblings: {
      description: 'Pages shown either side of the current one. The first and last are always shown on top of this, which is what produces the ellipses.',
      control: { type: 'range', min: 0, max: 4, step: 1 },
      table: { category: 'Pagination' },
    },
    'aria-label': { control: 'text', table: { category: 'Pagination' } },
    previousLabel: { control: 'text', table: { category: 'Pagination' } },
    nextLabel: { control: 'text', table: { category: 'Pagination' } },
    /* User-facing text built from a number. A control over a function is not a
       control; the prop is here so a product in another language can reach it. */
    pageLabel: { control: false, table: { category: 'Pagination' } },
    onPageChange: { table: { category: 'Pagination' } },
  },
  parameters: {
    docs: {
      description: {
        component:
          '**Every control is named, and never by its glyph.** The arrows carry `previousLabel` and '
          + '`nextLabel`, and each page control is named by `pageLabel` — "Page 4", not "4". A row of '
          + 'bare numerals announces as a row of bare numerals.\n\n'
          + 'The current page is `aria-current="page"`, and it is heavier. Selection is label weight '
          + 'here exactly as it is in a tab strip; the ellipsis is not a control and is not focusable.\n\n'
          + 'A stepper is the other half of the same idea and a different promise: pagination says '
          + '*where in a list*, a stepper says *how far through a task*. A step that cannot be returned '
          + 'to is disabled rather than absent, because a task whose shape changes as you move through '
          + 'it cannot be planned for.',
      },
    },
  },
} satisfies Meta<typeof Pagination>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Pages: Story = {
  render: (args) => {
    const [page, setPage] = useState(args.page);
    return (
      <Pagination
        {...only(args)}
        page={page}
        onPageChange={(next) => { setPage(next); args.onPageChange(next); }}
      />
    );
  },
};

/* Both ellipses, which only appear once the current page is far enough from
   both ends. Its own story because the elision rule is the part worth being
   able to look at, and it is unreachable at the default `total`. */
export const BothEnds: Story = {
  name: 'Elided at both ends',
  args: { total: 50, page: 25 },
  render: (args) => <Pagination {...only(args)} />,
};

export const EveryPageShown: Story = {
  name: 'Short enough to show whole',
  args: { total: 5, page: 3, siblings: 4 },
  render: (args) => <Pagination {...only(args)} />,
};

/* The names, asserted in a real browser. jsdom agrees with this, but the
   Interactions panel is where a reviewer can *see* that the arrow announces as
   "Next page" rather than as a chevron. */
export const NamedControls: Story = {
  name: 'Every control has a name',
  render: (args) => <Pagination {...only(args)} />,
  play: async ({ canvasElement, args, step }) => {
    const canvas = within(canvasElement);
    await step('the current page is aria-current, not aria-selected', async () => {
      const current = canvas.getByRole('button', { name: 'Page 4' });
      await expect(current).toHaveAttribute('aria-current', 'page');
      await expect(current).not.toHaveAttribute('aria-selected');
    });
    await step('the arrows are named in words', async () => {
      await expect(canvas.getByRole('button', { name: /previous/i })).toBeVisible();
      await expect(canvas.getByRole('button', { name: /next/i })).toBeVisible();
    });
    await step('picking a page reports the number', async () => {
      await userEvent.click(canvas.getByRole('button', { name: 'Page 5' }));
      await expect(args.onPageChange).toHaveBeenCalledWith(5);
    });
  },
};

export const Steps: Story = {
  name: 'Stepper',
  render: () => <Stepper steps={steps} aria-label="Sign-up" onNavigate={fn()} />,
};

export const StepsVertical: Story = {
  name: 'Stepper, vertical',
  render: () => (
    <Stepper steps={steps} orientation="vertical" aria-label="Sign-up" onNavigate={fn()} />
  ),
};

/* No handler, so no step is a control. The states still read — which is the
   distinction: a stepper is a status display that *may* also be navigation. */
export const StepsAsStatusOnly: Story = {
  name: 'Stepper with nowhere to go',
  render: () => <Stepper steps={steps} aria-label="Progress" />,
};

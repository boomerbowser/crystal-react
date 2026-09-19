import { describe, expect, it } from 'vitest';
import { expectNoAxeViolations } from '../../test/axe.js';
import { renderWithCrystal, screen, userEvent } from '../../test/render.js';
import { Tabs } from './Tabs.js';

const items = [
  { id: 'overview', label: 'Overview', content: 'What this is' },
  { id: 'usage', label: 'Usage', content: 'How to use it' },
  { id: 'api', label: 'API', content: 'Every prop' },
];

describe('Tabs', () => {
  it('has no accessibility violations', async () => {
    const { container } = renderWithCrystal(<Tabs label="Documentation" items={items} />);
    await expectNoAxeViolations(container);
  });

  it('is a tablist with tabs and one panel', () => {
    renderWithCrystal(<Tabs label="Documentation" items={items} />);
    expect(screen.getByRole('tablist', { name: 'Documentation' })).toBeInTheDocument();
    expect(screen.getAllByRole('tab')).toHaveLength(3);
    expect(screen.getByRole('tabpanel')).toHaveTextContent('What this is');
  });

  /* A visible label names the list by reference, so what is seen and what is
     announced cannot drift apart. */
  it('names the list by reference when the label is shown', () => {
    renderWithCrystal(<Tabs label="Documentation" items={items} labelVisible />);
    const list = screen.getByRole('tablist', { name: 'Documentation' });
    expect(list.getAttribute('aria-label')).toBeNull();
    expect(list.getAttribute('aria-labelledby')).toBeTruthy();
  });

  /* An aria-label can only carry a string. A rich label would be dropped
     silently and leave the list unnamed, so it is shown instead of hidden. */
  it('shows a rich label rather than dropping it', () => {
    renderWithCrystal(<Tabs label={<em>Docs</em>} items={items} />);
    expect(screen.getByRole('tablist', { name: 'Docs' })).toBeInTheDocument();
    expect(screen.getByText('Docs').tagName).toBe('EM');
  });

  it('moves between tabs with the arrow keys and Home and End', async () => {
    const user = userEvent.setup();
    renderWithCrystal(<Tabs label="Documentation" items={items} />);
    await user.tab();
    expect(screen.getByRole('tab', { name: 'Overview' })).toHaveFocus();
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('tab', { name: 'Usage' })).toHaveFocus();
    await user.keyboard('{End}');
    expect(screen.getByRole('tab', { name: 'API' })).toHaveFocus();
    await user.keyboard('{Home}');
    expect(screen.getByRole('tab', { name: 'Overview' })).toHaveFocus();
  });

  it('shows the selected tab’s panel and only that one', async () => {
    const user = userEvent.setup();
    renderWithCrystal(<Tabs label="Documentation" items={items} />);
    await user.click(screen.getByRole('tab', { name: 'API' }));
    expect(screen.getByRole('tab', { name: 'API' })).toHaveAttribute('aria-selected', 'true');
    const panels = screen.getAllByRole('tabpanel');
    expect(panels).toHaveLength(1);
    expect(panels[0]).toHaveTextContent('Every prop');
  });

  /* The panel plays `tab-in` on arrival, and the effect that plays it runs once
     per mount. That is only "once per arrival" if React Aria unmounts the panel
     that is not shown — so the assumption is checked rather than commented. A
     panel that stayed mounted would make every arrival animation fire at once on
     first render and none of them afterwards. */
  it('unmounts the panel that is not shown, which is what makes arrival motion arrive', async () => {
    const user = userEvent.setup();
    renderWithCrystal(<Tabs label="Documentation" items={items} />);
    expect(screen.queryByText('Every prop')).toBeNull();
    await user.click(screen.getByRole('tab', { name: 'API' }));
    expect(screen.getByText('Every prop')).toBeInTheDocument();
    expect(screen.queryByText('What this is')).toBeNull();
  });

  it('associates each tab with its panel', async () => {
    const user = userEvent.setup();
    renderWithCrystal(<Tabs label="Documentation" items={items} />);
    await user.click(screen.getByRole('tab', { name: 'Usage' }));
    const tab = screen.getByRole('tab', { name: 'Usage' });
    const panel = screen.getByRole('tabpanel');
    expect(tab.getAttribute('aria-controls')).toBe(panel.id);
    expect(panel.getAttribute('aria-labelledby')).toBe(tab.id);
  });

  it('skips a disabled tab', async () => {
    const user = userEvent.setup();
    renderWithCrystal(
      <Tabs
        label="Documentation"
        items={[items[0]!, { ...items[1]!, isDisabled: true }, items[2]!]}
      />,
    );
    await user.tab();
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('tab', { name: 'API' })).toHaveFocus();
  });

  /* `isDisabled` is only forwarded when the caller declared it. Passing a
     coerced `false` is the defect class that cost this library ten field
     components: a prop whose defined-ness is the mode switch, flattened to a
     value. */
  it('leaves a tab enabled when the item says nothing about it', () => {
    renderWithCrystal(<Tabs label="Documentation" items={items} />);
    for (const tab of screen.getAllByRole('tab')) {
      expect(tab.getAttribute('aria-disabled')).toBeNull();
    }
  });

  it('reports its orientation', () => {
    renderWithCrystal(<Tabs label="Documentation" items={items} orientation="vertical" />);
    expect(screen.getByRole('tablist')).toHaveAttribute('aria-orientation', 'vertical');
  });

  /* Selection is weight, and weight is not an ARIA state — so the check that it
     is never a check mark is that no tab contains one, in any of the forms the
     rest of the library uses for one. */
  it('never marks selection with a check', async () => {
    const user = userEvent.setup();
    renderWithCrystal(<Tabs label="Documentation" items={items} />);
    await user.click(screen.getByRole('tab', { name: 'Usage' }));
    for (const tab of screen.getAllByRole('tab')) {
      expect(tab.querySelector('svg')).toBeNull();
      expect(tab.textContent).not.toMatch(/[✓✔]/);
      expect(tab.getAttribute('aria-checked')).toBeNull();
    }
  });
});

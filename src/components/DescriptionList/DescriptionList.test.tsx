import { describe, expect, it } from 'vitest';
import { expectNoAxeViolations } from '../../test/axe.js';
import { renderWithCrystal, screen } from '../../test/render.js';
import { DescriptionList } from './DescriptionList.js';

const items = [
  { id: 'status', term: 'Status', value: 'Active' },
  { id: 'plan', term: 'Plan', value: 'Team' },
];

describe('DescriptionList', () => {
  /* A grid of divs cannot keep a term and its value associated, and read out of
     order they are two unrelated words. */
  it('renders real definition-list semantics', () => {
    const { container } = renderWithCrystal(<DescriptionList items={items} />);
    expect(container.querySelector('dl')).not.toBeNull();
    expect(container.querySelectorAll('dt')).toHaveLength(2);
    expect(container.querySelectorAll('dd')).toHaveLength(2);
  });

  it('keeps each pair together in one wrapper', () => {
    const { container } = renderWithCrystal(<DescriptionList items={items} />);
    const pair = container.querySelector('dl > div');
    expect(pair?.querySelector('dt')).toHaveTextContent('Status');
    expect(pair?.querySelector('dd')).toHaveTextContent('Active');
  });

  it('shows the empty state instead of an empty list', () => {
    renderWithCrystal(<DescriptionList items={[]} empty="No details" />);
    expect(screen.getByText('No details')).toBeInTheDocument();
  });

  it('has no accessibility violations', async () => {
    const { container } = renderWithCrystal(<DescriptionList items={items} stacked />);
    await expectNoAxeViolations(container);
  });
});

import { describe, expect, it, vi } from 'vitest';
import { expectNoAxeViolations } from '../../test/axe.js';
import { renderWithPrismata, screen, within } from '../../test/render.js';
import { List, ListItem } from './List.js';

describe('List', () => {
  it('is a real list, ordered when the numbers mean something', () => {
    const { container, rerenderWithPrismata } = renderWithPrismata(
      <List><ListItem>One</ListItem></List>,
    );
    expect(container.querySelector('ul')).not.toBeNull();
    rerenderWithPrismata(<List ordered><ListItem>One</ListItem></List>);
    expect(container.querySelector('ol')).not.toBeNull();
  });

  /* "Interactive rows are buttons or links, not clickable divs." */
  it('renders the element the interaction means', async () => {
    const onPress = vi.fn();
    renderWithPrismata(
      <List>
        <ListItem href="/one">A link</ListItem>
        <ListItem onPress={onPress}>A button</ListItem>
        <ListItem>Neither</ListItem>
      </List>,
    );
    expect(screen.getByRole('link', { name: 'A link' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'A button' })).toBeInTheDocument();
    /* The static row is not announced as anything pressable. */
    expect(screen.getAllByRole('listitem')).toHaveLength(3);
  });

  it('keeps a trailing action outside the row\'s own control', () => {
    renderWithPrismata(
      <List>
        <ListItem onPress={() => undefined} trailing={<button type="button">Remove</button>}>
          A row
        </ListItem>
      </List>,
    );
    const remove = screen.getByRole('button', { name: 'Remove' });
    const row = screen.getByRole('button', { name: 'A row' });
    /* A button inside a button is invalid; they have to be siblings. */
    expect(row.contains(remove)).toBe(false);
  });

  it('shows the empty state instead of an empty list', () => {
    renderWithPrismata(<List empty="Nothing here yet">{[]}</List>);
    expect(screen.getByText('Nothing here yet')).toBeInTheDocument();
    expect(screen.queryByRole('list')).toBeNull();
  });

  /* Nothing moves at rest: a row that was there when the page loaded has not
     just arrived. One that mounts afterwards has. */
  it('plays nothing on the first render and plays for a row that arrives', () => {
    const { rerenderWithPrismata } = renderWithPrismata(
      <List><ListItem data-testid="first">One</ListItem></List>,
    );
    const first = screen.getByTestId('first');
    expect(first.dataset['prMotionName'] ?? first.dataset['prMotionState']).toBeUndefined();

    rerenderWithPrismata(
      <List>
        <ListItem data-testid="first">One</ListItem>
        <ListItem data-testid="second">Two</ListItem>
      </List>,
    );
    const second = screen.getByTestId('second');
    expect(second.dataset['prMotionName'] ?? second.dataset['prMotionState']).toBeDefined();
    /* And the row that was already there stays still. */
    const stillFirst = screen.getByTestId('first');
    expect(stillFirst.dataset['prMotionName'] ?? stillFirst.dataset['prMotionState']).toBeUndefined();
  });

  it('has no accessibility violations', async () => {
    const { container } = renderWithPrismata(
      <List separated>
        <ListItem href="/one" leading={<span aria-hidden="true">•</span>}>One</ListItem>
        <ListItem href="/two" isSelected>Two</ListItem>
      </List>,
    );
    await expectNoAxeViolations(container);
    expect(within(screen.getByRole('list')).getAllByRole('listitem')).toHaveLength(2);
  });
});

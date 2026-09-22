import { describe, expect, it } from 'vitest';
import { expectNoAxeViolations } from '../../test/axe.js';
import { renderWithCrystal, screen, within } from '../../test/render.js';
import { Avatar } from '../Avatar/Avatar.js';
import { AvatarGroup } from './AvatarGroup.js';

const people = ['Ada Lovelace', 'Grace Hopper', 'Katherine Johnson', 'Annie Easley', 'Dorothy Vaughan'];

function group(props: { max?: number } = {}) {
  return (
    <AvatarGroup label="Project members" {...props}>
      {people.map((name) => <Avatar key={name} name={name} />)}
    </AvatarGroup>
  );
}

describe('AvatarGroup', () => {
  /* A known number of peers in an order, named once: "Project members, list,
     5 items" rather than five names in a row. */
  it('is one named list', () => {
    renderWithCrystal(group());
    const list = screen.getByRole('list', { name: 'Project members' });
    expect(within(list).getAllByRole('listitem')).toHaveLength(5);
  });

  it('keeps the people in it named', () => {
    renderWithCrystal(group());
    expect(screen.getByRole('img', { name: 'Ada Lovelace' })).toBeInTheDocument();
  });

  /* "+3" read literally is a plus sign and a number; what it means is "three
     more people". */
  it('announces the overflow rather than implying it', () => {
    renderWithCrystal(group({ max: 2 }));
    expect(screen.getByText('+3')).toHaveAttribute('aria-hidden', 'true');
    expect(screen.getByText('3 more')).toBeInTheDocument();
  });

  it('takes a sentence for the overflow when "N more" is not the right one', () => {
    renderWithCrystal(
      <AvatarGroup label="Project members" max={2} overflowDescription={(n) => `${n} more members`}>
        {people.map((name) => <Avatar key={name} name={name} />)}
      </AvatarGroup>,
    );
    expect(screen.getByText('3 more members')).toBeInTheDocument();
  });

  it('shows no overflow chip when everybody fits', () => {
    renderWithCrystal(group({ max: 5 }));
    expect(screen.queryByText(/^\+/)).toBeNull();
  });

  /* An overlap only reads as a row when the circles are the same circle. */
  it('gives every avatar in the row the group\'s size', () => {
    const { container } = renderWithCrystal(
      <AvatarGroup label="Project members" size="lg">
        <Avatar name="Ada Lovelace" size="sm" />
        <Avatar name="Grace Hopper" />
      </AvatarGroup>,
    );
    const classes = [...container.querySelectorAll('[role="img"]')].map((node) => node.className);
    expect(classes[0]).toBe(classes[1]);
  });

  it('has no accessibility violations', async () => {
    const { container } = renderWithCrystal(group({ max: 3 }));
    await expectNoAxeViolations(container);
  });
});

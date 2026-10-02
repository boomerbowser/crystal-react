import { describe, expect, it } from 'vitest';
import { expectNoAxeViolations } from '../../test/axe.js';
import { renderWithCrystal, screen, waitFor } from '../../test/render.js';
import { Collapse } from './Collapse.js';

function Region({ open }: { open: boolean }) {
  return (
    <>
      <button type="button" aria-expanded={open} aria-controls="region">Details</button>
      <Collapse id="region" isExpanded={open}>
        <a href="/inside">A link inside</a>
      </Collapse>
    </>
  );
}

describe('Collapse', () => {
  /* `max-height: 0` leaves a zero-height region full of focusable links that a
     keyboard user can still tab into and a screen reader still reads. */
  it('renders nothing at all when it is closed', () => {
    renderWithCrystal(<Region open={false} />);
    expect(screen.queryByRole('link', { name: 'A link inside' })).toBeNull();
  });

  it('renders the region under the id the trigger points at', () => {
    const { container } = renderWithCrystal(<Region open />);
    expect(container.querySelector('#region')).toHaveTextContent('A link inside');
  });

  /* Nothing moves at rest: a region that is open when the page loads has not
     just opened. */
  it('plays nothing on the first render', () => {
    const { container } = renderWithCrystal(<Region open />);
    const region = container.querySelector('#region') as HTMLElement;
    expect(region.dataset['crMotionName'] ?? region.dataset['crMotionState']).toBeUndefined();
  });

  it('plays the arrival when it opens', () => {
    const { container, rerenderWithCrystal } = renderWithCrystal(<Region open={false} />);
    rerenderWithCrystal(<Region open />);
    const region = container.querySelector('#region') as HTMLElement;
    expect(region.dataset['crMotionName'] ?? region.dataset['crMotionState']).toBeDefined();
  });

  /* `play` returns a promise because a region that unmounted the moment the
     state changed would play `accordion-out` into a detached node. */
  it('stays for the length of the exit recipe, and then goes', async () => {
    const { container, rerenderWithCrystal } = renderWithCrystal(<Region open />);
    rerenderWithCrystal(<Region open={false} />);
    /* Still there. A `waitFor` alone would not catch this: if the region
       unmounted synchronously, the recipe would run on a detached node and the
       test would still pass. */
    expect(container.querySelector('#region')).not.toBeNull();
    await waitFor(() => { expect(container.querySelector('#region')).toBeNull(); });
  });

  it('has no accessibility violations', async () => {
    const { container } = renderWithCrystal(<Region open />);
    await expectNoAxeViolations(container);
  });
});

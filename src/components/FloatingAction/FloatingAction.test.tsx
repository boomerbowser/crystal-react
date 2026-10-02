import { describe, expect, it, vi } from 'vitest';
import { expectNoAxeViolations } from '../../test/axe.js';
import { renderWithCrystal, screen, userEvent } from '../../test/render.js';
import { FloatingAction, SpeedDial, ActionBar } from './FloatingAction.js';
import { Button } from '../Button/Button.js';

const Plus = <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>;

describe('FloatingAction', () => {
  it('has no accessibility violations and is named', async () => {
    const { container } = renderWithCrystal(<FloatingAction label="New document" icon={Plus} />);
    expect(screen.getByRole('button', { name: 'New document' })).toBeInTheDocument();
    await expectNoAxeViolations(container);
  });

  /* The circle is the compact form of the same control, so the extended one keeps
     the same name rather than growing a second one. */
  it('keeps one name whether or not it shows a label', () => {
    renderWithCrystal(<FloatingAction label="New document" icon={Plus} isExtended />);
    expect(screen.getAllByRole('button', { name: 'New document' })).toHaveLength(1);
  });
});

describe('SpeedDial', () => {
  /* The catalogue forbids icon-only actions here: an icon in a set that appeared
     a moment ago has no surrounding context to be read from. */
  it('expands into actions that keep visible labels', async () => {
    const onPress = vi.fn();
    renderWithCrystal(
      <SpeedDial
        label="Create"
        icon={Plus}
        actions={[{ id: 'doc', label: 'Document', onPress }]}
      />,
    );
    const trigger = screen.getByRole('button', { name: 'Create' });
    expect(trigger.getAttribute('aria-expanded')).toBe('false');

    await userEvent.click(trigger);
    const action = screen.getByRole('button', { name: 'Document' });
    expect(action.textContent).toContain('Document');

    await userEvent.click(action);
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});

describe('ActionBar', () => {
  it('is absent rather than hidden when there is no selection', () => {
    renderWithCrystal(<ActionBar isVisible={false} selectedCount={0}><Button>Delete</Button></ActionBar>);
    expect(screen.queryByRole('toolbar')).toBeNull();
  });

  /* The bar's arrival and the size of the selection are announced together,
     for somebody who cannot see the bar appear. */
  it('announces the count when it appears', () => {
    renderWithCrystal(<ActionBar isVisible selectedCount={3}><Button>Delete</Button></ActionBar>);
    expect(screen.getByRole('toolbar', { name: 'Selection actions' })).toBeInTheDocument();
    expect(screen.getByRole('status').textContent).toContain('3 selected');
  });
});

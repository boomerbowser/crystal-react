import { describe, expect, it } from 'vitest';
import { expectNoAxeViolations } from '../../test/axe.js';
import { renderWithPrismata, screen } from '../../test/render.js';
import { Indicator } from './Indicator.js';

describe('Indicator', () => {
  it('says nothing, because the control it sits on already does', () => {
    renderWithPrismata(<Indicator kind="current" data-testid="mark" />);
    expect(screen.getByTestId('mark')).toHaveAttribute('aria-hidden', 'true');
  });

  /* Prismata's `.pr-indicator`, told what kind of state its host carries; the
     host's own attributes decide whether it shows. */
  it('is Prismata\'s indicator, carrying its kind as data', () => {
    renderWithPrismata(<Indicator kind="busy" data-testid="mark" />);
    const mark = screen.getByTestId('mark');
    expect(mark).toHaveClass('pr-indicator');
    expect(mark).toHaveAttribute('data-kind', 'busy');
  });

  it('is empty, so nothing inside it can become a target', () => {
    renderWithPrismata(<Indicator kind="field" data-testid="mark" />);
    expect(screen.getByTestId('mark')).toBeEmptyDOMElement();
  });

  it('has no accessibility violations on the controls it describes', async () => {
    const { container } = renderWithPrismata(
      <>
        <nav aria-label="Sections"><a href="/inbox" aria-current="page" style={{ position: 'relative' }}>Inbox<Indicator kind="current" /></a></nav>
        <button type="button" aria-busy="true" style={{ position: 'relative' }}>Syncing<Indicator kind="busy" /></button>
        <div className="pr-field-shell"><input aria-label="Email" required /><Indicator kind="field" /></div>
      </>,
    );
    await expectNoAxeViolations(container);
  });
});

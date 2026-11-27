import { describe, expect, it } from 'vitest';
import { expectNoAxeViolations } from '../../test/axe.js';
import { renderWithPrismata, screen } from '../../test/render.js';
import { RingProgress } from './RingProgress.js';

describe('RingProgress', () => {
  it('shares the progress semantics rather than being a dial', () => {
    renderWithPrismata(<RingProgress label="Sync" value={25} />);
    const bar = screen.getByRole('progressbar', { name: 'Sync' });
    expect(bar).toHaveAttribute('aria-valuenow', '25');
  });

  it('omits the value when there is none', () => {
    renderWithPrismata(<RingProgress label="Sync" />);
    expect(screen.getByRole('progressbar')).not.toHaveAttribute('aria-valuenow');
  });

  /* "The centre label is not the only representation." A ring with no centre
     label must lose nothing an assistive technology needs, so the value cannot
     live in that label. */
  it('announces its value with no centre label at all', () => {
    renderWithPrismata(<RingProgress label="Sync" value={25} />);
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuetext', '25%');
  });

  it('draws the centre label as text when given one', () => {
    renderWithPrismata(<RingProgress label="Sync" value={25} centre="25%" />);
    expect(screen.getByText('25%')).toBeInTheDocument();
  });

  it('has no axe violations', async () => {
    const { container } = renderWithPrismata(<RingProgress label="Sync" value={25} />);
    await expectNoAxeViolations(container);
  });
});

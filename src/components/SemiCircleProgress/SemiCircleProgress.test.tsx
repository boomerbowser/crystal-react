import { describe, expect, it } from 'vitest';
import { expectNoAxeViolations } from '../../test/axe.js';
import { renderWithPrismata, screen } from '../../test/render.js';
import { SemiCircleProgress } from './SemiCircleProgress.js';

describe('SemiCircleProgress', () => {
  it('is a progressbar with the value beside it on the screen', () => {
    renderWithPrismata(<SemiCircleProgress label="Battery" value={70} />);
    expect(screen.getByRole('progressbar', { name: 'Battery' })).toHaveAttribute('aria-valuenow', '70');
    /* The catalogue asks for a text value beside it, as well as an announced one. */
    expect(screen.getByText('70%')).toBeInTheDocument();
  });

  it('omits the value when there is none', () => {
    renderWithPrismata(<SemiCircleProgress label="Battery" />);
    expect(screen.getByRole('progressbar')).not.toHaveAttribute('aria-valuenow');
    expect(screen.getByText('Working')).toBeInTheDocument();
  });

  it('has no axe violations', async () => {
    const { container } = renderWithPrismata(<SemiCircleProgress label="Battery" value={70} />);
    await expectNoAxeViolations(container);
  });
});

import { describe, expect, it } from 'vitest';
import { expectNoAxeViolations } from '../../test/axe.js';
import { renderWithCrystal, screen } from '../../test/render.js';
import { Progress } from './Progress.js';

describe('Progress', () => {
  it('reports the value when it has one', () => {
    renderWithCrystal(<Progress label="Uploading" value={40} />);
    const bar = screen.getByRole('progressbar');
    expect(bar).toHaveAttribute('aria-valuenow', '40');
    expect(bar).toHaveAttribute('aria-valuemin', '0');
    expect(bar).toHaveAttribute('aria-valuemax', '100');
  });

  /* The catalogue's own sentence: "indeterminate omits the value rather than
     faking one". A bar that reported a number nobody measured would be a
     measurement invented by the component. */
  it('omits the value entirely when there is none', () => {
    renderWithCrystal(<Progress label="Uploading" />);
    const bar = screen.getByRole('progressbar');
    expect(bar).not.toHaveAttribute('aria-valuenow');
    expect(bar).not.toHaveAttribute('aria-valuemin');
    expect(bar).not.toHaveAttribute('aria-valuemax');
    expect(bar).toHaveAttribute('aria-valuetext', 'Working');
  });

  /* There is deliberately no `indeterminate` prop, so "we do not know" cannot be
     typed beside a number. This test is the record of that decision. */
  it('has no way to be indeterminate and carry a value at the same time', () => {
    renderWithCrystal(<Progress label="Uploading" value={0} />);
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0');
  });

  it('names the bar by its visible label rather than a copy of it', () => {
    renderWithCrystal(<Progress label={<em>Uploading</em>} value={10} />);
    expect(screen.getByRole('progressbar', { name: 'Uploading' })).toBeInTheDocument();
  });

  it('clamps a value outside its range instead of drawing past the track', () => {
    renderWithCrystal(<Progress label="Uploading" value={140} />);
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100');
  });

  it('states a stopped or failed bar in words, not only in colour', () => {
    renderWithCrystal(
      <Progress label="Uploading" value={40} state="error" valueLabel="Failed at 40%" />,
    );
    expect(screen.getByText('Failed at 40%')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuetext', 'Failed at 40%');
  });

  it('has no axe violations', async () => {
    const { container } = renderWithCrystal(<Progress label="Uploading" value={40} />);
    await expectNoAxeViolations(container);
  });
});

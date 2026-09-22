import { describe, expect, it } from 'vitest';
import { expectNoAxeViolations } from '../../test/axe.js';
import { renderWithCrystal, screen } from '../../test/render.js';
import { Statistic } from './Statistic.js';

describe('Statistic', () => {
  it('shows the label, the figure and the unit', () => {
    renderWithCrystal(<Statistic label="Revenue" value="£48,210" unit="this month" />);
    expect(screen.getByText('Revenue')).toBeInTheDocument();
    expect(screen.getByText('£48,210')).toBeInTheDocument();
    expect(screen.getByText('this month')).toBeInTheDocument();
  });

  /* "Trend direction is stated in text, not by colour or arrow alone." A reader
     who hears the arrow and the words has heard it twice; one who hears only the
     figure has not heard it at all. */
  it('says the trend in words and hides the arrow', () => {
    renderWithCrystal(
      <Statistic label="Revenue" value="£48,210" trend={{ direction: 'up', label: '4.2% up on last month' }} />,
    );
    expect(screen.getByText('4.2% up on last month')).toBeInTheDocument();
    expect(screen.getByText('↑')).toHaveAttribute('aria-hidden', 'true');
  });

  /* A box that empties while it loads is a box that changes height, and a row of
     statistics would reflow. */
  it('keeps the box while it is loading', () => {
    renderWithCrystal(<Statistic label="Revenue" value="£48,210" loading />);
    expect(screen.queryByText('£48,210')).toBeNull();
    expect(screen.getByText('Revenue')).toBeInTheDocument();
  });

  it('has no accessibility violations', async () => {
    const { container } = renderWithCrystal(
      <Statistic label="Revenue" value="£48,210" unit="this month"
        trend={{ direction: 'down', label: '1.1% down on last month' }} />,
    );
    await expectNoAxeViolations(container);
  });
});

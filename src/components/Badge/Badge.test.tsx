import { describe, expect, it } from 'vitest';
import { expectNoAxeViolations } from '../../test/axe.js';
import { renderWithCrystal, screen } from '../../test/render.js';
import { Badge, formatCount } from './Badge.js';

describe('Badge', () => {
  it('formats a count against its ceiling', () => {
    expect(formatCount(3, 99)).toBe('3');
    expect(formatCount(99, 99)).toBe('99');
    expect(formatCount(100, 99)).toBe('99+');
  });

  /* Zero is not "no badge" — it is a badge the caller may or may not want, and
     the two are different answers to different questions. */
  it('hides a zero count unless asked to show it', () => {
    const { rerenderWithCrystal } = renderWithCrystal(<Badge count={0} />);
    expect(screen.queryByText('0')).toBeNull();
    rerenderWithCrystal(<Badge count={0} showZero />);
    expect(screen.getByText('0')).toBeInTheDocument();
  });

  /* The visual never speaks. A loose "3" announced beside a button leaves a
     listener to guess what the 3 belongs to. */
  it('hides the visual from assistive technology', () => {
    renderWithCrystal(<Badge count={3} data-testid="badge" />);
    expect(screen.getByTestId('badge')).toHaveAttribute('aria-hidden', 'true');
  });

  it('announces a whole sentence when given one, and nothing when not', () => {
    const { rerenderWithCrystal } = renderWithCrystal(<Badge count={3} />);
    expect(screen.queryByRole('status')).toBeNull();
    rerenderWithCrystal(<Badge count={3} description="3 unread messages" />);
    expect(screen.getByRole('status')).toHaveTextContent('3 unread messages');
  });

  it('wraps a host and stands alone without one', () => {
    const { container, rerenderWithCrystal } = renderWithCrystal(
      <Badge count={3} data-testid="badge" />,
    );
    expect(screen.getByTestId('badge').parentElement).toBe(container.firstElementChild);

    rerenderWithCrystal(
      <Badge count={3} data-testid="badge"><button type="button">Inbox</button></Badge>,
    );
    const host = screen.getByRole('button', { name: 'Inbox' }).parentElement;
    expect(host).not.toBeNull();
    expect(host?.contains(screen.getByTestId('badge'))).toBe(true);
  });

  /* A dot's whole message is that it is there; there is nothing to read. */
  it('renders a dot with no content', () => {
    renderWithCrystal(<Badge dot data-testid="badge" />);
    expect(screen.getByTestId('badge')).toBeEmptyDOMElement();
  });

  it('has no accessibility violations on a host', async () => {
    const { container } = renderWithCrystal(
      <Badge count={120} description="120 unread messages">
        <button type="button">Inbox</button>
      </Badge>,
    );
    await expectNoAxeViolations(container);
  });
});

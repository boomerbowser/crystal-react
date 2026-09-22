import { describe, expect, it } from 'vitest';
import { expectNoAxeViolations } from '../../test/axe.js';
import { renderWithCrystal, screen } from '../../test/render.js';
import { AuthoredBubble } from './AuthoredBubble.js';

describe('AuthoredBubble', () => {
  /* "Author and time are text, not implied by side alone." The silhouette is a
     shortcut for people who can see it; the words are for everybody. */
  it('writes the author and the time rather than implying them', () => {
    renderWithCrystal(
      <AuthoredBubble author="Ada Lovelace" time="09:42">Morning.</AuthoredBubble>,
    );
    expect(screen.getByText('Ada Lovelace')).toBeInTheDocument();
    expect(screen.getByText('09:42')).toBeInTheDocument();
  });

  it('is an article, so a thread is a sequence of bounded messages', () => {
    const { container } = renderWithCrystal(
      <AuthoredBubble author="Ada Lovelace">Morning.</AuthoredBubble>,
    );
    expect(container.querySelector('article')).not.toBeNull();
  });

  it('marks the reader\'s own messages as data rather than only as a class', () => {
    const { rerenderWithCrystal } = renderWithCrystal(
      <AuthoredBubble author="Ada" data-testid="b">Hello</AuthoredBubble>,
    );
    expect(screen.getByTestId('b').dataset['own']).toBeUndefined();
    rerenderWithCrystal(<AuthoredBubble author="You" own data-testid="b">Hello</AuthoredBubble>);
    expect(screen.getByTestId('b').dataset['own']).toBe('');
  });

  /* A failure is a thing that happened, so it is announced — and it is said in
     words rather than in opacity, which would be a legibility problem over a
     coloured atmosphere rather than a status. */
  it('says a failed delivery in words, in a live region', () => {
    renderWithCrystal(
      <AuthoredBubble author="You" own delivery="failed" deliveryLabel="Not delivered. Try again.">
        Hello
      </AuthoredBubble>,
    );
    expect(screen.getByRole('status')).toHaveTextContent('Not delivered. Try again.');
  });

  it('does not announce a pending delivery, which is not news yet', () => {
    renderWithCrystal(
      <AuthoredBubble author="You" own delivery="pending" deliveryLabel="Sending…">Hello</AuthoredBubble>,
    );
    expect(screen.queryByRole('status')).toBeNull();
    expect(screen.getByText('Sending…')).toBeInTheDocument();
  });

  /* "Only on a new message; do not replay on virtualised history or steal
     scroll" — Crystal's own note on the recipe, and only the caller knows which
     this is. */
  it('plays the arrival only when it is told the message is new', () => {
    /* Two mounts rather than a rerender, because that is what the distinction
       *is*: a new message is a bubble that did not exist a moment ago, and
       history is one that did. Flipping `arriving` on a bubble already in the
       document is not either of those, and the component does not treat it as
       one — the recipe is bound to the mount. */
    const history = renderWithCrystal(
      <AuthoredBubble author="Ada" data-testid="history">History</AuthoredBubble>,
    );
    const quiet = screen.getByTestId('history');
    expect(quiet.dataset['crMotionName'] ?? quiet.dataset['crMotionState']).toBeUndefined();
    history.unmount();

    renderWithCrystal(<AuthoredBubble author="Ada" arriving data-testid="new">New</AuthoredBubble>);
    const arrived = screen.getByTestId('new');
    expect(arrived.dataset['crMotionName'] ?? arrived.dataset['crMotionState']).toBeDefined();
  });

  it('has no accessibility violations', async () => {
    const { container } = renderWithCrystal(
      <div role="log" aria-label="Conversation">
        <AuthoredBubble author="Ada Lovelace" time="09:42">Morning.</AuthoredBubble>
        <AuthoredBubble author="You" time="09:43" own grouped>Morning!</AuthoredBubble>
      </div>,
    );
    await expectNoAxeViolations(container);
  });
});

import { describe, expect, it, vi } from 'vitest';
import { expectNoAxeViolations } from '../../test/axe.js';
import { renderWithCrystal, screen, userEvent, within } from '../../test/render.js';
import { PricingBlock, type PricingPlan } from './PricingBlock.js';

const gbp = (amount: number) => ({ amount, currency: 'GBP' });
const plans: PricingPlan[] = [
  { id: 'solo', name: 'Solo', price: gbp(0), period: 'per month', features: [{ label: '3 projects' }, { label: 'Shared workspaces', included: false }] },
  { id: 'team', name: 'Team', price: gbp(12), period: 'per seat per month', recommended: true, features: [{ label: 'Unlimited projects' }, { label: 'Shared workspaces' }] },
  { id: 'org', name: 'Organisation', price: gbp(30), period: 'per seat per month', features: [{ label: 'Unlimited projects' }, { label: 'Single sign-on' }] },
];

describe('PricingBlock', () => {
  it('lists the plans, each an article named by its heading', () => {
    const { container } = renderWithCrystal(<PricingBlock plans={plans} onChoose={() => {}} />);
    expect(container.querySelectorAll('ul > li > article')).toHaveLength(3);
    expect(screen.getByRole('article', { name: 'Solo' })).toBeInTheDocument();
    expect(screen.getByRole('article', { name: 'Organisation' })).toBeInTheDocument();
  });

  /* The recommended plan is stated in words, not only styled. */
  it('says recommended in the plan\'s heading, in words', () => {
    renderWithCrystal(<PricingBlock plans={plans} onChoose={() => {}} />);
    expect(screen.getByRole('heading', { name: 'Team, Recommended' })).toBeInTheDocument();
    expect(screen.getByRole('article', { name: 'Team, Recommended' })).toHaveTextContent('Recommended');
    expect(screen.getAllByText('Recommended')).toHaveLength(1);
  });

  it('gives the recommended plan the one primary action, and names every action for its plan', async () => {
    const onChoose = vi.fn();
    renderWithCrystal(<PricingBlock plans={plans} onChoose={onChoose} />);
    const team = screen.getByRole('button', { name: 'Choose Team' });
    expect(team.className).toMatch(/primary/);
    expect(screen.getByRole('button', { name: 'Choose Solo' }).className).not.toMatch(/primary/);
    await userEvent.click(team);
    expect(onChoose).toHaveBeenCalledWith('team');
  });

  it('says a missing feature is not included, rather than only leaving it unticked', () => {
    renderWithCrystal(<PricingBlock plans={plans} onChoose={() => {}} />);
    const solo = screen.getByRole('article', { name: 'Solo' });
    expect(within(solo).getByText(/Not included/).closest('li')).toHaveTextContent('Not included: Shared workspaces');
  });

  it('says which plan is the reader\'s, and does not offer it', () => {
    renderWithCrystal(<PricingBlock plans={plans} onChoose={() => {}} currentPlan="solo" />);
    expect(screen.queryByRole('button', { name: 'Choose Solo' })).toBeNull();
    expect(within(screen.getByRole('article', { name: 'Solo' })).getByText('Your plan')).toBeInTheDocument();
  });

  it.each([
    ['at-rest', plans.map((plan) => ({ ...plan, recommended: false }))],
    ['recommended', plans],
  ])('has no axe violations %s', async (_, shown) => {
    const { container } = renderWithCrystal(<PricingBlock plans={shown} onChoose={() => {}} currentPlan="solo" />);
    await expectNoAxeViolations(container);
  });
});

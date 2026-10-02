'use client';

/* PricingBlock: plans side by side, with their features and a way to choose.
 *
 * "The recommended plan is stated in words, not only styled." States:
 * `at-rest`, `recommended`, `focus-visible`.
 *
 * Plans and their features are the product's. The block owns how they are said:
 *
 *   - Recommended is a word in the plan's heading. "Team, Recommended" is what
 *     a reader moving by headings hears, and what a sighted reader sees as the
 *     label beside the name. A ring or a lift says nothing to a reader who
 *     cannot see it.
 *   - Emphasis is Crystal's, and Crystal does not carry emphasis in colour. The
 *     colour specification says emphasis is carried by `.primary` being opt-in,
 *     by label weight and by placement. So the recommended plan's call to
 *     action is the one primary button on the block, its label is weighted, and
 *     it stays where the product placed it; the card material is the same Haze
 *     as its neighbours.
 *   - Every call to action names its plan. Three buttons that all say "Get
 *     started" are three identical entries in a list of controls; "Choose Team"
 *     is one.
 *   - A missing feature is said, not just left unticked. Included features
 *     carry a check, which in Crystal only ever means informational, and an
 *     excluded one says "Not included" in words.
 */
import { useId, type ReactNode } from 'react';
import { Button } from '../Button/Button.js';
import { Price } from '../Price/Price.js';
import { VisuallyHidden } from '../VisuallyHidden/VisuallyHidden.js';
import type { Money } from '../../commerce/money.js';
import { cx } from '../../styles/cx.js';
import styles from './PricingBlock.module.scss';

export interface PlanFeature {
  label: ReactNode;
  /** Defaults to true. False is said as "Not included". */
  included?: boolean;
}

export interface PricingPlan {
  id: string;
  name: string;
  price: Money;
  /** "per month", "per seat per month". */
  period?: string;
  description?: ReactNode;
  features: readonly PlanFeature[];
  recommended?: boolean;
  /** The call to action's words. Defaults to "Choose {name}". */
  actionLabel?: string;
}

export interface PricingBlockProps {
  plans: readonly PricingPlan[];
  onChoose: (id: string) => void;
  /** The plan the reader is already on: its action says so and is not offered. */
  currentPlan?: string;
  headingLevel?: 2 | 3;
  recommendedLabel?: string;
  currentLabel?: string;
  notIncludedLabel?: string;
  className?: string;
}

export function PricingBlock({
  plans, onChoose, currentPlan, headingLevel = 3, recommendedLabel = 'Recommended', currentLabel = 'Your plan',
  notIncludedLabel = 'Not included', className,
}: PricingBlockProps): React.JSX.Element {
  return (
    <ul className={cx(styles['plans'], className)}>
      {plans.map((plan) => (
        <Plan
          key={plan.id}
          plan={plan}
          isCurrent={plan.id === currentPlan}
          onChoose={onChoose}
          headingLevel={headingLevel}
          recommendedLabel={recommendedLabel}
          currentLabel={currentLabel}
          notIncludedLabel={notIncludedLabel}
        />
      ))}
    </ul>
  );
}

function Plan({ plan, isCurrent, onChoose, headingLevel, recommendedLabel, currentLabel, notIncludedLabel }: {
  plan: PricingPlan;
  isCurrent: boolean;
  onChoose: (id: string) => void;
  headingLevel: 2 | 3;
  recommendedLabel: string;
  currentLabel: string;
  notIncludedLabel: string;
}): React.JSX.Element {
  const Heading = `h${headingLevel}` as 'h3';
  const headingId = useId();
  return (
    <li className={cx(styles['item'])}>
      <article
        aria-labelledby={headingId}
        data-recommended={plan.recommended || undefined}
        className={cx(styles['plan'], 'cr-haze')}
      >
        <Heading id={headingId} className={cx(styles['name'])}>
          <span>{plan.name}</span>
          {plan.recommended ? (
            <>
              {/* The comma is for the ear; the label is for the eye. The space sits
                  outside the hidden span, because a name is built from trimmed
                  pieces and a space inside one is lost. */}
              <VisuallyHidden>,</VisuallyHidden>{' '}
              <span className={cx(styles['recommended'])}>{recommendedLabel}</span>
            </>
          ) : null}
        </Heading>
        <p className={cx(styles['price'])}>
          <Price value={plan.price} className={cx(styles['amount'])} />
          {plan.period ? <span className={cx(styles['period'])}> {plan.period}</span> : null}
        </p>
        {plan.description ? <p className={cx(styles['description'])}>{plan.description}</p> : null}
        <ul className={cx(styles['features'])}>
          {plan.features.map((feature, index) => {
            const included = feature.included ?? true;
            return (
              <li key={index} className={cx(styles['feature'])} data-included={included || undefined}>
                <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true" className={cx(styles['mark'])}>
                  <path d={included ? 'M5 13l4 4L19 7' : 'M6 12h12'} />
                </svg>
                {included ? null : <><VisuallyHidden>{notIncludedLabel}:</VisuallyHidden>{' '}</>}
                <span>{feature.label}</span>
              </li>
            );
          })}
        </ul>
        {isCurrent ? (
          <p className={cx(styles['current'])}>{currentLabel}</p>
        ) : (
          <Button
            variant={plan.recommended ? 'primary' : 'quiet'}
            className={cx(styles['action'])}
            onPress={() => { onChoose(plan.id); }}
          >
            {plan.actionLabel ?? `Choose ${plan.name}`}
          </Button>
        )}
      </article>
    </li>
  );
}

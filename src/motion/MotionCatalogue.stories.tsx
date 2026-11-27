import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState, type ReactNode } from 'react';
import motionRecipes from '@prismata/core/motion-recipes' with { type: 'json' };
import { useMotion } from './useMotion.js';
import { usePreset, type PrismataPresetName } from './usePreset.js';
import { Button } from '../components/Button/Button.js';

/* Every motion Prismata ships, playable on demand.
 *
 * The audit of 2 October 2026 found six recipes no component plays
 * (`view-push-out`, whose movement the view stack makes as a mirrored push, and
 * the five material compositions, which are specimens by definition) and four
 * material presets no catalogue component uses (`plastic`, `resin`, `haze`,
 * `stone`; `Transition` can play any of them, and plays `frost` by default). A motion nobody can see is one nobody can review, keep in step with
 * its spring, or notice regressing. This page puts all of them in one place,
 * each on the material it belongs to, each started by a press.
 *
 * It obeys the rule it documents: nothing moves until a person presses Play.
 * The three continuous recipes (D-19) run only while their toggle is on, which
 * stands in for work that is genuinely pending, and stop when it is turned off.
 */

interface Recipe {
  id: string;
  category: string;
  label: string;
  duration: number;
  use?: string;
  material?: string;
  loop?: boolean;
}

const RECIPES: readonly Recipe[] = motionRecipes.recipes as readonly Recipe[];

const PRESETS: { id: PrismataPresetName; label: string; material: string }[] = [
  { id: 'plastic', label: 'Plastic settles', material: 'pr-plastic' },
  { id: 'frost', label: 'Frost emerges', material: 'pr-frost' },
  { id: 'resin', label: 'Resin flows in', material: 'pr-resin' },
  { id: 'haze', label: 'Haze contour', material: 'pr-haze' },
  { id: 'stone', label: 'Stone contour', material: 'pr-stone' },
  { id: 'mirage', label: 'Mirage washes in', material: 'pr-mirage' },
  { id: 'mirage-out', label: 'Mirage withdraws', material: 'pr-mirage' },
  { id: 'dismiss', label: 'Shared dismissal', material: 'pr-haze' },
];

const MATERIAL_CLASS: Record<string, string> = {
  resin: 'pr-resin', frost: 'pr-frost', plastic: 'pr-plastic', haze: 'pr-haze', stone: 'pr-stone', mirage: 'pr-mirage',
};

/* The surface a recipe is seen on: its own material where it names one, a
   button for the controls it was written for, a Haze card otherwise. */
function specimenClass(recipe: Recipe): string {
  if (recipe.material && MATERIAL_CLASS[recipe.material]) return MATERIAL_CLASS[recipe.material]!;
  if (recipe.category === 'Controls') return 'pr-button';
  return 'pr-haze';
}

const card: React.CSSProperties = {
  display: 'grid', gap: 'var(--pr-spacing-xs)', alignContent: 'start', padding: 'var(--pr-space)',
};

const stage: React.CSSProperties = {
  display: 'grid', placeItems: 'center', minBlockSize: 'calc(var(--pr-spacing-2xl) * 2)', overflow: 'hidden',
  borderRadius: 'var(--pr-radius)', background: 'var(--pr-surface-alt)',
};

const specimenBox: React.CSSProperties = {
  display: 'grid', placeItems: 'center', inlineSize: 'calc(var(--pr-spacing-2xl) * 2.5)',
  blockSize: 'calc(var(--pr-spacing-2xl) * 1.2)', borderRadius: 'var(--pr-radius)', fontWeight: 700,
};

function RecipeCard({ recipe }: { recipe: Recipe }): ReactNode {
  const [scope, play, stop] = useMotion();
  const [running, setRunning] = useState(false);
  const toggle = (): void => {
    if (running) { stop(); setRunning(false); } else { void play(recipe.id); setRunning(true); }
  };
  return (
    <article className="pr-haze" style={card} aria-labelledby={`recipe-${recipe.id}`}>
      <div style={stage}>
        <div ref={scope as never} className={specimenClass(recipe)} style={specimenBox}>
          {recipe.id === 'skeleton-sweep' ? null : <span>{recipe.label}</span>}
        </div>
      </div>
      <h3 id={`recipe-${recipe.id}`} style={{ margin: 0, fontSize: 'var(--pr-text-body-size)' }}>
        <code>{recipe.id}</code>
      </h3>
      <p style={{ margin: 0, color: 'var(--pr-muted)', fontSize: 'var(--pr-text-caption-size)' }}>
        {recipe.category} · {recipe.duration}ms{recipe.loop ? ' · continuous' : ''}
      </p>
      {recipe.use ? <p style={{ margin: 0, fontSize: 'var(--pr-text-caption-size)' }}>{recipe.use}</p> : null}
      {recipe.loop ? (
        <Button variant="quiet" isSelected={running} onPress={toggle}>{running ? 'Stop (work resolved)' : 'Start (work pending)'}</Button>
      ) : (
        <Button variant="quiet" onPress={() => { void play(recipe.id); }}>Play</Button>
      )}
    </article>
  );
}

function PresetCard({ preset }: { preset: (typeof PRESETS)[number] }): ReactNode {
  const [scope, play] = usePreset();
  return (
    <article className="pr-haze" style={card} aria-labelledby={`preset-${preset.id}`}>
      <div style={stage}>
        <div ref={scope as never} className={preset.material} style={specimenBox}><span>{preset.label}</span></div>
      </div>
      <h3 id={`preset-${preset.id}`} style={{ margin: 0, fontSize: 'var(--pr-text-body-size)' }}><code>{preset.id}</code></h3>
      <p style={{ margin: 0, color: 'var(--pr-muted)', fontSize: 'var(--pr-text-caption-size)' }}>Material preset · computed from the travel tokens</p>
      <Button variant="quiet" onPress={() => { void play(preset.id); }}>Play</Button>
    </article>
  );
}

function Catalogue({ category }: { category?: string }): ReactNode {
  const shown = category ? RECIPES.filter((recipe) => recipe.category === category) : RECIPES;
  return (
    <div style={{ display: 'grid', gap: 'var(--pr-spacing-lg)' }}>
      <section aria-labelledby="recipes-heading" style={{ display: 'grid', gap: 'var(--pr-spacing-sm)' }}>
        <h2 id="recipes-heading" style={{ margin: 0 }}>{category ?? 'Every recipe'} ({shown.length})</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(calc(var(--pr-spacing-2xl) * 5), 1fr))', gap: 'var(--pr-spacing-md)' }}>
          {shown.map((recipe) => <RecipeCard key={recipe.id} recipe={recipe} />)}
        </div>
      </section>
      {category ? null : (
        <section aria-labelledby="presets-heading" style={{ display: 'grid', gap: 'var(--pr-spacing-sm)' }}>
          <h2 id="presets-heading" style={{ margin: 0 }}>Material presets ({PRESETS.length})</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(calc(var(--pr-spacing-2xl) * 5), 1fr))', gap: 'var(--pr-spacing-md)' }}>
            {PRESETS.map((preset) => <PresetCard key={preset.id} preset={preset} />)}
          </div>
        </section>
      )}
    </div>
  );
}

const CATEGORIES = [...new Set(RECIPES.map((recipe) => recipe.category))];

const meta = {
  title: 'Foundations/Motion catalogue',
  component: Catalogue,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Every motion recipe and material preset Prismata ships, each on the material it belongs to '
          + 'and each started by a press. Six recipes and four presets are played by no component in '
          + 'this library; this is where they can be seen and reviewed. Nothing moves until Play is '
          + 'pressed, and the three continuous recipes run only while their toggle stands for pending work.',
      },
    },
  },
  argTypes: { category: { control: 'select', options: [undefined, ...CATEGORIES] } },
} satisfies Meta<typeof Catalogue>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Everything: Story = {};

export const MaterialCompositions: Story = { args: { category: 'Material compositions' } };

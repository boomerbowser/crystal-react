import type { Metadata } from 'next';
import { Prose } from '@prismata/react';
import { withCode } from '../../../lib/text';
import { MODES, classesOf, describeBranch, madeOf, surface, surfaces, type Recipe } from '../../../lib/prismata';

export const dynamicParams = false;

export function generateStaticParams() {
  return surfaces.map((s) => ({ id: s.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  return { title: surface(id).recipe.name };
}

const FIELDS: [keyof Recipe, string][] = [
  ['fill', 'Fill'], ['blur', 'Backdrop blur'], ['saturation', 'Saturation'], ['rim', 'Rim'],
  ['shadow', 'Shadow'], ['radius', 'Radius'], ['padding', 'Padding'], ['feather', 'Feather'],
];

function RecipeTable({ recipe }: { recipe: Recipe }) {
  const rows = FIELDS.filter(([key]) => recipe[key] !== null && recipe[key] !== undefined);
  return (
    <div className="table-scroll">
      <table className="recipe">
        <tbody>
          {rows.map(([key, label]) => (
            <tr key={key}><th scope="row">{label}</th><td><code>{String(recipe[key])}</code></td></tr>
          ))}
          {recipe.haze ? (
            <tr><th scope="row">Reading fill</th><td><code>{`${recipe.haze.layer}: ${recipe.haze.fill}, inset ${recipe.haze.inset}, feather ${recipe.haze.feather}`}</code></td></tr>
          ) : null}
          {MODES.map(({ key, label }) => (
            <tr key={key}><th scope="row">{label}</th><td><code>{describeBranch(recipe.fallbacks?.[key])}</code></td></tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default async function SurfacePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { recipe, vocabulary } = surface(id);
  const components = madeOf(id);
  const variants = Object.entries(recipe.also ?? {});
  const wearable = [recipe.selector, ...variants.map(([selector]) => selector)]
    .map((selector) => [selector, classesOf(selector)] as const)
    .filter((pair): pair is readonly [string, string] => pair[1] !== null);
  return (
    <>
      <Prose>
        <h1>{recipe.name}</h1>
        <p>{withCode(vocabulary.use)}</p>
        <p>Materials: {recipe.materials.join(', ') || 'none'}. Worn as <code>{recipe.selector}</code>.</p>
      </Prose>

      {wearable.length ? (
        <div className="specimen-stage" aria-label={`${recipe.name}, worn`}>
          {wearable.map(([selector, classes]) => (
            <div key={selector} className={`specimen ${classes}`}>{selector}</div>
          ))}
        </div>
      ) : null}

      <Prose><h2>The recipe</h2></Prose>
      {recipe.alternatives ? (
        Object.entries(recipe.alternatives).map(([element, alternative]) => (
          <section key={element} aria-label={element}>
            <Prose><h3><code>{element}</code></h3></Prose>
            <RecipeTable recipe={alternative} />
          </section>
        ))
      ) : <RecipeTable recipe={recipe} />}

      {variants.length ? (
        <>
          <Prose><h2>Variants</h2></Prose>
          {variants.map(([selector, variant]) => (
            <section key={selector} aria-label={selector}>
              <Prose>
                <h3><code>{selector}</code></h3>
                {vocabulary.partial?.[selector] ? <p>{withCode(vocabulary.partial[selector])}</p> : null}
              </Prose>
              <RecipeTable recipe={variant} />
            </section>
          ))}
        </>
      ) : null}

      <Prose>
        <h2>Made of it</h2>
        {components.length ? (
          <ul>
            {components.map((entry) => (
              <li key={entry.id}><strong>{entry.name}</strong> ({entry.category}): {withCode(entry.material)}</li>
            ))}
          </ul>
        ) : <p>No catalogue entry names this surface.</p>}
      </Prose>
    </>
  );
}

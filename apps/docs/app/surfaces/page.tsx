import type { Metadata } from 'next';
import { Prose } from '@prismata/react';
import { madeOf, surfaces } from '../../lib/prismata';
import { count } from '../../lib/text';

export const metadata: Metadata = { title: 'Surfaces' };

export default function Surfaces() {
  return (
    <>
      <Prose>
        <h1>Surfaces</h1>
        <p>
          Every component is made of one or more surfaces from Prismata's closed vocabulary. Each is one recipe
          in Prismata's stylesheet, published as values for every platform, with its fallbacks for opaque effects,
          reduced transparency and forced colours.
        </p>
      </Prose>
      <ul className="surface-grid">
        {surfaces.map((s) => (
          <li key={s.id}>
            <a className="surface-card pr-haze" href={`/surfaces/${s.id}/`}>
              <strong>{s.name}</strong>
              <code>{s.selector}</code>
              <span>{s.materials.join(', ') || 'No material'} · {count(madeOf(s.id).length, 'component')}</span>
            </a>
          </li>
        ))}
      </ul>
    </>
  );
}

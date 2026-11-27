import { Prose } from '@prismata/react';
import { coreVersion, surfaces } from '../lib/prismata';

export default function Home() {
  return (
    <Prose>
      <h1>Prismata React</h1>
      <p>
        The Prismata Design System for React. This site is being built (slice Q of the plan); its first
        section documents the {surfaces.length} surfaces of @prismata/core {coreVersion}, the closed
        set of material compositions every component is made of.
      </p>
      <p><a href="/surfaces/">Surfaces</a> · <a href="/libraries/">Component libraries</a></p>
    </Prose>
  );
}

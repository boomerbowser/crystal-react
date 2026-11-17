import { Prose } from '@crystal-ui/react';
import { coreVersion, surfaces } from '../lib/crystal';

export default function Home() {
  return (
    <Prose>
      <h1>Crystal React</h1>
      <p>
        The Crystal Design System for React. This site is being built (slice Q of the plan); its first
        section documents the {surfaces.length} surfaces of @crystal-ui/core {coreVersion}, the closed
        set of material compositions every component is made of.
      </p>
      <p><a href="/surfaces/">Surfaces</a></p>
    </Prose>
  );
}

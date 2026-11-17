/* Every fact the site states about Crystal, read from the installed
 * `@crystal-ui/core`. Nothing here is retyped: a surface, a recipe value or a
 * catalogue entry that core does not publish cannot appear on a page, because
 * the page is generated from what core publishes (§3.10). */
import surfaceRecipes from '@crystal-ui/core/surface-recipes';
import surfaceVocabulary from '@crystal-ui/core/surfaces';
import catalogue from '@crystal-ui/core/catalogue';
import libraryRegistry from '@crystal-ui/core/libraries';
import libraryVersions from './library-versions.json';

export interface Branch {
  declarations?: Record<string, string>;
  layers?: Record<string, Record<string, string>>;
}

export interface Recipe {
  selector: string;
  fill?: string | null;
  blur?: string | null;
  saturation?: string | null;
  rim?: string | null;
  shadow?: string | null;
  radius?: string | null;
  padding?: string | null;
  haze?: { layer: string; inset: string; fill: string; feather: string; radius: string } | null;
  feather?: string | null;
  layers?: Record<string, Record<string, string>>;
  fallbacks?: Partial<Record<'opaque' | 'reducedTransparency' | 'forcedColors' | 'noBackdropFilter', Branch | null>>;
  alternatives?: Record<string, Recipe>;
}

export interface Surface extends Recipe {
  id: string;
  name: string;
  materials: string[];
  kind: string;
  also?: Record<string, Recipe>;
  tokens: string[];
}

export interface VocabularyEntry {
  id: string;
  name: string;
  materials: string[];
  class: string;
  use: string;
  also?: string[];
  partial?: Record<string, string>;
}

export interface CatalogueEntry {
  id: string;
  name: string;
  material: string;
  surface: string[];
  category: string;
}

export const surfaces = (surfaceRecipes as unknown as { surfaces: Surface[] }).surfaces;
const vocabulary = (surfaceVocabulary as unknown as { surfaces: VocabularyEntry[] }).surfaces;
export const coreVersion = (catalogue as unknown as { version: string }).version;

export const entries: CatalogueEntry[] = (catalogue as unknown as {
  categories: { name: string; components: Omit<CatalogueEntry, 'category'>[] }[];
}).categories.flatMap((category) => category.components.map((entry) => ({ ...entry, category: category.name })));

export function surface(id: string): { recipe: Surface; vocabulary: VocabularyEntry } {
  const recipe = surfaces.find((s) => s.id === id);
  const entry = vocabulary.find((s) => s.id === id);
  if (!recipe || !entry) throw new Error(`@crystal-ui/core ${coreVersion} publishes no surface "${id}"`);
  return { recipe, vocabulary: entry };
}

export function madeOf(id: string): CatalogueEntry[] {
  return entries.filter((entry) => entry.surface.includes(id));
}

/* A selector that is a compound of classes can be worn by a specimen; one keyed
   on an element or a pseudo-element (`input[type=range]`, `::backdrop`) cannot. */
export function classesOf(selector: string): string | null {
  return /^(\.[a-z][a-z0-9-]*)+$/.test(selector) ? selector.slice(1).split('.').join(' ') : null;
}

export const MODES: { key: keyof NonNullable<Recipe['fallbacks']>; label: string }[] = [
  { key: 'opaque', label: 'Opaque effects' },
  { key: 'reducedTransparency', label: 'Reduced transparency' },
  { key: 'forcedColors', label: 'Forced colours' },
  { key: 'noBackdropFilter', label: 'No backdrop filter' },
];

export function describeBranch(branch: Branch | null | undefined): string {
  if (!branch) return 'Unchanged';
  const parts = Object.entries(branch.declarations ?? {}).map(([k, v]) => `${k}: ${v}`);
  for (const [layer, decls] of Object.entries(branch.layers ?? {})) {
    parts.push(...Object.entries(decls).map(([k, v]) => `${layer} ${k}: ${v}`));
  }
  return parts.join('; ') || 'Unchanged';
}

export interface Library {
  platform: string;
  name: string | null;
  framework: string;
  status: 'built' | 'planned';
  stage: string | null;
  package: string | null;
  registry: string | null;
  repository: string | null;
  documentation: string | null;
}

/* Crystal's component libraries, from the installed registry, each with the
   version its package has published (scripts/library-versions.mjs). */
export const libraries = (libraryRegistry as unknown as { libraries: Library[] }).libraries;
export const publishedVersions = (libraryVersions as { packages: Record<string, string | null> }).packages;

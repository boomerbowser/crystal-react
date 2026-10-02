/* The recipes this library carries a copy of, until Crystal publishes them.
 *
 * The media and text recipes of 2 October 2026 (`.cr-media`, `.cr-media-bar`,
 * `.cr-resin.transport`, `.cr-media-caption`, `.cr-media.audio`, `.cr-prose`,
 * `.cr-editor`, `.cr-editor-toolbar`, `.cr-frost.bar`) were authored in core
 * after 2.3.1 and are not in the core this library installs. The players, the
 * editor and `Prose` carry their values in their own stylesheets meanwhile.
 *
 * This test is written to fail on the day the installed core publishes them, as
 * R-20's did for 2.2.0, so the copies cannot outlive their reason: each
 * component then wears the class and deletes its copy (Slice R, task R-M9 and
 * R-T9 in `docs/implementation-plan.md`).
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const stylesheet = readFileSync(require.resolve('@crystal-ui/core/css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');

const CARRIED = ['.cr-media {', '.cr-media-bar {', '.transport {', '.cr-media-caption {', '.cr-media.audio {', '.cr-editor {', '.cr-editor-toolbar {', '.bar {'];

describe('recipes this library carries a copy of', () => {
  it('are still unpublished by the installed core', () => {
    const published = CARRIED.filter((selector) => stylesheet.includes(selector));
    expect(
      published,
      `the installed @crystal-ui/core now publishes ${published.join(', ')}. Wear the classes and delete the copies in `
      + 'VideoPlayer, AudioPlayer, MediaControls, RichTextSurface, RichTextEditor and Prose (Slice R, R-M9 and R-T9)',
    ).toEqual([]);
  });
});

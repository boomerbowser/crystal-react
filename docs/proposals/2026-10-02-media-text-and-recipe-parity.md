# Media, text and recipe parity: Crystal React

2 October 2026. Crystal React's half of the proposal of the same name in
Crystal (`crystal-design-system/proposals/2026-10-02-media-text-and-recipe-parity.md`),
which holds the findings, the core recipes, the decisions for Meridian (D-30 to
D-36), the visual examples and the captures. This file says what changed in this
library, how to adopt it, and what is left. The tasks are Slice R in
[`../implementation-plan.md`](../implementation-plan.md); the open items are R-27
to R-29 in [`../open-issues.md`](../open-issues.md).

## 1. What changed

| Area | Change | Files |
|---|---|---|
| Media | `useMediaElement` reads and sets playback rate and picture in picture. | `src/media/useMediaElement.ts` |
| Media | `useMediaTracks`: caption, audio and video tracks read from the element and switched on it; a list the engine lacks offers nothing; Crystal draws the cues. | `src/media/useMediaTracks.ts` |
| Media | `MediaSettings`: speed, subtitles, audio track and quality as radio items, a submenu per choice when there are several, selection by weight, every change announced. | `src/components/MediaControls/MediaSettings.tsx` |
| Media | `MediaControls`: the transport's padding, readouts on Haze pills, sliders inset by half a thumb. | `src/components/MediaControls/` |
| Media | `VideoPlayer`: aspect ratio and fit, settings, captions on Stone above the transport, picture in picture, full screen, new shortcuts, overlays portalled into the player in full screen. | `src/components/VideoPlayer/` |
| Media | `AudioPlayer`: a Haze card with the card padding, `subtitle`, a speed menu. | `src/components/AudioPlayer/` |
| Media | `PlayerShell` uses the video player's own full screen. | `src/components/PlayerShell/` |
| Text | `RichTextSurface` wears `.cr-field-shell`, carries the reading vocabulary, plays the field recipes, takes a `toolbar` slot and places its toolbar by pointer, above the on-screen keyboard on touch. | `src/components/RichTextSurface/` |
| Text | The format vocabulary (`FORMAT_VOCABULARY`, `BLOCK_TYPES`, `MARKS`, `LISTS`, `STRUCTURE`, `HISTORY`, `FORMAT_ICONS`, `displayShortcut`) and `useKeyboardInset`, from the main entry. | `src/components/RichTextSurface/formats.tsx`, `useKeyboardInset.ts` |
| Text | `RichTextEditor`, from the new `@crystal-ui/react/editor` entry: TipTap 3 bound to the vocabulary. | `src/editor/`, `src/editor.ts` |
| Text | `Prose` and the editor share one vocabulary mixin; checklists, `u`, `s`, `ins`, `del`, `kbd`, `sub`, `sup`. `Prose` renders pixel-identically to before. | `src/styles/_prose.scss` |
| Text | `Text` renders the edit and annotation elements and takes `decoration`. | `src/components/Text/` |
| Motion | The motion catalogue story: every recipe and preset, playable. | `src/motion/MotionCatalogue.stories.tsx` |
| Manifest | `composedRecipes`: motion played by the components a component renders. | `scripts/build-manifest.mjs` |
| Gates | `scripts/audit-recipes.mjs`; real-browser checks for captions, transport geometry, settings, the audio card and the editor's touch layout; a guard for the recipes this library carries copies of. | `scripts/`, `src/media/coreRecipes.test.ts` |
| Fixtures | A generated 8 s clip with two audio tracks, captions in two languages, and an audio episode, so every media story plays real media offline. | `.storybook/fixtures/` |

## 2. Adopting it: an implementation guide

### 2.1 Video

```tsx
import { VideoPlayer } from '@crystal-ui/react';

<VideoPlayer
  label="A walk through the harbour"
  aspectRatio="16 / 9"            // default; 'auto' follows the media once known
  fit="contain"                    // or 'cover'
  playbackRates={[0.75, 1, 1.25, 1.5, 2]}
  qualities={renditions}           // your streaming library's levels
  quality={current}
  onQualityChange={(id) => hls.currentLevel = Number(id)}
>
  <source src="/harbour.m3u8" type="application/x-mpegURL" />
  <track kind="captions" srcLang="en" label="English" src="/en.vtt" default />
  <track kind="subtitles" srcLang="fr" label="Français" src="/fr.vtt" />
</VideoPlayer>
```

- **Captions.** Give each `<track>` a `label`; a track without one is named by
  its language in the reader's language. The toggle turns on the last language
  the reader chose. Crystal draws cues on Stone above the transport; pass
  `nativeCaptions` to let the browser draw them, under the transport, styled
  through `::cue`.
- **Audio tracks** need nothing from you. Where the browser exposes
  `audioTracks` (Safari) and the file carries more than one, the menu offers
  them. Where it does not (Chromium, Firefox), no audio choice is shown, because
  the player could not make it. For adaptive streams, switch audio in your
  streaming library and pass it as a quality-like choice of your own.
- **Quality** is yours: the player shows `qualities` and reports the choice;
  your streaming library switches. A file with more than one native video track
  is offered automatically when you pass no `qualities`.
- **Full screen and picture in picture** are on by default and shown only where
  the browser and frame allow them. `allowFullScreen={false}` and
  `allowPictureInPicture={false}` turn them off. `onFullScreenChange` reports
  however full screen was left.
- **Words.** `words` translates every control and announcement:
  `{ settings, fullScreen, pictureInPicture, speed, normal, subtitles, off, audio, quality, rate, spokenRate }`.
- **Shortcuts** while focus is inside the player: Space and K, the arrows, M,
  C for captions, F for full screen, Shift+< and Shift+> for speed.

### 2.2 Audio

```tsx
<AudioPlayer label="Episode 4" title="Episode 4: The long way round" subtitle="Harbour stories" skipBy={15}>
  <source src="/episode-4.m4a" type="audio/mp4" />
</AudioPlayer>
```

It is a Haze card. Inside a surface that is already Haze, pass
`surface={false}` so it is not Haze on Haze.

### 2.3 Rich text

**With TipTap**, from the editor entry. Install the optional peers first:

```sh
pnpm add @tiptap/react @tiptap/pm @tiptap/core @tiptap/starter-kit @tiptap/extension-list @tiptap/extension-highlight @tiptap/extension-subscript @tiptap/extension-superscript @tiptap/extensions
```

```tsx
import { RichTextEditor } from '@crystal-ui/react/editor';

<RichTextEditor
  label="Board notes"
  name="notes"                                   // submits HTML with the form
  defaultValue="<p>Figures are due Wednesday.</p>"
  onChange={({ html, json, text }) => save(json)}
  formats={['heading-2', 'paragraph', 'bold', 'italic', 'underline', 'strike', 'link', 'bullet-list', 'checklist', 'undo', 'redo']}
  placeholder="Write the notes, or type ## for a heading"
/>
```

`ref` gives the TipTap `Editor` (`ref.current.editor`) for anything the props
do not cover; `extensions` adds a product's own nodes and marks.

**With another engine**, keep `RichTextSurface` and read the vocabulary:

```tsx
import { RichTextSurface, MARKS, LISTS, type FormatAction } from '@crystal-ui/react';

const actions: FormatAction[] = [...MARKS, ...LISTS].map((format) => ({
  id: format.id, label: format.label, icon: format.icon,
  isActive: engine.isActive(format.id), onToggle: () => engine.toggle(format.id),
}));
<RichTextSurface label="Notes" actions={actions} toolbar={<MyBlockTypeMenu />}>
  <MyEditor />
</RichTextSurface>
```

Whatever the engine renders inside the surface is styled with Crystal's reading
vocabulary, and on a touch screen the toolbar moves below the text and stays
above the keyboard.

### 2.4 Text

```tsx
<Text>Fee <Text as="del">£40</Text> <Text as="ins">£45</Text></Text>
<Text as="span" decoration="underline">Label</Text>
```

Use the element when the line means something (`del`, `ins`, `s`); use
`decoration` only for a look.

## 3. Migrating: what to check

| What | Was | Is | Action |
|---|---|---|---|
| `VideoPlayer` stage | The media's own ratio, 300×150 until metadata | 16:9 | Pass `aspectRatio="auto"` to keep the old behaviour. |
| `VideoPlayer` controls bar | Hidden unless hovered or focused | Also shown while paused | None. |
| `VideoPlayer` captions | Drawn by the browser; the track's mode `showing` | Drawn by Crystal; the track's mode `hidden` | If you read `track.mode === 'showing'` to know captions are on, read `!== 'disabled'`, or pass `nativeCaptions`. |
| `VideoPlayer` full screen | Only through `PlayerShell` | Built in | If you added your own full-screen control through `controls`, remove it or pass `allowFullScreen={false}`. |
| `VideoPlayer`, `AudioPlayer` settings | None | A Settings control when there is a choice | Pass `playbackRates={[]}` to remove speed. |
| `AudioPlayer` surface | None | A Haze card with padding | Pass `surface={false}` inside a Haze surface; remove any card you wrapped it in. |
| `MediaControls` volume width | 96px including the thumb | 96px track plus half a thumb each side | None, unless you sized a container to the old width. |
| `RichTextSurface` frame | Hand-written Resin with its own Haze | `.cr-field-shell` | None; it now matches every other field. |
| `RichTextSurface` children | Unstyled | Crystal's reading vocabulary | Remove engine styles that fought it (headings, lists, marks). |
| `PlayerShell` `fullScreenLabel` | Its own control | Passed to the player's control | None. |
| Package | Two entries | Three; TipTap optional peers | Install the peers only if you import `@crystal-ui/react/editor`. |

## 4. What the gates say

| Gate | Result |
|---|---|
| `pnpm run typecheck`, `lint:tokens` | Clean. |
| `pnpm test` (Vitest, unit and Storybook projects) | 2038 tests in 422 files, all passing. Before this change: 1995 in 416. |
| `pnpm run test:jest` | 3 of 3 passing. |
| `verify:stories` | Above the floor on every count (179 files with a component against 161). |
| `pnpm run build` | Three entries; no vendored dependency; the main entry's 519 modules include no TipTap. |
| `verify:behaviour` | 114 checks, all passing, including 13 new ones for captions, transport geometry, settings, the audio card and the editor's touch layout. The first run failed one check, the virtualizer's focus retention, in a component this change did not touch; it passed on the rerun under the same dev server, so it is recorded as a flake (R-29). |
| `verify:appearance` | 120 checks, all passing. |
| `verify:materials` | Passing against crystal-preview on 4321. |
| `verify:targets` | Passing. |
| `verify:theme` | Passing, after the four properties the players and the rich text surface set on themselves were added to its local list (they were already on the unit test's). |

Not checked: Safari and Firefox; a real phone with a real keyboard; screen
readers. Tasks R-M10, R-T5 and R-T8.

## 5. What is left

Slice R in the implementation plan lists every task with its target and what
says it is done. The ones that block nothing in this change but finish it:

- **R-M9 and R-T9**, blocked on core 2.4.0: wear `.cr-media`, `.cr-media-bar`,
  `.cr-resin.transport`, `.cr-media-caption`, `.cr-prose`, `.cr-editor`,
  `.cr-editor-toolbar` and `.cr-frost.bar`, and delete the copies this library
  carries. `src/media/coreRecipes.test.ts` fails on the day they publish.
- **R-A1**, the 29 directories that paint `backdrop-filter` by hand and the 49
  that use material mixins, sorted into surfaces to wear and compositions to
  propose.
- **R-M10, R-T5, R-T8**, the engines and devices not yet checked.

## Appendix A: the fixtures

`.storybook/fixtures/` was generated with ffmpeg 7 on 2 October 2026, so the
stories and the browser gates play real media with no network. Run from that
folder to regenerate.

The clip: an 8 s 640×360 gradient, H.264 baseline, with two mono AAC tracks
(English at 330 Hz, French at 550 Hz) so an engine with `audioTracks` has a
real choice to make.

```sh
ffmpeg -y \
  -f lavfi -i "gradients=s=640x360:c0=0x6d4bd8:c1=0xf2a7d8:c2=0x2b6cb0:x0=0:y0=0:x1=640:y1=360:speed=0.02:d=8:r=24" \
  -f lavfi -i "sine=frequency=330:duration=8" -f lavfi -i "sine=frequency=550:duration=8" \
  -map 0:v -map 1:a -map 2:a -c:v libx264 -preset veryslow -crf 34 -pix_fmt yuv420p -profile:v baseline \
  -c:a aac -b:a 32k -ac 1 \
  -metadata:s:a:0 language=eng -metadata:s:a:0 title="English" \
  -metadata:s:a:1 language=fra -metadata:s:a:1 title="Français" \
  -disposition:a:0 default -movflags +faststart harbour.mp4
```

The audio episode: two tones mixed, 8 s.

```sh
ffmpeg -y -f lavfi -i "sine=frequency=262:duration=8" -f lavfi -i "sine=frequency=392:duration=8" \
  -filter_complex "[0][1]amix=inputs=2" -c:a aac -b:a 32k -ac 1 episode.m4a
```

The captions, `harbour.en.vtt` and `harbour.fr.vtt`, are hand-written WebVTT:
three cues each at 0 to 2.6 s, 2.6 to 5.4 s and 5.4 to 8 s, the second with
italics, so `getCueAsHTML` is exercised.

/* Story fixtures, resolved by Vite as assets so they work in `storybook dev`,
   in `storybook-static` and in the browser gates, with no network. See
   README.md beside this file for what each one is. */
export const harbourVideo = new URL('./harbour.mp4', import.meta.url).href;
export const harbourCaptionsEnglish = new URL('./harbour.en.vtt', import.meta.url).href;
export const harbourCaptionsFrench = new URL('./harbour.fr.vtt', import.meta.url).href;
export const episodeAudio = new URL('./episode.m4a', import.meta.url).href;

/* Photographs from Unsplash (the Unsplash License), fetched once through Lorem
   Picsum at 1200×800 and kept here, so image stories show real photographs
   with no network. Credits are in README.md. */
const photo = (name: string): string => new URL(`./photos/${name}.jpg`, import.meta.url).href;
export const photos = {
  bay: photo('bay'),
  pebbleBeach: photo('pebble-beach'),
  pier: photo('pier'),
  lighthouse: photo('lighthouse'),
  mooredBoat: photo('moored-boat'),
  rockyShore: photo('rocky-shore'),
  headland: photo('headland'),
  forestCoast: photo('forest-coast'),
  hillTown: photo('hill-town'),
  hillTownGrey: photo('hill-town-grey'),
} as const;

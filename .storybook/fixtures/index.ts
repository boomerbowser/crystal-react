/* Story fixtures, resolved by Vite as assets so they work in `storybook dev`,
   in `storybook-static` and in the browser gates, with no network. See
   README.md beside this file for what each one is. */
export const harbourVideo = new URL('./harbour.mp4', import.meta.url).href;
export const harbourCaptionsEnglish = new URL('./harbour.en.vtt', import.meta.url).href;
export const harbourCaptionsFrench = new URL('./harbour.fr.vtt', import.meta.url).href;
export const episodeAudio = new URL('./episode.m4a', import.meta.url).href;

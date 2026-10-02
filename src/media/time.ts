/* How a media time is displayed and how it is announced.
 *
 * "Crystal: … **time formatting**". The catalogue assigns this to Crystal rather
 * than the product, as it does the palette, so that two players never format
 * the same second differently.
 *
 * There are two functions because the screen and the announcement need
 * different text. `1:23` is right beside a scrubber, but a screen reader reads
 * it as "one colon twenty-three" or "one twenty-three", depending on the engine
 * and the punctuation setting. The thumb says "1 minute 23 seconds of 4 minutes
 * 56 seconds" and the display says "1:23".
 */

/** `m:ss`, or `h:mm:ss` once there is an hour to show. For the screen. */
export function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const whole = Math.floor(seconds);
  const s = whole % 60;
  const m = Math.floor(whole / 60) % 60;
  const h = Math.floor(whole / 3600);
  const ss = String(s).padStart(2, '0');
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${ss}` : `${m}:${ss}`;
}

/** Words. For `aria-valuetext`, where `1:23` is not a time to a screen reader. */
export function speakTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '0 seconds';
  const whole = Math.floor(seconds);
  const parts: string[] = [];
  const h = Math.floor(whole / 3600);
  const m = Math.floor(whole / 60) % 60;
  const s = whole % 60;
  if (h > 0) parts.push(`${h} hour${h === 1 ? '' : 's'}`);
  if (m > 0) parts.push(`${m} minute${m === 1 ? '' : 's'}`);
  /* Seconds are included when they are the only thing there, so "2 minutes" does
     not become "2 minutes 0 seconds" and 0 does not become nothing at all. */
  if (s > 0 || parts.length === 0) parts.push(`${s} second${s === 1 ? '' : 's'}`);
  return parts.join(' ');
}

/** What the scrubber's thumb says: a position inside a whole, in words. */
export function speakPosition(at: number, of: number): string {
  return Number.isFinite(of) && of > 0
    ? `${speakTime(at)} of ${speakTime(of)}`
    : speakTime(at);
}

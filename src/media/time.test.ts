import { describe, expect, it } from 'vitest';
import { formatTime, speakTime, speakPosition } from './time.js';

describe('media time', () => {
  it('reads as m:ss, and grows an hour only when there is one', () => {
    expect(formatTime(0)).toBe('0:00');
    expect(formatTime(9)).toBe('0:09');
    expect(formatTime(83)).toBe('1:23');
    expect(formatTime(600)).toBe('10:00');
    expect(formatTime(3661)).toBe('1:01:01');
  });

  it('survives the values a media element actually reports before it loads', () => {
    expect(formatTime(Number.NaN)).toBe('0:00');
    expect(formatTime(Number.POSITIVE_INFINITY)).toBe('0:00');
    expect(formatTime(-1)).toBe('0:00');
  });

  /* The whole reason there are two functions: `1:23` is right on the screen and
     wrong in an announcement, where a screen reader reads it as "one colon
     twenty-three" or "one twenty-three" depending on the engine. */
  it('is said in words rather than in punctuation', () => {
    expect(speakTime(83)).toBe('1 minute 23 seconds');
    expect(speakTime(3661)).toBe('1 hour 1 minute 1 second');
  });

  it('says nothing about a unit that is not there', () => {
    expect(speakTime(120)).toBe('2 minutes');
    expect(speakTime(0)).toBe('0 seconds');
  });

  it('places a position inside a whole', () => {
    expect(speakPosition(83, 296)).toBe('1 minute 23 seconds of 4 minutes 56 seconds');
  });

  /* Before the metadata arrives there is no whole to be inside. */
  it('says only the position when the length is unknown', () => {
    expect(speakPosition(83, 0)).toBe('1 minute 23 seconds');
  });
});

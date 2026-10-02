'use client';

/* MediaSettings: the settings menu at the end of the transport.
 *
 * One control opens one menu holding every choice a player makes once and then
 * leaves alone: playback speed, the subtitle or caption language, the audio
 * track and the quality. With several choices each is a submenu whose row shows
 * its current value; with one it is a flat group. Each is a set of radio items (`menuitemradio` with
 * `aria-checked`), because each is a choice of exactly one. The chosen item is
 * shown by label weight and the selected fill. There is no check mark: in
 * Crystal a check means validated, and a mark beside the label would offset the
 * very item it points at.
 *
 * A group with nothing to choose between is left out. A file with one audio
 * track has no audio choice, and a browser with no audio track list cannot make
 * one, so offering it would be a control that does nothing. When every group is
 * left out, the control itself is not rendered.
 *
 * Every change is reported through `onAnnounce` in words ("Speed 1.5 times",
 * "Subtitles French"), because a speed or a language changing is otherwise
 * silent to a reader who cannot see the menu close.
 *
 * The menu is Frost, as every transient overlay is, and plays `menu-in` and
 * `menu-out` through `Menu`.
 */
import { type ReactNode } from 'react';
import { IconButton } from '../IconButton/IconButton.js';
import { Menu, MenuGroup, MenuItem, MenuTrigger, Submenu } from '../Menu/Menu.js';
import { VisuallyHidden } from '../VisuallyHidden/VisuallyHidden.js';
import styles from './MediaSettings.module.scss';
import type { MediaTrackOption } from '../../media/useMediaTracks.js';

export interface MediaQuality {
  id: string;
  /** What the reader sees, such as "1080p" or "Auto (720p)". */
  label: string;
}

export interface MediaSettingsProps {
  /** What the control is called. */
  label?: string;
  /** The speeds offered. Omit or pass one value to leave speed out. */
  playbackRates?: readonly number[];
  playbackRate?: number;
  onPlaybackRateChange?: (rate: number) => void;
  /** Caption and subtitle tracks. "Off" is always offered when there are any. */
  textTracks?: readonly MediaTrackOption[];
  activeTextTrack?: string | null;
  onTextTrackChange?: (id: string | null) => void;
  audioTracks?: readonly MediaTrackOption[];
  activeAudioTrack?: string | null;
  onAudioTrackChange?: (id: string) => void;
  /**
   * Renditions, which the product's streaming library switches between. A
   * native video-track list is passed here too, when a file really has more
   * than one.
   */
  qualities?: readonly MediaQuality[];
  quality?: string | null;
  onQualityChange?: (id: string) => void;
  /** Called with a sentence describing each change, for a live region. */
  onAnnounce?: (sentence: string) => void;
  /** Words, so a product can translate them. */
  words?: Partial<MediaSettingsWords>;
}

export interface MediaSettingsWords {
  speed: string;
  normal: string;
  subtitles: string;
  off: string;
  audio: string;
  quality: string;
  /** How a speed is written, such as "1.5×". */
  rate: (rate: number) => string;
  /** How a speed is said, such as "1.5 times". */
  spokenRate: (rate: number) => string;
}

const WORDS: MediaSettingsWords = {
  speed: 'Speed',
  normal: 'Normal',
  subtitles: 'Subtitles',
  off: 'Off',
  audio: 'Audio',
  quality: 'Quality',
  rate: (rate) => `${rate}×`,
  spokenRate: (rate) => `${rate} times`,
};

const SettingsIcon = (
  <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
    <path d="M4 7h10M18 7h2M4 17h2M10 17h10" />
    <circle cx="16" cy="7" r="2" />
    <circle cx="8" cy="17" r="2" />
  </svg>
);

const OFF = '__off__';

/** The speeds both players offer by default. */
export const DEFAULT_PLAYBACK_RATES = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2] as const;

export function MediaSettings({
  label = 'Settings',
  playbackRates, playbackRate = 1, onPlaybackRateChange,
  textTracks = [], activeTextTrack = null, onTextTrackChange,
  audioTracks = [], activeAudioTrack = null, onAudioTrackChange,
  qualities = [], quality = null, onQualityChange,
  onAnnounce, words: given,
}: MediaSettingsProps): ReactNode {
  const words = { ...WORDS, ...given };
  const speeds = onPlaybackRateChange && playbackRates && playbackRates.length > 1 ? playbackRates : [];
  const subtitles = onTextTrackChange && textTracks.length > 0 ? textTracks : [];
  const audio = onAudioTrackChange && audioTracks.length > 1 ? audioTracks : [];
  const renditions = onQualityChange && qualities.length > 1 ? qualities : [];

  type Choice = {
    id: string;
    title: string;
    options: { id: string; label: string; textValue?: string }[];
    selected: string | null;
    choose: (id: string) => void;
  };

  const choices: Choice[] = [];
  if (speeds.length) {
    choices.push({
      id: 'speed',
      title: words.speed,
      options: speeds.map((rate) => ({
        id: String(rate),
        label: rate === 1 ? words.normal : words.rate(rate),
        textValue: rate === 1 ? words.normal : words.spokenRate(rate),
      })),
      selected: String(playbackRate),
      choose: (id) => {
        const rate = Number(id);
        onPlaybackRateChange?.(rate);
        onAnnounce?.(`${words.speed} ${rate === 1 ? words.normal : words.spokenRate(rate)}`);
      },
    });
  }
  if (subtitles.length) {
    choices.push({
      id: 'subtitles',
      title: words.subtitles,
      options: [{ id: OFF, label: words.off }, ...subtitles.map((track) => ({ id: track.id, label: track.label }))],
      selected: activeTextTrack ?? OFF,
      choose: (id) => {
        const track = id === OFF ? null : id;
        onTextTrackChange?.(track);
        const chosen = subtitles.find((option) => option.id === track);
        onAnnounce?.(`${words.subtitles} ${chosen ? chosen.label : words.off}`);
      },
    });
  }
  if (audio.length) {
    choices.push({
      id: 'audio',
      title: words.audio,
      options: audio.map((track) => ({ id: track.id, label: track.label })),
      selected: activeAudioTrack,
      choose: (id) => {
        onAudioTrackChange?.(id);
        onAnnounce?.(`${words.audio} ${audio.find((track) => track.id === id)?.label ?? ''}`.trim());
      },
    });
  }
  if (renditions.length) {
    choices.push({
      id: 'quality',
      title: words.quality,
      options: renditions.map((option) => ({ id: option.id, label: option.label })),
      selected: quality,
      choose: (id) => {
        onQualityChange?.(id);
        onAnnounce?.(`${words.quality} ${renditions.find((option) => option.id === id)?.label ?? ''}`.trim());
      },
    });
  }

  if (!choices.length) return null;

  /* A speed is written "1.5×" and said "1.5 times": screen readers read the
     multiplication sign differently ("times", "multiplied by", nothing), so the
     spoken form is the item's name and the written one is what is seen. */
  const items = (choice: Choice): ReactNode => choice.options.map((option) => (
    <MenuItem key={option.id} id={option.id} {...(option.textValue ? { textValue: option.textValue } : {})}>
      {option.textValue && option.textValue !== option.label ? (
        <>
          <span aria-hidden="true">{option.label}</span>
          <VisuallyHidden>{option.textValue}</VisuallyHidden>
        </>
      ) : option.label}
    </MenuItem>
  ));

  /* One choice is a flat group under its heading. Several are one submenu each,
     whose row names the choice and shows its current value ("Speed, Normal"), so
     the menu stays a handful of rows over a short picture instead of a column
     taller than the stage. React Aria owns the submenus: right arrow enters,
     left arrow and Escape leave, and focus returns to the row. */
  if (choices.length === 1) {
    const [only] = choices as [Choice];
    return (
      <MenuTrigger>
        <IconButton label={label} icon={SettingsIcon} />
        <Menu label={label}>
          <MenuGroup
            label={only.title}
            selectionMode="single"
            selectedKey={only.selected}
            onSelectionChange={(key) => only.choose(String(key))}
          >
            {items(only)}
          </MenuGroup>
        </Menu>
      </MenuTrigger>
    );
  }

  return (
    <MenuTrigger>
      <IconButton label={label} icon={SettingsIcon} />
      <Menu label={label}>
        {choices.map((choice) => {
          const option = choice.options.find((one) => one.id === choice.selected);
          const current = option?.label ?? '';
          const spoken = option?.textValue ?? current;
          return (
            <Submenu
              key={choice.id}
              textValue={`${choice.title}, ${spoken}`}
              label={(
                /* Read as "Speed, 1.5 times": the comma separates the two
                   spans, which a name computed from content would otherwise
                   run together. */
                <span className={styles['row']}>
                  <span>{choice.title}</span>
                  <VisuallyHidden>{`, ${spoken}`}</VisuallyHidden>
                  <span className={styles['value']} aria-hidden="true">{current}</span>
                </span>
              )}
            >
              <Menu
                label={choice.title}
                selectionMode="single"
                disallowEmptySelection
                selectedKeys={choice.selected === null ? [] : [choice.selected]}
                onSelectionChange={(keys) => {
                  if (keys === 'all') return;
                  const [first] = [...keys];
                  if (first !== undefined) choice.choose(String(first));
                }}
              >
                {items(choice)}
              </Menu>
            </Submenu>
          );
        })}
      </Menu>
    </MenuTrigger>
  );
}

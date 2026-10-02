'use client';

/* VideoPlayer is a video surface with Crystal transport controls.
 *
 * "Native video element underneath. Controls are real buttons, **captions are
 * supported and their state is announced**, and **keyboard shortcuts do not trap
 * focus**." The catalogue (core, after 2.3.1) adds the anatomy a product needs
 * to ship one: a stage at a set aspect ratio, caption cues above the transport,
 * and a settings menu for speed, subtitles, the audio track and quality, with
 * picture in picture and full screen.
 *
 * Captions. A `<track>` is not enough on its own, because a reader has no way to
 * turn it on and no way to know whether it is on. The caption toggle and the
 * settings menu's subtitle group are both views of `textTracks`; the toggle's
 * pressed state is whether a caption track is on, and every change is announced
 * in words for a reader who cannot see subtitles appear. Crystal draws the cues
 * itself, on Stone and above the transport, because the browser draws them at
 * the bottom of the picture where the transport covers them. `nativeCaptions`
 * hands drawing back to the browser.
 *
 * Every choice the browser cannot make is left out. The audio-track group
 * appears only where the browser exposes `audioTracks` and the file has more
 * than one; picture in picture only where the document allows it; full screen
 * only where the frame may go full screen.
 *
 * Keyboard shortcuts do not trap focus. The player answers Space and K, the
 * arrow keys, M, C (captions), F (full screen) and Shift+< and Shift+> (speed)
 * while focus is inside it, and does nothing when focus is not. There is no
 * document-level listener, which would steal the space bar from the page's own
 * scrolling. The handler ignores an event that started on a button, a slider or
 * anything else focusable, so Space on the play toggle is the button's Space.
 *
 * Showing and hiding the controls is Crystal's, and Crystal's rule is that
 * nothing moves at rest, so the bar does not fade in and out on a timer. It is
 * shown whenever a pointer is over the video, focus is inside the player or the
 * video is paused, and hidden otherwise, so a person always started the change.
 */
import {
  forwardRef, useCallback, useEffect, useLayoutEffect, useRef, useState,
  type CSSProperties, type KeyboardEvent, type ReactNode, type RefObject, type VideoHTMLAttributes,
} from 'react';
import { UNSAFE_PortalProvider as PortalProvider, useUNSAFE_PortalContext as usePortalContext } from 'react-aria';
import { IconButton } from '../IconButton/IconButton.js';
import { MediaControls } from '../MediaControls/MediaControls.js';
import {
  DEFAULT_PLAYBACK_RATES, MediaSettings, type MediaQuality, type MediaSettingsWords,
} from '../MediaControls/MediaSettings.js';
import { useMediaElement } from '../../media/useMediaElement.js';
import { useMediaTracks } from '../../media/useMediaTracks.js';
import { mergeRefs } from '../../utils/mergeRefs.js';
import { cx } from '../../styles/cx.js';
import { useMediaArrival } from '../../media/useMediaArrival.js';
import styles from './VideoPlayer.module.scss';

/** The ratios the catalogue names, or any CSS `aspect-ratio`. */
export type MediaAspectRatio = '16 / 9' | '4 / 3' | '1 / 1' | '9 / 16' | '21 / 9' | 'auto' | (string & {});

export interface VideoPlayerProps
  extends Omit<VideoHTMLAttributes<HTMLVideoElement>, 'controls' | 'children' | 'title'> {
  /** What is playing. The video's accessible name. */
  label: string;
  /** `<source>` and `<track>` elements. */
  children?: ReactNode;
  /** Seconds the arrow keys and the skip controls jump. */
  skipBy?: number;
  /** The element itself, for sources, captions, DRM and analytics. */
  mediaRef?: RefObject<HTMLVideoElement | null>;
  /**
   * The stage's shape. `16 / 9` by default, so the page does not jump when the
   * first frame decodes; `auto` follows the media's own ratio once it is known.
   */
  aspectRatio?: MediaAspectRatio;
  /** `contain` letterboxes and crops nothing; `cover` fills the stage. */
  fit?: 'contain' | 'cover';
  /** What the caption control is called. */
  captionsLabel?: string;
  /** Let the browser draw caption cues instead of Crystal. */
  nativeCaptions?: boolean;
  /** The speeds the settings menu offers. Pass `[]` to leave speed out. */
  playbackRates?: readonly number[];
  /** Renditions the product's streaming library switches between. */
  qualities?: readonly MediaQuality[];
  quality?: string | null;
  onQualityChange?: (id: string) => void;
  /** Offer full screen, where the frame allows it. On by default. */
  allowFullScreen?: boolean;
  /** Offer picture in picture, where the browser allows it. On by default. */
  allowPictureInPicture?: boolean;
  /** Called when full screen starts or stops, however it was left. */
  onFullScreenChange?: (isFullScreen: boolean) => void;
  /** Words for the controls, so a product can translate them. */
  words?: Partial<VideoPlayerWords>;
  /** More controls at the end of the transport, after the player's own. */
  controls?: ReactNode;
  className?: string;
}

export interface VideoPlayerWords extends MediaSettingsWords {
  settings: string;
  fullScreen: string;
  pictureInPicture: string;
  on: string;
}

const PLAYER_WORDS: VideoPlayerWords = {
  settings: 'Settings',
  fullScreen: 'Full screen',
  pictureInPicture: 'Picture in picture',
  on: 'on',
  speed: 'Speed',
  normal: 'Normal',
  subtitles: 'Subtitles',
  off: 'off',
  audio: 'Audio',
  quality: 'Quality',
  rate: (rate) => `${rate}×`,
  spokenRate: (rate) => `${rate} times`,
};

const CaptionsIcon = (
  <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
    <rect x="3" y="5" width="18" height="14" rx="3" />
    <path d="M9 11a2 2 0 1 0 0 2M16 11a2 2 0 1 0 0 2" />
  </svg>
);

const PictureInPictureIcon = (
  <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
    <rect x="3" y="5" width="18" height="14" rx="3" />
    <rect x="12" y="11" width="6" height="5" rx="1" />
  </svg>
);

const FullScreenIcon = (
  <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
    <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />
  </svg>
);

/** Draws the cues Crystal renders. `getCueAsHTML` keeps the cue's own italics,
 *  bold and voice spans, and builds them as nodes, never as markup. */
function CaptionCues({ cues }: { cues: TextTrackCue[] }): ReactNode {
  const host = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const element = host.current;
    if (!element) return;
    const lines = cues.map((cue) => {
      const line = document.createElement('span');
      const vtt = cue as TextTrackCue & { getCueAsHTML?: () => DocumentFragment; text?: string };
      if (typeof vtt.getCueAsHTML === 'function') line.append(vtt.getCueAsHTML());
      else line.textContent = vtt.text ?? '';
      return line;
    });
    element.replaceChildren(...lines);
  }, [cues]);
  /* Hidden from the accessibility tree: the cues are a visual rendering of a
     track whose text a screen reader user is reading from the transcript or
     hearing. Announcing every cue would talk over the audio. */
  return <div ref={host} aria-hidden="true" className={styles['captions']} hidden={cues.length === 0} />;
}

export const VideoPlayer = forwardRef<HTMLVideoElement, VideoPlayerProps>(function VideoPlayer({
  label, children, skipBy = 10, mediaRef, aspectRatio = '16 / 9', fit = 'contain',
  captionsLabel = 'Captions', nativeCaptions = false,
  playbackRates = DEFAULT_PLAYBACK_RATES, qualities, quality = null, onQualityChange,
  allowFullScreen = true, allowPictureInPicture = true, onFullScreenChange,
  words: given, controls, className, style, ...props
}, ref): ReactNode {
  const words = { ...PLAYER_WORDS, ...given };
  const own = useRef<HTMLVideoElement>(null);
  const root = useRef<HTMLDivElement>(null);
  const media = useMediaElement(own);
  const tracks = useMediaTracks(own, { native: nativeCaptions });
  /* `media-in` on the picture once its first frame is ready. */
  const arrival = useMediaArrival(own);
  const [said, setSaid] = useState('');
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [canFullScreen, setCanFullScreen] = useState(false);
  /* The last caption track that was on, so the toggle turns back on the
     language the reader chose rather than the first in the list. */
  const lastTrack = useRef<string | null>(null);
  if (tracks.activeTextTrack) lastTrack.current = tracks.activeTextTrack;

  const captionsOn = tracks.activeTextTrack !== null;
  const hasCaptions = tracks.textTracks.length > 0;

  /* Whether this document may go full screen at all, which not every frame or
     phone allows. Read after mount, so the server and the first client render
     agree. */
  useEffect(() => {
    setCanFullScreen(allowFullScreen && typeof document !== 'undefined' && document.fullscreenEnabled === true);
  }, [allowFullScreen]);

  /* Full screen is read from the document, which also changes when the reader
     presses Escape and the toggle is never touched, so leaving is announced
     however it happened. */
  const shown = useRef(false);
  useEffect(() => {
    const read = (): void => {
      const now = document.fullscreenElement !== null && document.fullscreenElement === root.current;
      if (now === shown.current) return;
      shown.current = now;
      setIsFullScreen(now);
      setSaid(`${words.fullScreen} ${now ? words.on : words.off}`);
      onFullScreenChange?.(now);
    };
    document.addEventListener('fullscreenchange', read);
    return () => { document.removeEventListener('fullscreenchange', read); };
  }, [onFullScreenChange, words.fullScreen, words.on, words.off]);

  /* Full screen is the player, picture and transport together, rather than the
     `<video>`, whose full screen is the browser's player with the browser's
     controls. */
  /* Overlays opened from the transport (the settings menu and its submenus)
     portal into the player while it is full screen. In full screen the browser
     draws only the full-screen element's subtree, so a menu portalled to the
     body would open invisibly. */
  /* Otherwise they go where `CrystalProvider` sends every overlay, a themed
     sibling of the scope; the player root is inside that scope, so a menu
     portalled into it in full screen keeps the palette and the mode. */
  const parentPortal = usePortalContext();
  const portalContainer = useCallback((): HTMLElement | null => {
    if (typeof document !== 'undefined' && document.fullscreenElement === root.current) return root.current;
    return parentPortal.getContainer?.() ?? null;
  }, [parentPortal]);

  const toggleFullScreen = useCallback(() => {
    if (document.fullscreenElement) void document.exitFullscreen().catch(() => undefined);
    else void root.current?.requestFullscreen().catch(() => undefined);
  }, []);

  const toggleCaptions = useCallback(() => {
    const next = captionsOn ? null : (lastTrack.current ?? tracks.textTracks[0]?.id ?? null);
    tracks.selectTextTrack(next);
    /* Announced. A reader who cannot see subtitles appear has no other way to
       know whether the control did anything. */
    setSaid(next ? `${captionsLabel} on` : `${captionsLabel} off`);
  }, [captionsLabel, captionsOn, tracks]);

  const changeRate = useCallback((by: 1 | -1) => {
    const list = [...playbackRates].sort((a, b) => a - b);
    if (list.length < 2) return;
    const at = list.findIndex((rate) => rate >= media.playbackRate);
    const next = list[Math.min(list.length - 1, Math.max(0, (at === -1 ? list.length - 1 : at) + by))]!;
    media.setPlaybackRate(next);
    setSaid(`${words.speed} ${next === 1 ? words.normal : words.spokenRate(next)}`);
  }, [media, playbackRates, words]);

  const onKeyDown = useCallback((event: KeyboardEvent<HTMLDivElement>) => {
    /* The shortcut never takes a key from the control the reader is on. Space
       on the play toggle is the button's Space, and the arrow keys inside the
       scrubber are the slider's. The player answers only a press that started
       on the player itself or on the video. */
    const from = event.target as HTMLElement;
    if (from.closest('button, input, [role="slider"], [role="menu"], a, select, textarea')) return;
    if (event.altKey || event.ctrlKey || event.metaKey) return;

    switch (event.key) {
      case ' ':
      case 'k':
        event.preventDefault();
        media.toggle();
        break;
      case 'ArrowLeft':
        event.preventDefault();
        media.seek(media.currentTime - skipBy);
        break;
      case 'ArrowRight':
        event.preventDefault();
        media.seek(media.currentTime + skipBy);
        break;
      case 'm':
        event.preventDefault();
        media.setMuted(!media.isMuted);
        break;
      case 'c':
        if (!hasCaptions) break;
        event.preventDefault();
        toggleCaptions();
        break;
      case 'f':
        if (!canFullScreen) break;
        event.preventDefault();
        toggleFullScreen();
        break;
      case '>':
        event.preventDefault();
        changeRate(1);
        break;
      case '<':
        event.preventDefault();
        changeRate(-1);
        break;
      default:
        break;
    }
  }, [media, skipBy, hasCaptions, toggleCaptions, canFullScreen, toggleFullScreen, changeRate]);

  /* Quality: the product's renditions, or the file's own video tracks when it
     really carries more than one. */
  const renditions = qualities ?? (tracks.videoTracks.length > 1 ? tracks.videoTracks : []);
  const activeRendition = qualities ? quality : tracks.activeVideoTrack;
  const changeRendition = qualities ? onQualityChange : tracks.selectVideoTrack;

  const stage = {
    ...style,
    '--cr-media-aspect': aspectRatio,
    '--cr-media-fit': fit,
  } as CSSProperties;

  return (
    /* No `tabIndex` on the region and no document listener. The shortcuts work
       only when focus is already inside the player, which is what "do not trap
       focus" requires. A player that took the space bar from the page would be
       a trap. */
    // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/no-static-element-interactions -- the handler is a shortcut for controls that are focusable in their own right, not a control itself
    <div
      ref={root}
      className={cx(styles['player'], className)}
      onKeyDown={onKeyDown}
      data-full-screen={isFullScreen ? '' : undefined}
      data-paused={media.isPlaying ? undefined : ''}
    >
      <PortalProvider getContainer={portalContainer}>
      <div className={styles['surface']} style={stage}>
        {/* eslint-disable-next-line jsx-a11y/media-has-caption -- the caption `<track>` is the product's to supply through `children`; the control for it is below */}
        <video
          {...props}
          ref={mergeRefs(ref, own, mediaRef, arrival as never)}
          aria-label={label}
          className={styles['video']}
          onClick={media.toggle}
        >
          {children}
        </video>
        {nativeCaptions ? null : <CaptionCues cues={tracks.activeCues} />}
        <div className={styles['bar']}>
          <MediaControls
            mediaLabel={label}
            isPlaying={media.isPlaying}
            onPlayPause={media.toggle}
            currentTime={media.currentTime}
            duration={media.duration}
            onSeek={media.seek}
            isBuffering={media.isBuffering}
            isMuted={media.isMuted}
            onMuteToggle={() => media.setMuted(!media.isMuted)}
            volume={media.volume}
            onVolumeChange={media.setVolume}
            skipBy={skipBy}
            onSkip={(by) => media.seek(media.currentTime + by)}
          >
            {hasCaptions ? (
              <IconButton
                label={captionsLabel}
                icon={CaptionsIcon}
                isSelected={captionsOn}
                onPress={toggleCaptions}
              />
            ) : null}
            <MediaSettings
              label={words.settings}
              playbackRates={playbackRates}
              playbackRate={media.playbackRate}
              onPlaybackRateChange={media.setPlaybackRate}
              textTracks={tracks.textTracks}
              activeTextTrack={tracks.activeTextTrack}
              onTextTrackChange={tracks.selectTextTrack}
              audioTracks={tracks.audioTracks}
              activeAudioTrack={tracks.activeAudioTrack}
              onAudioTrackChange={tracks.selectAudioTrack}
              qualities={renditions}
              quality={activeRendition}
              {...(changeRendition ? { onQualityChange: changeRendition } : {})}
              onAnnounce={setSaid}
              words={{ ...words, off: given?.off ?? 'Off' }}
            />
            {allowPictureInPicture && media.canPictureInPicture ? (
              <IconButton
                label={words.pictureInPicture}
                icon={PictureInPictureIcon}
                isSelected={media.isPictureInPicture}
                onPress={media.togglePictureInPicture}
              />
            ) : null}
            {canFullScreen ? (
              <IconButton
                label={words.fullScreen}
                icon={FullScreenIcon}
                isSelected={isFullScreen}
                onPress={toggleFullScreen}
              />
            ) : null}
            {controls}
          </MediaControls>
        </div>
      </div>
      </PortalProvider>
      <span role="status" className={styles['announcement']}>{said}</span>
    </div>
  );
});

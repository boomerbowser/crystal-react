'use client';

/* PlayerShell: a media surface with its transport, queue and metadata.
 *
 * "**Real media elements; captions and their state announced; transport
 * reachable by keyboard.**" States: `idle`, `playing`, `paused`, `buffering`,
 * `full-screen`.
 *
 * Sources, the queue and DRM are the product's. The pieces that keep the three
 * promises already exist, and the shell puts them together:
 *
 *   - Real media elements. `VideoPlayer` and `AudioPlayer` are a native
 *     `<video>` and `<audio>` under Crystal's transport; the element is handed
 *     back through `mediaRef` for sources, DRM and analytics.
 *   - Captions and their state announced. `VideoPlayer`'s caption toggle is
 *     the track's real mode, `aria-pressed`, and says "Captions on" or "off".
 *   - Transport reachable by keyboard. Every control is a real button or
 *     slider in the tab order, and the player's shortcuts answer only while
 *     focus is inside it.
 *
 * What the shell adds:
 *
 *   - Full screen that keeps Crystal's transport. The shell asks for full
 *     screen on its own stage (the picture and the transport together) rather
 *     than on the `<video>`, whose full screen is the browser's player with the
 *     browser's controls. The toggle is `aria-pressed`, and entering and leaving
 *     are announced, since Escape can leave without the toggle being touched.
 *   - The queue is `PlaylistBlock`: reorderable by keyboard, with the playing
 *     track `aria-current`.
 *   - Metadata on Haze, named by its heading.
 *
 * "Resin transport over the media; Haze metadata". The transport's showing and
 * hiding is `VideoPlayer`'s, which Crystal's rule keeps to movement a person
 * started: shown while a pointer is over the picture or focus is inside it.
 */
import { useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode, type RefObject } from 'react';
import { VideoPlayer } from '../VideoPlayer/VideoPlayer.js';
import { AudioPlayer } from '../AudioPlayer/AudioPlayer.js';
import { IconButton } from '../IconButton/IconButton.js';
import { PlaylistBlock, type PlaylistBlockProps } from '../PlaylistBlock/PlaylistBlock.js';
import { VisuallyHidden } from '../VisuallyHidden/VisuallyHidden.js';
import { useMediaElement } from '../../media/useMediaElement.js';
import { cx } from '../../styles/cx.js';
import styles from './PlayerShell.module.scss';

export type PlayerState = 'idle' | 'playing' | 'paused' | 'buffering' | 'full-screen';

export interface PlayerMetadata {
  title: ReactNode;
  subtitle?: ReactNode;
  description?: ReactNode;
}

export interface PlayerShellProps {
  kind?: 'video' | 'audio';
  /** What is playing. The media's accessible name. */
  label: string;
  /** `<source>` and `<track>` elements. */
  children?: ReactNode;
  poster?: string;
  /** The element itself, for sources, DRM and analytics. */
  mediaRef?: RefObject<HTMLMediaElement | null>;
  metadata?: PlayerMetadata;
  /** The queue. Omit for a single item. */
  queue?: PlaylistBlockProps;
  headingLevel?: 2 | 3;
  fullScreenLabel?: string;
  className?: string;
}

const FullScreenIcon = (
  <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
    <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />
  </svg>
);

export function PlayerShell({
  kind = 'video', label, children, poster, mediaRef, metadata, queue, headingLevel = 2,
  fullScreenLabel = 'Full screen', className,
}: PlayerShellProps): React.JSX.Element {
  const Heading = `h${headingLevel}` as 'h2';
  const metadataId = useId();
  const stage = useRef<HTMLDivElement>(null);
  const own = useRef<HTMLVideoElement & HTMLAudioElement>(null);
  const media = useMediaElement(own);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [canFullScreen, setCanFullScreen] = useState(false);
  const [said, setSaid] = useState('');

  /* The product's handle on the element is the shell's, passed on. */
  useLayoutEffect(() => {
    if (mediaRef) (mediaRef as { current: HTMLMediaElement | null }).current = own.current;
  });

  /* Whether this document may go full screen at all, which not every frame or
     phone allows. Read after mount, so the server and the first client render
     agree. */
  useEffect(() => {
    setCanFullScreen(kind === 'video' && document.fullscreenEnabled === true);
  }, [kind]);

  /* The stage's full-screen state from the document, which also changes when
     the reader presses Escape and the toggle is never touched. */
  const shown = useRef(false);
  useEffect(() => {
    const read = (): void => {
      const now = document.fullscreenElement !== null && document.fullscreenElement === stage.current;
      if (now === shown.current) return;
      shown.current = now;
      setIsFullScreen(now);
      setSaid(now ? `${fullScreenLabel} on` : `${fullScreenLabel} off`);
    };
    document.addEventListener('fullscreenchange', read);
    return () => { document.removeEventListener('fullscreenchange', read); };
  }, [fullScreenLabel]);

  const toggleFullScreen = (): void => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void stage.current?.requestFullscreen();
  };

  const state: PlayerState = isFullScreen ? 'full-screen'
    : media.isBuffering ? 'buffering'
      : media.isPlaying ? 'playing'
        : media.currentTime > 0 ? 'paused' : 'idle';

  return (
    <div data-cr-state={state} className={cx(styles['shell'], className)}>
      <div ref={stage} className={cx(styles['stage'])}>
        {kind === 'video' ? (
          <VideoPlayer
            label={label}
            mediaRef={own}
            {...(poster ? { poster } : {})}
            className={cx(styles['player'])}
            controls={canFullScreen ? (
              <IconButton
                label={fullScreenLabel}
                icon={FullScreenIcon}
                isSelected={isFullScreen}
                onPress={toggleFullScreen}
              />
            ) : null}
          >
            {children}
          </VideoPlayer>
        ) : (
          <AudioPlayer label={label} mediaRef={own} skipBy={10} className={cx(styles['player'])}>
            {children}
          </AudioPlayer>
        )}
      </div>

      {metadata ? (
        <section aria-labelledby={metadataId} className={cx(styles['metadata'], 'cr-haze')}>
          <Heading id={metadataId} className={cx(styles['title'])}>{metadata.title}</Heading>
          {metadata.subtitle ? <p className={cx(styles['subtitle'])}>{metadata.subtitle}</p> : null}
          {metadata.description ? <p className={cx(styles['description'])}>{metadata.description}</p> : null}
        </section>
      ) : null}

      {queue ? <PlaylistBlock {...queue} className={cx(styles['queue'], queue.className)} /> : null}

      <VisuallyHidden role="status">{said}</VisuallyHidden>
    </div>
  );
}

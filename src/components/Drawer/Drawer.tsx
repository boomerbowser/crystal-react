'use client';

/* Drawer — a panel anchored to an edge.
 *
 * ## Modality must be real, not implied
 *
 * The catalogue states it that way, and it is the defect this component exists
 * to make impossible. The usual drawer draws a dark wash over the page and stops
 * there: the wash *looks* like the rest of the page is unavailable, and a
 * keyboard user tabs straight past the drawer into it, a screen-reader user
 * reads through it, and neither is told the page is supposed to be blocked. The
 * appearance made a promise the behaviour did not keep.
 *
 * So `isModal` chooses between two genuinely different constructions rather than
 * between two appearances:
 *
 *   - **Modal** is React Aria's `Modal` — focus contained, the page behind it
 *     inert, Escape closing, the body's scroll locked, `aria-modal` set, and
 *     focus returned to whatever opened it. It has a Mirage scrim because the
 *     page really is unavailable.
 *   - **Non-modal** is a `complementary` landmark sitting in the layout. It has
 *     **no scrim at all**, takes no focus, locks no scroll, and the page beside
 *     it keeps working. An inspector panel, a filter sidebar.
 *
 * There is deliberately no way to ask for one's look with the other's behaviour.
 *
 * ## Which way it comes in
 *
 * Crystal authors `drawer-in` once, from the right, with a physical
 * `translateX(105%)`. That is the inline-end edge of a left-to-right page and
 * wrong everywhere else, and CSS cannot mirror a transform the way it mirrors
 * `padding-inline-start`. `useMotion`'s `reorient` points the authored movement
 * at the placement and the reading direction, carrying the fitted spring through
 * untouched — rather than this file inventing three more recipes, which would be
 * inventing three more specifications.
 */
import { useEffect, useId, useRef, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  Modal,
  ModalOverlay,
  Dialog as AriaDialog,
  Heading,
  type ModalOverlayProps,
} from 'react-aria-components';
import { useLocale } from 'react-aria';
import { useMotion } from '../../motion/useMotion.js';
import { usePresetMotion } from '../../motion/usePresetMotion.js';
import { ScrollArea } from '../ScrollArea/ScrollArea.js';
import { CloseButton } from '../IconButton/IconButton.js';
import { SurfaceProvider } from '../../overlays/surface.js';
import { cx } from '../../styles/cx.js';
import { PresenceExit } from '../../motion/PresenceExit.js';
import styles from './Drawer.module.scss';

/** Which edge the panel is anchored to. `start` and `end` follow the reading direction. */
export type DrawerPlacement = 'start' | 'end' | 'top' | 'bottom';

export interface DrawerProps extends Omit<ModalOverlayProps,
  'className' | 'children' | 'style' | 'isDismissable' | 'onAnimationStart' | 'onAnimationEnd' | 'onAnimationIteration'> {
  /** The drawer's accessible name, rendered as its heading. */
  title: ReactNode;
  children?: ReactNode;
  /** Which edge it is anchored to. Defaults to the inline end. */
  placement?: DrawerPlacement;
  /**
   * Whether the page behind is genuinely unavailable.
   *
   * True builds a modal dialog: focus contained, page inert, scroll locked, a
   * Mirage scrim. False builds a `complementary` landmark with no scrim, no
   * focus trap and no scroll lock. There is no third option, because the third
   * option is a drawer that lies about which one it is.
   */
  isModal?: boolean;
  /** Whether a click on the scrim closes it. Modal only — there is no scrim otherwise. */
  isDismissable?: boolean;
  /** Hide the close control. The drawer must then be closable some other way. */
  hideCloseButton?: boolean;
  /** What the close control says it closes, for its accessible name. */
  closes?: string;
  className?: string;
}

/* React's DOM `onAnimationStart` and Motion's lifecycle callback of the same name
   collide under `exactOptionalPropertyTypes`; the dialog hit this first and the
   narrow fix is the same one — an overlay has no use for CSS animation events. */
type OverlayProps = Omit<ModalOverlayProps, 'onAnimationStart' | 'onAnimationEnd' | 'onAnimationIteration'>;
const MotionOverlay = motion.create(
  ModalOverlay as React.ForwardRefExoticComponent<OverlayProps & React.RefAttributes<HTMLDivElement>>,
);

/** How the authored recipe is pointed for a given edge and reading direction. */
export function reorientationFor(
  placement: DrawerPlacement,
  isRtl: boolean,
): { mirrorInline: boolean; toBlockAxis: boolean } {
  if (placement === 'top') return { mirrorInline: true, toBlockAxis: true };
  if (placement === 'bottom') return { mirrorInline: false, toBlockAxis: true };
  /* `drawer-in` is authored arriving from the right. The inline-end edge is the
     right in a left-to-right page and the left in a right-to-left one, so the
     two conditions cancel. */
  const fromTheRight = (placement === 'end') !== isRtl;
  return { mirrorInline: !fromTheRight, toBlockAxis: false };
}

export function Drawer({
  title, children, placement = 'end', isModal = true, isDismissable = true,
  hideCloseButton = false, closes, className, ...props
}: DrawerProps): React.JSX.Element {
  const titleId = useId();
  const { direction } = useLocale();
  const reorient = reorientationFor(placement, direction === 'rtl');

  return isModal
    ? (
      <ModalDrawer
        {...props}
        titleId={titleId}
        title={title}
        placement={placement}
        reorient={reorient}
        isDismissable={isDismissable}
        hideCloseButton={hideCloseButton}
        {...(closes === undefined ? {} : { closes })}
        {...(className === undefined ? {} : { className })}
      >
        {children}
      </ModalDrawer>
    )
    : (
      <InlineDrawer
        titleId={titleId}
        title={title}
        placement={placement}
        reorient={reorient}
        isOpen={props.isOpen ?? false}
        hideCloseButton={hideCloseButton}
        {...(props.onOpenChange === undefined ? {} : { onOpenChange: props.onOpenChange })}
        {...(closes === undefined ? {} : { closes })}
        {...(className === undefined ? {} : { className })}
      >
        {children}
      </InlineDrawer>
    );
}

interface PanelProps {
  titleId: string;
  title: ReactNode;
  placement: DrawerPlacement;
  reorient: { mirrorInline: boolean; toBlockAxis: boolean };
  hideCloseButton: boolean;
  closes?: string;
  className?: string;
  children?: ReactNode;
}

function ModalDrawer({
  titleId, title, placement, reorient, hideCloseButton, closes, className, children, ...props
}: PanelProps & Omit<OverlayProps, 'className' | 'children' | 'style'>): React.JSX.Element {
  /* The scrim fades and the panel sweeps. The panel's entrance is an authored
     recipe with its own fitted spring, not a material's generic arrival, so it
     is `useMotion` rather than `usePreset`. */
  const [scope, play] = useMotion({ reorient });
  /* The scrim is Mirage, and Mirage has a wash: the catalogue's `mirage` and
     `mirage-out`, computed by Crystal's preset module rather than a hand-written
     fade. It was an opacity ramp here until the drawer's own motion was audited. */
  const wash = usePresetMotion('mirage', 'mirage-out', { active: props.isOpen === true });

  return (
    <AnimatePresence>
      {props.isOpen ? (
        <MotionOverlay
          {...props}
          isOpen
          className={cx(styles['scrim'])}
          {...wash}
        >
          <Modal className={cx(styles['modalHolder'], styles[placement])}>
            <AriaDialog
              ref={scope as never}
              aria-labelledby={titleId}
              className={cx(styles['panel'], styles[placement], className)}
            >
              {/* The render prop, for `close`. Passing children directly is the
                  obvious spelling and it leaves the close control inert: it has
                  no way to reach the overlay's state, so it renders, focuses,
                  presses — and does nothing. Found by a test that clicked it. */}
              {({ close }) => (
                <>
                  <Sweep play={play} />
                  <PresenceExit play={play} recipe="drawer-out" />
                  <PanelBody
                    titleId={titleId}
                    title={title}
                    inDialog
                    hideCloseButton={hideCloseButton}
                    onClose={close}
                    {...(closes === undefined ? {} : { closes })}
                  >
                    {children}
                  </PanelBody>
                </>
              )}
            </AriaDialog>
          </Modal>
        </MotionOverlay>
      ) : null}
    </AnimatePresence>
  );
}

/** Plays the entrance once, on the mount that is the arrival. */
function Sweep({ play }: { play: (name: string) => Promise<void> | void }): null {
  const played = useRef(false);
  useEffect(() => {
    if (played.current) return;
    played.current = true;
    play('drawer-in');
  }, [play]);
  return null;
}

function InlineDrawer({
  titleId, title, placement, reorient, hideCloseButton, closes, className, children,
  isOpen, onOpenChange,
}: PanelProps & { isOpen: boolean; onOpenChange?: (isOpen: boolean) => void }): React.JSX.Element | null {
  /* Rendered only while open, so mounting is the arrival — the same discipline
     the tree uses and for the same reason: nothing in Crystal moves at rest, and
     a panel that is already there must not sweep itself in. */
  /* Kept for its exit: `AnimatePresence` holds the panel while it plays
     `drawer-out`, which `PresenceExit` inside it starts. */
  return (
    <AnimatePresence>
      {isOpen ? (
        <InlinePanel
          key="panel"
          titleId={titleId}
          title={title}
          placement={placement}
          reorient={reorient}
          hideCloseButton={hideCloseButton}
          {...(closes === undefined ? {} : { closes })}
          {...(className === undefined ? {} : { className })}
          {...(onOpenChange ? { onClose: () => { onOpenChange(false); } } : {})}
        >
          {children}
        </InlinePanel>
      ) : null}
    </AnimatePresence>
  );
}

function InlinePanel({
  titleId, title, placement, reorient, hideCloseButton, closes, className, children, onClose,
}: PanelProps & { onClose?: () => void }): React.JSX.Element {
  const [scope, play] = useMotion({ reorient });

  return (
    /* A landmark, not a dialog. It holds no focus, blocks nothing, and announces
       itself as what it is: a supporting region beside the main content. */
    <aside
      ref={scope as never}
      aria-labelledby={titleId}
      className={cx(styles['panel'], styles['inline'], styles[placement], className)}
    >
      <Sweep play={play} />
      <PresenceExit play={play} recipe="drawer-out" />
      <PanelBody
        titleId={titleId}
        title={title}
        hideCloseButton={hideCloseButton}
        {...(closes === undefined ? {} : { closes })}
        {...(onClose ? { onClose } : {})}
      >
        {children}
      </PanelBody>
    </aside>
  );
}

function PanelBody({
  titleId, title, inDialog = false, hideCloseButton, closes, onClose, children,
}: {
  titleId: string;
  title: ReactNode;
  inDialog?: boolean;
  hideCloseButton: boolean;
  closes?: string;
  onClose?: () => void;
  children?: ReactNode;
}): React.JSX.Element {
  return (
    <>
      <div className={cx(styles['header'])}>
        {/* `Heading slot="title"` inside a dialog and a plain heading outside
            one. The slot is how React Aria finds the dialog's name; outside a
            dialog there is no context to read it, and the landmark is named by
            `aria-labelledby` pointing at the same id either way. */}
        {inDialog
          ? <Heading slot="title" id={titleId} className={cx(styles['title'])}>{title}</Heading>
          : <h2 id={titleId} className={cx(styles['title'])}>{title}</h2>}
        {hideCloseButton ? null : (
          <CloseButton
            closes={closes ?? (typeof title === 'string' ? title : 'panel')}
            {...(onClose ? { onPress: onClose } : {})}
          />
        )}
      </div>
      {/* The body scrolls, never the panel: a surface that carries a material
          cannot also take the edge fade, because the mask dissolves its own fill
          and border along with the content. Frost, because a drawer is a reading
          surface. */}
      <ScrollArea variant="frost" className={cx(styles['body'])}>
        {/* The panel is Frost, so an overlay opened inside it is floating above
            Frost and is Resin — which is the correct stack, and the reason this
            declares it rather than leaving the DOM to imply it. */}
        <SurfaceProvider surface="frost">{children}</SurfaceProvider>
      </ScrollArea>
    </>
  );
}

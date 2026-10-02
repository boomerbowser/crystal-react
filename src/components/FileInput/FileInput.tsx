'use client';

/* FileInput, DropZone, Upload and UploadZone.
 *
 * Four catalogue entries over two ideas: choosing files, and watching them go.
 *
 * A drop zone is never the only way to choose a file. Dragging requires a
 * pointer, a steady hand and sight of both ends of the gesture, so it is an
 * enhancement over a button and never a replacement for one. Every surface here
 * contains a real `FileTrigger`, React Aria's, which wraps a hidden native input
 * so the platform's own file picker opens, with its recent files, its search and
 * its accessibility.
 *
 * Progress is a number as well as a bar. A bar alone says "something is
 * happening". The number says how much, which is what somebody waiting wants,
 * and a screen reader can read only the number. Crystal renders progress it is
 * told about and computes none, because an upload's state belongs to whatever is
 * doing the uploading.
 *
 * A drop surface has a dashed edge, the one place Crystal uses one. It marks the
 * boundary as a target and not a surface.
 */
import { useId, type CSSProperties, type HTMLAttributes, type ReactNode } from 'react';
import {
  FileTrigger, DropZone as AriaDropZone, Text, isFileDropItem, type DropZoneProps as AriaDropZoneProps,
} from 'react-aria-components';
import { cx } from '../../styles/cx.js';
import { useMotion } from '../../motion/useMotion.js';
import { useChangeMotion } from '../../motion/useChangeMotion.js';
import { ListPresence, PresenceItem } from '../../motion/ListPresence.js';
import { Button } from '../Button/Button.js';
import { VisuallyHidden } from '../VisuallyHidden/VisuallyHidden.js';
import styles from './FileInput.module.scss';

const UploadIcon = (
  <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
    <path d="M12 16V4M7 9l5-5 5 5M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2" />
  </svg>
);

const CrossIcon = (
  <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
);

/** What the product knows about one file. Crystal renders it and computes none of it. */
export interface UploadedFile {
  id: string;
  name: string;
  /** Bytes. Shown in a readable unit. */
  size?: number;
  /** 0 to 1 while uploading; omit once it is done. */
  progress?: number;
  /** What went wrong. Announced, not only coloured. */
  error?: string;
}

function readableSize(bytes: number): string {
  const units = ['B', 'kB', 'MB', 'GB'];
  let value = bytes;
  let unit = 0;
  while (value >= 1000 && unit < units.length - 1) { value /= 1000; unit += 1; }
  return `${value < 10 && unit > 0 ? value.toFixed(1) : Math.round(value)} ${units[unit]}`;
}

export interface FileInputProps {
  label: ReactNode;
  description?: ReactNode;
  errorMessage?: ReactNode;
  /** Accepted types, as the platform picker understands them. */
  acceptedFileTypes?: readonly string[];
  allowsMultiple?: boolean;
  onSelect?: (files: FileList | null) => void;
  /** What the button says. */
  chooseLabel?: string;
  className?: string;
}

/**
 * A button that opens the platform's file picker. React Aria's `FileTrigger`
 * wraps a real input, so the picker is the system's, with its recent files, its
 * search and its own accessibility, and not a web imitation of one.
 */
export function FileInput({
  label, description, errorMessage, acceptedFileTypes, allowsMultiple = false,
  onSelect, chooseLabel = 'Choose a file', className,
}: FileInputProps): React.JSX.Element {
  return (
    <div className={cx(styles['field'], className)}>
      <span className={cx(styles['label'])}>{label}</span>
      <FileTrigger
        {...(acceptedFileTypes ? { acceptedFileTypes: [...acceptedFileTypes] } : {})}
        allowsMultiple={allowsMultiple}
        {...(onSelect ? { onSelect } : {})}
      >
        <Button>{chooseLabel}</Button>
      </FileTrigger>
      {description ? <span className={cx(styles['description'])}>{description}</span> : null}
      {errorMessage ? <span role="alert" className={cx(styles['error'])}>{errorMessage}</span> : null}
    </div>
  );
}

export interface DropZoneProps extends FileInputProps {
  /** Called when files are dropped. Dropping and choosing reach the same place. */
  onDrop?: (files: FileList | null) => void;
  children?: ReactNode;
}

/**
 * A surface files can be dropped onto, always with a button as well. Dragging
 * needs a pointer, a steady hand and sight of both ends of the gesture, so it is
 * an enhancement over choosing and never a replacement.
 */
export function DropZone({
  label, description, errorMessage, acceptedFileTypes, allowsMultiple = false,
  onSelect, onDrop, chooseLabel = 'Choose a file', children, className,
}: DropZoneProps): React.JSX.Element {
  /* The zone lifts with `drag-pickup` as files are carried over it and settles
     with `drag-settle` once they are dropped, a valid move completed. A drag
     that passes over and leaves gets no settle. */
  const [scope, play] = useMotion();

  /* What was dropped, delivered where choosing delivers it. Without this
     handler React Aria's zone accepts the gesture and discards the files. Types
     the picker would not offer are left out, and so is every file after the
     first when only one is allowed. */
  const receive = async (event: DropEvent): Promise<void> => {
    const deliver = onDrop ?? onSelect;
    const dropped = await Promise.all(event.items
      .filter(isFileDropItem)
      .filter((item) => !acceptedFileTypes || acceptedFileTypes.some((type) => accepts(type, item.type)))
      .map((item) => item.getFile()));
    const chosen = allowsMultiple ? dropped : dropped.slice(0, 1);
    if (chosen.length === 0) return;
    void play('drag-settle');
    if (!deliver || typeof DataTransfer === 'undefined') return;
    const list = new DataTransfer();
    for (const file of chosen) list.items.add(file);
    deliver(list.files);
  };

  return (
    <div className={cx(styles['field'], className)}>
      <span className={cx(styles['label'])}>{label}</span>
      <AriaDropZone
        ref={scope as never}
        className={cx(styles['zone'])}
        onDropEnter={() => { void play('drag-pickup'); }}
        onDrop={(event) => { void receive(event); }}
      >
        <span aria-hidden="true">{UploadIcon}</span>
        <Text slot="label">{children ?? 'Drop files here'}</Text>
        {/* The route that does not require a pointer. */}
        <FileTrigger
          {...(acceptedFileTypes ? { acceptedFileTypes: [...acceptedFileTypes] } : {})}
          allowsMultiple={allowsMultiple}
          {...(onSelect ? { onSelect } : {})}
        >
          <Button variant="quiet">{chooseLabel}</Button>
        </FileTrigger>
      </AriaDropZone>
      {description ? <span className={cx(styles['description'])}>{description}</span> : null}
      {errorMessage ? <span role="alert" className={cx(styles['error'])}>{errorMessage}</span> : null}
    </div>
  );
}

export interface UploadProps extends FileInputProps {
  /** The files and what is known about each. */
  files: readonly UploadedFile[];
  onRemove?: (id: string) => void;
}

/**
 * The list of what was chosen and how far each has got, without a chooser of its
 * own. `Upload` puts a `FileInput` above it, and `UploadZone` puts a `DropZone`
 * there instead. Neither renders the other and hides half of it.
 */
function UploadedFiles({ files, onRemove }: {
  files: readonly UploadedFile[];
  onRemove?: ((id: string) => void) | undefined;
}): React.JSX.Element {
  const statusId = useId();

  return (
    <>
      {files.length > 0 ? (
        <ul className={cx(styles['files'])}>
          {/* A file joins the list with `list-in` as it is chosen and leaves with
              `list-out` when it is removed. The files already there when the
              list first renders do neither. */}
          <ListPresence>
            {files.map((file) => (
              <PresenceItem key={file.id} className={cx(styles['file'])}>
                <span className={cx(styles['fileName'])}>{file.name}</span>
                {file.size !== undefined ? (
                  <span className={cx(styles['fileSize'])}>{readableSize(file.size)}</span>
                ) : null}
                {file.progress !== undefined ? (
                  <>
                    {/* A real progressbar. The bar draws the number, and a screen
                        reader reads the number. */}
                    <MovingProgress
                      value={file.progress}
                      role="progressbar"
                      aria-label={`Uploading ${file.name}`}
                      aria-valuenow={Math.round(file.progress * 100)}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      className={cx(styles['progressTrack'])}
                    >
                      <div
                        className={cx(styles['progressFill'])}
                        style={{ '--cr-progress': `${file.progress * 100}%` } as CSSProperties}
                      />
                    </MovingProgress>
                    <span className={cx(styles['fileSize'])}>{Math.round(file.progress * 100)}%</span>
                  </>
                ) : null}
                {file.error ? <span role="alert" className={cx(styles['error'])}>{file.error}</span> : null}
                {onRemove ? (
                  <button
                    type="button"
                    aria-label={`Remove ${file.name}`}
                    onClick={() => onRemove(file.id)}
                    className={cx(styles['remove'], 'cr-bare')}
                  >
                    {CrossIcon}
                  </button>
                ) : null}
              </PresenceItem>
            ))}
          </ListPresence>
        </ul>
      ) : null}
      {/* The arrival and completion of an upload are announced as well as drawn. */}
      <VisuallyHidden as="div" id={statusId} role="status" aria-live="polite">
        {files.filter((file) => file.progress === undefined && !file.error).length} of {files.length} uploaded
      </VisuallyHidden>
    </>
  );
}

/** A chooser with the list of what was chosen, and how far each has got. */
export function Upload({ files, onRemove, ...props }: UploadProps): React.JSX.Element {
  return (
    <div className={cx(styles['field'])}>
      <FileInput {...props} />
      <UploadedFiles files={files} {...(onRemove ? { onRemove } : {})} />
    </div>
  );
}

export type UploadZoneProps = UploadProps & { children?: ReactNode };

/**
 * The drop surface with the list beneath it.
 *
 * It does not compose `Upload`. Doing so with `label=""` leaves an empty `span`
 * in the accessibility tree, a second "Choose a file" button, a second copy of
 * the description, and a second `role="alert"` carrying the same error, so a
 * failure is announced twice. Both halves draw on the same list, and only the
 * drop surface carries the chooser.
 */
export function UploadZone({ files, onRemove, children, ...props }: UploadZoneProps): React.JSX.Element {
  return (
    <div className={cx(styles['field'])}>
      <DropZone {...props}>{children}</DropZone>
      <UploadedFiles files={files} {...(onRemove ? { onRemove } : {})} />
    </div>
  );
}

/* A file's upload, marking each move of its progress with `progress-change`.
   The motion plays after the value is set, never in place of it, and not on the
   render that first shows the row. */
function MovingProgress({ value, ...props }: HTMLAttributes<HTMLDivElement> & { value: number }): React.JSX.Element {
  const scope = useChangeMotion(value, () => 'progress-change');
  return <div ref={scope as never} {...props} />;
}

type DropEvent = Parameters<NonNullable<AriaDropZoneProps['onDrop']>>[0];

/* The picker's rule for one accepted type against a dropped file's type:
   `image/*` accepts any image, and an exact type accepts itself. The picker
   matches extensions, since a drop carries a media type and not a name. */
function accepts(accepted: string, type: string): boolean {
  if (accepted.endsWith('/*')) return type.startsWith(accepted.slice(0, -1));
  return accepted === type || accepted.startsWith('.');
}

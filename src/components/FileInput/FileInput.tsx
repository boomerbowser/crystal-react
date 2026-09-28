'use client';

/* FileInput, DropZone, Upload and UploadZone.
 *
 * Four catalogue entries over two ideas: choosing files, and watching them go.
 *
 * **A drop zone is never the only way to choose a file.** Dragging requires a
 * pointer, a steady hand and sight of both ends of the gesture; it is an
 * enhancement over a button, never a replacement for one. So every surface here
 * contains a real `FileTrigger` — React Aria's, which wraps a hidden native input
 * so the platform's own file picker opens, with its recent files, its search and
 * its accessibility.
 *
 * **Progress is a number as well as a bar.** A bar alone says "something is
 * happening"; the number says how much, which is what somebody waiting actually
 * wants — and it is the only half of it that a screen reader can read. Crystal
 * renders progress it is told about and computes none: an upload's state belongs
 * to whatever is doing the uploading.
 *
 * The dashed edge on a drop surface is the one place Crystal uses one. It says
 * "this boundary is a target, not a surface", which is exactly the distinction a
 * drop zone needs to make.
 */
import { useId, type CSSProperties, type ReactNode } from 'react';
import { FileTrigger, DropZone as AriaDropZone, Text } from 'react-aria-components';
import { cx } from '../../styles/cx.js';
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
 * wraps a real input, so the picker is the system's — with its recent files, its
 * search and its own accessibility — rather than a web imitation of one.
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
 * A surface files can be dropped onto — **and** a button, always. Dragging needs
 * a pointer, a steady hand and sight of both ends of the gesture; it is an
 * enhancement over choosing, never a replacement.
 */
export function DropZone({
  label, description, errorMessage, acceptedFileTypes, allowsMultiple = false,
  onSelect, chooseLabel = 'Choose a file', children, className,
}: DropZoneProps): React.JSX.Element {
  return (
    <div className={cx(styles['field'], className)}>
      <span className={cx(styles['label'])}>{label}</span>
      <AriaDropZone className={cx(styles['zone'])}>
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
 * own. Shared by `Upload`, which puts a `FileInput` above it, and `UploadZone`,
 * which puts a `DropZone` there instead — neither of them by rendering the other
 * and hiding half of it.
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
              `list-out` when it is removed; the files already there when the
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
                    {/* A real progressbar: the bar is a picture of the number, and
                        the number is what a screen reader reads. */}
                    <div
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
                    </div>
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
      {/* The arrival and completion of an upload are events, not only pictures. */}
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
 * It used to compose `Upload` with `label=""` to suppress the second heading.
 * That left an empty `span` in the accessibility tree — and, less visibly, a
 * second "Choose a file" button, a second copy of the description, and a second
 * `role="alert"` carrying the same error, so a failure was announced twice. Both
 * halves now draw on the same list and only the drop surface carries the chooser.
 */
export function UploadZone({ files, onRemove, children, ...props }: UploadZoneProps): React.JSX.Element {
  return (
    <div className={cx(styles['field'])}>
      <DropZone {...props}>{children}</DropZone>
      <UploadedFiles files={files} {...(onRemove ? { onRemove } : {})} />
    </div>
  );
}

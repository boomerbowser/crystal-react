import { describe, expect, it } from 'vitest';
import { expectNoAxeViolations } from '../../test/axe.js';
import { renderWithCrystal, screen } from '../../test/render.js';
import { FileInput, DropZone, Upload, UploadZone } from './FileInput.js';

describe('FileInput', () => {
  it('has no accessibility violations and opens the platform picker', async () => {
    const { container } = renderWithCrystal(<FileInput label="Attachment" />);
    expect(screen.getByRole('button', { name: 'Choose a file' })).toBeInTheDocument();
    /* A real input underneath, so the picker is the system's, with its recent
       files, its search and its own accessibility. */
    expect(container.querySelector('input[type="file"]')).not.toBeNull();
    await expectNoAxeViolations(container);
  });
});

describe('DropZone', () => {
  /* Dragging needs a pointer, a steady hand and sight of both ends of the
     gesture. It is an enhancement over choosing, never a replacement. */
  it('always offers a button as well as a surface', () => {
    renderWithCrystal(<DropZone label="Attachments" />);
    expect(screen.getByRole('button', { name: 'Choose a file' })).toBeInTheDocument();
  });
});

describe('Upload', () => {
  /* A bar alone says "something is happening". The number says how much, and a
     screen reader can read only the number. */
  it('reports progress as a number, not only a bar', () => {
    renderWithCrystal(
      <Upload
        label="Attachments"
        files={[{ id: '1', name: 'report.pdf', size: 248000, progress: 0.4 }]}
      />,
    );
    const bar = screen.getByRole('progressbar', { name: 'Uploading report.pdf' });
    expect(bar.getAttribute('aria-valuenow')).toBe('40');
    expect(screen.getByText('40%')).toBeInTheDocument();
  });

  it('shows a readable size rather than a byte count', () => {
    renderWithCrystal(
      <Upload label="Attachments" files={[{ id: '1', name: 'report.pdf', size: 248000 }]} />,
    );
    expect(screen.getByText('248 kB')).toBeInTheDocument();
  });

  it('announces an upload failure rather than only colouring it', () => {
    renderWithCrystal(
      <Upload label="Attachments" files={[{ id: '1', name: 'report.pdf', error: 'Too large' }]} />,
    );
    expect(screen.getByRole('alert').textContent).toContain('Too large');
  });

  /* Rendering a whole second chooser with its label blanked would duplicate the
     button, the description and the error. The error would be announced twice,
     because both copies carry `role="alert"`. */
  it('gives a drop zone exactly one chooser, one description and one error', () => {
    renderWithCrystal(
      <UploadZone
        label="Attachments"
        description="PDF or PNG, up to 10 MB"
        errorMessage="That file is too large"
        files={[{ id: 'a', name: 'brief.pdf', size: 2048 }]}
      />,
    );
    expect(screen.getAllByRole('button', { name: 'Choose a file' })).toHaveLength(1);
    expect(screen.getAllByText('PDF or PNG, up to 10 MB')).toHaveLength(1);
    expect(screen.getAllByRole('alert')).toHaveLength(1);
    /* And no empty label is left in the tree. */
    const labels = Array.from(document.querySelectorAll('span'))
      .filter((node) => node.className.includes('label'));
    expect(labels.every((node) => node.textContent !== '')).toBe(true);
  });
});

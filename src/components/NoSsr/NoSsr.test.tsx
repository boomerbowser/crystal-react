import { describe, expect, it } from 'vitest';
import { renderWithPrismata, screen } from '../../test/render.js';
import { NoSsr } from './NoSsr.js';

describe('NoSsr', () => {
  it('renders its children on the client', () => {
    renderWithPrismata(<NoSsr fallback={<p>Loading</p>}><p>Chart</p></NoSsr>);
    expect(screen.getByText('Chart')).toBeInTheDocument();
    expect(screen.queryByText('Loading')).toBeNull();
  });
});

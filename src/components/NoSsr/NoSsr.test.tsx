import { describe, expect, it } from 'vitest';
import { renderWithCrystal, screen } from '../../test/render.js';
import { NoSsr } from './NoSsr.js';

describe('NoSsr', () => {
  it('renders its children on the client', () => {
    renderWithCrystal(<NoSsr fallback={<p>Loading</p>}><p>Chart</p></NoSsr>);
    expect(screen.getByText('Chart')).toBeInTheDocument();
    expect(screen.queryByText('Loading')).toBeNull();
  });
});

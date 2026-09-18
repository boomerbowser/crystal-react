import { describe, expect, it } from 'vitest';
import userEvent from '@testing-library/user-event';
import { renderWithCrystal, screen } from '../../test/render.js';
import { Cascader } from './Cascader.js';

const PLACES = [
  {
    value: 'gb',
    label: 'United Kingdom',
    children: [
      { value: 'sct', label: 'Scotland', children: [{ value: 'edi', label: 'Edinburgh' }] },
      { value: 'wls', label: 'Wales' },
    ],
  },
];

describe('Cascader', () => {
  /* Columns were announced as "Top level", "Level 2", "Level 3" — position
     rather than subject. A column is now named after whatever it hangs from. */
  it('names each column after what it is a list of', async () => {
    renderWithCrystal(
      <Cascader label="Location" options={PLACES} defaultValue={['gb', 'sct']} />,
    );
    await userEvent.click(screen.getByRole('button', { name: /Location/ }));

    expect(screen.getByRole('listbox', { name: 'Location' })).toBeInTheDocument();
    expect(screen.getByRole('listbox', { name: 'United Kingdom' })).toBeInTheDocument();
    expect(screen.getByRole('listbox', { name: 'Scotland' })).toBeInTheDocument();
    expect(screen.queryByRole('listbox', { name: /^Level / })).toBeNull();
  });

  it("takes the product's own names for the levels", async () => {
    renderWithCrystal(
      <Cascader
        label="Location"
        options={PLACES}
        defaultValue={['gb']}
        columnLabels={['Country', 'Region']}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: /Location/ }));
    expect(screen.getByRole('listbox', { name: 'Country' })).toBeInTheDocument();
    expect(screen.getByRole('listbox', { name: 'Region' })).toBeInTheDocument();
  });

  /* The path, not the leaf: "Edinburgh" alone has lost what disambiguates it. */
  it('shows the whole path on the trigger', () => {
    renderWithCrystal(
      <Cascader label="Location" options={PLACES} defaultValue={['gb', 'sct', 'edi']} />,
    );
    expect(screen.getByRole('button', { name: /Location/ }).textContent)
      .toContain('United Kingdom / Scotland / Edinburgh');
  });
});

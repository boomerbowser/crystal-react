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
  /* A column is named after the option it hangs from, so its name gives its
     subject. "Top level", "Level 2" and "Level 3" gave only its position. */
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

  /* The trigger shows the whole path. "Edinburgh" alone loses what
     disambiguates it. */
  it('shows the whole path on the trigger', () => {
    renderWithCrystal(
      <Cascader label="Location" options={PLACES} defaultValue={['gb', 'sct', 'edi']} />,
    );
    expect(screen.getByRole('button', { name: /Location/ }).textContent)
      .toContain('United Kingdom / Scotland / Edinburgh');
  });
});

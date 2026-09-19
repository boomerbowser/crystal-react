import type { Meta, StoryObj } from '@storybook/react-vite';
import styles from './Parity.module.scss';

/* The parity specimens.
 *
 * One bare element per Crystal material, carrying nothing but the material, so
 * `scripts/verify-materials.mjs` can put it beside the same primitive in
 * Crystal's own preview and compare the computed style. A component would bring
 * its own decisions — a button's radius, a card's padding — and the comparison
 * would be about those instead.
 *
 * The environment is pinned rather than left to the toolbar: a measurement is
 * worth nothing if a reviewer who left the palette in Ion turns it into a
 * failure. Crystal's own defaults, which is what the approved baseline was
 * captured at.
 */
const meta = {
  title: 'Materials/Parity',
  parameters: {
    crystal: {
      palette: 'prism', mode: 'light', density: 'comfortable', direction: 'ltr',
      effects: 'full', atmosphere: 90, translucency: 35, elevation: 125, radius: 28,
      ground: 'plastic',
    },
    docs: {
      description: {
        component:
          'Bare specimens, one per material, pinned to Crystal\'s own defaults. `verify-materials` '
          + 'renders these beside `.cr-frost`, `.cr-resin` and `.cr-haze` in Crystal\'s preview and '
          + 'fails on any difference in diffusion, shadow, fill or edge. Crystal is the acceptance '
          + 'standard; a difference is a defect here until someone shows it is a defect there.',
      },
    },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const EveryMaterial: Story = {
  render: () => (
    <div className={styles.row}>
      <div className={styles.frost} data-material="frost">Frost</div>
      <div className={styles.resin} data-material="resin">Resin</div>
      <div className={styles.haze} data-material="haze">Haze</div>
    </div>
  ),
};

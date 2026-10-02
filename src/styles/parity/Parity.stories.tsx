import type { Meta, StoryObj } from '@storybook/react-vite';
import styles from './Parity.module.scss';
import { Button } from '../../components/Button/Button.js';

/* The parity specimens.
 *
 * One bare element per Crystal material, carrying nothing but the material, so
 * `scripts/verify-materials.mjs` can put it beside the same primitive in
 * Crystal's own preview and compare the computed style. A component would add
 * its own decisions (a button's radius, a card's padding), and the comparison
 * would measure those instead.
 *
 * The environment is pinned instead of left to the toolbar, so a reviewer who
 * left the palette in Ion cannot turn a measurement into a failure. It uses
 * Crystal's own defaults, at which the approved baseline was captured.
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
      {/* A real control instead of a bare div, because the Haze content fill is
          part of the control recipe and not of the Resin primitive. Crystal
          puts an 80% reading fill on an isolated `::before` behind every Resin
          control's label. The bare `.cr-resin` specimen above has none, so it
          cannot detect a missing fill. */}
      <span data-material="resin-control"><Button>Resin control</Button></span>
    </div>
  ),
};

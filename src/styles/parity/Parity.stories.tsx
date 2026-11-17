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
    <>
    <div className={styles.row}>
      <div className={`cr-frost ${styles.frost}`} data-material="frost">Frost</div>
      <div className={`cr-resin ${styles.resin}`} data-material="resin">Resin</div>
      <div className={styles.haze} data-material="haze">Haze</div>
      {/* A real control instead of a bare div, because the Haze content fill is
          part of the control recipe and not of the Resin primitive. Crystal
          puts an 80% reading fill on an isolated `::before` behind every Resin
          control's label. The bare `.cr-resin` specimen above has none, so it
          cannot detect a missing fill. */}
      <span data-material="resin-control"><Button>Resin control</Button></span>
    </div>
    {/* The material variants (Crystal 2.7.0 and 2.8.0), one specimen each, matched to
        the `data-variant` specimens on Crystal's playground. */}
    <div className={styles.row} style={{ flexWrap: 'wrap' }}>
      <div className={`cr-haze inset ${styles.variant}`} data-material="haze-inset">haze-inset</div>
      <div className={`cr-haze flush ${styles.variant}`} data-material="haze-flush">haze-flush</div>
      <div className={`cr-haze flat ${styles.variant}`} data-material="haze-flat">haze-flat</div>
      <div className={`cr-haze flat sunken ${styles.variant}`} data-material="haze-flat-sunken">haze-flat-sunken</div>
      <div className={`cr-haze raised ${styles.variant}`} data-material="haze-raised">haze-raised</div>
      <div className={`cr-frost pane ${styles.variant}`} data-material="frost-pane">frost-pane</div>
      <div className={`cr-frost flat ${styles.variant}`} data-material="frost-flat">frost-flat</div>
      <div className={`cr-frost docked flat ${styles.variant}`} data-material="frost-docked">frost-docked</div>
      <div className={`cr-frost sheet flat ${styles.variant}`} data-material="frost-sheet">frost-sheet</div>
      <div className={`cr-frost reading ${styles.variant}`} data-material="frost-reading">frost-reading</div>
      <div className={`cr-resin flat ${styles.variant}`} data-material="resin-flat">resin-flat</div>
      <div className={`cr-resin divider ${styles.variant}`} data-material="resin-divider">resin-divider</div>
      <span className="cr-choice" data-material="choice" />
      <span className="cr-choice outline" data-material="choice-outline" />
      <span className="cr-choice radio" data-material="choice-radio" />
      <span className="cr-field-shell block" data-material="field-block"><input className="cr-input" aria-label="Variant field" defaultValue="Fills the row" /></span>
    </div>
    </>
  ),
};

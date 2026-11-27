import type { Meta, StoryObj } from '@storybook/react-vite';
import styles from './Parity.module.scss';
import { Button } from '../../components/Button/Button.js';

/* The parity specimens.
 *
 * One bare element per Prismata material, carrying nothing but the material, so
 * `scripts/verify-materials.mjs` can put it beside the same primitive in
 * Prismata's own preview and compare the computed style. A component would add
 * its own decisions (a button's radius, a card's padding), and the comparison
 * would measure those instead.
 *
 * The environment is pinned instead of left to the toolbar, so a reviewer who
 * left the palette in Ion cannot turn a measurement into a failure. It uses
 * Prismata's own defaults, at which the approved baseline was captured.
 */
const meta = {
  title: 'Materials/Parity',
  parameters: {
    prismata: {
      palette: 'prism', mode: 'light', density: 'comfortable', direction: 'ltr',
      effects: 'full', atmosphere: 90, translucency: 35, elevation: 125, radius: 28,
      ground: 'plastic',
    },
    docs: {
      description: {
        component:
          'Bare specimens, one per material, pinned to Prismata\'s own defaults. `verify-materials` '
          + 'renders these beside `.pr-frost`, `.pr-resin` and `.pr-haze` in Prismata\'s preview and '
          + 'fails on any difference in diffusion, shadow, fill or edge. Prismata is the acceptance '
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
      <div className={`pr-frost ${styles.frost}`} data-material="frost">Frost</div>
      <div className={`pr-resin ${styles.resin}`} data-material="resin">Resin</div>
      <div className={styles.haze} data-material="haze">Haze</div>
      {/* A real control instead of a bare div, because the Haze content fill is
          part of the control recipe and not of the Resin primitive. Prismata
          puts an 80% reading fill on an isolated `::before` behind every Resin
          control's label. The bare `.pr-resin` specimen above has none, so it
          cannot detect a missing fill. */}
      <span data-material="resin-control"><Button>Resin control</Button></span>
    </div>
    {/* The material variants (Prismata 2.7.0 and 2.8.0), one specimen each, matched to
        the `data-variant` specimens on Prismata's playground. */}
    <div className={styles.row} style={{ flexWrap: 'wrap' }}>
      <div className={`pr-haze inset ${styles.variant}`} data-material="haze-inset">haze-inset</div>
      <div className={`pr-haze flush ${styles.variant}`} data-material="haze-flush">haze-flush</div>
      <div className={`pr-haze flat ${styles.variant}`} data-material="haze-flat">haze-flat</div>
      <div className={`pr-haze flat sunken ${styles.variant}`} data-material="haze-flat-sunken">haze-flat-sunken</div>
      <div className={`pr-haze raised ${styles.variant}`} data-material="haze-raised">haze-raised</div>
      <div className={`pr-frost pane ${styles.variant}`} data-material="frost-pane">frost-pane</div>
      <div className={`pr-frost flat ${styles.variant}`} data-material="frost-flat">frost-flat</div>
      <div className={`pr-frost docked flat ${styles.variant}`} data-material="frost-docked">frost-docked</div>
      <div className={`pr-frost sheet flat ${styles.variant}`} data-material="frost-sheet">frost-sheet</div>
      <div className={`pr-frost reading ${styles.variant}`} data-material="frost-reading">frost-reading</div>
      <div className={`pr-resin flat ${styles.variant}`} data-material="resin-flat">resin-flat</div>
      <div className={`pr-resin divider ${styles.variant}`} data-material="resin-divider">resin-divider</div>
      <span className="pr-choice" data-material="choice" />
      <span className="pr-choice outline" data-material="choice-outline" />
      <span className="pr-choice radio" data-material="choice-radio" />
      <span className="pr-field-shell block" data-material="field-block"><input className="pr-input" aria-label="Variant field" defaultValue="Fills the row" /></span>
    </div>
    </>
  ),
};

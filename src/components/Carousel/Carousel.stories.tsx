import type { Meta, StoryObj } from '@storybook/react-vite';
import { only } from '../../../.storybook/environment.js';
import { crystalTokens } from '../../theme/tokens.generated.js';
import { Carousel } from './Carousel.js';
import { photos } from '../../../.storybook/fixtures/index.js';

const materials = [
  ['Plastic', 'The foundation. A coloured atmosphere behind everything else, with its own glow.'],
  ['Frost', `The diffused intermediate surface: ${crystalTokens['material.frost.diffusion']} of backdrop blur at ${crystalTokens['material.frost.saturation']}% saturation, with fine grain.`],
  ['Resin', `The floating optical control plane. A ${Number(crystalTokens['material.resin.fill']) * 100}% fill, a rim that catches the light, and a float shadow.`],
  ['Haze', `The reading fill a control paints under its label, at ${Number(crystalTokens['material.haze.fill']) * 100}% with a ${crystalTokens['material.haze.feather']} feather.`],
];

const slides = materials.map(([name, text]) => ({
  id: (name ?? '').toLowerCase(),
  label: name ?? '',
  content: (
    <>
      <h3 style={{ margin: 0 }}>{name}</h3>
      <p style={{ marginBlock: 'var(--cr-spacing-xs) 0', color: 'var(--cr-muted)' }}>{text}</p>
    </>
  ),
}));

const meta = {
  title: 'Data display/Carousel',
  component: Carousel,
  parameters: {
    docs: {
      description: {
        component:
          'There is no autoplay, and that is a decision. Crystal\'s rule is that nothing moves '
          + 'at rest, the catalogue says "never autoplay without a pause control", and the '
          + 'recipes say, in Crystal\'s own words, "explicit next/previous navigation; never '
          + 'autoplay". Autoplay policy belongs to the product, so a product that must have it '
          + 'owns both the timer and the pause control.\n\n'
          + 'The track is a real scroll container with snapping, so a swipe, a flick and the '
          + 'platform\'s own momentum all work. It is a tab stop, because a scroll container '
          + 'with nothing focusable inside cannot be reached without a pointer. The movement '
          + 'between slides is the track gliding, the same movement a swipe makes. A reader who '
          + 'asks for reduced motion gets the jump alone. `gap` sets the space between slides '
          + 'and `padding` the space inside each, both from Crystal\'s spacing scale.',
      },
    },
  },
  args: { slides, label: 'Crystal materials' },
} satisfies Meta<typeof Carousel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** Two slides, so the step controls reach both ends quickly. A disabled control
 *  stays where it is instead of disappearing, because a control that vanishes
 *  changes the layout under the reader's hand. */
export const AtTheEnds: Story = {
  args: { slides: slides.slice(0, 2) },
};

/** One slide, the catalogue's `single-slide` state. Both controls are disabled
 *  and the indicator row has one entry, which shows there is nowhere to go. */
export const SingleSlide: Story = {
  render: (args) => <Carousel {...only(args)} slides={slides.slice(0, 1)} />,
};

const shots = [
  ['bay', photos.bay, 'A calm bay below a clear sky'],
  ['pier', photos.pier, 'A pier on a grey morning'],
  ['boat', photos.mooredBoat, 'A moored boat on still water'],
  ['lighthouse', photos.lighthouse, 'A lighthouse above the rocks'],
] as const;

/** Photographs, with the spacing opened up: `gap="xl"` between slides and
 *  `padding="sm"` inside each, so the picture nearly fills its slide. */
export const PhotographsWithSpacing: Story = {
  args: {
    label: 'The east shore',
    gap: 'xl',
    padding: 'sm',
    slides: shots.map(([id, src, alt]) => ({
      id,
      label: alt,
      content: (
        <img
          src={src}
          alt={alt}
          style={{ display: 'block', inlineSize: '100%', aspectRatio: '3 / 2', objectFit: 'cover', borderRadius: 'calc(var(--cr-radius) - var(--cr-spacing-sm))' }}
        />
      ),
    })),
  },
};

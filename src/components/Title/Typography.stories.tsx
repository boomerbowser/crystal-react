import type { Meta, StoryObj } from '@storybook/react-vite';
import { Title, Display, Lead } from './Title.js';
import { Text } from '../Text/Text.js';
import { Prose, Blockquote, Abbr } from '../Prose/Prose.js';
import { ProseList, Cite } from '../ProseList/ProseList.js';
import { Highlight } from '../Highlight/Highlight.js';
import { NumberFormatter } from '../NumberFormatter/NumberFormatter.js';
import { Truncate } from '../Truncate/Truncate.js';
import { CodeBlock } from '../CodeBlock/CodeBlock.js';
import { GradientText } from '../GradientText/GradientText.js';
import { Stack } from '../Stack/Stack.js';
import { Card } from '../Card/Card.js';
import { crystalTokens } from '../../theme/tokens.generated.js';

const meta = {
  title: 'Typography/Scale and prose',
  component: Title,
  parameters: {
    docs: {
      description: {
        component:
          'The scale is Crystal\'s, derived from the reading size: each step is a ratio, so '
          + 'moving `typography.readingSize` moves all six. The scale is modest, because '
          + 'Crystal\'s hierarchy is carried by weight and material as much as by size, and a '
          + 'dramatic scale would compete with that.\n\n'
          + '**The level and the size are chosen separately.** The catalogue states this rule '
          + 'twice, and it is why Title takes both. If `level={2}` also meant "medium", products '
          + 'would have to choose between a correct outline and a correct appearance, and they '
          + 'reliably choose appearance. Switch density in the toolbar: leading tightens and the '
          + 'size never does, because shrinking text at higher density trades legibility for '
          + 'space.\n\n'
          + 'Prose is the rhythm applied to content the product did not lay out, such as rendered '
          + 'Markdown or a CMS body. It is the one place in this library where a stylesheet reaches '
          + 'its descendants, so a content author does not need to know Crystal.',
      },
    },
  },
} satisfies Meta<typeof Title>;

export default meta;
type Story = StoryObj<typeof meta>;

export const TheScale: Story = {
  render: () => (
    <Stack gap="lg">
      <Display>Display: one per view</Display>
      <Title level={2}>Title: a section</Title>
      <Title level={3}>Heading: a subsection</Title>
      <Title level={4}>Subheading: a group</Title>
      <Text>Body: Crystal&rsquo;s reading size exactly, at the 16/24 rhythm.</Text>
      <Text step="caption" tone="muted">Caption: supporting detail beside something else.</Text>
    </Stack>
  ),
};

/** The level is the outline and the step is the size. Here each heading takes a
 *  step its level would not default to. */
export const LevelAndStepAreSeparate: Story = {
  render: () => (
    <Stack gap="lg">
      <Title level={2} step="subheading">A level-two heading at the subheading step</Title>
      {/* Level three, so the outline does not jump from two to four. That jump
          fails `heading-order` and breaks navigation by heading. A level three
          at the title step shows the level and the step moving independently
          just as well. */}
      <Title level={3} step="title">A level-three heading at the title step</Title>
    </Stack>
  ),
};

export const Gradient: Story = {
  render: () => (
    <Stack gap="lg">
      <GradientText level={1}>Colour that runs across the words</GradientText>
      <Text tone="muted">
        The gradient runs between palette colours that already clear their contrast ratio, so every
        point along it does. Where the clip is unsupported the solid colour beneath paints instead.
      </Text>
    </Stack>
  ),
};

export const LongForm: Story = {
  render: () => (
    <Prose>
      <h2>Materials, depth and optical detail</h2>
      <p>
        The defining order is Plastic, then Frost, then Resin, from back to front. Haze reading
        wells preserve legibility within that hierarchy.
      </p>
      <ul>
        <li>Plastic is the foundation and the only material that emits rather than refracts.</li>
        <li>Frost is the intermediate surface.</li>
        <li>Resin is the floating control plane, and it never contains Resin.</li>
      </ul>
      <blockquote>
        <p>Feathering applies to paint only. Text, icons, hit areas and focus rings stay crisp.</p>
        <cite>Crystal, Materials</cite>
      </blockquote>
      <p>
        A <abbr title="Cascading Style Sheets">CSS</abbr> approximation is not a native optical
        specification.
      </p>
      {/* The figure is interpolated from the live token instead of typed into the
          sample, so the code example cannot drift from the material it describes. */}
      <pre><code>{`.cr-haze { filter: blur(${crystalTokens['material.haze.feather']}); }`}</code></pre>
    </Prose>
  ),
};

export const Composed: Story = {
  render: () => (
    <Stack gap="lg">
      <Display>A design system</Display>
      <Lead>
        The standfirst beneath a title reads like a heading but is not one, which keeps a sentence
        of copy out of the document outline.
      </Lead>
      <Card aria-label="Search result">
        <Highlight query={['resin', 'frost']}>
          Resin is the floating control plane and Frost is the intermediate surface.
        </Highlight>
      </Card>
      <Blockquote attribution="Ada Lovelace" source="Notes on the Analytical Engine">
        <p>The Analytical Engine weaves algebraic patterns.</p>
      </Blockquote>
      <ProseList>
        <li>A real list, so the count and the nesting are announced.</li>
        <li>
          <NumberFormatter value={1204893} format={{ notation: 'compact' }} />
          {' components, formatted under the scope’s locale.'}
        </li>
      </ProseList>
      <Text step="caption" tone="muted">
        Quoted from <Cite>Crystal, Materials</Cite>, with <Abbr expansion="Cascading Style Sheets">CSS</Abbr> examples.
      </Text>
      <Truncate lines={2}>
        A paragraph long enough to clamp at two lines, so the control to expand it appears. It
        appears only because there is something to reveal, since a control that does nothing still
        costs a keyboard user a tab stop to find that out. The full text stays in the document
        throughout, which is why clamping is used rather than cutting the string.
      </Truncate>
      <CodeBlock language="TypeScript" label="crystal.ts">
        {'import { CrystalProvider, Button } from \'@crystal-ui/react\';\n\n<CrystalProvider palette="prism">\n  <Button variant="primary">Save</Button>\n</CrystalProvider>'}
      </CodeBlock>
    </Stack>
  ),
};

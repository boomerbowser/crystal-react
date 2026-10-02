import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { only } from '../../../.storybook/environment.js';
import { Button } from '../Button/Button.js';
import { Collapse } from './Collapse.js';

const meta = {
  title: 'Data display/Collapse',
  component: Collapse,
  parameters: {
    docs: {
      description: {
        component:
          'A region that opens and closes. "Hidden content is genuinely hidden from assistive '
          + 'technology", which rules out the usual `max-height: 0`. That leaves a zero-height '
          + 'region full of focusable links a keyboard user can still tab into. So a collapsed '
          + 'region is not rendered at all, and the exit recipe still plays: `play` returns a '
          + 'promise that settles when the movement finishes, so the content stays for exactly as '
          + 'long as `accordion-out` runs and then goes. The trigger is not part of this '
          + 'component, because its `aria-expanded` and `aria-controls` belong to whoever owns '
          + 'the button.',
      },
    },
  },
  args: { isExpanded: true, id: 'collapse-story', children: 'A region that opens and closes.' },
} satisfies Meta<typeof Collapse>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** The assembled pair: a button that owns the state and names the region.
 *  `Accordion` solves the same problem on React Aria's disclosure, which keeps
 *  a collapsed row reachable by find-in-page and in exchange owns the hiding
 *  itself. */
export const WithItsTrigger: Story = {
  render: (args) => {
    const Demo = () => {
      const [open, setOpen] = useState(false);
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--cr-space)', alignItems: 'flex-start' }}>
          <Button
            variant="quiet"
            aria-expanded={open}
            aria-controls="collapse-demo"
            onPress={() => { setOpen((was) => !was); }}
          >
            {open ? 'Hide details' : 'Show details'}
          </Button>
          <Collapse {...only(args)} id="collapse-demo" isExpanded={open}>
            <p style={{ margin: 0 }}>
              When closed, this paragraph is removed from the document, not just hidden.
            </p>
          </Collapse>
        </div>
      );
    };
    return <Demo />;
  },
};

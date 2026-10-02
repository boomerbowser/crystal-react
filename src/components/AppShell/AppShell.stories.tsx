import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { AppShell } from './AppShell.js';
import { AppBar } from '../AppBar/AppBar.js';
import { Resizable } from '../Resizable/Resizable.js';
import { Button } from '../Button/Button.js';
import { Card } from '../Card/Card.js';
import { Stack } from '../Stack/Stack.js';

const meta = {
  title: 'Application/Shell',
  component: AppShell,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'The material assignment of a whole view, in one place: Plastic underneath, Frost for '
          + 'the supporting panels, Resin for the floating destination group. That ordering is '
          + 'Crystal\'s hierarchy at the largest scale. A Resin sidebar with a Frost dock inverts it.\n\n'
          + 'The shell also owns the landmarks, with one main per view, so the regions are props '
          + 'and not children a caller arranges. Collapsing the sidebar removes it from the '
          + 'accessibility tree too. A sidebar that is visually gone but still focusable sends a '
          + 'keyboard user into links they cannot see.\n\n'
          + 'The app bar takes its elevation on scroll, not at rest. It reads one boolean from a '
          + 'passive scroll listener on the shell\'s content region, which scrolls beneath it.',
      },
    },
  },
} satisfies Meta<typeof AppShell>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Shell: Story = {
  render: function Shell() {
    const [collapsed, setCollapsed] = useState(false);
    return (
      <AppShell
        header={(
          <AppBar
            title="Workspace"
            titleAs="h1"
            actions={<Button variant="quiet" onPress={() => setCollapsed((was) => !was)}>
              {collapsed ? 'Show sections' : 'Hide sections'}
            </Button>}
          />
        )}
        sidebar={(
          <Stack gap="2xs" style={{ padding: 'var(--cr-space)' }}>
            {['Overview', 'Materials', 'Components', 'Catalogue'].map((label) => (
              <a key={label} href={`#${label}`} style={{ padding: 'var(--cr-spacing-sm)' }}>{label}</a>
            ))}
          </Stack>
        )}
        isCollapsed={collapsed}
        destinations={(
          <>
            <Button variant="quiet">Home</Button>
            <Button variant="quiet">Search</Button>
            <Button variant="quiet">Profile</Button>
          </>
        )}
      >
        <Stack gap="lg">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((n) => (
            <Card key={n} aria-label={`Section ${n}`}>Section {n}. Scroll to see the bar take its elevation.</Card>
          ))}
        </Stack>
      </AppShell>
    );
  },
};

/** The handle is a separator with a value, so the size is announced as it changes.
 *  The arrow keys move it, because pointer dragging is never the only route. */
export const Resizing: Story = {
  render: () => (
    <div style={{ height: '320px' /* crystal-allow-literal: story box, so the split has somewhere to be */ }}>
      <Resizable
        aria-label="Resize the panel"
        defaultSize={260}
        minSize={140}
        maxSize={520}
        secondary={<Card aria-label="Rest">The rest of the view.</Card>}
      >
        <Card aria-label="Panel">Focus the handle and use the arrow keys.</Card>
      </Resizable>
    </div>
  ),
};

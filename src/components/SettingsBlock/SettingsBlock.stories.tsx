import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { SettingsBlock, type SettingsBlockProps, type SettingsState } from './SettingsBlock.js';
import { Switch } from '../Switch/Switch.js';
import { Button } from '../Button/Button.js';

const groups = (onChange?: () => void): SettingsBlockProps['groups'] => [
  {
    id: 'mail',
    title: 'Email',
    description: 'What we send you, and how often.',
    children: (
      <>
        <Switch {...(onChange ? { onChange } : {})} defaultSelected>Weekly summary</Switch>
        <Switch {...(onChange ? { onChange } : {})}>Product news</Switch>
      </>
    ),
  },
  {
    id: 'privacy',
    title: 'Privacy',
    description: 'Who can see what.',
    children: <Switch {...(onChange ? { onChange } : {})} defaultSelected>Show my status</Switch>,
  },
];

const meta = {
  title: 'Blocks/SettingsBlock',
  component: SettingsBlock,
  parameters: {
    docs: {
      description: {
        component:
          '"Each group is a labelled region; unsaved changes are announced before navigation."\n\n'
          + 'Groups are Haze regions named by their headings. Becoming dirty is said politely and '
          + 'shown on the save bar; leaving the document while dirty is the browser\'s to confirm '
          + '(`beforeunload`); leaving through the product\'s router is held by the router, which '
          + 'sets `isLeaving` so the block can ask in an alert dialog and report the choice.',
      },
    },
  },
  args: { title: 'Settings', groups: groups() },
} satisfies Meta<typeof SettingsBlock>;

export default meta;
type Story = StoryObj<typeof meta>;

export const AtRest: Story = {};
export const Dirty: Story = { args: { state: 'dirty' } };
export const Saving: Story = { args: { state: 'saving' } };
export const Saved: Story = { args: { state: 'saved' } };
/** The product's router has held a navigation while there is unsaved work. */
export const Leaving: Story = { args: { state: 'dirty', isLeaving: true } };
export const Immediate: Story = { args: { saveMode: 'immediate', state: 'saved' } };

/** Change a setting, then try to go elsewhere before saving. */
export const AWorkingPage: Story = {
  render: function Working(args) {
    const [state, setState] = useState<SettingsState>('at-rest');
    const [leaving, setLeaving] = useState(false);
    const [where, setWhere] = useState('Settings');
    const save = (then?: () => void): void => {
      setState('saving');
      setTimeout(() => { setState('saved'); then?.(); }, 600);
    };
    return (
      <div style={{ display: 'grid', gap: 16, maxInlineSize: 640 }}>
        <p>Page: {where}</p>
        <Button
          onPress={() => { if (state === 'dirty') setLeaving(true); else setWhere('Home'); }}
        >
          Go to Home
        </Button>
        <SettingsBlock
          {...args}
          groups={groups(() => { setState('dirty'); })}
          state={state}
          onSave={() => { save(); }}
          onDiscard={() => { setState('at-rest'); }}
          isLeaving={leaving}
          onLeaveChoice={(choice) => {
            setLeaving(false);
            if (choice === 'save') save(() => { setWhere('Home'); });
            if (choice === 'discard') { setState('at-rest'); setWhere('Home'); }
          }}
        />
      </div>
    );
  },
};

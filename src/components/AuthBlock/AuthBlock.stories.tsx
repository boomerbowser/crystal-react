import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { AuthBlock, type AuthMode, type AuthState } from './AuthBlock.js';

const meta = {
  title: 'Blocks/AuthBlock',
  component: AuthBlock,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          '"Real form semantics with autocomplete tokens; failures never reveal which factor was wrong."\n\n'
          + 'One real form per mode, with the autocomplete token each field is (`username`, '
          + '`current-password`, `new-password`, `one-time-code`), so password managers fill and save. '
          + 'Signing in takes one failure message and has no way to attach it to a field. A reset '
          + 'answers the same whether or not the address has an account. Locked holds the form and says '
          + 'when to try again. A Haze card on the Plastic ground.',
      },
    },
  },
  args: { mode: 'sign-in', onSubmit: () => {}, onModeChange: () => {} },
  decorators: [(Story) => <div style={{ minBlockSize: '100vh', display: 'grid' }}><Story /></div>],
} satisfies Meta<typeof AuthBlock>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SignIn: Story = {};
export const Submitting: Story = { args: { state: 'submitting' } };
export const Failed: Story = { args: { state: 'error' } };
export const Locked: Story = { args: { state: 'locked', lockedMessage: 'Too many attempts. Try again in 15 minutes.' } };
export const Register: Story = { args: { mode: 'register', errors: { password: 'Use at least 12 characters' } } };
export const Reset: Story = { args: { mode: 'reset', notice: 'If an account uses that address, a reset link is on its way.' } };
export const Verify: Story = { args: { mode: 'verify' } };

/** Every mode, reachable from the links. Any sign-in fails the same way. */
export const AWorkingFlow: Story = {
  render: function Flow(args) {
    const [mode, setMode] = useState<AuthMode>('sign-in');
    const [state, setState] = useState<AuthState>('at-rest');
    const [notice, setNotice] = useState<string | null>(null);
    return (
      <AuthBlock
        {...args}
        mode={mode}
        state={state}
        {...(notice ? { notice } : {})}
        onModeChange={(next) => { setMode(next); setState('at-rest'); setNotice(null); }}
        onSubmit={() => {
          setState('submitting');
          setTimeout(() => {
            if (mode === 'reset') { setState('at-rest'); setNotice('If an account uses that address, a reset link is on its way.'); return; }
            setState('error');
          }, 600);
        }}
      />
    );
  },
};

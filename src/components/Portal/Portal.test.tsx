import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createContext, useContext } from 'react';
import { Portal } from './Portal.js';

/* A context that only reaches the child if the portal keeps the tree. This is
   the property the component exists for — `SurfaceProvider` is one of these,
   and "Resin never contains Resin" is enforced by it surviving the portal. */
const Material = createContext('page');
function Reads(): React.JSX.Element {
  return <span data-testid="reader">{useContext(Material)}</span>;
}

describe('Portal', () => {
  it('renders its children into document.body by default', async () => {
    render(<div data-testid="origin"><Portal><span data-testid="moved">out</span></Portal></div>);
    const moved = await screen.findByTestId('moved');
    expect(moved).toBeTruthy();
    /* The assertion that matters is not "it rendered" but "it rendered
       somewhere else": the whole point is escaping the layout parent. */
    expect(screen.getByTestId('origin').contains(moved)).toBe(false);
    expect(document.body.contains(moved)).toBe(true);
  });

  it('carries React context across the portal', async () => {
    render(
      <Material.Provider value="resin">
        <Portal><Reads /></Portal>
      </Material.Provider>,
    );
    expect((await screen.findByTestId('reader')).textContent).toBe('resin');
  });

  it('renders into a container it is given', async () => {
    const host = document.createElement('aside');
    document.body.append(host);
    render(<Portal container={host}><span data-testid="aimed">here</span></Portal>);
    expect(host.contains(await screen.findByTestId('aimed'))).toBe(true);
    host.remove();
  });

  it('resolves a function container on the client', async () => {
    const host = document.createElement('section');
    host.id = 'late';
    document.body.append(host);
    render(<Portal container={() => document.getElementById('late')}><span data-testid="late-child">x</span></Portal>);
    expect(host.contains(await screen.findByTestId('late-child'))).toBe(true);
    host.remove();
  });

  it('renders nothing when disabled, and keeps rendering nothing', () => {
    const { queryByTestId } = render(
      <Portal isDisabled><span data-testid="off">no</span></Portal>,
    );
    expect(queryByTestId('off')).toBeNull();
  });
});

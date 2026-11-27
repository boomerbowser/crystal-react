import type { Metadata } from 'next';
import { Prose } from '@prismata/react';
import { coreVersion, libraries, publishedVersions } from '../../lib/prismata';

export const metadata: Metadata = { title: 'Component libraries' };

export default function Libraries() {
  return (
    <>
      <Prose>
        <h1>Component libraries</h1>
        <p>
          Prismata is implemented for each platform by its own library. This site is built against{' '}
          <code>@prismata/core</code> {coreVersion}; each version below is the one its package has published.
          The list is Prismata's own, <code>@prismata/core/libraries</code>.
        </p>
      </Prose>
      <div className="table-scroll">
        <table className="recipe">
          <thead>
            <tr><th scope="col">Platform</th><th scope="col">Library</th><th scope="col">Status</th><th scope="col">Package</th><th scope="col">Version</th><th scope="col">Documentation</th></tr>
          </thead>
          <tbody>
            {libraries.map((library) => {
              const version = library.package ? publishedVersions[library.package] : null;
              return (
                <tr key={library.platform}>
                  <td>{library.framework}</td>
                  <td>{library.name ?? 'Not yet named'}</td>
                  <td>{library.status === 'built' ? `Built${library.stage ? ` (${library.stage})` : ''}` : 'Planned'}</td>
                  <td>{library.package && library.registry ? <a href={library.registry}><code>{library.package}</code></a> : 'Not yet published'}</td>
                  <td>{version ?? 'Not published'}</td>
                  <td>
                    {library.documentation ? <a href={library.documentation}>Documentation</a>
                      : library.repository ? <><a href={library.repository}>Repository</a>; no documentation website yet</>
                        : 'Not yet'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}

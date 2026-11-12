import { Link } from 'react-router'
import { useCursor } from '../state/useCursor'
import { modo3D, usePrefs } from '../state/usePrefs'
import { useScene } from '../state/useScene'

const rotte = ['/', '/bio', '/serie', '/serie/roundabout', '/opere/sinapsi', '/edizioni', '/mostre', '/fotografia', '/non-esiste']

/** Sandbox /dev/scena (solo in dev): stato di prefs, scena e cursore, con link per provare le transizioni. */
export function DevScena() {
  const prefs = usePrefs()
  const scena = useScene()
  const cursor = useCursor((s) => s.kind)
  return (
    <section className="dev">
      <h1>Sandbox scena</h1>
      <pre>
        {JSON.stringify(
          {
            modo3D: modo3D(prefs),
            vistaLista: prefs.vistaLista,
            reducedMotion: prefs.reducedMotion,
            webgl: prefs.webgl,
            scena: scena.scena,
            target: scena.target,
            inTransizione: scena.inTransizione,
            cursore: cursor,
          },
          null,
          2,
        )}
      </pre>
      <ul className="lista">
        {rotte.map((r) => (
          <li key={r}>
            <Link to={r}>{r}</Link>
          </li>
        ))}
      </ul>
      <p>
        <button type="button" className="button" data-cursor="spray">
          spray
        </button>{' '}
        <button type="button" className="link" data-cursor="grab">
          grab
        </button>
      </p>
    </section>
  )
}

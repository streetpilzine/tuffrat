import { Link } from 'react-router'
import { useCursor } from '../state/useCursor'
import { modo3D, usePrefs } from '../state/usePrefs'
import { useScene } from '../state/useScene'

const rotte = [
  '/',
  '/?intro=1',
  '/opere/sinapsi',
  '/opere/te-nero-2',
  '/serie',
  '/serie/roundabout',
  '/serie/roundabout?p=3120&r=1000',
  '/serie/bustine-di-te',
  '/edizioni',
  '/edizioni/rivista-test',
  '/fotografia',
  '/mostre',
  '/mostre#teatro-nero-2025',
  '/bio',
  '/non-esiste',
]

/** Sandbox /dev/scena (solo in dev): stato di prefs, scena e cursore, con un link per ogni cosa da provare (intro, fuoco, Roundabout con stato, rivista di prova, hash). */
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

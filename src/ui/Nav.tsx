import { NavLink } from 'react-router'
import { artista } from '../data'
import { usePrefs } from '../state/usePrefs'

const voci = [
  { to: '/serie', label: 'Serie' },
  { to: '/edizioni', label: 'Edizioni' },
  { to: '/fotografia', label: 'Fotografia' },
  { to: '/mostre', label: 'Mostre' },
  { to: '/bio', label: 'Bio' },
]

/** Navigazione principale con l'interruttore «vista lista» (ARCHITECTURE §5 e §7). */
export function Nav() {
  const { vistaLista, reducedMotion, webgl, toggleVistaLista } = usePrefs()
  const bloccata = !webgl || reducedMotion
  const motivo = !webgl
    ? 'La vista 3D non è disponibile su questo dispositivo'
    : reducedMotion
      ? 'Vista lista attiva: il sistema chiede animazioni ridotte'
      : vistaLista
        ? 'Torna alla vista 3D'
        : 'Mostra tutto come elenco, senza scena 3D'
  return (
    <nav className="nav" aria-label="Principale">
      <NavLink to="/" className="nav__brand">
        {artista.brand}
      </NavLink>
      <ul className="nav__links">
        {voci.map((v) => (
          <li key={v.to}>
            <NavLink to={v.to}>{v.label}</NavLink>
          </li>
        ))}
      </ul>
      <button
        type="button"
        className="nav__vista"
        aria-pressed={vistaLista || bloccata}
        disabled={bloccata}
        title={motivo}
        onClick={toggleVistaLista}
      >
        Vista lista
      </button>
    </nav>
  )
}

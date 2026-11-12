import { lazy, Suspense, useEffect } from 'react'
import { Outlet, useLocation } from 'react-router'
import { artista } from '../data'
import { usePageMeta } from '../lib/usePageMeta'
import { metaFor } from '../routes.meta'
import { SceneRouter } from '../core/SceneRouter'
import { scenaPerRoute } from '../core/scene-map'
import { modo3D, osservaReducedMotion, usePrefs } from '../state/usePrefs'
import { Nav } from './Nav'

/** I chunk three/R3F e gsap si caricano solo quando si entra in modo 3D. */
const Stage = lazy(() => import('../core/Stage'))
const Cursor = lazy(() => import('../core/Cursor'))

const annoCorrente = new Date().getFullYear()

function ScrollToTop() {
  const { pathname, hash } = useLocation()
  useEffect(() => {
    if (hash) {
      document.getElementById(hash.slice(1))?.scrollIntoView()
    } else {
      window.scrollTo(0, 0)
    }
  }, [pathname, hash])
  return null
}

/** Regione aria-live: annuncia la pagina e, in 3D, dove va la camera (ARCHITECTURE §9). */
function Annuncio({ in3D }: { in3D: boolean }) {
  const { pathname } = useLocation()
  const titolo = metaFor(pathname).title
  const { etichetta } = scenaPerRoute(pathname)
  const testo = in3D ? `${titolo}. La camera si sposta ${etichetta}.` : titolo
  return (
    <p className="sr-only" aria-live="polite" role="status">
      {testo}
    </p>
  )
}

export function Layout() {
  usePageMeta()
  const prefs = usePrefs()
  const in3D = modo3D(prefs)
  useEffect(() => osservaReducedMotion(), [])
  useEffect(() => {
    document.documentElement.dataset.vista = in3D ? '3d' : 'lista'
  }, [in3D])

  return (
    <div className={`app ${in3D ? 'app--3d' : 'app--lista'}`}>
      <a className="skip-link" href="#main">
        Vai al contenuto
      </a>
      <ScrollToTop />
      <SceneRouter />
      {in3D && (
        <Suspense fallback={null}>
          <Stage />
        </Suspense>
      )}
      <Nav />
      <div className="sheet">
        <main id="main">
          <Outlet />
        </main>
        <footer className="footer">
          <p>
            © {annoCorrente} {artista.brand} — Portfolio
          </p>
        </footer>
      </div>
      {in3D && (
        <Suspense fallback={null}>
          <Cursor />
        </Suspense>
      )}
      <Annuncio in3D={in3D} />
    </div>
  )
}

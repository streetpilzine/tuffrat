import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router'
import { artista } from '../data'
import { usePageMeta } from '../lib/usePageMeta'
import { metaFor } from '../routes.meta'
import { SceneRouter } from '../core/SceneRouter'
import { scenaPerRoute } from '../core/scene-map'
import { modo3D, osservaReducedMotion, usePrefs } from '../state/usePrefs'
import { useScene } from '../state/useScene'
import { Hud } from './Hud'
import { Nav } from './Nav'

/** I chunk three/R3F e gsap si caricano solo quando si entra in modo 3D. */
const Stage = lazy(() => import('../core/Stage'))
const Cursor = lazy(() => import('../core/Cursor'))
const TagIntro = lazy(() => import('./TagIntro'))

const CHIAVE_INTRO = 'tuffrat.intro.v1'

/** L'intro parte solo entrando dalla home, una volta per sessione; `?intro=1` la forza (per provarla). */
function introDaMostrare(): boolean {
  if (typeof window === 'undefined') return false
  if (new URLSearchParams(window.location.search).get('intro') === '1') return true
  if ((window.location.pathname.replace(/\/+$/, '') || '/') !== '/') return false
  try {
    return sessionStorage.getItem(CHIAVE_INTRO) === null
  } catch {
    return false
  }
}

const annoCorrente = new Date().getFullYear()

/** A ogni cambio di pagina si riparte dall'alto: della finestra in vista lista, della scheda in 3D. Un hash apre la scheda sul suo bersaglio. */
function ScrollToTop({ corpo }: { corpo: React.RefObject<HTMLDivElement | null> }) {
  const { pathname, hash } = useLocation()
  useEffect(() => {
    if (hash) {
      // La scheda la apre il SceneRouter; qui si aspetta un frame perché il bersaglio non sia più `inert`.
      requestAnimationFrame(() => document.getElementById(hash.slice(1))?.scrollIntoView())
    } else {
      window.scrollTo(0, 0)
      corpo.current?.scrollTo(0, 0)
    }
  }, [pathname, hash, corpo])
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

  const corpo = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const [intro, setIntro] = useState<'aperta' | 'uscita' | 'chiusa'>(() => (introDaMostrare() ? 'aperta' : 'chiusa'))
  useEffect(() => {
    if (intro !== 'aperta') return
    try {
      sessionStorage.setItem(CHIAVE_INTRO, '1')
    } catch {
      /* storage non disponibile */
    }
  }, [intro])
  const chiudiIntro = (versoContatti: boolean) => {
    document.querySelector('.tagintro')?.classList.add('is-uscita')
    setIntro('uscita')
    window.setTimeout(() => setIntro('chiusa'), 400)
    if (versoContatti) void navigate('/#contatti')
  }
  const schedaAperta = useScene((s) => s.schedaAperta)
  const setScheda = useScene((s) => s.setScheda)
  const { pathname } = useLocation()
  const titoloScheda = pathname === '/' ? 'Studio' : metaFor(pathname).title.replace(/ — TuffRat$/, '')
  const chiusa = in3D && !schedaAperta

  return (
    <div className={`app ${in3D ? 'app--3d' : 'app--lista'}`}>
      <a className="skip-link" href="#main" onClick={() => setScheda(true)}>
        Vai al contenuto
      </a>
      <ScrollToTop corpo={corpo} />
      <SceneRouter />
      {in3D && (
        <Suspense fallback={null}>
          <Stage />
        </Suspense>
      )}
      {/* DOM agganciato alla scena (l'iframe del video nella TV): fratello dello Stage, che è `aria-hidden`, con il suo contesto di impilamento sotto Nav, Hud e scheda. */}
      {in3D && <div className="stage-html" id="stage-html" />}
      <Nav />
      {in3D && <Hud />}
      {/* In 3D la scheda è un cassetto fisso in basso: chiusa lascia libero il palco, aperta scorre al suo interno. */}
      <div className={`sheet${in3D ? (schedaAperta ? ' is-aperta' : ' is-chiusa') : ''}`}>
        {in3D && (
          <button
            type="button"
            className="sheet__maniglia"
            aria-expanded={schedaAperta}
            aria-controls="scheda-corpo"
            onClick={() => setScheda(!schedaAperta)}
          >
            <span className="sheet__titolo">{titoloScheda}</span>
            <span className="sheet__azione">{schedaAperta ? 'Chiudi scheda' : 'Apri scheda'}</span>
          </button>
        )}
        <div className="sheet__corpo" id="scheda-corpo" ref={corpo} inert={chiusa}>
          <main id="main">
            <Outlet />
          </main>
          <footer className="footer">
            <p>
              © {annoCorrente} {artista.brand} — Portfolio
            </p>
          </footer>
        </div>
      </div>
      {in3D && (
        <Suspense fallback={null}>
          <Cursor />
        </Suspense>
      )}
      <Annuncio in3D={in3D} />
      {intro !== 'chiusa' && (
        <Suspense fallback={<div className="tagintro tagintro--attesa" />}>
          <TagIntro onDone={chiudiIntro} statico={prefs.reducedMotion} />
        </Suspense>
      )}
    </div>
  )
}

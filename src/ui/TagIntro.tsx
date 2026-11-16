import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import tagSvg from '../assets/tag.svg?raw'
import { EASE_TUFFRAT, gsap } from '../core/motion/ease'
import { artista } from '../data'

interface Props {
  /** Chiamata quando l'intro si chiude; `versoContatti` se è stato scelto «Contatti». */
  onDone: (versoContatti: boolean) => void
  /** Nessuna animazione: si mostra direttamente lo stato finale (reduced motion). */
  statico?: boolean
}

const VIEWBOX = /viewBox="([^"]+)"/.exec(tagSvg)?.[1] ?? '0 0 706 490'
const TAG_D = / d="([^"]+)"/.exec(tagSvg)?.[1] ?? ''

/**
 * Tratti che «scrivono» la tag: non sono il contorno ma la mano, in ordine di scrittura. Fanno da maschera
 * larga sopra il tracciato vero (src/assets/tag.svg): dove passa il tratto compare l'inchiostro.
 * Coordinate nel viewBox della tag; se la tag viene ritracciata con un altro ritaglio vanno riviste.
 */
const TRATTI = [
  'M22,217 L360,22',
  'M142,64 L217,356',
  'M217,157 L247,255 L322,225 L300,112 L420,71 L540,79 L405,112 L517,135 L420,165',
  'M420,217 L690,195',
  'M270,255 L300,390 L330,300 L420,247 L405,382 L450,270 L525,345 L480,247 L555,217 L547,397',
  'M585,335 L597,347',
  'M330,465 L450,401',
  'M457,461 L517,420',
]
/** Durata relativa di ogni tratto (somma libera: si normalizza sul tempo di scrittura). */
const PESI = [3, 2.4, 6, 2, 7, 0.6, 1.2, 0.8]
const T_SCRITTURA = 1.35
const T_SPRAY = 0.75

/** Passata spray a zigzag su tutto lo schermo (viewBox 100×100 stirato): il tratto è largo quanto il passo, quindi copre tutto. */
const ZIGZAG = 'M-12,6 L112,-2 L-12,24 L112,16 L-12,42 L112,34 L-12,60 L112,52 L-12,78 L112,70 L-12,96 L112,88 L-12,112'

/**
 * Porta d'ingresso del sito (PLAN fase 2): la tag si scrive, una passata spray la copre e dal nero escono
 * la bio breve e due pulsanti. Meno di 3 secondi; click o Esc saltano allo stato finale; una volta per sessione
 * (lo decide chi la monta). Con `statico` mostra subito lo stato finale.
 */
export default function TagIntro({ onDone, statico = false }: Props) {
  const radice = useRef<HTMLDivElement>(null)
  const primo = useRef<HTMLButtonElement>(null)
  const tl = useRef<gsap.core.Timeline | null>(null)
  const finita = useRef(statico)

  useEffect(() => {
    const el = radice.current
    const app = document.getElementById('root')
    if (!el) return
    if (app) app.inert = true
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const ctx = gsap.context(() => {
      const tratti = gsap.utils.toArray<SVGPathElement>('.tagintro__tratto')
      const tutto = el.querySelector('.tagintro__tutto')
      const fine = () => {
        finita.current = true
        el.classList.add('is-finita')
        primo.current?.focus({ preventScroll: true })
      }
      if (statico) {
        gsap.set(tratti, { strokeDashoffset: 0 })
        gsap.set(tutto, { opacity: 1 })
        gsap.set('.tagintro__spray path', { strokeDashoffset: 0 })
        gsap.set('.tagintro__tag', { color: '#f7f7f5' })
        gsap.set('.tagintro__bio > *', { opacity: 1, y: 0 })
        fine()
        return
      }
      const somma = PESI.reduce((a, b) => a + b, 0)
      const t = gsap.timeline({ defaults: { ease: 'none' }, onComplete: fine })
      gsap.set('.tagintro__tag', { yPercent: 38, scale: 1.25 })
      tratti.forEach((p, i) => t.to(p, { strokeDashoffset: 0, duration: (PESI[i] / somma) * T_SCRITTURA }))
      t.set(tutto, { opacity: 1 })
        .to('.tagintro__spray path', { strokeDashoffset: 0, duration: T_SPRAY, ease: 'power1.inOut' }, '+=0.1')
        // Nero su nero la tag sparisce sotto lo spray, poi riemerge chiara e sale a fare da intestazione.
        .to('.tagintro__tag', { color: '#f7f7f5', duration: 0.25 }, '-=0.15')
        .to('.tagintro__tag', { yPercent: 0, scale: 1, duration: 0.5, ease: EASE_TUFFRAT }, '<')
        .to('.tagintro__bio > *', { opacity: 1, y: 0, duration: 0.45, stagger: 0.06, ease: EASE_TUFFRAT }, '<0.1')
      tl.current = t
    }, el)

    return () => {
      ctx.revert()
      tl.current = null
      if (app) app.inert = false
      document.body.style.overflow = overflow
    }
  }, [statico])

  // Durante l'animazione click ed Esc saltano alla fine; a intro finita Esc entra nel sito.
  const salta = () => {
    if (!finita.current) tl.current?.progress(1)
  }
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      e.preventDefault()
      if (finita.current) onDone(false)
      else tl.current?.progress(1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onDone])

  return createPortal(
    <div className="tagintro" ref={radice} role="dialog" aria-modal="true" aria-label={`${artista.brand}, presentazione`} onPointerDown={salta}>
      <svg className="tagintro__spray" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <path d={ZIGZAG} pathLength={1} />
      </svg>
      <div className="tagintro__colonna">
        <div className="tagintro__tag">
          <svg viewBox={VIEWBOX} role="img" aria-label={artista.brand}>
            <defs>
              <mask id="tagintro-scrivi" maskUnits="userSpaceOnUse">
                {TRATTI.map((d) => (
                  <path key={d} className="tagintro__tratto" d={d} pathLength={1} />
                ))}
                <rect className="tagintro__tutto" width="100%" height="100%" fill="#fff" opacity="0" />
              </mask>
            </defs>
            <path d={TAG_D} fill="currentColor" fillRule="evenodd" mask="url(#tagintro-scrivi)" />
          </svg>
        </div>
        <div className="tagintro__bio">
          <p className="tagintro__eyebrow">{artista.lede.join(' ')}</p>
          {artista.bioBreve.slice(0, 1).map((p) => (
            <p key={p} className="tagintro__testo">
              {p}
            </p>
          ))}
          <div className="tagintro__azioni">
            <button ref={primo} type="button" className="tagintro__btn tagintro__btn--pieno" data-cursor="spray" onClick={() => onDone(false)}>
              Galleria
            </button>
            <button type="button" className="tagintro__btn" data-cursor="spray" onClick={() => onDone(true)}>
              Contatti
            </button>
          </div>
        </div>
      </div>
      <button type="button" className="tagintro__salta" onClick={salta}>
        Salta
      </button>
    </div>,
    document.body,
  )
}

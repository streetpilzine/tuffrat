import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import type { PageFlip } from 'page-flip'
import { useMobile } from '../core/mobile'
import { usePrefs } from '../state/usePrefs'
import { descriviPagine, misureSfogliatore } from './logica/sfogliatore'
import { SfogliatoreMobile } from './SfogliatoreMobile'

interface Props {
  pagine: string[]
  /** Testo alternativo di ogni pagina, stesso ordine di `pagine`: diventa la didascalia dello sfogliatore. */
  altPagine?: string[]
  titolo: string
  /** Larghezza / altezza di una pagina (default A4 verticale). */
  proporzione?: number
  /** Misura di riferimento delle pagine, come in flipbook.js: le pagine si ingrandiscono fino a riempire lo spazio. */
  larghezza?: number
  altezza?: number
  /**
   * Punto di partenza per l'animazione d'ingresso, letto dal CSS (0 = dal centro, 1 = già a posto):
   * in 3D è la posizione del libro sul banco, in vista lista resta 0.
   */
  ingresso?: number
  /** Elemento che ha aperto la fanzine: alla chiusura, se è ancora in pagina, ci torna il focus. */
  origine?: HTMLElement | null
  /** Riporta il focus sulla scheda della fanzine quando quella di partenza non esiste più; vero se ci è riuscita. */
  tornoAlMioPosto?: () => boolean
  onClose: (origine: string | null) => void
}

/** Palette della fanzine: bianco caldo, testo #111, attenuato #555 (tuffrat-visual, valori TuffRat). */
const fondo = '#f7f7f5'
const attenuato = '#555'

/** Stile della didascalia sotto il libro: Caption 2 (14/20, Regular, attenuato). */
const stileDidascalia = { font: '400 14px/20px Manrope, sans-serif', color: attenuato, margin: 0, textAlign: 'center' } as const
/** Stile della riga «Pagina 3 di 8». */
const stilePagina = { font: '500 12px/16px Manrope, sans-serif', color: attenuato } as const

/** Fondo e testo delle pagine generate da `loadFromImages` (arrivavano senza stile, su trasparenza). */
const cssPagine = `
.flipbook__book .stf__item { background: ${fondo}; }
.flipbook__book .stf__item img { display: block; width: 100%; height: 100%; object-fit: fill; }
.flipbook__book.stf__parent::before { content: ''; position: absolute; inset: 0; margin: 0 auto; background: #000; opacity: 0.35; transition: opacity 300ms; }
.flipbook__book.stf__parent.--landscape::before { width: 50%; }
.flipbook__book.stf__parent.--portrait::before { width: 100%; }
.flipbook__book.is-pronto.stf__parent::before { opacity: 0; }
`

/**
 * Sfogliatore di una fanzine (ARCHITECTURE §7): incapsula `page-flip` con gli stessi parametri del
 * `flipbook.js` del sito precedente. Mouse e touch sfogliano trascinando l'angolo o cliccando la pagina,
 * le frecce ← → e i pulsanti fanno lo stesso da tastiera, Esc o il fondo chiudono.
 * `page-flip` disegna le pagine senza testo alternativo: una didascalia sotto il libro descrive la pagina
 * visibile (o la doppia pagina) a ogni cambio, ed è l'unico annuncio (il contatore non è `aria-live`).
 * Il focus resta dentro il dialogo e, alla chiusura, torna all'elemento che ha aperto la fanzine.
 * `page-flip` si scarica solo all'apertura.
 * Su mobile (`useMobile`) il libro è `SfogliatoreMobile`: una pagina per volta, sempre in orizzontale, col foglio
 * che segue il dito; qui restano le parti comuni (portale, dialog, Esc, focus, ritorno alla pagina).
 */
export function FlipBook({ pagine, altPagine = [], titolo, proporzione = 210 / 297, larghezza, altezza, ingresso = 0, origine, tornoAlMioPosto, onClose }: Props) {
  const libro = useRef<HTMLDivElement>(null)
  const chiudi = useRef<HTMLButtonElement>(null)
  const prossima = useRef<HTMLButtonElement>(null)
  const flip = useRef<PageFlip | null>(null)
  const [pagina, setPagina] = useState(1)
  const [pronto, setPronto] = useState(false)
  const [doppia, setDoppia] = useState(true)
  const reducedMotion = usePrefs((s) => s.reducedMotion)
  const mobile = useMobile()
  /** Lo sfoglio consuma le frecce solo dopo che le si è usate davvero: da lì la tabulazione entra nella barra. */
  const frecceUsate = useRef(false)

  useEffect(() => {
    let vivo = true
    const contenitore = libro.current
    // Su mobile lo sfoglio è `SfogliatoreMobile` (il portale sotto non monta nemmeno il contenitore di page-flip).
    if (!contenitore || mobile) return
    // page-flip sostituisce il nodo che riceve: gli si dà un figlio usa e getta, così React non perde il suo.
    const nodo = document.createElement('div')
    contenitore.appendChild(nodo)
    void import('page-flip').then((mod) => {
      // Il pacchetto pubblica un bundle UMD: a seconda del bundler la classe arriva come export nominato o dentro `default`.
      const PageFlip = mod.PageFlip ?? (mod as unknown as { default?: typeof mod }).default?.PageFlip
      if (!vivo || !PageFlip) return
      const stile = document.createElement('style')
      stile.textContent = cssPagine
      document.head.appendChild(stile)
      const misure = misureSfogliatore(
        proporzione,
        { larghezza: contenitore.clientWidth || window.innerWidth, altezza: contenitore.clientHeight || window.innerHeight },
      )
      const pf = new PageFlip(nodo, {
        width: larghezza ?? misure.larghezza,
        height: altezza ?? misure.altezza,
        size: 'stretch',
        minWidth: 160,
        maxWidth: 1000,
        minHeight: 160,
        maxHeight: 1400,
        drawShadow: true,
        // Con reduced motion lo sfoglio arriva subito alla pagina nuova: niente animazione lunga.
        flippingTime: reducedMotion ? 1 : 900,
        usePortrait: true,
        showCover: true,
        mobileScrollSupport: true,
        showPageCorners: true,
        autoSize: true,
        maxShadowOpacity: 0.5,
        swipeDistance: 30,
        useMouseEvents: true,
        disableFlipByClick: false,
      })
      pf.loadFromImages(pagine)
      pf.on('flip', (e) => setPagina(Number(e.data) + 1))
      pf.on('changeOrientation', (e) => setDoppia(String(e.data).toLowerCase() === 'landscape'))
      pf.on('init', (e) => {
        setDoppia((e.data as { mode?: string }).mode?.toLowerCase() === 'landscape')
        setPronto(true)
      })
      flip.current = pf
      return () => stile.remove()
    })
    return () => {
      vivo = false
      try {
        flip.current?.destroy()
      } catch {
        /* già distrutto */
      }
      flip.current = null
      contenitore.replaceChildren()
    }
  }, [mobile, pagine, proporzione, larghezza, altezza, reducedMotion])

  const origineRef = useRef(origine)
  const postoRef = useRef(tornoAlMioPosto)
  const chiudiRef = useRef(onClose)

  /** Chiude e segnala alla pagina il link di partenza (se c'è ancora): la pagina decide dove tornare. */
  const chiudiOra = useCallback(() => {
    const o = origineRef.current
    chiudiRef.current(o?.isConnected ? o.getAttribute('href') : null)
  }, [])

  // Gli ascoltatori si installano una volta, all'apertura: gli ultimi valori restano nei ref (`chiudiOra` è stabile).
  useEffect(() => {
    origineRef.current = origine
    postoRef.current = tornoAlMioPosto
  }, [origine, tornoAlMioPosto])
  useEffect(() => {
    chiudiRef.current = onClose
  }, [onClose])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Esc arriva solo se non l'ha già consumato un altro overlay (dialoghi nativi).
      if (e.defaultPrevented) return
      if (e.key === 'Escape') {
        e.preventDefault()
        chiudiOra()
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        frecceUsate.current = true
        if (e.key === 'ArrowRight') flip.current?.flipNext()
        else flip.current?.flipPrev()
      }
    }
    const onResize = () => flip.current?.update()
    window.addEventListener('keydown', onKey)
    window.addEventListener('resize', onResize)
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    chiudi.current?.focus()
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('resize', onResize)
      document.body.style.overflow = overflow
    }
  }, [chiudiOra])
  // Se lo sfoglio arriva dopo l'apertura (import lento), il focus non deve restare sulla pagina dietro.
  useEffect(() => {
    frecceUsate.current = false
    if (!frecceUsate.current) chiudi.current?.focus()
  }, [pronto])

  // Chiusura: se l'elemento di partenza esiste ancora torna lì, altrimenti sulla scheda aperta.
  useEffect(
    () => () => {
      const o = origineRef.current
      if (o?.isConnected) {
        o.focus({ preventScroll: true })
      } else if (!postoRef.current?.()) {
        // Senza un posto migliore: la scheda aperta (`inert` se il cassetto 3D è chiuso, quindi il focus resta al `body`).
        document.getElementById('scheda-corpo')?.focus({ preventScroll: true })
      }
    },
    [],
  )

  const vaiAPagina = (e: { preventDefault: () => void }, passo: 1 | -1) => {
    e.preventDefault()
    frecceUsate.current = true
    if (passo === 1) prossima.current?.focus()
    else chiudi.current?.focus()
  }

  const mostra = Math.min(Math.max(pagina, 1), pagine.length)
  const descrizione = descriviPagine(pagine.length, mostra, doppia, altPagine)

  // In portale su body: la scheda che ospita la pagina è `inert` da chiusa e ha un transform (romperebbe `position: fixed`).
  if (mobile) {
    return createPortal(
      <div className="flipbook-overlay is-open sfoglia-overlay" role="dialog" aria-modal="true" aria-label={`Sfoglia ${titolo}`}>
        <SfogliatoreMobile
          pagine={pagine}
          altPagine={altPagine}
          titolo={titolo}
          proporzione={proporzione}
          ridottoMovimento={reducedMotion}
          chiudiRef={chiudi}
          onClose={chiudiOra}
        />
      </div>,
      document.body,
    )
  }
  return createPortal(
    <div className="flipbook-overlay is-open" role="dialog" aria-modal="true" aria-label={`Sfoglia ${titolo}`}>
      <div className="flipbook__backdrop" onClick={() => chiudiOra()} />
      <div className="flipbook__content">
        <button
          ref={chiudi}
          type="button"
          className="flipbook__close"
          aria-label="Chiudi"
          onClick={() => chiudiOra()}
          onKeyDown={(e) => {
            if (e.key === 'Tab' && e.shiftKey && !frecceUsate.current) {
              e.preventDefault()
              prossima.current?.focus()
            }
          }}
        >
          ×
        </button>
        <p className="flipbook__title">{titolo}</p>
        {/* La doppia pagina non supera l'altezza disponibile: la larghezza massima deriva dalla proporzione. */}
        <div
          className={`flipbook__book${pronto ? ' is-pronto' : ''}`}
          ref={libro}
          style={
            {
              maxWidth: `calc((min(88dvh, 1600px) - 14rem) * ${(2 * proporzione).toFixed(4)})`,
              '--ingresso': ingresso,
            } as CSSProperties
          }
        />
        <p className="flipbook__didascalia" style={stileDidascalia} aria-live="polite" aria-atomic="true">
          {descrizione}
        </p>
        <div className="flipbook__bar">
          <button type="button" aria-label="Pagina precedente" onClick={() => flip.current?.flipPrev()} onKeyDown={(e) => e.key === 'Tab' && !e.shiftKey && vaiAPagina(e, -1)}>
            ←
          </button>
          <span className="flipbook__count" style={stilePagina} aria-hidden="true">
            {mostra} di {pagine.length}
          </span>
          <button
            ref={prossima}
            type="button"
            aria-label="Pagina successiva"
            onClick={() => flip.current?.flipNext()}
            onKeyDown={(e) => e.key === 'Tab' && !e.shiftKey && vaiAPagina(e, 1)}
          >
            →
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}

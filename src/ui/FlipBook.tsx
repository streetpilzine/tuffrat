import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { PageFlip } from 'page-flip'

interface Props {
  pagine: string[]
  titolo: string
  /** Larghezza / altezza di una pagina (default A4 verticale). */
  proporzione?: number
  onClose: () => void
}

/**
 * Sfogliatore di una fanzine (ARCHITECTURE §7): incapsula `page-flip` con gli stessi parametri del
 * `flipbook.js` del sito precedente. Mouse e touch sfogliano trascinando l'angolo o cliccando la pagina,
 * le frecce ← → e i pulsanti fanno lo stesso da tastiera, Esc o il fondo chiudono.
 * `page-flip` si scarica solo all'apertura.
 */
export function FlipBook({ pagine, titolo, proporzione = 210 / 297, onClose }: Props) {
  const libro = useRef<HTMLDivElement>(null)
  const chiudi = useRef<HTMLButtonElement>(null)
  const flip = useRef<PageFlip | null>(null)
  const [pagina, setPagina] = useState(1)
  const [pronto, setPronto] = useState(false)

  useEffect(() => {
    let vivo = true
    const contenitore = libro.current
    if (!contenitore) return
    // page-flip sostituisce il nodo che riceve: gli si dà un figlio usa e getta, così React non perde il suo.
    const nodo = document.createElement('div')
    contenitore.appendChild(nodo)
    void import('page-flip').then((mod) => {
      // Il pacchetto pubblica un bundle UMD: a seconda del bundler la classe arriva come export nominato o dentro `default`.
      const PageFlip = mod.PageFlip ?? (mod as unknown as { default?: typeof mod }).default?.PageFlip
      if (!vivo || !PageFlip) return
      const altezza = 778
      const pf = new PageFlip(nodo, {
        width: Math.round(altezza * proporzione),
        height: altezza,
        size: 'stretch',
        minWidth: 240,
        maxWidth: 1000,
        minHeight: 320,
        maxHeight: 1400,
        drawShadow: true,
        flippingTime: 900,
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
      flip.current = pf
      setPronto(true)
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
  }, [pagine, proporzione])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      } else if (e.key === 'ArrowRight') flip.current?.flipNext()
      else if (e.key === 'ArrowLeft') flip.current?.flipPrev()
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
  }, [onClose])

  // In portale su body: la scheda che ospita la pagina è `inert` da chiusa e ha un transform (romperebbe `position: fixed`).
  return createPortal(
    <div className="flipbook-overlay is-open" role="dialog" aria-modal="true" aria-label={`Sfoglia ${titolo}`}>
      <div className="flipbook__backdrop" onClick={onClose} />
      <div className="flipbook__content">
        <button ref={chiudi} type="button" className="flipbook__close" aria-label="Chiudi" onClick={onClose}>
          ×
        </button>
        <div className="flipbook__title">{titolo}</div>
        {/* La doppia pagina non supera l'altezza disponibile: la larghezza massima deriva dalla proporzione. */}
        <div
          className={`flipbook__book${pronto ? ' is-pronto' : ''}`}
          ref={libro}
          style={{ maxWidth: `calc((min(88dvh, 1600px) - 112px) * ${(2 * proporzione).toFixed(4)})` }}
        />
        <div className="flipbook__bar">
          <button type="button" aria-label="Pagina precedente" onClick={() => flip.current?.flipPrev()}>
            ←
          </button>
          <span className="flipbook__count" aria-live="polite">
            {pagina} / {pagine.length}
          </span>
          <button type="button" aria-label="Pagina successiva" onClick={() => flip.current?.flipNext()}>
            →
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}

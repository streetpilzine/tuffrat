import { useEffect, useLayoutEffect, useRef, type CSSProperties, type RefObject } from 'react'
import type { Fotogramma } from '../data'

interface Props {
  foto: Fotogramma[]
  /** Indice della foto aperta; `null` chiude il visore. */
  indice: number | null
  onChange: (indice: number | null) => void
  /** Titolo del rullino, per l'etichetta del dialogo. */
  rullino: string
  /** Miniatura da cui è partito il focus: ci torna alla chiusura. */
  origine: RefObject<HTMLButtonElement | null>
}

/**
 * Visore a tutto schermo di un rullino (fase 3): `<dialog>` nativo, quindi focus trattenuto dentro il dialogo e
 * Esc gestito dal browser. Frecce ← → e i pulsanti precedente/successiva cambiano foto; la foto non si mostra
 * mai più grande del file (larghezza massima pari alla sua larghezza in pixel). Alla chiusura il focus torna alla miniatura.
 * I due pulsanti sono gli stessi nodi da una foto all'altra: cambiando con le frecce il focus va sul pulsante
 * della direzione, così il Tab successivo non rimbalza sul bordo del dialogo.
 */
export function FotoVisore({ foto, indice, onChange, rullino, origine }: Props) {
  const ref = useRef<HTMLDialogElement>(null)
  const precedente = useRef<HTMLButtonElement>(null)
  const successiva = useRef<HTMLButtonElement>(null)
  /** Direzione dell'ultimo cambio: 1 = avanti, -1 = indietro, 0 = nessun cambio (apertura o click sui pulsanti). */
  const daFrecce = useRef<1 | -1 | 0>(0)
  const ultima = useRef<number | null>(null)
  const corrente = indice === null ? null : foto[indice]

  // Apre e chiude il dialogo nativo; il cambio di pagina non tocca il focus.
  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (corrente && !d.open) {
      ultima.current = null
      d.showModal()
    }
    if (!corrente && d.open) d.close()
  }, [corrente])

  // Cambio di foto con le frecce: il focus segue la direzione. Va messo prima della registrazione di `ultima`.
  useLayoutEffect(() => {
    if (indice === null || ultima.current === null || indice === ultima.current || !daFrecce.current) return
    ;(daFrecce.current === 1 ? successiva : precedente).current?.focus({ preventScroll: true })
  }, [indice])

  useEffect(() => {
    ultima.current = indice
    daFrecce.current = 0
  })

  // Alla chiusura (anche con Esc) il focus torna alla miniatura di partenza.
  useEffect(() => {
    if (indice !== null) return
    origine.current?.focus({ preventScroll: true })
  }, [indice, origine])

  useEffect(() => {
    if (indice === null) return
    const onKey = (e: KeyboardEvent) => {
      // Esc lo consuma il dialogo nativo; qui solo le frecce, e solo se un altro overlay non le ha già prese.
      if (e.defaultPrevented || (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft')) return
      e.preventDefault()
      const passo = e.key === 'ArrowRight' ? 1 : -1
      daFrecce.current = passo
      onChange((indice + passo + foto.length) % foto.length)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [indice, foto.length, onChange])

  const sposta = (passo: 1 | -1) => {
    daFrecce.current = 0
    if (indice === null) return
    onChange((indice + passo + foto.length) % foto.length)
  }
  const chiudi = () => onChange(null)

  return (
    <dialog
      ref={ref}
      className="fotovisore"
      aria-label={`Visore, rullino ${rullino}`}
      onClose={chiudi}
      onClick={(e) => {
        if (e.target === e.currentTarget) chiudi()
      }}
    >
      {corrente && indice !== null && (
        <div className="fotovisore__content">
          <div className="fotovisore__barra">
            <span className="fotovisore__conta" aria-live="polite">
              {indice + 1} di {foto.length}
            </span>
            <button type="button" className="fotovisore__pulsante" aria-label="Chiudi" onClick={chiudi}>
              <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true" focusable="false">
                <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          </div>
          <div className="fotovisore__img" style={{ '--foto-max': `${corrente.width}px` } as CSSProperties}>
            {/* La foto non supera mai la misura del file mostrato (grande qui, piccolo in griglia). */}
            <img src={corrente.src} alt={corrente.alt} width={corrente.width} height={corrente.height} decoding="async" />
          </div>
          <div className="fotovisore__didascalia">
            <p className="fotovisore__alt">{corrente.alt}</p>
            <div className="fotovisore__nav">
              <button
                ref={precedente}
                type="button"
                className="fotovisore__pulsante fotovisore__pulsante--testo"
                onClick={() => sposta(-1)}
                onKeyDown={(e) => {
                  // Da «Precedente» il Tab porta a «Successiva»: il contatore in mezzo non è raggiungibile.
                  if (e.key === 'Tab' && !e.shiftKey) {
                    e.preventDefault()
                    successiva.current?.focus()
                  }
                }}
              >
                <span aria-hidden="true">←</span> Precedente
              </button>
              <button ref={successiva} type="button" className="fotovisore__pulsante fotovisore__pulsante--testo" onClick={() => sposta(1)}>
                Successiva <span aria-hidden="true">→</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </dialog>
  )
}

import { useEffect, useRef } from 'react'
import { Link } from 'react-router'
import { statoLabel, type Opera } from '../data'
import { misureLabel, tecnicaCompleta } from '../lib/format'

interface Props {
  opere: Opera[]
  indice: number | null
  onChange: (indice: number | null) => void
}

/**
 * Visualizzatore opera: stessa resa della lightbox legacy, ma su <dialog> nativo
 * (focus trattenuto, Esc gestito dal browser, frecce per prec/succ).
 */
export function Lightbox({ opere, indice, onChange }: Props) {
  const ref = useRef<HTMLDialogElement>(null)
  const opera = indice === null ? null : opere[indice]

  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (opera && !d.open) d.showModal()
    if (!opera && d.open) d.close()
  }, [opera])

  useEffect(() => {
    if (indice === null) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') onChange((indice + 1) % opere.length)
      if (e.key === 'ArrowLeft') onChange((indice - 1 + opere.length) % opere.length)
    }
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [indice, opere.length, onChange])

  return (
    <dialog
      ref={ref}
      className="lightbox"
      aria-label="Visualizzatore opera"
      onClose={() => onChange(null)}
      onClick={(e) => {
        if (e.target === e.currentTarget) onChange(null)
      }}
    >
      {opera && (
        <div className="lightbox__content">
          <button className="lightbox__close" aria-label="Chiudi" onClick={() => onChange(null)}>
            ×
          </button>
          <div className="lightbox__img-wrap">
            <img src={opera.immagine.src} alt={opera.immagine.alt} width={opera.immagine.width} height={opera.immagine.height} />
          </div>
          <div className="lightbox__meta">
            <h3>{opera.titolo}</h3>
            <p>Anno: {opera.anno}</p>
            <p>Tecnica: {tecnicaCompleta(opera)}</p>
            <p>Dimensioni: {misureLabel(opera.misure)}</p>
            <p>
              Status: {statoLabel[opera.stato]}
              {opera.nota ? ` — ${opera.nota}` : ''}
            </p>
            <p>
              <Link to={`/opere/${opera.id}`}>Scheda completa →</Link>
            </p>
          </div>
          {opere.length > 1 && (
            <div className="lightbox__nav">
              <button onClick={() => onChange((indice! - 1 + opere.length) % opere.length)} aria-label="Precedente">
                ← Prec
              </button>
              <button onClick={() => onChange((indice! + 1) % opere.length)} aria-label="Successivo">
                Succ →
              </button>
            </div>
          )}
        </div>
      )}
    </dialog>
  )
}

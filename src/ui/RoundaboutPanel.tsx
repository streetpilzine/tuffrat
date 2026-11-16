import { useRef, useState, type KeyboardEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { leggiRoundabout, ROUNDABOUT_DEFAULT, ruota, scambia, scriviRoundabout, slotVicino, ugualeRoundabout, type StatoRoundabout } from '../core/roundabout'
import { opereById, type Serie } from '../data'

const SCAMBI: { a: number; b: number; label: string }[] = [
  { a: 0, b: 1, label: 'Scambia le due in alto' },
  { a: 2, b: 3, label: 'Scambia le due in basso' },
  { a: 0, b: 2, label: 'Scambia le due a sinistra' },
  { a: 1, b: 3, label: 'Scambia le due a destra' },
]

const POSIZIONI = ['in alto a sinistra', 'in alto a destra', 'in basso a sinistra', 'in basso a destra']
const FRECCE: Record<string, 'su' | 'giu' | 'sx' | 'dx'> = { ArrowUp: 'su', ArrowDown: 'giu', ArrowLeft: 'sx', ArrowRight: 'dx' }

/**
 * Roundabout nel DOM: l'equivalente accessibile del `RoundaboutBoard` 3D, usato in vista lista e nella scheda.
 * Stesso stato nell'URL (`?p=&r=`). Click o Invio su una tessera la ruota di 90°; le frecce da tastiera
 * la scambiano con la vicina; i pulsanti sotto fanno gli scambi senza tastiera (touch).
 */
export function RoundaboutPanel({ serie }: { serie: Serie }) {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const griglia = useRef<HTMLDivElement>(null)
  const [copiato, setCopiato] = useState(false)
  const tessere = serie.modulare?.tessere ?? []
  const stato = leggiRoundabout(`?${params.toString()}`)
  const applica = (s: StatoRoundabout) => void navigate({ search: scriviRoundabout(s) }, { replace: true })

  const onKey = (e: KeyboardEvent<HTMLButtonElement>, slot: number) => {
    const dir = FRECCE[e.key]
    if (dir) {
      e.preventDefault()
      const meta = slotVicino(slot, dir)
      if (meta === slot) return
      applica(scambia(stato, slot, meta))
      // Il fuoco segue la tessera nello slot di arrivo.
      griglia.current?.querySelectorAll<HTMLButtonElement>('button')[meta]?.focus()
    } else if (e.key.toLowerCase() === 'r') {
      e.preventDefault()
      applica(ruota(stato, slot))
    }
  }

  const copia = () => {
    void navigator.clipboard?.writeText(window.location.href).then(() => {
      setCopiato(true)
      window.setTimeout(() => setCopiato(false), 1600)
    })
  }

  return (
    <section className="roundabout" aria-labelledby="roundabout-titolo">
      <h2 id="roundabout-titolo" className="sr-only">
        Componi Roundabout
      </h2>
      <div className="roundabout__griglia" ref={griglia}>
        {stato.p.map((t, slot) => {
          const opera = opereById.get(tessere[t]?.opera ?? '')
          const src = tessere[t]?.texture?.replace(/\.webp$/, '-1024.webp') ?? opera?.immagine.src
          return (
            <button
              key={t}
              type="button"
              className="roundabout__tessera"
              style={{ order: slot }}
              data-cursor="hand"
              aria-label={`${opera?.titolo ?? `Tessera ${t + 1}`}, ${POSIZIONI[slot]}, ruotata di ${stato.r[t] * 90} gradi. Invio per ruotare, frecce per scambiare.`}
              onClick={() => applica(ruota(stato, slot))}
              onKeyDown={(e) => onKey(e, slot)}
            >
              <img src={src} alt="" width={1024} height={1024} style={{ transform: `rotate(${stato.r[t] * 90}deg)` }} draggable={false} />
            </button>
          )
        })}
      </div>
      <div className="roundabout__azioni">
        <p className="roundabout__aiuto">Clicca una tessera per ruotarla di 90°. Ogni disposizione ha il suo link.</p>
        <div className="roundabout__pulsanti">
          {SCAMBI.map((s) => (
            <button key={s.label} type="button" className="link" onClick={() => applica(scambia(stato, s.a, s.b))}>
              {s.label}
            </button>
          ))}
          <button type="button" className="link" disabled={ugualeRoundabout(stato, ROUNDABOUT_DEFAULT)} onClick={() => applica(ROUNDABOUT_DEFAULT)}>
            Ripristina
          </button>
          <button type="button" className="button" onClick={copia}>
            {copiato ? 'Link copiato' : 'Copia link'}
          </button>
        </div>
      </div>
    </section>
  )
}

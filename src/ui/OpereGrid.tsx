import { useState } from 'react'
import type { Opera } from '../data'
import { didascalia } from '../lib/format'
import { ListView } from '../core/ListView'
import { Lightbox } from './Lightbox'

interface Props {
  opere: Opera[]
  /** Mostra l'immagine intera invece del crop 4:3 (serie e polittici). */
  contain?: boolean
  label: string
}

/** Griglia di card come nel sito precedente; ogni card è un pulsante che apre la lightbox. */
export function OpereGrid({ opere, contain, label }: Props) {
  const [indice, setIndice] = useState<number | null>(null)
  return (
    <>
      <ListView
        items={opere}
        label={label}
        className="grid"
        keyOf={(o) => o.id}
        renderItem={(o, i) => (
          <button
            type="button"
            className={`card card--button lightbox-trigger${contain ? ' card--contain' : ''}`}
            data-cursor="hand"
            onClick={() => setIndice(i)}
            aria-label={`Apri ${o.titolo}, ${o.anno}`}
          >
            <figure>
              <img src={o.immagine.src} alt={o.immagine.alt} width={o.immagine.width} height={o.immagine.height} loading="lazy" />
              <figcaption>{didascalia(o)}</figcaption>
            </figure>
          </button>
        )}
      />
      <Lightbox opere={opere} indice={indice} onChange={setIndice} />
    </>
  )
}

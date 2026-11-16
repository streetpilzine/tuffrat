import { useState } from 'react'
import { Link } from 'react-router'
import type { Opera } from '../data'
import { didascalia } from '../lib/format'
import { ListView } from '../core/ListView'
import { Lightbox } from './Lightbox'
import { modo3D, usePrefs } from '../state/usePrefs'

interface Props {
  opere: Opera[]
  /** Mostra l'immagine intera invece del crop 4:3 (serie e polittici). */
  contain?: boolean
  label: string
}

/**
 * Griglia di card come nel sito precedente. In vista lista ogni card è un pulsante che apre la lightbox;
 * in 3D è un link a `/opere/:slug`, dove la camera raggiunge l'opera sul muro.
 */
export function OpereGrid({ opere, contain, label }: Props) {
  const [indice, setIndice] = useState<number | null>(null)
  const in3D = modo3D(usePrefs())
  const figura = (o: Opera) => (
    <figure>
      <img src={o.immagine.src} alt={o.immagine.alt} width={o.immagine.width} height={o.immagine.height} loading="lazy" />
      <figcaption>{didascalia(o)}</figcaption>
    </figure>
  )
  const classe = `card card--button lightbox-trigger${contain ? ' card--contain' : ''}`
  return (
    <>
      <ListView
        items={opere}
        label={label}
        className="grid"
        keyOf={(o) => o.id}
        renderItem={(o, i) =>
          in3D ? (
            <Link to={`/opere/${o.id}`} className={`${classe} card-link`} data-cursor="hand" aria-label={`Vai a ${o.titolo}, ${o.anno}`}>
              {figura(o)}
            </Link>
          ) : (
            <button type="button" className={classe} data-cursor="hand" onClick={() => setIndice(i)} aria-label={`Apri ${o.titolo}, ${o.anno}`}>
              {figura(o)}
            </button>
          )
        }
      />
      <Lightbox opere={opere} indice={indice} onChange={setIndice} />
    </>
  )
}

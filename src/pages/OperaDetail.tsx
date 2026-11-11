import { Link, useParams } from 'react-router'
import { serieById, statoLabel, tutteLeOpereById } from '../data'
import { misureLabel, tecnicaCompleta } from '../lib/format'
import { NotFound } from './NotFound'

export function OperaDetail() {
  const { slug = '' } = useParams()
  const o = tutteLeOpereById.get(slug)
  if (!o) return <NotFound />
  const s = o.serie ? serieById.get(o.serie) : undefined
  return (
    <article className="opera">
      <div className="opera__img">
        <img src={o.immagine.src} alt={o.immagine.alt} width={o.immagine.width} height={o.immagine.height} />
        {o.dettagli && (
          <div className="opera__dettagli">
            {o.dettagli.map((d) => (
              <img key={d.src} src={d.src} alt={d.alt} width={d.width} height={d.height} loading="lazy" />
            ))}
          </div>
        )}
      </div>
      <div className="opera__meta">
        <p className="eyebrow">{s ? <Link to={`/serie/${s.id}`}>{s.titolo}</Link> : 'Opera singola'}</p>
        <h1>{o.titolo}</h1>
        <dl>
          <dt>Anno</dt>
          <dd>{o.anno}</dd>
          <dt>Tecnica</dt>
          <dd>{tecnicaCompleta(o)}</dd>
          <dt>Dimensioni</dt>
          <dd>{misureLabel(o.misure)}</dd>
          <dt>Status</dt>
          <dd>
            {statoLabel[o.stato]}
            {o.nota ? ` — ${o.nota}` : ''}
          </dd>
        </dl>
        <p>
          <Link className="link" to={s ? `/serie/${s.id}` : '/#galleria'}>
            ← Torna alla galleria
          </Link>
        </p>
      </div>
    </article>
  )
}

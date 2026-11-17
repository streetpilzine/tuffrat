import { Link, useParams } from 'react-router'
import { useMobile } from '../core/mobile'
import { serieById, statoLabel, tutteLeOpereById } from '../data'
import { misureLabel, tecnicaCompleta } from '../lib/format'
import { ImmagineZoom } from '../ui/ImmagineZoom'
import { NotFound } from './NotFound'

export function OperaDetail() {
  const { slug = '' } = useParams()
  // Su telefono l'immagine e i dettagli si ingrandiscono dentro il loro riquadro (la scheda e la pagina restano ferme).
  const mobile = useMobile()
  const o = tutteLeOpereById.get(slug)
  if (!o) return <NotFound />
  const s = o.serie ? serieById.get(o.serie) : undefined
  return (
    <article className={`opera${mobile ? ' opera--mobile' : ''}`}>
      <div className="opera__img">
        {mobile ? (
          <ImmagineZoom
            src={o.immagine.src}
            alt={o.immagine.alt}
            width={o.immagine.width}
            height={o.immagine.height}
            // L'immagine è la pagina: si carica subito, così nella scheda si vede intera appena aperta.
            loading="eager"
          />
        ) : (
          <img src={o.immagine.src} alt={o.immagine.alt} width={o.immagine.width} height={o.immagine.height} />
        )}
        {o.dettagli && (
          <div className="opera__dettagli">
            {o.dettagli.map((d) =>
              mobile ? (
                <ImmagineZoom key={d.src} src={d.src} alt={d.alt} width={d.width} height={d.height} loading="lazy" />
              ) : (
                <img key={d.src} src={d.src} alt={d.alt} width={d.width} height={d.height} loading="lazy" />
              ),
            )}
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

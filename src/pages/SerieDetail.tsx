import { useParams } from 'react-router'
import { opereDiSerie, politticiDiSerie, serieById } from '../data'
import { misureLabel, tecnicaCompleta } from '../lib/format'
import { OpereGrid } from '../ui/OpereGrid'
import { PageHeader } from '../ui/PageHeader'
import { NotFound } from './NotFound'

export function SerieDetail() {
  const { slug = '' } = useParams()
  const s = serieById.get(slug)
  if (!s) return <NotFound />

  return (
    <>
      <PageHeader titolo={s.titolo} sotto={s.descrizione} />
      {(s.tipo === 'raccolta' || s.tipo === 'modulare') && (
        <section className="gallery" style={{ marginTop: '1rem' }}>
          <OpereGrid opere={opereDiSerie(s.id)} contain label={`Opere ${s.titolo}`} />
        </section>
      )}
      {s.tipo === 'polittici' &&
        politticiDiSerie(s.id).map((p) => (
          <section className="polittico" key={p.id} aria-labelledby={`pol-${p.id}`}>
            <h3 id={`pol-${p.id}`}>{p.titolo}</h3>
            <p className="polittico__meta">
              {p.anno} · {p.pannelli.length} pannelli · {misureLabel(p.pannelli[0].misure)} ciascuno · {tecnicaCompleta(p)}
            </p>
            <OpereGrid opere={p.pannelli} contain label={`Pannelli ${p.titolo}`} />
          </section>
        ))}
    </>
  )
}

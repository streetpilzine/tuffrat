import { useParams } from 'react-router'
import { useMobile } from '../core/mobile'
import { opereDiSerie, politticiDiSerie, serieById } from '../data'
import { misureLabel, tecnicaCompleta } from '../lib/format'
import { OpereGrid } from '../ui/OpereGrid'
import { PageHeader } from '../ui/PageHeader'
import { Polyptych } from '../ui/Polyptych'
import { RoundaboutPanel } from '../ui/RoundaboutPanel'
import { useLayout } from '../state/useLayout'
import { NotFound } from './NotFound'

export function SerieDetail() {
  const { slug = '' } = useParams()
  const s = serieById.get(slug)
  const ordini = useLayout((l) => l.ordini)
  const riordina = useLayout((l) => l.riordina)
  // Telefono: niente pannello 2×2 di Roundabout nella scheda (le tessere si compongono sul muro), e i polittici restano fermi.
  const mobile = useMobile()
  if (!s) return <NotFound />

  return (
    <>
      <PageHeader titolo={s.titolo} sotto={s.descrizione} />
      {s.tipo === 'modulare' && !mobile && <RoundaboutPanel serie={s} />}
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
            {/* Su telefono `Polyptych` ignora l'ordine della sessione e mostra `ordineDefault`. */}
            <Polyptych polittico={p} ordine={ordini[p.id] ?? p.ordineDefault} onReorder={(o) => riordina(p.id, o)} />
          </section>
        ))}
    </>
  )
}

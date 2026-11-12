import { mostre } from '../data'
import { ListView } from '../core/ListView'
import { Contatti } from '../ui/Contatti'
import { PageHeader } from '../ui/PageHeader'

export function Mostre() {
  return (
    <>
      <PageHeader titolo="Mostre" sotto="Percorso espositivo recente" />
      <ListView
        items={mostre}
        label="Mostre"
        className="mostre"
        keyOf={(m) => m.id}
        renderItem={(m) => (
          <article className="mostra" id={m.id}>
            <h3>{m.titolo}</h3>
            <p className="mostra__meta">
              {m.anno} · {m.luogo}, {m.citta}
              {m.link?.instagram && (
                <>
                  {' · '}
                  <a href={m.link.instagram} target="_blank" rel="noreferrer">
                    Instagram
                  </a>
                </>
              )}
            </p>
          </article>
        )}
      />
      <Contatti />
    </>
  )
}

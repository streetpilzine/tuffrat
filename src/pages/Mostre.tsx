import { mostre } from '../data'
import { Contatti } from '../ui/Contatti'
import { PageHeader } from '../ui/PageHeader'

export function Mostre() {
  return (
    <>
      <PageHeader titolo="Mostre" sotto="Percorso espositivo recente" />
      <ul className="mostre" style={{ listStyle: 'none', padding: 0 }}>
        {mostre.map((m) => (
          <li className="mostra" key={m.id} id={m.id}>
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
          </li>
        ))}
      </ul>
      <Contatti />
    </>
  )
}

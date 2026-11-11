import { Link } from 'react-router'
import { serie } from '../data'
import { PageHeader } from '../ui/PageHeader'

export function SerieIndex() {
  return (
    <>
      <PageHeader titolo="Serie" sotto="Corpi di lavoro organizzati per serie" />
      <ul className="grid" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {serie.map((s) => (
          <li key={s.id}>
            <Link to={`/serie/${s.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
              <figure className="card">
                <img src={s.copertina.src} alt={s.copertina.alt} width={s.copertina.width} height={s.copertina.height} loading="lazy" />
                <figcaption>
                  {s.titolo} · {s.periodo}
                </figcaption>
              </figure>
            </Link>
          </li>
        ))}
      </ul>
    </>
  )
}

import { Link } from 'react-router'
import { serie } from '../data'
import { ListView } from '../core/ListView'
import { PageHeader } from '../ui/PageHeader'

export function SerieIndex() {
  return (
    <>
      <PageHeader titolo="Serie" sotto="Corpi di lavoro organizzati per serie" />
      <ListView
        items={serie}
        label="Serie"
        className="grid"
        keyOf={(s) => s.id}
        renderItem={(s) => (
          <Link to={`/serie/${s.id}`} className="card-link" data-cursor="hand">
            <figure className="card">
              <img src={s.copertina.src} alt={s.copertina.alt} width={s.copertina.width} height={s.copertina.height} loading="lazy" />
              <figcaption>
                {s.titolo} · {s.periodo}
              </figcaption>
            </figure>
          </Link>
        )}
      />
    </>
  )
}

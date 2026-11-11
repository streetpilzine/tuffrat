import { Link } from 'react-router'
import { edizioni } from '../data'
import { Contatti } from '../ui/Contatti'
import { PageHeader } from '../ui/PageHeader'

export function Edizioni() {
  return (
    <>
      <PageHeader titolo="Edizioni" sotto="Fanzine, stampe limitate, multipli e collaborazioni. Clicca su una fanzine per sfogliarla." />
      <section className="gallery" aria-label="Edizioni e fanzine" style={{ marginTop: '1rem' }}>
        {edizioni.length === 0 ? (
          <p className="edizioni__note">Fanzine in digitalizzazione — in arrivo.</p>
        ) : (
          <ul className="grid" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {edizioni.map((e) => (
              <li key={e.id}>
                <Link to={`/edizioni/${e.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                  <figure className="card flipbook-trigger">
                    <img src={e.copertina.src} alt={e.copertina.alt} width={e.copertina.width} height={e.copertina.height} loading="lazy" />
                    <figcaption>
                      {e.titolo} · {e.anno} · Fanzine
                    </figcaption>
                  </figure>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
      <Contatti titolo="Acquisti & richieste" testo="Per ordini, distribuzione o collaborazioni editoriali:" />
    </>
  )
}

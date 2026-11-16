import { useCallback } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { ListView } from '../core/ListView'
import { edizioneVisibile, edizioniVisibili } from '../lib/edizioni'
import { Contatti } from '../ui/Contatti'
import { FlipBook } from '../ui/FlipBook'
import { PageHeader } from '../ui/PageHeader'

/** `/edizioni` elenca le fanzine; `/edizioni/:slug` apre direttamente lo sfogliatore sopra l'elenco (e sopra il banco, in 3D). */
export function Edizioni() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const aperta = edizioneVisibile(slug)
  const chiudi = useCallback(() => void navigate('/edizioni'), [navigate])

  return (
    <>
      <PageHeader titolo="Edizioni" sotto="Fanzine, stampe limitate, multipli e collaborazioni. Clicca su una fanzine per sfogliarla." />
      <section className="gallery" aria-label="Edizioni e fanzine" style={{ marginTop: '1rem' }}>
        {edizioniVisibili.length === 0 ? (
          <p className="edizioni__note">Fanzine in digitalizzazione — in arrivo.</p>
        ) : (
          <ListView
            items={edizioniVisibili}
            label="Fanzine"
            className="grid"
            keyOf={(e) => e.id}
            renderItem={(e) => (
              <Link to={`/edizioni/${e.id}`} className="card-link" data-cursor="hand">
                <figure className="card card--contain flipbook-trigger">
                  <img src={e.copertina.src} alt={e.copertina.alt} width={e.copertina.width} height={e.copertina.height} loading="lazy" />
                  <figcaption>
                    {e.titolo} · {e.anno} · Fanzine
                  </figcaption>
                </figure>
              </Link>
            )}
          />
        )}
        {slug && !aperta && <p className="edizioni__note">Questa edizione non esiste, o non è ancora stata digitalizzata.</p>}
      </section>
      <Contatti titolo="Acquisti & richieste" testo="Per ordini, distribuzione o collaborazioni editoriali:" />
      {aperta && (
        <FlipBook
          pagine={aperta.pagine}
          titolo={aperta.titolo}
          proporzione={aperta.copertina.width / aperta.copertina.height}
          onClose={chiudi}
        />
      )}
    </>
  )
}

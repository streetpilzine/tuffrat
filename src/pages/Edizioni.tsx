import { useCallback, useRef } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { ListView } from '../core/ListView'
import { didascaliaEdizione } from '../ui/logica/didascaliaEdizione'
import { edizioneVisibile, edizioniVisibili } from '../lib/edizioni'
import { Contatti } from '../ui/Contatti'
import { FlipBook } from '../ui/FlipBook'
import { PageHeader } from '../ui/PageHeader'

/** `/edizioni` elenca le fanzine; `/edizioni/:slug` apre direttamente lo sfogliatore sopra l'elenco (e sopra il banco, in 3D). */
export function Edizioni() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const elenco = useRef<HTMLElement | null>(null)
  const aperta = edizioneVisibile(slug)
  // Chiudi riporta alla pagina di provenienza se il link che aprire indica un altro URL (banco in 3D, scheda); altrimenti all'elenco.
  const chiudi = useCallback(
    (origine: string | null) => {
      if (origine && origine !== window.location.pathname + window.location.search) {
        void navigate(-1)
      } else {
        void navigate('/edizioni')
      }
    },
    [navigate],
  )

  return (
    <>
      <PageHeader titolo="Edizioni" sotto="Fanzine, stampe limitate, multipli e collaborazioni. Clicca su una fanzine per sfogliarla." />
      <section className="gallery" aria-label="Edizioni e fanzine" ref={elenco} style={{ marginTop: '1rem' }}>
        {edizioniVisibili.length === 0 ? (
          <p className="edizioni__note">Le fanzine non sono ancora pubblicate.</p>
        ) : (
          <ListView
            items={edizioniVisibili}
            label="Fanzine"
            className="griglia-fanzine"
            keyOf={(e) => e.id}
            renderItem={(e) => (
              <Link to={`/edizioni/${e.id}`} className="card-link fanzine" data-cursor="hand" data-edizione={e.id}>
                <figure className="card flipbook-trigger fanzine__card">
                  <img src={e.copertina.src} alt={e.copertina.alt} width={e.copertina.width} height={e.copertina.height} loading="lazy" decoding="async" />
                  <figcaption>{didascaliaEdizione(e)}</figcaption>
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
          altPagine={aperta.altPagine}
          titolo={aperta.titolo}
          proporzione={aperta.copertina.width / aperta.copertina.height}
          origine={(document.activeElement as HTMLElement | null) ?? null}
          tornoAlMioPosto={() => {
            const link = elenco.current?.querySelector<HTMLElement>(`[data-edizione="${aperta.id}"]`)
            link?.focus()
            return !!link
          }}
          onClose={chiudi}
        />
      )}
    </>
  )
}

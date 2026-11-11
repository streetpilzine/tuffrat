import { Contatti } from '../ui/Contatti'
import { PageHeader } from '../ui/PageHeader'

export function Fotografia() {
  return (
    <>
      <PageHeader titolo="Fotografia" sotto="Pellicola, sviluppo e scansione in proprio. La selezione è in corso." />
      <section className="gallery" aria-label="Fotografia" style={{ marginTop: '1rem' }}>
        <p className="edizioni__note">Galleria fotografica in fase di selezione.</p>
      </section>
      <Contatti titolo="In aggiornamento" testo="Galleria fotografica in fase di selezione. Per richieste o collaborazioni:" />
    </>
  )
}

import { useRef, useState } from 'react'
import { ListView } from '../core/ListView'
import { rullini } from '../data'
import { Contatti } from '../ui/Contatti'
import { FotoVisore } from '../ui/FotoVisore'
import { PageHeader } from '../ui/PageHeader'

/**
 * `/fotografia` (fase 3): un rullino per sezione, con l'elenco delle miniature e il visore a tutto schermo.
 * Le foto sono i file diritti: la `rotazione` dei dati riguarda solo la striscia 3D. Le miniature non superano
 * mai la larghezza del file piccolo, né in griglia né nel visore (che però usa il file grande).
 */
export function Fotografia() {
  const [aperta, setAperta] = useState<{ rullino: string; indice: number } | null>(null)
  const tornaAlla = useRef<HTMLButtonElement | null>(null)
  const rullinoAperto = aperta ? rullini.find((r) => r.id === aperta.rullino) : undefined

  return (
    <>
      <PageHeader titolo="Fotografia" sotto="Pellicola, sviluppo e scansione in proprio. Due rullini da sfogliare." />
      {rullini.map((r) => (
        <section key={r.id} className="rullino" aria-labelledby={`rullino-${r.id}`} data-rullino={r.id}>
          <div className="rullino__testata">
            <h2 id={`rullino-${r.id}`} className="rullino__titolo">
              Rullino {r.etichetta}
            </h2>
            <p className="rullino__meta">{r.foto.length === 1 ? '1 foto' : `${r.foto.length} foto`}</p>
          </div>
          <ListView
            items={r.foto}
            label={`Foto del rullino ${r.etichetta}`}
            className={`griglia-foto${r.id === 'gialla' ? ' griglia-foto--piccole' : ''}`}
            keyOf={(f) => f.src}
            renderItem={(f, i) => (
              <button
                type="button"
                className="mini"
                aria-label={`Apri la foto ${i + 1} di ${r.foto.length}: ${f.alt}`}
                onClick={(e) => {
                  tornaAlla.current = e.currentTarget
                  setAperta({ rullino: r.id, indice: i })
                }}
              >
                <img
                  className="mini__immagine"
                  src={f.srcPiccola}
                  alt={f.alt}
                  width={f.width}
                  height={f.height}
                  loading="lazy"
                  decoding="async"
                  style={{ maxWidth: `${f.width}px` }}
                />
              </button>
            )}
          />
        </section>
      ))}
      <Contatti titolo="Stampe e richieste" testo="Per stampe, pubblicazioni o collaborazioni:" />
      {rullinoAperto && aperta && (
        <FotoVisore
          foto={rullinoAperto.foto}
          rullino={rullinoAperto.etichetta}
          indice={aperta.indice}
          onChange={(i) => setAperta(i === null ? null : { rullino: rullinoAperto.id, indice: i })}
          origine={tornaAlla}
        />
      )}
    </>
  )
}

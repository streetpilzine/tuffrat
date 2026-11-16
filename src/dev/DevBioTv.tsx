import { Link } from 'react-router'
import { useOggetti } from '../state/useOggetti'
import { Tv } from '../three/Tv'

/**
 * Sandbox `/dev/bio-tv` (solo in dev): i due oggetti dell'angolo destro del muro, il ritratto con il retro e la TV, provati senza passare dai click del Canvas.
 * In alto i comandi DOM (equivalenti da tastiera delle stesse azioni): spegni e riaccendi la TV, gli stati del primo piano. La camera resta quella della sandbox (il muro intero), quindi non si vedono in primo piano: per la resa vera usare `/bio` e un click sul ritratto o sulla TV.
 */
export function DevBioTv() {
  const { tv, primoPiano, interruttoreTv, setPrimoPiano, avviaVideo } = useOggetti()
  return (
    <section className="dev">
      <h1>Sandbox bio e TV</h1>
      <p>
        Stato: primo piano <code>{primoPiano?.tipo ?? 'nessuno'}</code>, TV <code>{tv}</code>.
      </p>
      <p>
        <button type="button" className="button" onClick={interruttoreTv}>
          {tv === 'spenta' ? 'Accendi la TV' : 'Spegni la TV'}
        </button>{' '}
        <button type="button" className="button" onClick={() => setPrimoPiano({ tipo: 'bio' })}>
          Gira il ritratto
        </button>{' '}
        <button type="button" className="button" onClick={() => setPrimoPiano({ tipo: 'tv' })}>
          TV in primo piano
        </button>{' '}
        <button type="button" className="button" onClick={avviaVideo}>
          Avvia il video
        </button>{' '}
        <button type="button" className="button" onClick={() => setPrimoPiano(null)}>
          Torna al muro
        </button>
      </p>
      <p>
        Prova completa: <Link to="/bio">/bio</Link>, poi click sul ritratto (gira e si legge il retro) o sullo schermo della TV (da lontano porta a /bio, da vicino avvia il video).
      </p>
      <p>
        Player dell&apos;intervista in prova, a TV spenta: si smonta uscendo dalla pagina.
      </p>
      <div style={{ position: 'relative', height: 480 }}>
        <Tv anteprimaVideo />
      </div>
    </section>
  )
}

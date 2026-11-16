import { useState, type ReactNode } from 'react'
import { Link, useLocation } from 'react-router'
import { percorsoDiRitorno } from '../core/ponte'
import { ROUNDABOUT_DEFAULT, ugualeRoundabout } from '../core/roundabout'
import { comandaStriscia } from '../core/striscia'
import { tutteLeOpereById } from '../data'
import { useLayout } from '../state/useLayout'
import { useOggetti } from '../state/useOggetti'
import { useScene } from '../state/useScene'

/**
 * Barra di contesto del modo 3D: dice cosa si può fare nella scena e ospita le azioni che non hanno
 * un oggetto 3D (ripristina, torna al muro, copia link). Sparisce quando la scheda è aperta.
 */
export function Hud() {
  const { pathname } = useLocation()
  const percorso = pathname.replace(/\/+$/, '') || '/'
  const fuoco = useScene((s) => s.fuoco)
  const schedaAperta = useScene((s) => s.schedaAperta)
  const setScheda = useScene((s) => s.setScheda)
  const roundabout = useScene((s) => s.roundabout)
  const spostati = useLayout((s) => Object.keys(s.posizioni).length)
  const ripristina = useLayout((s) => s.ripristina)
  const primoPiano = useOggetti((s) => s.primoPiano)
  const tv = useOggetti((s) => s.tv)
  const setPrimoPiano = useOggetti((s) => s.setPrimoPiano)
  const interruttoreTv = useOggetti((s) => s.interruttoreTv)
  const [copiato, setCopiato] = useState(false)

  const copia = () => {
    void navigator.clipboard?.writeText(window.location.href).then(() => {
      setCopiato(true)
      window.setTimeout(() => setCopiato(false), 1600)
    })
  }

  let testo: ReactNode = null
  let azioni: ReactNode = null
  const opera = percorso.startsWith('/opere/') ? tutteLeOpereById.get(percorso.slice(7)) : undefined

  if (opera) {
    testo = (
      <>
        <strong>{opera.titolo}</strong>, {opera.anno}
        {fuoco ? '. Muovi il puntatore per spostare la luce.' : ''}
      </>
    )
    azioni = (
      <>
        <button type="button" className="hud__btn" onClick={() => setScheda(true)}>
          Scheda
        </button>
        <Link className="hud__btn" to={percorsoDiRitorno(opera.id)}>
          Torna al muro
        </Link>
      </>
    )
  } else if (percorso === '/' || percorso === '/serie/2023-2025') {
    testo = 'Trascina il muro per scorrerlo. Clicca un quadro per avvicinarlo, trascinalo per riappenderlo.'
    azioni = spostati > 0 && (
      <button type="button" className="hud__btn" onClick={ripristina}>
        Ripristina il muro
      </button>
    )
  } else if (percorso === '/serie') {
    testo = 'Clicca una serie sul muro per avvicinarti.'
  } else if (percorso === '/serie/roundabout') {
    testo = 'Clicca una tessera per ruotarla, trascinala su un’altra per scambiarle.'
    azioni = (
      <>
        {!ugualeRoundabout(roundabout, ROUNDABOUT_DEFAULT) && (
          <Link className="hud__btn" to="/serie/roundabout" replace>
            Ripristina
          </Link>
        )}
        <button type="button" className="hud__btn" onClick={copia}>
          {copiato ? 'Link copiato' : 'Copia link'}
        </button>
      </>
    )
  } else if (percorso === '/serie/bustine-di-te') {
    testo = 'Pannelli piatti, da vedere affiancati. L’ordine si cambia dalla scheda.'
    azioni = (
      <button type="button" className="hud__btn" onClick={() => setScheda(true)}>
        Riordina
      </button>
    )
  } else if (percorso.startsWith('/edizioni')) {
    testo = 'Clicca una rivista sul banco per sfogliarla.'
  } else if (percorso === '/fotografia' && primoPiano?.tipo === 'rullino') {
    testo = 'Trascina la pellicola o usa la rotella per scorrerla. Ctrl più rotella, o due dita, per ingrandire. Clicca il rullino per riavvolgerla.'
    azioni = (
      <>
        <button type="button" className="hud__btn" aria-label="Foto precedente" onClick={() => comandaStriscia('indietro')}>
          ←
        </button>
        <button type="button" className="hud__btn" aria-label="Foto successiva" onClick={() => comandaStriscia('avanti')}>
          →
        </button>
        <button type="button" className="hud__btn" aria-label="Rimpicciolisci" onClick={() => comandaStriscia('zoom-')}>
          −
        </button>
        <button type="button" className="hud__btn" aria-label="Ingrandisci" onClick={() => comandaStriscia('zoom+')}>
          +
        </button>
        <button type="button" className="hud__btn" onClick={() => setPrimoPiano(null)}>
          Riavvolgi
        </button>
      </>
    )
  } else if (percorso === '/fotografia') {
    testo = 'Clicca un rullino per tirare fuori la pellicola, trascinalo per spostarlo sul banco.'
    azioni = (
      <button type="button" className="hud__btn" onClick={() => setScheda(true)}>
        Tutte le foto
      </button>
    )
  } else if (percorso === '/bio' && primoPiano?.tipo === 'bio') {
    testo = 'Il retro del ritratto. Clicca di nuovo, o premi Esc, per riappenderlo.'
    azioni = (
      <>
        <button type="button" className="hud__btn" onClick={() => setPrimoPiano(null)}>
          Riappendi
        </button>
        <button type="button" className="hud__btn" onClick={() => setScheda(true)}>
          Bio completa
        </button>
      </>
    )
  } else if (percorso === '/bio' && primoPiano?.tipo === 'tv') {
    testo = 'Il pulsante in basso a destra della TV la spegne.'
    azioni = (
      <>
        <button type="button" className="hud__btn" onClick={interruttoreTv}>
          Spegni la TV
        </button>
        <button type="button" className="hud__btn" onClick={() => setPrimoPiano(null)}>
          Torna al muro
        </button>
      </>
    )
  } else if (percorso === '/bio') {
    testo = tv === 'spenta' ? 'Clicca il ritratto per girarlo. La TV è spenta: il pulsante in basso a destra la riaccende.' : 'Clicca il ritratto per girarlo, lo schermo della TV per avviare l’intervista.'
    azioni = (
      <>
        {tv === 'spenta' && (
          <button type="button" className="hud__btn" onClick={interruttoreTv}>
            Accendi la TV
          </button>
        )}
        <button type="button" className="hud__btn" onClick={() => setScheda(true)}>
          Leggi la bio
        </button>
      </>
    )
  } else if (percorso.startsWith('/mostre')) {
    testo = 'Clicca una locandina sulla bacheca.'
    azioni = (
      <button type="button" className="hud__btn" onClick={() => setScheda(true)}>
        Elenco mostre
      </button>
    )
  }

  if (!testo) return null
  return (
    <div className={`hud${schedaAperta ? ' is-nascosto' : ''}`} inert={schedaAperta}>
      <p className="hud__testo">{testo}</p>
      {azioni && <div className="hud__azioni">{azioni}</div>}
    </div>
  )
}

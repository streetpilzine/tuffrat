import { create } from 'zustand'
import { eMobile } from '../core/mobile.ts'
import type { CameraTarget, Scena } from '../core/scene-map.ts'
import { DURATA_FUOCO_S, scenaPerRoute } from '../core/scene-map.ts'
import { leggiRoundabout, type StatoRoundabout } from '../core/roundabout.ts'
import { tutteLeOpereById } from '../data/index.ts'
import { SCALA } from '../three/mondo.ts'
import { posaDi } from './useLayout.ts'
import { useOggetti } from './useOggetti.ts'

export interface SceneState {
  scena: Scena
  target: CameraTarget
  /** Pathname corrente, senza slash finale: lo leggono gli oggetti 3D per sapere se sono «di scena». */
  percorso: string
  /** Opera in primo piano (`/opere/:slug`), se è una cornice appesa. */
  fuoco: string | null
  /** In modo 3D: scheda DOM aperta o ridotta alla sola maniglia. */
  schedaAperta: boolean
  /** Disposizione di Roundabout, letta dall'URL di `/serie/roundabout`. */
  roundabout: StatoRoundabout
  inTransizione: boolean
  /** Chiamato dal SceneRouter a ogni cambio di route. `indietro` = la navigazione viene dalla cronologia del browser (tasto indietro o avanti). */
  vaiA: (pathname: string, search?: string, hash?: string, indietro?: boolean) => void
  setScheda: (aperta: boolean) => void
  setInTransizione: (v: boolean) => void
}

const pulisci = (p: string) => p.replace(/\/+$/, '') || '/'

/** Route → stato della scena. Per `/opere/:slug` il target si calcola dalla posa corrente della cornice. */
function statoPer(pathname: string, search: string, precedente?: StatoRoundabout) {
  const percorso = pulisci(pathname)
  const info = scenaPerRoute(percorso)
  let target = info.target
  let fuoco: string | null = null
  if (percorso.startsWith('/opere/')) {
    const id = percorso.slice('/opere/'.length)
    const opera = tutteLeOpereById.get(id)
    const posa = posaDi(id)
    if (opera && posa) {
      fuoco = id
      target = {
        pos: [posa.x, posa.y, 4],
        look: [posa.x, posa.y, 0],
        // Sul telefono il quadro a fuoco riempie lo schermo (resta il margine per la barra in alto e la maniglia in basso); su desktop lascia spazio alla scheda.
        inquadra: { w: opera.misure.w * SCALA, h: opera.misure.h * SCALA, riempi: eMobile() ? 0.82 : 0.52 },
        durata: DURATA_FUOCO_S,
      }
    } else if (opera?.serie === 'roundabout') target = scenaPerRoute('/serie/roundabout').target
    else if (opera?.serie === 'bustine-di-te') target = scenaPerRoute('/serie/bustine-di-te').target
  }
  const roundabout = percorso === '/serie/roundabout' ? leggiRoundabout(search) : (precedente ?? leggiRoundabout(''))
  return { scena: info.scena, target, percorso, fuoco, schedaAperta: info.schedaAperta, roundabout }
}

const inBrowser = typeof window !== 'undefined'

/**
 * Telefono: istante dell'ultimo tocco su un link dentro la scheda aperta, che chiede di tenerla aperta sulla pagina successiva. Lo scrive il Layout, lo consuma `vaiA`: vale per la navigazione che lo segue subito, non per una che arriva dopo.
 */
export const navigazione = { daScheda: -Infinity }
const TENUTA_SCHEDA_MS = 1000

/** Scena corrente e target camera: lo scrive il SceneRouter, lo leggono Stage, Nav, Hud e la regione aria-live. */
export const useScene = create<SceneState>()((set, get) => ({
  ...statoPer(inBrowser ? window.location.pathname : '/', inBrowser ? window.location.search : ''),
  inTransizione: false,
  vaiA: (pathname, search = '', hash = '', indietro = false) => {
    const prima = get()
    const nuovo = statoPer(pathname, search, prima.roundabout)
    // Un hash punta a un elemento della pagina (contatti, una mostra): la scheda si apre per mostrarlo.
    if (hash) nuovo.schedaAperta = true
    // Telefono: la scheda resta aperta sulla pagina nuova se ci si arriva da un link dentro la scheda, o tornando indietro nella cronologia mentre è aperta (prima si richiudeva e l'opera andava riaperta a mano).
    const daScheda = inBrowser && performance.now() - navigazione.daScheda < TENUTA_SCHEDA_MS
    navigazione.daScheda = -Infinity
    if (eMobile() && (daScheda || (indietro && prima.schedaAperta))) nuovo.schedaAperta = true
    // Stessa pagina (cambia solo la query, es. Roundabout): la camera e la scheda restano dove sono.
    if (nuovo.percorso === prima.percorso) set(hash ? { roundabout: nuovo.roundabout, schedaAperta: true } : { roundabout: nuovo.roundabout })
    else {
      // Cambio di pagina: rullino, ritratto e TV tornano a posto (il video si ferma).
      useOggetti.getState().azzera()
      set(nuovo)
    }
  },
  setScheda: (schedaAperta) => set({ schedaAperta }),
  setInTransizione: (v) => set({ inTransizione: v }),
}))

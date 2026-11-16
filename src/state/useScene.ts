import { create } from 'zustand'
import type { CameraTarget, Scena } from '../core/scene-map.ts'
import { DURATA_FUOCO_S, scenaPerRoute, TARGET_BUSTINE, TARGET_ROUNDABOUT } from '../core/scene-map.ts'
import { leggiRoundabout, type StatoRoundabout } from '../core/roundabout.ts'
import { tutteLeOpereById } from '../data/index.ts'
import { SCALA } from '../three/mondo.ts'
import { posaDi } from './useLayout.ts'

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
  /** Chiamato dal SceneRouter a ogni cambio di route. */
  vaiA: (pathname: string, search?: string, hash?: string) => void
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
        inquadra: { w: opera.misure.w * SCALA, h: opera.misure.h * SCALA, riempi: 0.52 },
        durata: DURATA_FUOCO_S,
      }
    } else if (opera?.serie === 'roundabout') target = TARGET_ROUNDABOUT
    else if (opera?.serie === 'bustine-di-te') target = TARGET_BUSTINE
  }
  const roundabout = percorso === '/serie/roundabout' ? leggiRoundabout(search) : (precedente ?? leggiRoundabout(''))
  return { scena: info.scena, target, percorso, fuoco, schedaAperta: info.schedaAperta, roundabout }
}

const inBrowser = typeof window !== 'undefined'

/** Scena corrente e target camera: lo scrive il SceneRouter, lo leggono Stage, Nav, Hud e la regione aria-live. */
export const useScene = create<SceneState>()((set, get) => ({
  ...statoPer(inBrowser ? window.location.pathname : '/', inBrowser ? window.location.search : ''),
  inTransizione: false,
  vaiA: (pathname, search = '', hash = '') => {
    const prima = get()
    const nuovo = statoPer(pathname, search, prima.roundabout)
    // Un hash punta a un elemento della pagina (contatti, una mostra): la scheda si apre per mostrarlo.
    if (hash) nuovo.schedaAperta = true
    // Stessa pagina (cambia solo la query, es. Roundabout): la camera e la scheda restano dove sono.
    if (nuovo.percorso === prima.percorso) set(hash ? { roundabout: nuovo.roundabout, schedaAperta: true } : { roundabout: nuovo.roundabout })
    else set(nuovo)
  },
  setScheda: (schedaAperta) => set({ schedaAperta }),
  setInTransizione: (v) => set({ inTransizione: v }),
}))

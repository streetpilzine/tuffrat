/**
 * Route → scena → target camera (ARCHITECTURE §5 e §6).
 * Unità mondo e zone del muro in `src/three/mondo.ts`. La camera guarda sempre `look`.
 */
import { eMobile } from './mobile.ts'
import { BOARD, ingombroColonna } from '../three/layout-muro.ts'
import { frontaleTv, RITRATTO, TV, ZONA } from '../three/mondo.ts'

export type Scena = 'muro' | 'banco' | 'bio'

export interface CameraTarget {
  pos: readonly [number, number, number]
  look: readonly [number, number, number]
  /**
   * Se presente, la distanza dal muro si calcola nel Canvas perché un rettangolo w×h (unità mondo)
   * centrato su `look` riempia la quota `riempi` del viewport, qualunque sia il rapporto d'aspetto.
   * `pos[2]` resta il valore di ripiego (desktop 16:9). La camera si mette lungo la direzione `look → pos`, quindi un target può guardare un piano non parallelo al muro (lo schermo della TV).
   */
  inquadra?: { w: number; h: number; riempi?: number }
  /** Durata del tween in secondi (default `DURATA_CAMERA_S`). */
  durata?: number
}

export interface SceneInfo {
  scena: Scena
  target: CameraTarget
  /** Complemento annunciato in aria-live: «La camera si sposta {etichetta}». */
  etichetta: string
  /** In modo 3D la scheda DOM parte chiusa (la scena resta libera); aperta solo dove non c'è niente da vedere (404, sandbox). */
  schedaAperta: boolean
}

export const DURATA_CAMERA_S = 0.8
export const DURATA_FUOCO_S = 0.6

const frontale = (x: number, y: number, z: number, inquadra?: CameraTarget['inquadra']): CameraTarget => ({
  pos: [x, y, z],
  look: [x, y, 0],
  inquadra,
})

const TARGET_HOME = frontale(ZONA.home, 1.3, 8.2, { w: 9.4, h: 4.6, riempi: 0.8 })
const TARGET_SERIE = frontale((ZONA.roundabout + ZONA.bustine) / 2, 1.5, 7.2, { w: 6.6, h: 3.2, riempi: 0.8 })
export const TARGET_ROUNDABOUT = frontale(ZONA.roundabout, 1.5, 4.4, { w: 1.8, h: 1.8, riempi: 0.56 })
export const TARGET_BUSTINE = frontale(ZONA.bustine, 1.75, 5.6, { w: 2.8, h: 2.7, riempi: 0.66 })

/**
 * Inquadrature del telefono (`eMobile()`): fuori dal browser e su desktop valgono quelle sopra.
 * - Home: stessa distanza (il muro si scorre), con lo sguardo più in basso, così il piano del banco con fanzine e rullini si vede sopra la maniglia della scheda.
 * - Serie: i polittici del Tè stanno in colonna sopra Roundabout (`BUSTINE_MOBILE` in `layout-muro`), e la colonna intera riempie lo schermo verticale.
 * - Roundabout: le quattro tessere larghe quanto lo schermo.
 * - Bustine di tè: i due polittici della colonna.
 */
const TARGET_HOME_MOBILE = frontale(ZONA.home, 1.1, 8.2, { w: 9.4, h: 4.6, riempi: 0.8 })
const colonna = ingombroColonna(true)
const TARGET_SERIE_MOBILE = frontale(colonna.x, colonna.y, 7.2, { w: colonna.w, h: colonna.h, riempi: 0.8 })
const TARGET_ROUNDABOUT_MOBILE = frontale(ZONA.roundabout, BOARD.y, 4.4, { w: BOARD.lato, h: BOARD.lato, riempi: 0.94 })
const te = ingombroColonna(false)
const TARGET_BUSTINE_MOBILE = frontale(te.x, te.y, 5.6, { w: te.w, h: te.h, riempi: 0.88 })
/** Telefono tenuto in verticale: lo schermo è stretto e il banco, visto dalla distanza del desktop, non ci sta. In orizzontale valgono le inquadrature del desktop. */
const telefonoInVerticale = () => eMobile() && window.innerHeight > window.innerWidth

/** Banco sul telefono in verticale: stessa direzione di sguardo del desktop, da più lontano, perché stiano nello schermo tutte e quattro le fanzine e tutti e due i rullini. */
const piuLontano = (t: CameraTarget, k: number): CameraTarget => ({
  pos: [t.look[0] + (t.pos[0] - t.look[0]) * k, t.look[1] + (t.pos[1] - t.look[1]) * k, t.look[2] + (t.pos[2] - t.look[2]) * k],
  look: t.look,
})

/** Sceglie l'inquadratura alla richiesta, non al caricamento del modulo: così segue la finestra che si stringe o si allarga. */
const perDispositivo = (desktop: CameraTarget, mobile: CameraTarget): CameraTarget => (eMobile() ? mobile : desktop)

const MOSTRE = frontale(ZONA.mostre, 1.6, 5.2, { w: 3, h: 2.2, riempi: 0.66 })
const BIO = frontale((ZONA.bio + ZONA.tv) / 2, 1.0, 6.2, { w: 3.8, h: 3.4, riempi: 0.8 })
const EDIZIONI: CameraTarget = { pos: [-0.9, 1.7, 4.7], look: [-0.9, -0.5, 2.25] }
const FOTOGRAFIA: CameraTarget = { pos: [1.35, 0.75, 4.2], look: [1.35, -0.5, 2.3] }
const LONTANO: CameraTarget = { pos: [0, 3.5, 11], look: [0, 1, 0] }
const EDIZIONI_MOBILE = piuLontano(EDIZIONI, 1.5)
const FOTOGRAFIA_MOBILE = piuLontano({ ...FOTOGRAFIA, look: [1.38, -0.5, 2.3], pos: [1.38, 0.75, 4.2] }, 1.7)

/**
 * Ritratto girato sul retro: la camera si mette di fronte alla cornice venuta avanti. Su uno schermo stretto vincola la larghezza e la cornice lo riempie quasi tutto (96 %), perché il testo si legga; su uno schermo largo vincola l'altezza, gonfiata del 20 % per lasciare liberi la barra in alto e i comandi in basso.
 */
export const TARGET_BIO_RETRO: CameraTarget = {
  pos: [RITRATTO.x, RITRATTO.y, RITRATTO.zPrimoPiano + 3],
  look: [RITRATTO.x, RITRATTO.y, RITRATTO.zPrimoPiano],
  inquadra: { w: RITRATTO.largo + RITRATTO.bordo, h: (RITRATTO.alto + RITRATTO.bordo) * 1.2, riempi: 0.96 },
  durata: DURATA_FUOCO_S,
}

/**
 * Video nella TV: la camera sta sulla normale del frontale (la TV è girata di qualche grado), così l'iframe non è in scorcio. L'inquadratura va dal bordo sinistro dello schermo al pulsante di accensione a destra, e in altezza prende tutto il corpo.
 */
export const TARGET_TV: CameraTarget = (() => {
  const sinistra = TV.schermo.x - TV.schermo.w / 2 - 0.04
  const destra = TV.pulsante.x + TV.pulsante.r + 0.04
  const { punto, normale } = frontaleTv((sinistra + destra) / 2, 0)
  return {
    pos: [punto[0] + normale[0] * 2, punto[1], punto[2] + normale[2] * 2],
    look: punto,
    inquadra: { w: destra - sinistra, h: TV.corpo.h * 1.15, riempi: 0.94 },
    durata: DURATA_FUOCO_S,
  }
})()

const pulisci = (p: string) => (p.split('?')[0].replace(/\/+$/, '') || '/')

export function scenaPerRoute(pathname: string): SceneInfo {
  const p = pulisci(pathname)
  if (p === '/') return { scena: 'muro', target: perDispositivo(TARGET_HOME, TARGET_HOME_MOBILE), etichetta: 'sul muro', schedaAperta: false }
  if (p === '/bio' || p === '/about') return { scena: 'bio', target: BIO, etichetta: 'sul ritratto', schedaAperta: false }
  if (p.startsWith('/opere/')) return { scena: 'muro', target: perDispositivo(TARGET_HOME, TARGET_HOME_MOBILE), etichetta: 'sull’opera in primo piano', schedaAperta: false }
  if (p === '/serie') return { scena: 'muro', target: perDispositivo(TARGET_SERIE, TARGET_SERIE_MOBILE), etichetta: 'sulle serie', schedaAperta: false }
  if (p === '/serie/roundabout')
    return { scena: 'muro', target: perDispositivo(TARGET_ROUNDABOUT, TARGET_ROUNDABOUT_MOBILE), etichetta: 'su Roundabout', schedaAperta: false }
  if (p === '/serie/bustine-di-te')
    return { scena: 'muro', target: perDispositivo(TARGET_BUSTINE, TARGET_BUSTINE_MOBILE), etichetta: 'sulle Bustine di tè', schedaAperta: false }
  if (p.startsWith('/serie/')) return { scena: 'muro', target: perDispositivo(TARGET_HOME, TARGET_HOME_MOBILE), etichetta: 'sulla serie', schedaAperta: false }
  if (p === '/edizioni' || p.startsWith('/edizioni/')) return { scena: 'banco', target: telefonoInVerticale() ? EDIZIONI_MOBILE : EDIZIONI, etichetta: 'sul banco delle fanzine', schedaAperta: false }
  if (p === '/mostre' || p.startsWith('/mostre/')) return { scena: 'muro', target: MOSTRE, etichetta: 'sulle mostre', schedaAperta: false }
  if (p === '/fotografia') return { scena: 'banco', target: telefonoInVerticale() ? FOTOGRAFIA_MOBILE : FOTOGRAFIA, etichetta: 'sui rullini', schedaAperta: false }
  if (p.startsWith('/dev')) return { scena: 'muro', target: perDispositivo(TARGET_HOME, TARGET_HOME_MOBILE), etichetta: 'sul muro', schedaAperta: true }
  return { scena: 'muro', target: LONTANO, etichetta: 'su un muro vuoto', schedaAperta: true }
}

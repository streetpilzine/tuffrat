import { polittici, type Opera, type Polittico } from '../data'
import { eMobile } from '../core/mobile.ts'
import { PASSO_GRIGLIA, SCALA, ZONA } from './mondo.ts'

export { SCALA }

const GAP = 0.3
const QUOTE = [2.3, 0.3]

export interface Posto {
  opera: Opera
  x: number
  y: number
  /** Inclinazione a riposo in radianti, deterministica per indice. */
  tilt: number
}

/** Due file di opere centrate sul muro, larghezze reali, lieve inclinazione deterministica. */
export function disponiSulMuro(opere: readonly Opera[]): Posto[] {
  const meta = Math.ceil(opere.length / 2)
  const righe = [opere.slice(0, meta), opere.slice(meta)]
  const posti: Posto[] = []
  righe.forEach((riga, r) => {
    const larghezze = riga.map((o) => o.misure.w * SCALA)
    const totale = larghezze.reduce((a, b) => a + b, 0) + GAP * Math.max(0, riga.length - 1)
    let x = -totale / 2
    riga.forEach((opera, i) => {
      const w = larghezze[i]
      const indice = r * meta + i
      posti.push({ opera, x: x + w / 2, y: QUOTE[r], tilt: (((indice * 7) % 5) - 2) * 0.012 })
      x += w + GAP
    })
  })
  return posti
}

const GAP_POLITTICO = 0.06

/** Dove stanno i polittici delle Bustine di tè: ascissa del centro e quota del centro di ciascuno, dall'alto in basso. */
export interface ZonaBustine {
  centro: number
  quote: number[]
}

/** Board di Roundabout: lato (due tessere da 0,78 con la fuga di 0,025) e quota del centro, come in `RoundaboutBoard`. */
export const BOARD = { lato: 0.78 * 2 + 0.025, y: 1.5 }
/** Larghezza e altezza di un polittico messo in fila (l'ordine dei pannelli non le cambia). */
export const politticoLargo = (p: Polittico) => p.pannelli.reduce((s, o) => s + o.misure.w * SCALA, 0) + GAP_POLITTICO * Math.max(0, p.pannelli.length - 1)
export const politticoAlto = (p: Polittico) => Math.max(...p.pannelli.map((o) => o.misure.h * SCALA))

/** Desktop: la zona a sinistra di Roundabout, due file. */
export const BUSTINE_DESKTOP: ZonaBustine = { centro: ZONA.bustine, quote: [2.5, 1.1] }

/** Parete lasciata tra il board e il polittico sopra, e tra un polittico e l'altro, nella colonna del telefono. */
const INTERVALLO_COLONNA = 0.35
/**
 * Telefono: i polittici stanno in colonna sopra Roundabout, centrati sul board. Su uno schermo verticale le due serie affiancate non entrano (insieme sono larghe quasi 4,5 unità: per vederle intere la camera andrebbe così lontano da renderle francobolli), mentre in colonna `/serie` le mostra tutte grandi quanto lo schermo è largo.
 */
export const BUSTINE_MOBILE: ZonaBustine = (() => {
  const quote: number[] = []
  let base = BOARD.y + BOARD.lato / 2 + INTERVALLO_COLONNA
  for (const p of [...polittici].reverse()) {
    const alto = politticoAlto(p)
    quote.unshift(base + alto / 2)
    base += alto + INTERVALLO_COLONNA
  }
  return { centro: ZONA.roundabout, quote }
})()

/** Zona delle Bustine di tè sul dispositivo corrente. Fuori dal browser (test, prerender) è quella del desktop. */
export const zonaBustine = (): ZonaBustine => (eMobile() ? BUSTINE_MOBILE : BUSTINE_DESKTOP)

/** Ingombro sul muro della colonna del telefono, con o senza il board in fondo: centro e misure, per i target della camera. */
export function ingombroColonna(conBoard: boolean): { x: number; y: number; w: number; h: number } {
  const alti = polittici.map(politticoAlto)
  const su = Math.max(...BUSTINE_MOBILE.quote.map((q, i) => q + alti[i] / 2))
  const giu = conBoard ? BOARD.y - BOARD.lato / 2 : Math.min(...BUSTINE_MOBILE.quote.map((q, i) => q - alti[i] / 2))
  return { x: BUSTINE_MOBILE.centro, y: (su + giu) / 2, w: Math.max(...polittici.map(politticoLargo), conBoard ? BOARD.lato : 0), h: su - giu }
}

/**
 * Pannelli di un polittico affiancati e complanari (nessuna inclinazione), nell'ordine dato.
 * `riga` = posizione del polittico nella zona (0 in alto).
 */
export function disponiPolittico(p: Polittico, ordine: readonly string[], riga: number, zona: ZonaBustine = BUSTINE_DESKTOP): Posto[] {
  const pannelli = ordine.map((id) => p.pannelli.find((o) => o.id === id)).filter((o): o is Opera => !!o)
  const larghezze = pannelli.map((o) => o.misure.w * SCALA)
  const totale = larghezze.reduce((a, b) => a + b, 0) + GAP_POLITTICO * Math.max(0, pannelli.length - 1)
  let x = zona.centro - totale / 2
  return pannelli.map((opera, i) => {
    const w = larghezze[i]
    const posto = { opera, x: x + w / 2, y: zona.quote[riga] ?? zona.quote[zona.quote.length - 1], tilt: 0 }
    x += w + GAP_POLITTICO
    return posto
  })
}

/** Riaggancio: arrotonda una posizione al passo della griglia del muro. */
export const agganciaAllaGriglia = (v: number) => Math.round(v / PASSO_GRIGLIA) * PASSO_GRIGLIA

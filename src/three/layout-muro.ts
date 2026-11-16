import type { Opera, Polittico } from '../data'
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
/** Quota del centro di ogni polittico nella zona «Bustine di tè», dall'alto in basso. */
const QUOTE_POLITTICI = [2.5, 1.1]

/**
 * Pannelli di un polittico affiancati e complanari (nessuna inclinazione), nell'ordine dato.
 * `riga` = posizione del polittico nella zona (0 in alto).
 */
export function disponiPolittico(p: Polittico, ordine: readonly string[], riga: number): Posto[] {
  const pannelli = ordine.map((id) => p.pannelli.find((o) => o.id === id)).filter((o): o is Opera => !!o)
  const larghezze = pannelli.map((o) => o.misure.w * SCALA)
  const totale = larghezze.reduce((a, b) => a + b, 0) + GAP_POLITTICO * Math.max(0, pannelli.length - 1)
  let x = ZONA.bustine - totale / 2
  return pannelli.map((opera, i) => {
    const w = larghezze[i]
    const posto = { opera, x: x + w / 2, y: QUOTE_POLITTICI[riga] ?? 1.1, tilt: 0 }
    x += w + GAP_POLITTICO
    return posto
  })
}

/** Riaggancio: arrotonda una posizione al passo della griglia del muro. */
export const agganciaAllaGriglia = (v: number) => Math.round(v / PASSO_GRIGLIA) * PASSO_GRIGLIA

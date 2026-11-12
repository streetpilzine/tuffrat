import type { Opera } from '../data'

/** cm → unità mondo. 100 cm = 2 unità. */
export const SCALA = 1 / 50
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

import { describe, expect, it } from 'vitest'
import { opereInHome } from '../../data/index.ts'
import { disponiSulMuro, SCALA } from '../layout-muro.ts'

describe('disponiSulMuro', () => {
  const posti = disponiSulMuro(opereInHome)

  it('appende tutte le opere della home', () => {
    expect(posti.map((p) => p.opera.id)).toEqual(opereInHome.map((o) => o.id))
  })

  it('nessuna sovrapposizione orizzontale nella stessa fila', () => {
    for (const y of new Set(posti.map((p) => p.y))) {
      const fila = posti.filter((p) => p.y === y).sort((a, b) => a.x - b.x)
      for (let i = 1; i < fila.length; i++) {
        const destraPrec = fila[i - 1].x + (fila[i - 1].opera.misure.w * SCALA) / 2
        const sinistra = fila[i].x - (fila[i].opera.misure.w * SCALA) / 2
        expect(sinistra).toBeGreaterThan(destraPrec)
      }
    }
  })

  it('resta dentro il muro (18 unità) e sopra il pavimento', () => {
    for (const p of posti) {
      const w = p.opera.misure.w * SCALA
      const h = p.opera.misure.h * SCALA
      expect(Math.abs(p.x) + w / 2).toBeLessThan(9)
      expect(p.y - h / 2).toBeGreaterThan(-1.5)
      expect(Math.abs(p.tilt)).toBeLessThanOrEqual(0.03)
    }
  })
})

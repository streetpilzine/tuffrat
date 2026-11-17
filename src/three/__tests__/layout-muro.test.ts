import { describe, expect, it } from 'vitest'
import { opereInHome, polittici } from '../../data/index.ts'
import { agganciaAllaGriglia, BOARD, BUSTINE_DESKTOP, BUSTINE_MOBILE, disponiPolittico, disponiSulMuro, ingombroColonna, SCALA } from '../layout-muro.ts'
import { MURO, PASSO_GRIGLIA, ZONA } from '../mondo.ts'

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

  it('resta nella zona della home (9 unità per lato) e sopra il pavimento', () => {
    for (const p of posti) {
      const w = p.opera.misure.w * SCALA
      const h = p.opera.misure.h * SCALA
      expect(Math.abs(p.x) + w / 2).toBeLessThan(9)
      expect(p.y - h / 2).toBeGreaterThan(-1.5)
      expect(Math.abs(p.tilt)).toBeLessThanOrEqual(0.03)
    }
  })
})

describe('disponiPolittico', () => {
  it.each(polittici.map((p, riga) => [p.id, p, riga] as const))('%s: pannelli complanari, affiancati, nell’ordine dato', (_id, p, riga) => {
    const ordine = [...p.ordineDefault].reverse()
    const posti = disponiPolittico(p, ordine, riga)
    expect(posti.map((x) => x.opera.id)).toEqual(ordine)
    expect(new Set(posti.map((x) => x.y)).size).toBe(1)
    expect(posti.every((x) => x.tilt === 0)).toBe(true)
    for (let i = 1; i < posti.length; i++) {
      const destraPrec = posti[i - 1].x + (posti[i - 1].opera.misure.w * SCALA) / 2
      const sinistra = posti[i].x - (posti[i].opera.misure.w * SCALA) / 2
      expect(sinistra).toBeGreaterThan(destraPrec)
      expect(sinistra - destraPrec).toBeLessThan(0.1)
    }
    // Centrato sulla zona delle Bustine di tè, dentro il muro.
    const centro = (posti[0].x + posti[posti.length - 1].x) / 2
    expect(centro).toBeCloseTo(ZONA.bustine, 5)
    expect(posti[0].x).toBeGreaterThan(MURO.xMin)
  })

  it('i polittici non si sovrappongono in verticale', () => {
    const [sopra, sotto] = polittici.map((p, riga) => disponiPolittico(p, p.ordineDefault, riga)[0])
    const bassoSopra = sopra.y - (sopra.opera.misure.h * SCALA) / 2
    const altoSotto = sotto.y + (sotto.opera.misure.h * SCALA) / 2
    expect(bassoSopra).toBeGreaterThan(altoSotto)
  })
})

describe('agganciaAllaGriglia', () => {
  it('arrotonda al passo della griglia', () => {
    expect(agganciaAllaGriglia(1.1)).toBeCloseTo(1, 6)
    expect(agganciaAllaGriglia(1.13)).toBeCloseTo(1.25, 6)
    expect(agganciaAllaGriglia(-0.4)).toBeCloseTo(-0.5, 6)
    expect(Math.abs(agganciaAllaGriglia(3.33) / PASSO_GRIGLIA - Math.round(agganciaAllaGriglia(3.33) / PASSO_GRIGLIA))).toBeLessThan(1e-9)
  })
})

describe('colonna del telefono: i polittici sopra Roundabout', () => {
  it('ogni polittico sta sopra il board, centrato su di lui, senza toccare gli altri né il soffitto', () => {
    const posti = polittici.map((p, riga) => disponiPolittico(p, p.ordineDefault, riga, BUSTINE_MOBILE))
    const bordi = posti.map((riga) => ({
      sinistra: Math.min(...riga.map((x) => x.x - (x.opera.misure.w * SCALA) / 2)),
      destra: Math.max(...riga.map((x) => x.x + (x.opera.misure.w * SCALA) / 2)),
      giu: Math.min(...riga.map((x) => x.y - (x.opera.misure.h * SCALA) / 2)),
      su: Math.max(...riga.map((x) => x.y + (x.opera.misure.h * SCALA) / 2)),
    }))
    for (const b of bordi) expect((b.sinistra + b.destra) / 2).toBeCloseTo(ZONA.roundabout)
    // Dal basso: board, ultimo polittico, primo polittico, con parete in mezzo.
    const cimaBoard = BOARD.y + BOARD.lato / 2
    expect(bordi[1].giu - cimaBoard).toBeGreaterThan(0.2)
    expect(bordi[0].giu - bordi[1].su).toBeGreaterThan(0.2)
    expect(bordi[0].su).toBeLessThan(MURO.yCentro + MURO.alto / 2 - 0.5)
  })

  it('l’ingombro della colonna va dalla base del board alla cima del polittico più alto', () => {
    const tutta = ingombroColonna(true)
    const te = ingombroColonna(false)
    expect(tutta.y - tutta.h / 2).toBeCloseTo(BOARD.y - BOARD.lato / 2)
    expect(tutta.y + tutta.h / 2).toBeCloseTo(te.y + te.h / 2)
    expect(te.h).toBeLessThan(tutta.h)
    expect(tutta.w).toBeGreaterThanOrEqual(BOARD.lato)
  })

  it('sul desktop la zona resta quella a sinistra di Roundabout', () => {
    const p = polittici[0]
    expect(disponiPolittico(p, p.ordineDefault, 0)).toEqual(disponiPolittico(p, p.ordineDefault, 0, BUSTINE_DESKTOP))
    expect(BUSTINE_DESKTOP.centro).toBe(ZONA.bustine)
  })
})

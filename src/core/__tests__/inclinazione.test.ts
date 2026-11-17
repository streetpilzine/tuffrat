import { describe, expect, it } from 'vitest'
import { filtra, INCLINAZIONE, posizioneLuce, scostamento } from '../inclinazione.ts'

const neutro = { beta: 40, gamma: 10 }

describe('luce col telefono in mano', () => {
  it('come si tiene il telefono alla prima lettura è lo zero', () => {
    expect(scostamento(neutro, neutro)).toEqual({ x: 0, y: 0 })
  })

  it('girando il polso a destra la luce va a destra, piegando in avanti la cima sale', () => {
    expect(scostamento({ beta: 40, gamma: 20 }, neutro).x).toBeGreaterThan(0)
    expect(scostamento({ beta: 40, gamma: 0 }, neutro).x).toBeLessThan(0)
    expect(scostamento({ beta: 30, gamma: 10 }, neutro).y).toBeGreaterThan(0)
    expect(scostamento({ beta: 50, gamma: 10 }, neutro).y).toBeLessThan(0)
  })

  it('oltre l’angolo pieno la luce resta ferma al massimo', () => {
    const pieno = INCLINAZIONE.angoloPieno
    expect(scostamento({ beta: 40, gamma: 10 + pieno }, neutro).x).toBe(1)
    expect(scostamento({ beta: 40, gamma: 10 + pieno * 3 }, neutro).x).toBe(1)
    expect(scostamento({ beta: 40 + pieno * 3, gamma: 10 }, neutro).y).toBe(-1)
    // A metà angolo, metà scostamento.
    expect(scostamento({ beta: 40, gamma: 10 + pieno / 2 }, neutro).x).toBeCloseTo(0.5)
  })

  it('a telefono fermo la luce sta nella posizione di riposo, e l’inclinazione la sposta dell’ampiezza', () => {
    expect(posizioneLuce({ x: 0, y: 0 })).toEqual(INCLINAZIONE.riposo)
    const destra = posizioneLuce({ x: 1, y: 0 })
    expect(destra.x - INCLINAZIONE.riposo.x).toBeCloseTo(INCLINAZIONE.ampiezza)
    expect(destra.y).toBe(INCLINAZIONE.riposo.y)
    // Due inclinazioni diverse danno due posizioni diverse del riflesso.
    expect(posizioneLuce(scostamento({ beta: 40, gamma: 30 }, neutro))).not.toEqual(posizioneLuce(scostamento({ beta: 20, gamma: -10 }, neutro)))
  })

  it('il filtro avvicina al bersaglio senza superarlo e converge', () => {
    let v = 0
    for (let i = 0; i < 5; i++) {
      const prima = v
      v = filtra(v, 1)
      expect(v).toBeGreaterThan(prima)
      expect(v).toBeLessThan(1)
    }
    for (let i = 0; i < 200; i++) v = filtra(v, 1)
    expect(v).toBeCloseTo(1, 5)
    expect(filtra(0.3, 0.3)).toBe(0.3)
  })
})

import { describe, expect, it } from 'vitest'
import { alCentro, altezzaRuotata, centraSu, layoutStriscia, limita, limitiZoom, rapportoRuotato, scorri, scorrimentoMax, visibili, zooma } from '../striscia.ts'

const finestra = { largo: 1200, alto: 700 }

describe('striscia del rullino', () => {
  it('la rotazione di 90° scambia i lati, 0° e 180° no', () => {
    expect(rapportoRuotato(560, 866, 90)).toBeCloseTo(866 / 560)
    expect(rapportoRuotato(560, 866, 270)).toBeCloseTo(866 / 560)
    expect(rapportoRuotato(1600, 1062, 0)).toBeCloseTo(1600 / 1062)
    expect(rapportoRuotato(1600, 1062, 180)).toBeCloseTo(1600 / 1062)
    expect(altezzaRuotata(560, 866, 90)).toBe(560)
    expect(altezzaRuotata(1600, 1062, 0)).toBe(1062)
  })

  it('i fotogrammi stanno in fila senza sovrapporsi', () => {
    const l = layoutStriscia([1.5, 0.66, 1.5])
    for (let i = 1; i < l.inizio.length; i++) expect(l.inizio[i]).toBeGreaterThan(l.inizio[i - 1] + l.largo[i - 1])
    expect(l.lunghezza).toBeGreaterThan(l.inizio[2] + l.largo[2])
  })

  it('lo zoom non supera mai i pixel veri della foto né la finestra', () => {
    expect(limitiZoom(finestra, 560).max).toBe(560)
    expect(limitiZoom(finestra, 1600).max).toBeCloseTo(560)
    expect(limitiZoom({ largo: 390, alto: 660 }, 560).max).toBeCloseTo(528)
    const z = limitiZoom(finestra, 560)
    expect(z.min).toBeLessThanOrEqual(z.max)
  })

  it('lo scorrimento resta tra inizio e fine', () => {
    const l = layoutStriscia(Array.from({ length: 28 }, () => 1.55))
    const z = limitiZoom(finestra, 560)
    const s0 = { x: 0, h: z.min }
    expect(scorri(s0, -500, l, finestra, z).x).toBe(0)
    expect(scorri(s0, 1e9, l, finestra, z).x).toBeCloseTo(scorrimentoMax(l, z.min, finestra))
  })

  it('una striscia più corta della finestra non scorre', () => {
    const l = layoutStriscia([1.5])
    const z = limitiZoom(finestra, 560)
    expect(limita({ x: 300, h: z.min }, l, finestra, z).x).toBe(0)
  })

  it('lo zoom tiene fermo il punto sotto il puntatore e rispetta i limiti', () => {
    const l = layoutStriscia(Array.from({ length: 24 }, () => 1.5))
    const z = limitiZoom(finestra, 1062)
    const s = { x: 2000, h: 300 }
    const punto = 400
    const dopo = zooma(s, 1.5, punto, l, finestra, z)
    expect(dopo.h).toBeCloseTo(450)
    expect((dopo.x + punto) / dopo.h).toBeCloseTo((s.x + punto) / s.h)
    expect(zooma(s, 100, punto, l, finestra, z).h).toBe(z.max)
    expect(zooma(s, 0.001, punto, l, finestra, z).h).toBe(z.min)
  })

  it('trova i fotogrammi visibili e centra quello richiesto', () => {
    const l = layoutStriscia(Array.from({ length: 10 }, () => 1.5))
    const z = limitiZoom(finestra, 1062)
    const s = centraSu(5, { x: 0, h: 300 }, l, finestra, z)
    expect(alCentro(s, l, finestra)).toBe(5)
    const v = visibili(s, l, finestra, 0)!
    expect(v[0]).toBeLessThanOrEqual(5)
    expect(v[1]).toBeGreaterThanOrEqual(5)
    expect(visibili(s, l, finestra, 1)![0]).toBe(Math.max(0, v[0] - 1))
  })
})

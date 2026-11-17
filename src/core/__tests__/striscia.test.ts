import { describe, expect, it } from 'vitest'
import { alCentro, altezzaRuotata, centraSu, CODA_RULLINO, FORMATO_35MM, latiFoto, layoutStriscia, limita, limitiZoom, posaRullino, rapportoRuotato, scorri, scorrimentoMax, visibili, zooma } from '../striscia.ts'

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

describe('rullino aperto', () => {
  it('su un telefono in verticale bussolotto e striscia stanno dentro lo schermo, tra la barra e i comandi', () => {
    const p = posaRullino(390, 844, true)
    // Il bussolotto è a filo del bordo sinistro e la striscia prende quasi tutta la larghezza.
    expect(p.asse).toBeGreaterThan(0)
    expect(p.asse).toBeLessThan(60)
    expect(p.asse + p.finestra.largo).toBe(390)
    // La fascia libera: sotto la barra di navigazione, sopra la riga dei pulsanti e la maniglia.
    expect(p.centro - p.finestra.alto / 2).toBeGreaterThanOrEqual(90)
    expect(p.centro + p.finestra.alto / 2).toBeLessThanOrEqual(844 - 140)
    // Allo zoom minimo la pellicola (larga 35/24 di fotogramma) sta tutta nella fascia.
    const z = limitiZoom(p.finestra, 560)
    expect(z.min * FORMATO_35MM.pellicola).toBeLessThan(p.finestra.alto)
  })

  it('su un telefono in orizzontale la fascia resta utile', () => {
    const p = posaRullino(844, 390, true)
    expect(p.finestra.alto).toBeGreaterThan(200)
    expect(p.centro).toBeGreaterThan(150)
    expect(p.centro).toBeLessThan(240)
  })

  it('su desktop il bussolotto si vede intero allo zoom di apertura', () => {
    const p = posaRullino(1440, 900, false)
    const z = limitiZoom(p.finestra, 1062)
    expect(p.asse - z.min * FORMATO_35MM.bussolottoRaggio).toBeGreaterThan(0)
    expect(p.asse + p.finestra.largo).toBe(1440)
  })

  it('a inizio corsa il primo fotogramma sta fuori dal bussolotto', () => {
    const l = layoutStriscia([1.5, 1.5], 0.06, CODA_RULLINO)
    expect(l.inizio[0]).toBeGreaterThan(FORMATO_35MM.bussolottoRaggio)
  })

  it('una foto girata di un quarto di giro occupa la sua cella', () => {
    // File verticale 564 × 851 posato a 90°: la cella è larga 851/564, il piano prima della rotazione è alto quanto la cella è larga.
    const largo = rapportoRuotato(564, 851, 90)
    expect(latiFoto(largo, 90)).toEqual({ w: 1, h: largo })
    expect(latiFoto(largo, 270)).toEqual({ w: 1, h: largo })
    expect(latiFoto(1.5, 0)).toEqual({ w: 1.5, h: 1 })
    expect(latiFoto(1.5, 180)).toEqual({ w: 1.5, h: 1 })
  })
})

import { describe, expect, it } from 'vitest'
import { AREA_SFOGLIATORE, descriviPagine, misureSfogliatore } from './sfogliatore'
import { didascaliaEdizione } from './didascaliaEdizione'

const area = AREA_SFOGLIATORE

describe('misureSfogliatore', () => {
  it('a 1440 × 800 le pagine 3:2 stanno nell’altezza e nella larghezza disponibili', () => {
    const m = misureSfogliatore(1.5, { larghezza: 1440, altezza: 800 })
    expect(m.altezza + area.verticale).toBeLessThanOrEqual(800)
    expect(m.blocco).toBeLessThanOrEqual(1440 - 2 * area.orizzontale)
    expect(m.blocco / m.altezza).toBeCloseTo(m.doppia ? 3 : 1.5, 1)
    expect(m).toEqual({ larghezza: 924, altezza: 616, doppia: false, blocco: 924 })
  })

  it('a 390 × 700 la pagina 3:2 entra nella larghezza senza uscire dallo schermo', () => {
    const m = misureSfogliatore(1.5, { larghezza: 390, altezza: 700 })
    expect(m.doppia).toBe(false)
    expect(m.blocco).toBeLessThanOrEqual(390 - 2 * area.orizzontale)
    expect(m.altezza + area.verticale).toBeLessThanOrEqual(700)
    expect(m).toEqual({ larghezza: 342, altezza: 228, doppia: false, blocco: 342 })
  })

  it('con pagine verticali (210 × 297) la doppia pagina resta sotto il tetto del libro e dentro lo schermo', () => {
    const m = misureSfogliatore(210 / 297, { larghezza: 1440, altezza: 800 })
    expect(m.doppia).toBe(true)
    expect(m.blocco).toBeLessThanOrEqual(area.libroMassimo)
    expect(m.larghezza).toBeLessThanOrEqual(area.massimoPagina)
    expect(m.altezza + area.verticale).toBeLessThanOrEqual(800)
  })

  it('su schermi stretti e alti con pagine 3:2 si legge una pagina per volta', () => {
    const m = misureSfogliatore(1.5, { larghezza: 700, altezza: 1000 })
    expect(m.doppia).toBe(false)
    expect(m.blocco).toBeLessThanOrEqual(700 - 2 * area.orizzontale)
  })
})

describe('descriviPagine', () => {
  const alt = ['uno', 'due', 'tre']
  it('in lettura doppia descrive anche la pagina di destra', () => {
    expect(descriviPagine(3, 1, true, alt)).toBe('Pagina 1 di 3. uno Pagina 2: due')
  })
  it('a una pagina per volta descrive una sola pagina', () => {
    expect(descriviPagine(3, 2, false, alt)).toBe('Pagina 2 di 3. due')
  })
  it('senza testo alternativo resta il contatore', () => {
    expect(descriviPagine(3, 3, true, [])).toBe('Pagina 3 di 3.')
  })
})

describe('didascaliaEdizione', () => {
  it('fanzine numerata, senza anno', () => {
    expect(didascaliaEdizione({ numero: 1, titolo: 'Muschio' })).toBe('StreetPIL n. 1 · Muschio · Fanzine')
  })
  it('edizione senza numero', () => {
    expect(didascaliaEdizione({ titolo: 'Rivista di prova' })).toBe('Rivista di prova · Fanzine')
  })
})

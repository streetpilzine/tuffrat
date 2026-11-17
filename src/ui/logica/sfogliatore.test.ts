import { describe, expect, it } from 'vitest'
import { angoloFoglio, AREA_SFOGLIATORE, avanzamento, descriviPagine, misureSfogliatore, MOBILE, paginaMobile, rilascio, scenaMobile, versoScena } from './sfogliatore'
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

describe('visore mobile', () => {
  it('la scena è sempre orizzontale e si gira solo col telefono in verticale', () => {
    expect(scenaMobile({ larghezza: 390, altezza: 844 })).toEqual({ ruotata: true, lungo: 844, corto: 390 })
    expect(scenaMobile({ larghezza: 844, altezza: 390 })).toEqual({ ruotata: false, lungo: 844, corto: 390 })
  })

  it('con la scena girata l’asse della pagina è quello verticale dello schermo', () => {
    const scena = { ruotata: true, corto: 390 }
    // L'angolo in alto a sinistra della scena si vede in alto a destra dello schermo.
    expect(versoScena({ x: 390, y: 0 }, scena)).toEqual({ x: 0, y: 0 })
    // Scendere lungo lo schermo è andare a destra nella pagina; andare a sinistra sullo schermo è scendere nella pagina.
    expect(versoScena({ x: 390, y: 500 }, scena)).toEqual({ x: 500, y: 0 })
    expect(versoScena({ x: 90, y: 500 }, scena)).toEqual({ x: 500, y: 300 })
    expect(versoScena({ x: 10, y: 20 }, { ruotata: false, corto: 390 })).toEqual({ x: 10, y: 20 })
  })

  it('la pagina 3:2 prende tutta l’altezza dello schermo tenuto in orizzontale', () => {
    expect(paginaMobile(1.5, { larghezza: 740, altezza: 390 })).toEqual({ larghezza: 561, altezza: 374 })
    // Se lo spazio è stretto vincola la larghezza, sempre in proporzione.
    expect(paginaMobile(1.5, { larghezza: 316, altezza: 390 })).toEqual({ larghezza: 300, altezza: 200 })
  })

  it('il dito verso la rilegatura sfoglia in avanti, verso il bordo libero all’indietro', () => {
    expect(avanzamento(-280, 560, 2, 8)).toBeCloseTo(0.5)
    expect(avanzamento(280, 560, 2, 8)).toBeCloseTo(-0.5)
    expect(avanzamento(-2000, 560, 2, 8)).toBe(1)
  })

  it('ai capi del libro il foglio cede appena e resiste', () => {
    const ultima = avanzamento(-560, 560, 7, 8)
    expect(ultima).toBeGreaterThan(0)
    expect(ultima).toBeLessThanOrEqual(MOBILE.resistenza)
    const prima = avanzamento(560, 560, 0, 8)
    expect(prima).toBeLessThan(0)
    expect(prima).toBeGreaterThanOrEqual(-MOBILE.resistenza)
  })

  it('il bordo libero del foglio resta sotto il dito', () => {
    expect(angoloFoglio(0)).toBe(0)
    expect(angoloFoglio(1)).toBeCloseTo(90)
    expect(angoloFoglio(2)).toBeCloseTo(90)
    // A ogni punto dello sfoglio la larghezza del foglio visto di fronte è la parte di pagina non ancora percorsa.
    for (const p of [0.1, 0.25, 0.5, 0.75, 0.9]) {
      expect(Math.cos((angoloFoglio(p) * Math.PI) / 180)).toBeCloseTo(1 - p)
    }
    // Continuo e crescente: nessuno scatto all'inizio del gesto.
    expect(angoloFoglio(0.001)).toBeLessThan(3)
    expect(angoloFoglio(0.3)).toBeGreaterThan(angoloFoglio(0.2))
  })

  it('il rilascio completa oltre la soglia o con un colpo veloce, e torna a posto altrimenti', () => {
    expect(rilascio(0.5, 0, 2, 8)).toBe(1)
    expect(rilascio(-0.5, 0, 2, 8)).toBe(-1)
    expect(rilascio(0.1, 0, 2, 8)).toBe(0)
    // Colpo veloce verso la rilegatura: avanti anche se corto.
    expect(rilascio(0.1, -0.8, 2, 8)).toBe(1)
    expect(rilascio(-0.1, 0.8, 2, 8)).toBe(-1)
    // Colpo veloce nel verso opposto: annulla anche oltre la soglia.
    expect(rilascio(0.6, 0.8, 2, 8)).toBe(0)
    // Ai capi non si completa mai.
    expect(rilascio(0.09, -2, 7, 8)).toBe(0)
    expect(rilascio(-0.09, 2, 0, 8)).toBe(0)
  })
})

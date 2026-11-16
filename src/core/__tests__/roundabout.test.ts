import { describe, expect, it } from 'vitest'
import { leggiRoundabout, ROUNDABOUT_DEFAULT, ruota, scambia, scriviRoundabout, slotVicino, ugualeRoundabout, type StatoRoundabout } from '../roundabout.ts'

describe('stato Roundabout nell’URL', () => {
  it('lo stato di default non sporca l’URL', () => {
    expect(scriviRoundabout(ROUNDABOUT_DEFAULT)).toBe('')
    expect(leggiRoundabout('')).toEqual(ROUNDABOUT_DEFAULT)
  })

  it('scrivere e rileggere restituisce lo stesso stato', () => {
    const s: StatoRoundabout = { p: [3, 1, 2, 0], r: [1, 0, 3, 2] }
    expect(scriviRoundabout(s)).toBe('?p=3120&r=1032')
    expect(leggiRoundabout(scriviRoundabout(s))).toEqual(s)
  })

  it('valori malformati ricadono sul default, parametro per parametro', () => {
    expect(leggiRoundabout('?p=0012&r=0000')).toEqual(ROUNDABOUT_DEFAULT) // non è una permutazione
    expect(leggiRoundabout('?p=0123&r=0400')).toEqual(ROUNDABOUT_DEFAULT) // rotazione fuori da 0..3
    expect(leggiRoundabout('?p=abc&r=12')).toEqual(ROUNDABOUT_DEFAULT)
    expect(leggiRoundabout('?p=1032&r=9999')).toEqual({ p: [1, 0, 3, 2], r: [0, 0, 0, 0] })
  })

  it('convive con altri parametri della query', () => {
    expect(leggiRoundabout('?vista=lista&p=1023&r=0001')).toEqual({ p: [1, 0, 2, 3], r: [0, 0, 0, 1] })
  })
})

describe('mosse di Roundabout', () => {
  it('scambia due slot senza toccare le rotazioni', () => {
    const s = scambia({ p: [0, 1, 2, 3], r: [1, 2, 3, 0] }, 0, 3)
    expect(s).toEqual({ p: [3, 1, 2, 0], r: [1, 2, 3, 0] })
  })

  it('la rotazione segue la tessera, non lo slot', () => {
    const ruotata = ruota(ROUNDABOUT_DEFAULT, 0) // tessera 0 a 90°
    const spostata = scambia(ruotata, 0, 2) // la tessera 0 va nello slot 2
    expect(spostata.r[0]).toBe(1)
    expect(ruota(spostata, 2).r[0]).toBe(2) // ruotare lo slot 2 ruota ancora la tessera 0
  })

  it('quattro rotazioni riportano alla partenza', () => {
    let s = ROUNDABOUT_DEFAULT
    for (let i = 0; i < 4; i++) s = ruota(s, 1)
    expect(ugualeRoundabout(s, ROUNDABOUT_DEFAULT)).toBe(true)
  })

  it('le mosse non mutano lo stato di partenza', () => {
    const copia = JSON.stringify(ROUNDABOUT_DEFAULT)
    ruota(ROUNDABOUT_DEFAULT, 0)
    scambia(ROUNDABOUT_DEFAULT, 0, 1)
    expect(JSON.stringify(ROUNDABOUT_DEFAULT)).toBe(copia)
  })

  it('con scambi tra vicini e rotazioni si raggiungono tutte le 24 × 256 disposizioni', () => {
    // Visita in ampiezza dallo stato di default usando solo le mosse dell'interfaccia.
    const viste = new Set<string>([scriviRoundabout(ROUNDABOUT_DEFAULT)])
    let fronte: StatoRoundabout[] = [ROUNDABOUT_DEFAULT]
    const coppie = [
      [0, 1],
      [2, 3],
      [0, 2],
      [1, 3],
    ]
    while (fronte.length) {
      const prossimi: StatoRoundabout[] = []
      for (const s of fronte) {
        const mosse = [...coppie.map(([a, b]) => scambia(s, a, b)), ...[0, 1, 2, 3].map((slot) => ruota(s, slot))]
        for (const m of mosse) {
          const k = scriviRoundabout(m)
          if (!viste.has(k)) {
            viste.add(k)
            prossimi.push(m)
          }
        }
      }
      fronte = prossimi
    }
    expect(viste.size).toBe(24 * 256)
  })

  it('slotVicino resta dentro la griglia 2×2', () => {
    expect(slotVicino(0, 'dx')).toBe(1)
    expect(slotVicino(0, 'giu')).toBe(2)
    expect(slotVicino(0, 'sx')).toBe(0)
    expect(slotVicino(0, 'su')).toBe(0)
    expect(slotVicino(3, 'sx')).toBe(2)
    expect(slotVicino(3, 'su')).toBe(1)
    expect(slotVicino(3, 'dx')).toBe(3)
  })
})

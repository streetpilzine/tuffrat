/**
 * Stato di Roundabout (PLAN fase 2): 4 tessere in una griglia 2×2, scambiabili e ruotabili di 90°.
 * Vive nell'URL (`?p=0123&r=0000`) così una disposizione si condivide. Funzioni pure, testate.
 *
 * - `p[slot]` = indice della tessera che occupa lo slot (slot 0 in alto a sinistra, 1 in alto a destra, 2 e 3 sotto).
 * - `r[tessera]` = quarti di giro in senso orario (0..3) della tessera, ovunque si trovi.
 */
export interface StatoRoundabout {
  p: number[]
  r: number[]
}

export const ROUNDABOUT_DEFAULT: StatoRoundabout = { p: [0, 1, 2, 3], r: [0, 0, 0, 0] }

const permutazioneValida = (p: number[]) => p.length === 4 && [0, 1, 2, 3].every((n) => p.includes(n))
const rotazioniValide = (r: number[]) => r.length === 4 && r.every((n) => Number.isInteger(n) && n >= 0 && n <= 3)

const cifre = (s: string | null) => (s && /^\d{4}$/.test(s) ? s.split('').map(Number) : null)

/** Legge lo stato dalla query string; qualsiasi valore malformato ricade sul default. */
export function leggiRoundabout(search: string, def: StatoRoundabout = ROUNDABOUT_DEFAULT): StatoRoundabout {
  const q = new URLSearchParams(search)
  const p = cifre(q.get('p'))
  const r = cifre(q.get('r'))
  return {
    p: p && permutazioneValida(p) ? p : [...def.p],
    r: r && rotazioniValide(r) ? r : [...def.r],
  }
}

export const ugualeRoundabout = (a: StatoRoundabout, b: StatoRoundabout) => a.p.join('') === b.p.join('') && a.r.join('') === b.r.join('')

/** Query string dello stato; stringa vuota per lo stato di default (URL pulito). */
export function scriviRoundabout(s: StatoRoundabout, def: StatoRoundabout = ROUNDABOUT_DEFAULT): string {
  if (ugualeRoundabout(s, def)) return ''
  return `?p=${s.p.join('')}&r=${s.r.join('')}`
}

/** Scambia le tessere di due slot. */
export function scambia(s: StatoRoundabout, a: number, b: number): StatoRoundabout {
  if (a === b) return s
  const p = [...s.p]
  ;[p[a], p[b]] = [p[b], p[a]]
  return { p, r: [...s.r] }
}

/** Ruota di 90° in senso orario la tessera che occupa lo slot. */
export function ruota(s: StatoRoundabout, slot: number): StatoRoundabout {
  const r = [...s.r]
  const t = s.p[slot]
  r[t] = (r[t] + 1) % 4
  return { p: [...s.p], r }
}

/** Slot adiacente nella griglia 2×2 in una direzione, o lo stesso slot se si esce dal bordo. */
export function slotVicino(slot: number, dir: 'su' | 'giu' | 'sx' | 'dx'): number {
  const col = slot % 2
  const riga = Math.floor(slot / 2)
  if (dir === 'sx' && col === 1) return slot - 1
  if (dir === 'dx' && col === 0) return slot + 1
  if (dir === 'su' && riga === 1) return slot - 2
  if (dir === 'giu' && riga === 0) return slot + 2
  return slot
}

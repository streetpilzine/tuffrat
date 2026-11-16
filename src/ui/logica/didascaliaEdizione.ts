import type { Edizione } from '../../data/schema.ts'

/**
 * Didascalia di una fanzine nell'elenco: «StreetPIL n. 1 · Muschio · Fanzine».
 * L'anno non compare perché non è noto; un'edizione senza numero (la rivista di prova in dev) resta «Titolo · Fanzine».
 */
export function didascaliaEdizione(e: Pick<Edizione, 'titolo'> & { numero?: number }): string {
  const testata = e.numero ? `StreetPIL n. ${e.numero}` : null
  return [testata ?? e.titolo, testata ? e.titolo : null, 'Fanzine'].filter(Boolean).join(' · ')
}

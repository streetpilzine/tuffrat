import type { NavigateFunction, NavigateOptions } from 'react-router'
import { tutteLeOpereById } from '../data/index.ts'

/**
 * Ponte router → Canvas. Il contesto di react-router non attraversa il root R3F (docs/decisioni.md, 12/11):
 * il SceneRouter registra qui `navigate` e gli oggetti 3D lo chiamano come funzione di modulo.
 */
let navigate: NavigateFunction | null = null

export function registraNavigate(fn: NavigateFunction | null) {
  navigate = fn
}

export function naviga(to: string, opzioni?: NavigateOptions) {
  void navigate?.(to, opzioni)
}

/** Da un'opera in primo piano si torna alla sua serie, o al muro della home. */
export function percorsoDiRitorno(operaId: string): string {
  const serie = tutteLeOpereById.get(operaId)?.serie
  return serie && serie !== '2023-2025' ? `/serie/${serie}` : '/'
}

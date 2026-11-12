import { create } from 'zustand'

/** Forme del cursore contestuale (ARCHITECTURE §6): default, spray sulle azioni, pennarello sui link, mano sulle opere, pugno durante il drag. */
export type CursorKind = 'default' | 'spray' | 'marker' | 'hand' | 'grab'

export const CURSOR_KINDS: readonly CursorKind[] = ['default', 'spray', 'marker', 'hand', 'grab']

interface CursorState {
  kind: CursorKind
  set: (kind: CursorKind) => void
}

export const useCursor = create<CursorState>()((set) => ({
  kind: 'default',
  set: (kind) => set((s) => (s.kind === kind ? s : { kind })),
}))

/** Deduce la forma da un elemento DOM: `data-cursor` esplicito, poi card/bottoni/link. */
export function cursorPerElemento(el: Element | null): CursorKind {
  if (!el) return 'default'
  const esplicito = el.closest<HTMLElement>('[data-cursor]')?.dataset.cursor
  if (esplicito && (CURSOR_KINDS as readonly string[]).includes(esplicito)) return esplicito as CursorKind
  if (el.closest('.card')) return 'hand'
  if (el.closest('button, .button')) return 'spray'
  if (el.closest('a')) return 'marker'
  return 'default'
}

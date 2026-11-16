import { create } from 'zustand'

/**
 * Un solo oggetto alla volta può stare «in primo piano» fuori dalle opere: un rullino srotolato, il ritratto girato sul retro o la TV con il video. Un campo solo, esclusivo: così una regola unica copre il blocco dello scorrimento del muro, Esc, l'azzeramento al cambio di pagina e i testi dell'Hud, e il ritratto girato non può mai trovarsi sotto un video acceso.
 */
export type PrimoPiano = { tipo: 'rullino'; id: string } | { tipo: 'bio' } | { tipo: 'tv' }

/** Stato della TV: accesa con la neve, con il video in riproduzione (solo mentre è in primo piano), spenta con lo schermo nero. */
export type StatoTv = 'neve' | 'video' | 'spenta'

export interface OggettiState {
  primoPiano: PrimoPiano | null
  tv: StatoTv
  /** Mette un oggetto in primo piano (o nessuno). Uscendo dalla TV il video si ferma e torna la neve. */
  setPrimoPiano: (p: PrimoPiano | null) => void
  /** Click sullo schermo: se la TV è accesa parte il video e la TV va in primo piano. Da spenta non succede nulla. */
  avviaVideo: () => void
  /** Pulsante della TV: spegne (video distrutto, schermo nero) o riaccende (neve). */
  interruttoreTv: () => void
  /** Cambio di pagina: tutto torna a posto; la TV spenta resta spenta. */
  azzera: () => void
}

export const useOggetti = create<OggettiState>()((set, get) => ({
  primoPiano: null,
  tv: 'neve',
  setPrimoPiano: (p) => set({ primoPiano: p, tv: get().tv === 'video' && p?.tipo !== 'tv' ? 'neve' : get().tv }),
  avviaVideo: () => {
    if (get().tv === 'spenta') return
    set({ primoPiano: { tipo: 'tv' }, tv: 'video' })
  },
  interruttoreTv: () => {
    const { tv, primoPiano } = get()
    if (tv === 'spenta') set({ tv: 'neve' })
    else set({ tv: 'spenta', primoPiano: primoPiano?.tipo === 'tv' ? null : primoPiano })
  },
  azzera: () => set({ primoPiano: null, tv: get().tv === 'video' ? 'neve' : get().tv }),
}))

export const rullinoAperto = (s: OggettiState) => (s.primoPiano?.tipo === 'rullino' ? s.primoPiano.id : null)
export const bioGirata = (s: OggettiState) => s.primoPiano?.tipo === 'bio'
export const tvInPrimoPiano = (s: OggettiState) => s.primoPiano?.tipo === 'tv'

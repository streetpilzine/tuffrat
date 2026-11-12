import { create } from 'zustand'
import { dispositivoDebole, rilevaWebGL } from '../core/webgl.ts'

const CHIAVE = 'tuffrat.prefs.v1'
const QUERY_MOTION = '(prefers-reduced-motion: reduce)'

export interface Prefs {
  /** Interruttore «vista lista» (Nav) o `?vista=lista`: niente Canvas, solo DOM. */
  vistaLista: boolean
  /** Da media query, osservata. */
  reducedMotion: boolean
  /** WebGL disponibile e dispositivo adeguato. */
  webgl: boolean
  toggleVistaLista: () => void
  setReducedMotion: (v: boolean) => void
}

/**
 * Vista iniziale: il parametro URL vince, poi la preferenza salvata, altrimenti 3D.
 * Funzione pura, testata in `__tests__/prefs.test.ts`.
 */
export function vistaIniziale(search: string, salvata: string | null): boolean {
  const vista = new URLSearchParams(search).get('vista')
  if (vista === 'lista') return true
  if (vista === '3d') return false
  if (salvata) {
    try {
      const p = JSON.parse(salvata) as { vistaLista?: unknown }
      if (typeof p.vistaLista === 'boolean') return p.vistaLista
    } catch {
      /* preferenza corrotta: si ignora */
    }
  }
  return false
}

function leggiSalvata(): string | null {
  try {
    return localStorage.getItem(CHIAVE)
  } catch {
    return null
  }
}

function salva(vistaLista: boolean) {
  try {
    localStorage.setItem(CHIAVE, JSON.stringify({ vistaLista }))
  } catch {
    /* storage non disponibile */
  }
}

const inBrowser = typeof window !== 'undefined'

export const usePrefs = create<Prefs>()((set, get) => ({
  vistaLista: inBrowser ? vistaIniziale(window.location.search, leggiSalvata()) : true,
  reducedMotion: inBrowser ? window.matchMedia(QUERY_MOTION).matches : false,
  webgl: inBrowser ? rilevaWebGL() && !dispositivoDebole() : false,
  toggleVistaLista: () => {
    const v = !get().vistaLista
    salva(v)
    set({ vistaLista: v })
  },
  setReducedMotion: (v) => set({ reducedMotion: v }),
}))

/** Vero quando si monta Stage e Cursor: vista 3D scelta, motion pieno, WebGL ok. */
export const modo3D = (p: Pick<Prefs, 'vistaLista' | 'reducedMotion' | 'webgl'>) => !p.vistaLista && !p.reducedMotion && p.webgl

/** Osserva la media query per tutta la vita dell'app; ritorna la funzione di pulizia. */
export function osservaReducedMotion(): () => void {
  if (!inBrowser) return () => {}
  const mq = window.matchMedia(QUERY_MOTION)
  const onChange = (e: MediaQueryListEvent) => usePrefs.getState().setReducedMotion(e.matches)
  mq.addEventListener('change', onChange)
  return () => mq.removeEventListener('change', onChange)
}

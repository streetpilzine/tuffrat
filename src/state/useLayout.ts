import { create } from 'zustand'
import { opereInHome, polittici, type Opera } from '../data/index.ts'
import { disponiPolittico, disponiSulMuro, zonaBustine, type Posto } from '../three/layout-muro.ts'

const CHIAVE = 'tuffrat.layout.v1'

export interface Punto {
  x: number
  y: number
}

interface LayoutState {
  /** Posizioni scelte dall'utente per i quadri della home (solo quelli spostati). */
  posizioni: Record<string, Punto>
  /** Ordine dei pannelli di ogni polittico (sessione corrente). */
  ordini: Record<string, string[]>
  sposta: (id: string, p: Punto) => void
  ripristina: () => void
  riordina: (polittico: string, ordine: string[]) => void
}

function leggi(): Record<string, Punto> {
  try {
    const raw = localStorage.getItem(CHIAVE)
    if (!raw) return {}
    const dati = JSON.parse(raw) as { v?: number; posizioni?: Record<string, Punto> }
    if (dati.v !== 1 || !dati.posizioni) return {}
    const valide: Record<string, Punto> = {}
    for (const [id, p] of Object.entries(dati.posizioni)) {
      if (p && Number.isFinite(p.x) && Number.isFinite(p.y)) valide[id] = { x: p.x, y: p.y }
    }
    return valide
  } catch {
    return {}
  }
}

function salva(posizioni: Record<string, Punto>) {
  try {
    localStorage.setItem(CHIAVE, JSON.stringify({ v: 1, posizioni }))
  } catch {
    /* storage non disponibile */
  }
}

/** Disposizione del muro: riaggancio dei quadri (persistito) e ordine dei polittici (ARCHITECTURE §6). */
export const useLayout = create<LayoutState>()((set, get) => ({
  posizioni: typeof window !== 'undefined' ? leggi() : {},
  ordini: Object.fromEntries(polittici.map((p) => [p.id, [...p.ordineDefault]])),
  sposta: (id, p) => {
    const posizioni = { ...get().posizioni, [id]: p }
    salva(posizioni)
    set({ posizioni })
  },
  ripristina: () => {
    salva({})
    set({ posizioni: {} })
  },
  riordina: (polittico, ordine) => set({ ordini: { ...get().ordini, [polittico]: ordine } }),
}))

const postiHome = disponiSulMuro(opereInHome)

export interface Posa {
  opera: Opera
  x: number
  y: number
  tilt: number
}

/** Quadri della home con la posizione corrente (default del layout o scelta dell'utente). */
export function poseHome(posizioni: Record<string, Punto>): Posa[] {
  return postiHome.map((p) => {
    const mia = posizioni[p.opera.id]
    return mia ? { ...p, x: mia.x, y: mia.y } : p
  })
}

/** Pannelli dei polittici con la posizione che deriva dall'ordine corrente. */
export function posePolittici(ordini: Record<string, string[]>): Posto[] {
  // Sul telefono i polittici stanno in colonna sopra Roundabout: la stessa zona vale per i quadri, per i target e per il fuoco dei pannelli.
  const zona = zonaBustine()
  return polittici.flatMap((p, riga) => disponiPolittico(p, ordini[p.id] ?? p.ordineDefault, riga, zona))
}

/** Posa corrente di un'opera appesa (home o polittico), o `null` se l'opera non è una cornice sul muro. */
export function posaDi(id: string): Posa | null {
  const { posizioni, ordini } = useLayout.getState()
  return poseHome(posizioni).find((p) => p.opera.id === id) ?? posePolittici(ordini).find((p) => p.opera.id === id) ?? null
}

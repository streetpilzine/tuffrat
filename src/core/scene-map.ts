/**
 * Route → scena → target camera (ARCHITECTURE §5 e §6).
 * Unità mondo: il muro è il piano z=0, largo 14 e alto 7, con il pavimento a y=-1.5;
 * il banco sta davanti al muro a z≈2.2. La camera guarda sempre `look`.
 */

export type Scena = 'muro' | 'banco' | 'bio'

export interface CameraTarget {
  pos: readonly [number, number, number]
  look: readonly [number, number, number]
}

export interface SceneInfo {
  scena: Scena
  target: CameraTarget
  /** Complemento annunciato in aria-live: «La camera si sposta {etichetta}». */
  etichetta: string
}

export const DURATA_CAMERA_S = 0.8

const MURO: CameraTarget = { pos: [0, 1.2, 7.5], look: [0, 1.2, 0] }
const MURO_VICINO: CameraTarget = { pos: [0, 1.3, 5], look: [0, 1.3, 0] }
const MURO_SINISTRA: CameraTarget = { pos: [-3, 1.3, 6], look: [-3, 1.2, 0] }
const MURO_MOSTRE: CameraTarget = { pos: [-6.5, 1.6, 5], look: [-6, 1.5, 0] }
const BANCO: CameraTarget = { pos: [0, 2.8, 4.6], look: [0, -0.5, 2.2] }
const BIO: CameraTarget = { pos: [6.5, 1.6, 4.5], look: [6.5, 1.5, 0] }
const LONTANO: CameraTarget = { pos: [0, 3.5, 10], look: [0, 1, 0] }

const pulisci = (p: string) => (p.replace(/\/+$/, '') || '/').split('?')[0]

export function scenaPerRoute(pathname: string): SceneInfo {
  const p = pulisci(pathname)
  if (p === '/') return { scena: 'muro', target: MURO, etichetta: 'sul muro' }
  if (p === '/bio' || p === '/about') return { scena: 'bio', target: BIO, etichetta: 'sul ritratto' }
  if (p.startsWith('/opere/')) return { scena: 'muro', target: MURO_VICINO, etichetta: 'sull’opera in primo piano' }
  if (p === '/serie') return { scena: 'muro', target: MURO_SINISTRA, etichetta: 'sulle serie' }
  if (p.startsWith('/serie/')) return { scena: 'muro', target: MURO_SINISTRA, etichetta: 'sulla serie' }
  if (p === '/edizioni' || p.startsWith('/edizioni/')) return { scena: 'banco', target: BANCO, etichetta: 'sul banco delle fanzine' }
  if (p === '/mostre' || p.startsWith('/mostre/')) return { scena: 'muro', target: MURO_MOSTRE, etichetta: 'sulle mostre' }
  if (p === '/fotografia') return { scena: 'banco', target: BANCO, etichetta: 'sul banco' }
  return { scena: 'muro', target: LONTANO, etichetta: 'su un muro vuoto' }
}

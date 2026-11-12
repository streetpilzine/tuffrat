import { create } from 'zustand'
import type { CameraTarget, Scena } from '../core/scene-map.ts'
import { scenaPerRoute } from '../core/scene-map.ts'

export interface SceneState {
  scena: Scena
  target: CameraTarget
  inTransizione: boolean
  /** Chiamato dal SceneRouter a ogni cambio di route. */
  vaiA: (pathname: string) => void
  setInTransizione: (v: boolean) => void
}

const iniziale = scenaPerRoute(typeof window !== 'undefined' ? window.location.pathname : '/')

/** Scena corrente e target camera: lo scrive il SceneRouter, lo leggono Stage, Nav e la regione aria-live. */
export const useScene = create<SceneState>()((set) => ({
  scena: iniziale.scena,
  target: iniziale.target,
  inTransizione: false,
  vaiA: (pathname) => set(scenaPerRoute(pathname)),
  setInTransizione: (v) => set({ inTransizione: v }),
}))

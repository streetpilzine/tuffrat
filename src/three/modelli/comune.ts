import { useGLTF } from '@react-three/drei'
import { useMemo } from 'react'
import type { Object3D } from 'three'

/** Nome del file in `public/assets/models/` → URL (`BASE_URL` di Vite, oggi `/`). */
export function urlModello(file: string): string {
  return `${import.meta.env.BASE_URL}assets/models/${file}`
}

/**
 * Carica un modello Blender (`tools/blender/`, GLB senza compressione) e ne restituisce una copia per la scena. Va usata in un componente dentro una `Suspense` sua, con le primitive come ripiego: lo `Stage` ha una sola `Suspense`, e un file che arriva tardi non deve far sparire tutto il mondo. Il file si carica una volta sola; più usi sono cloni con i materiali in condivisione.
 * Senza i decoder Draco e Meshopt di drei: i modelli non li usano, e così non entrano nel bundle.
 */
export function useModello(file: string): Object3D {
  const gltf = useGLTF(urlModello(file), false, false)
  return useMemo(() => gltf.scene.clone(true), [gltf.scene])
}

import { useModello } from './comune'

/**
 * Il banco da lavoro da `banco.glb` (modello Blender): piano di tavole di legno 4,6 × 1,5 con i bordi smussati, gambe e traverse in metallo fino al pavimento. Origine al centro della superficie del piano: si mette in `[0, BANCO.y, BANCO.z]`.
 */
export function ModelloBanco() {
  return <primitive object={useModello('banco.glb')} />
}

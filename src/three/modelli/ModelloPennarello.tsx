import { useModello } from './comune'

/**
 * Il pennarello a punta larga da `pennarello.glb` (modello Blender): origine alla punta, asse lungo +y fino a 0,33 (corpo e tappo con l'occhiello), raggio 0,02.
 */
export function ModelloPennarello() {
  return <primitive object={useModello('pennarello.glb')} />
}

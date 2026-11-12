import { opereInHome } from '../data'
import { disponiSulMuro } from '../three/layout-muro'
import { Quadro } from '../three/Quadro'

const posti = disponiSulMuro(opereInHome)

/** Il muro dello studio: piano di fondo, pavimento, opere singole appese (in fase 2 diventano Frame afferrabili). */
export function Muro() {
  return (
    <group>
      <mesh position={[0, 2, -0.05]}>
        <planeGeometry args={[18, 8]} />
        <meshStandardMaterial color="#efede8" roughness={0.95} />
      </mesh>
      <mesh position={[0, -1.5, 5]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[18, 14]} />
        <meshStandardMaterial color="#e3dfd5" roughness={1} />
      </mesh>
      {posti.map((p) => (
        <Quadro key={p.opera.id} opera={p.opera} position={[p.x, p.y, 0]} tilt={p.tilt} />
      ))}
    </group>
  )
}

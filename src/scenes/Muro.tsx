import { poseHome, posePolittici, useLayout } from '../state/useLayout'
import { Bacheca } from '../three/Bacheca'
import { Frame } from '../three/Frame'
import { MURO } from '../three/mondo'
import { RoundaboutBoard } from '../three/RoundaboutBoard'

const LARGO = MURO.xMax - MURO.xMin
const CENTRO_X = (MURO.xMax + MURO.xMin) / 2

/**
 * Il muro dello studio: piano di fondo, pavimento e tutto ciò che è appeso.
 * Da destra a sinistra: i singoli della home (cornici riagganciabili), Roundabout, i polittici delle Bustine di tè, la bacheca delle mostre.
 */
export function Muro() {
  const posizioni = useLayout((s) => s.posizioni)
  const ordini = useLayout((s) => s.ordini)
  return (
    <group>
      <mesh position={[CENTRO_X, MURO.yCentro, -0.05]}>
        <planeGeometry args={[LARGO, MURO.alto]} />
        <meshStandardMaterial color="#efede8" roughness={0.95} />
      </mesh>
      <mesh position={[CENTRO_X, MURO.pavimento, 5]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[LARGO, 14]} />
        <meshStandardMaterial color="#e3dfd5" roughness={1} />
      </mesh>
      {poseHome(posizioni).map((p) => (
        <Frame key={p.opera.id} opera={p.opera} x={p.x} y={p.y} tilt={p.tilt} spostabile />
      ))}
      {posePolittici(ordini).map((p) => (
        <Frame key={p.opera.id} opera={p.opera} x={p.x} y={p.y} />
      ))}
      <RoundaboutBoard />
      <Bacheca />
    </group>
  )
}

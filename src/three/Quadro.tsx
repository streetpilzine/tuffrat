import { useLoader } from '@react-three/fiber'
import { Suspense } from 'react'
import { SRGBColorSpace, TextureLoader } from 'three'
import type { Opera } from '../data'
import { SCALA } from './layout-muro'

interface Props {
  opera: Opera
  position: [number, number, number]
  tilt?: number
}

function Tela({ opera, w, h }: { opera: Opera; w: number; h: number }) {
  const tex = useLoader(TextureLoader, opera.immagine.src)
  return (
    <mesh position={[0, 0, 0.03]}>
      <planeGeometry args={[w, h]} />
      <meshStandardMaterial map={tex} map-colorSpace={SRGBColorSpace} map-anisotropy={4} roughness={0.85} />
    </mesh>
  )
}

/**
 * Opera appesa: cornice scura sottile e tela con la texture dell'immagine, misure reali.
 * Componente di parcheggio della fase 1: in fase 2 lo sostituisce `Frame` (PhysicalObject + shader luce-puntatore).
 */
export function Quadro({ opera, position, tilt = 0 }: Props) {
  const w = opera.misure.w * SCALA
  const h = opera.misure.h * SCALA
  return (
    <group position={position} rotation={[0, 0, tilt]}>
      <mesh>
        <boxGeometry args={[w + 0.08, h + 0.08, 0.06]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.6} />
      </mesh>
      <Suspense
        fallback={
          <mesh position={[0, 0, 0.03]}>
            <planeGeometry args={[w, h]} />
            <meshStandardMaterial color="#d8d4ca" />
          </mesh>
        }
      >
        <Tela opera={opera} w={w} h={h} />
      </Suspense>
    </group>
  )
}

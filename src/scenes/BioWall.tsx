import { useLoader } from '@react-three/fiber'
import { SRGBColorSpace, TextureLoader } from 'three'
import { artista } from '../data'

/** L'angolo destro del muro: il ritratto dell'artista, dove la camera si posa su /bio. */
export function BioWall() {
  const tex = useLoader(TextureLoader, artista.profilo.src)
  const w = 1.3
  const h = (w * artista.profilo.height) / artista.profilo.width
  return (
    <group position={[6.5, 1.5, 0]} rotation={[0, 0, -0.01]}>
      <mesh>
        <boxGeometry args={[w + 0.06, h + 0.06, 0.04]} />
        <meshStandardMaterial color="#ffffff" roughness={0.7} />
      </mesh>
      <mesh position={[0, 0, 0.025]}>
        <planeGeometry args={[w, h]} />
        <meshStandardMaterial map={tex} map-colorSpace={SRGBColorSpace} roughness={0.9} />
      </mesh>
    </group>
  )
}

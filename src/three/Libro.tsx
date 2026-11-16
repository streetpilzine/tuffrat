import { useLoader, useThree } from '@react-three/fiber'
import { Suspense, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { SRGBColorSpace, TextureLoader, type Group } from 'three'
import type { Edizione } from '../data'
import { useGesto } from '../core/gesto'
import { EASE_TUFFRAT, gsap } from '../core/motion/ease'
import { naviga } from '../core/ponte'
import { useScene } from '../state/useScene'
import { BANCO, SCALA } from './mondo'

interface Props {
  edizione: Edizione
  /** Posizione a riposo sul banco (x, z) e rotazione attorno alla verticale. */
  x: number
  z: number
  giro?: number
}

/** A4 verticale: 21 × 29,7 cm. */
const LARGO = 21 * SCALA
const ALTO = 29.7 * SCALA
const SPESSORE = 0.022

function Copertina({ src }: { src: string }) {
  const tex = useLoader(TextureLoader, src)
  return (
    <mesh position={[0, SPESSORE / 2 + 0.001, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[LARGO, ALTO]} />
      <meshBasicMaterial map={tex} map-colorSpace={SRGBColorSpace} map-anisotropy={8} toneMapped={false} />
    </mesh>
  )
}

/**
 * Una fanzine sul banco (ARCHITECTURE §7, `Book`). Click: la route diventa `/edizioni/:slug`, la rivista si alza
 * verso la camera e sopra si apre lo sfogliatore DOM (`FlipBook`); alla chiusura torna a posto.
 * Equivalente da tastiera: i link dell'elenco nella scheda.
 */
export function Libro({ edizione, x, z, giro = 0 }: Props) {
  const g = useRef<Group>(null)
  const invalidate = useThree((s) => s.invalidate)
  const aperto = useScene((s) => s.percorso === `/edizioni/${edizione.id}`)
  const [sopra, setSopra] = useState(false)
  const yRiposo = BANCO.y + SPESSORE / 2

  useLayoutEffect(() => {
    g.current?.position.set(x, yRiposo, z)
    g.current?.rotation.set(0, giro, 0)
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const gruppo = g.current
    if (!gruppo) return
    const opz = { duration: 0.7, ease: EASE_TUFFRAT, onUpdate: invalidate, overwrite: true as const }
    // Aperto: si alza davanti alla camera e si inclina verso chi guarda.
    const a = gsap.to(gruppo.position, aperto ? { x: -0.9, y: 0.55, z: 3.35, ...opz } : { x, y: yRiposo + (sopra ? 0.05 : 0), z, ...opz })
    const b = gsap.to(gruppo.rotation, aperto ? { x: 0.95, y: 0, ...opz } : { x: 0, y: giro, ...opz })
    return () => {
      a.kill()
      b.kill()
    }
  }, [aperto, sopra, x, z, giro, yRiposo, invalidate])

  const gesto = useGesto({
    cursore: 'hand',
    onHover: setSopra,
    onClick: () => naviga(aperto ? '/edizioni' : `/edizioni/${edizione.id}`),
  })

  return (
    <group ref={g} {...gesto}>
      <mesh>
        <boxGeometry args={[LARGO, SPESSORE, ALTO]} />
        <meshStandardMaterial color="#f4f1ea" roughness={0.9} />
      </mesh>
      <Suspense fallback={null}>
        <Copertina src={edizione.copertina.src} />
      </Suspense>
    </group>
  )
}

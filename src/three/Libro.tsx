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

/** Lato lungo di una fanzine: 29,7 cm, come un A4. Il lato corto segue il rapporto della copertina. */
const LATO_LUNGO = 29.7 * SCALA
const SPESSORE = 0.022
/** Posa da aperta: alzata davanti alla camera di `/edizioni` e inclinata verso chi guarda. */
const APERTA = { x: -0.9, y: 0.55, z: 3.35, inclinazione: 0.95 }

/** Formato sul banco in unità mondo: `largo` lungo x, `alto` lungo z (il piede della copertina verso chi guarda). */
function formatoLibro(edizione: Edizione): { largo: number; alto: number } {
  const { width, height } = edizione.copertina
  return width >= height ? { largo: LATO_LUNGO, alto: (LATO_LUNGO * height) / width } : { largo: (LATO_LUNGO * width) / height, alto: LATO_LUNGO }
}

function Copertina({ src, largo, alto }: { src: string; largo: number; alto: number }) {
  const tex = useLoader(TextureLoader, src)
  return (
    <mesh position={[0, SPESSORE / 2 + 0.001, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[largo, alto]} />
      <meshBasicMaterial map={tex} map-colorSpace={SRGBColorSpace} map-anisotropy={8} toneMapped={false} />
    </mesh>
  )
}

/**
 * Una fanzine sul banco (ARCHITECTURE §7). Il formato viene dal rapporto della copertina (le StreetPIL sono orizzontali 3:2, la rivista di prova è un A4 verticale) e il blocco prende il colore del dorso dell'edizione. Click: la route diventa `/edizioni/:slug`, la rivista si alza verso la camera in 0,7 s e sopra si apre lo sfogliatore DOM (`FlipBook`); alla chiusura torna a posto.
 * Equivalente da tastiera: i link dell'elenco nella scheda.
 */
export function Libro({ edizione, x, z, giro = 0 }: Props) {
  const g = useRef<Group>(null)
  const invalidate = useThree((s) => s.invalidate)
  const aperto = useScene((s) => s.percorso === `/edizioni/${edizione.id}`)
  const [sopra, setSopra] = useState(false)
  const yRiposo = BANCO.y + SPESSORE / 2
  const { largo, alto } = formatoLibro(edizione)

  useLayoutEffect(() => {
    g.current?.position.set(x, yRiposo, z)
    g.current?.rotation.set(0, giro, 0)
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const gruppo = g.current
    if (!gruppo) return
    const opz = { duration: 0.7, ease: EASE_TUFFRAT, onUpdate: invalidate, overwrite: true as const }
    const a = gsap.to(gruppo.position, aperto ? { x: APERTA.x, y: APERTA.y, z: APERTA.z, ...opz } : { x, y: yRiposo + (sopra ? 0.05 : 0), z, ...opz })
    const b = gsap.to(gruppo.rotation, aperto ? { x: APERTA.inclinazione, y: 0, ...opz } : { x: 0, y: giro, ...opz })
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
        <boxGeometry args={[largo, SPESSORE, alto]} />
        <meshStandardMaterial color={edizione.dorso?.colore ?? '#f4f1ea'} roughness={0.9} />
      </mesh>
      <Suspense fallback={null}>
        <Copertina src={edizione.copertina.src} largo={largo} alto={alto} />
      </Suspense>
    </group>
  )
}

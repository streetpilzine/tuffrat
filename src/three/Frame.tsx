import { useLoader, useThree } from '@react-three/fiber'
import { Suspense, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { MathUtils, Plane, TextureLoader, Vector3, type Group } from 'three'
import type { Opera } from '../data'
import { useGesto } from '../core/gesto'
import { EASE_TUFFRAT, gsap } from '../core/motion/ease'
import { naviga, percorsoDiRitorno } from '../core/ponte'
import { useLayout } from '../state/useLayout'
import { useScene } from '../state/useScene'
import { agganciaAllaGriglia } from './layout-muro'
import { useMaterialeTela } from './luce'
import { MURO, SCALA } from './mondo'

interface Props {
  opera: Opera
  /** Posa a riposo sul muro. */
  x: number
  y: number
  tilt?: number
  /** Il quadro si può staccare e riagganciare altrove (drag con snap, persistito in `useLayout`). */
  spostabile?: boolean
}

const PIANO_MURO = new Plane(new Vector3(0, 0, 1), 0)
const Z_FUOCO = 0.5
const Z_HOVER = 0.07
const Z_PRESO = 0.3

function Tela({ opera, w, h }: { opera: Opera; w: number; h: number }) {
  const tex = useLoader(TextureLoader, opera.immagine.src)
  const mat = useMaterialeTela(tex)
  return (
    <mesh position={[0, 0, 0.031]}>
      <planeGeometry args={[w, h]} />
      <primitive object={mat} attach="material" />
    </mesh>
  )
}

/**
 * Cornice di un'opera appesa (ARCHITECTURE §7): storta a riposo, si stacca dal muro in hover,
 * al click vola in primo piano (la route diventa `/opere/:slug` e la camera la inquadra),
 * con Esc o click fuori torna a posto. Se `spostabile`, il drag la riaggancia sulla griglia del muro.
 */
export function Frame({ opera, x, y, tilt = 0, spostabile = false }: Props) {
  const g = useRef<Group>(null)
  const invalidate = useThree((s) => s.invalidate)
  const inFuoco = useScene((s) => s.fuoco === opera.id)
  const [sopra, setSopra] = useState(false)
  const preso = useRef(false)
  const scarto = useRef({ x: 0, y: 0 })
  const w = opera.misure.w * SCALA
  const h = opera.misure.h * SCALA

  useLayoutEffect(() => {
    g.current?.position.set(x, y, 0)
    if (g.current) g.current.rotation.z = tilt
    // Solo al montaggio: dopo, la posa si raggiunge con un tween.
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const gruppo = g.current
    if (!gruppo || preso.current) return
    const z = inFuoco ? Z_FUOCO : sopra ? Z_HOVER : 0
    const opz = { duration: 0.6, ease: EASE_TUFFRAT, onUpdate: invalidate, overwrite: true as const }
    const a = gsap.to(gruppo.position, { x, y, z, ...opz })
    const b = gsap.to(gruppo.rotation, { z: inFuoco ? 0 : tilt, ...opz })
    return () => {
      a.kill()
      b.kill()
    }
  }, [x, y, tilt, inFuoco, sopra, invalidate])

  const punto = new Vector3()
  const gesto = useGesto({
    cursore: 'hand',
    onHover: setSopra,
    onClick: () => naviga(inFuoco ? percorsoDiRitorno(opera.id) : `/opere/${opera.id}`),
    onDragStart: (e) => {
      const gruppo = g.current
      if (!spostabile || inFuoco || !gruppo || !e.ray.intersectPlane(PIANO_MURO, punto)) return false
      preso.current = true
      gsap.killTweensOf(gruppo.position)
      scarto.current = { x: gruppo.position.x - punto.x, y: gruppo.position.y - punto.y }
    },
    onDrag: (e) => {
      const gruppo = g.current
      if (!gruppo || !e.ray.intersectPlane(PIANO_MURO, punto)) return
      gruppo.position.set(punto.x + scarto.current.x, punto.y + scarto.current.y, Z_PRESO)
      invalidate()
    },
    onDragEnd: () => {
      const gruppo = g.current
      preso.current = false
      if (!gruppo) return
      const nx = MathUtils.clamp(agganciaAllaGriglia(gruppo.position.x), MURO.xMin + w / 2 + 0.2, MURO.xMax - w / 2 - 0.2)
      const ny = MathUtils.clamp(agganciaAllaGriglia(gruppo.position.y), MURO.pavimento + h / 2 + 0.15, MURO.yCentro + MURO.alto / 2 - h / 2 - 0.2)
      gsap.to(gruppo.position, { x: nx, y: ny, z: 0, duration: 0.5, ease: EASE_TUFFRAT, onUpdate: invalidate, overwrite: true })
      useLayout.getState().sposta(opera.id, { x: nx, y: ny })
    },
  })

  return (
    <group ref={g} {...gesto}>
      <mesh>
        <boxGeometry args={[w + 0.08, h + 0.08, 0.06]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.6} />
      </mesh>
      <Suspense
        fallback={
          <mesh position={[0, 0, 0.031]}>
            <planeGeometry args={[w, h]} />
            <meshBasicMaterial color="#d8d4ca" />
          </mesh>
        }
      >
        <Tela opera={opera} w={w} h={h} />
      </Suspense>
    </group>
  )
}

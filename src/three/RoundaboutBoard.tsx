import { useLoader, useThree } from '@react-three/fiber'
import { Suspense, useEffect, useLayoutEffect, useRef } from 'react'
import { Plane, TextureLoader, Vector3, type Group } from 'three'
import { useGesto } from '../core/gesto'
import { EASE_TUFFRAT, gsap } from '../core/motion/ease'
import { naviga } from '../core/ponte'
import { ruota, scambia, scriviRoundabout, type StatoRoundabout } from '../core/roundabout'
import { serieById } from '../data'
import { useScene } from '../state/useScene'
import { useMaterialeTela } from './luce'
import { ZONA } from './mondo'

/** Lato della tessera (39 cm) e fuga tra le tessere, in unità mondo. */
const LATO = 0.78
const FUGA = 0.025
const PASSO = LATO + FUGA
const CENTRO_Y = 1.5
const PIANO = new Plane(new Vector3(0, 0, 1), 0)

/** Centro dello slot nel sistema del board: 0 in alto a sinistra, 1 in alto a destra, 2 e 3 sotto. */
const centroSlot = (slot: number): [number, number] => [((slot % 2) - 0.5) * PASSO, (0.5 - Math.floor(slot / 2)) * PASSO]

const tessere = serieById.get('roundabout')?.modulare?.tessere ?? []
/** Su schermi piccoli si carica la variante a 1024 px (PLAN §5). */
const piccolo = typeof window !== 'undefined' && window.matchMedia('(max-width: 800px)').matches
const texturePer = (t: number) => {
  const src = tessere[t]?.texture ?? ''
  return piccolo ? src.replace(/\.webp$/, '-1024.webp') : src
}

const applica = (s: StatoRoundabout) => naviga(`/serie/roundabout${scriviRoundabout(s)}`, { replace: true })

function Faccia({ tessera }: { tessera: number }) {
  const tex = useLoader(TextureLoader, texturePer(tessera))
  const mat = useMaterialeTela(tex, 0.14)
  return (
    <mesh position={[0, 0, 0.021]}>
      <planeGeometry args={[LATO, LATO]} />
      <primitive object={mat} attach="material" />
    </mesh>
  )
}

function Tessera({ tessera }: { tessera: number }) {
  const g = useRef<Group>(null)
  const invalidate = useThree((s) => s.invalidate)
  const slot = useScene((s) => s.roundabout.p.indexOf(tessera))
  const quarti = useScene((s) => s.roundabout.r[tessera])
  const preso = useRef(false)
  const scarto = useRef({ x: 0, y: 0 })
  /** Angolo accumulato: ruota sempre in senso orario, senza tornare indietro al quarto giro. */
  const angolo = useRef(-quarti * (Math.PI / 2))
  const quartiPrec = useRef(quarti)

  useLayoutEffect(() => {
    const [x, y] = centroSlot(slot)
    g.current?.position.set(x, y, 0)
    if (g.current) g.current.rotation.z = angolo.current
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const gruppo = g.current
    if (!gruppo || preso.current) return
    const [x, y] = centroSlot(slot)
    const passi = (quarti - quartiPrec.current + 4) % 4
    quartiPrec.current = quarti
    // Tre quarti in avanti = uno indietro: si prende la strada corta (succede con back/forward e «ripristina»).
    angolo.current -= (passi === 3 ? -1 : passi) * (Math.PI / 2)
    const opz = { duration: 0.5, ease: EASE_TUFFRAT, onUpdate: invalidate, overwrite: true as const }
    const a = gsap.to(gruppo.position, { x, y, z: 0, ...opz })
    const c = gsap.to(gruppo.rotation, { z: angolo.current, ...opz })
    return () => {
      a.kill()
      c.kill()
    }
  }, [slot, quarti, invalidate])

  const punto = new Vector3()
  const locale = (e: { ray: { intersectPlane: (p: Plane, v: Vector3) => Vector3 | null } }) => {
    if (!e.ray.intersectPlane(PIANO, punto)) return null
    return { x: punto.x - ZONA.roundabout, y: punto.y - CENTRO_Y }
  }

  const gesto = useGesto({
    cursore: 'hand',
    onClick: () => {
      const s = useScene.getState()
      if (s.percorso !== '/serie/roundabout') naviga('/serie/roundabout')
      else applica(ruota(s.roundabout, slot))
    },
    onDragStart: (e) => {
      const gruppo = g.current
      const p = locale(e)
      if (!gruppo || !p || useScene.getState().percorso !== '/serie/roundabout') return false
      preso.current = true
      gsap.killTweensOf(gruppo.position)
      scarto.current = { x: gruppo.position.x - p.x, y: gruppo.position.y - p.y }
    },
    onDrag: (e) => {
      const gruppo = g.current
      const p = locale(e)
      if (!gruppo || !p) return
      gruppo.position.set(p.x + scarto.current.x, p.y + scarto.current.y, 0.22)
      invalidate()
    },
    onDragEnd: () => {
      const gruppo = g.current
      preso.current = false
      if (!gruppo) return
      // Slot più vicino al punto di rilascio.
      let meta = slot
      let minimo = Infinity
      for (let i = 0; i < 4; i++) {
        const [cx, cy] = centroSlot(i)
        const d = Math.hypot(gruppo.position.x - cx, gruppo.position.y - cy)
        if (d < minimo) {
          minimo = d
          meta = i
        }
      }
      if (meta !== slot && minimo < PASSO) applica(scambia(useScene.getState().roundabout, slot, meta))
      else {
        const [x, y] = centroSlot(slot)
        gsap.to(gruppo.position, { x, y, z: 0, duration: 0.5, ease: EASE_TUFFRAT, onUpdate: invalidate, overwrite: true })
      }
    },
  })

  return (
    <group ref={g} {...gesto}>
      <mesh>
        <boxGeometry args={[LATO, LATO, 0.04]} />
        <meshStandardMaterial color="#b89b6f" roughness={0.85} />
      </mesh>
      <Suspense fallback={null}>
        <Faccia tessera={tessera} />
      </Suspense>
    </group>
  )
}

/**
 * Roundabout sul muro (ARCHITECTURE §7): quattro tessere di multistrato fisicamente separate.
 * Drag su un'altra tessera per scambiarle, click (o tap) per ruotare di 90°. Lo stato sta nell'URL
 * (`?p=&r=`): qui si legge dallo store e si scrive con `navigate(…, { replace: true })`.
 */
export function RoundaboutBoard() {
  return (
    <group position={[ZONA.roundabout, CENTRO_Y, 0.02]}>
      {tessere.map((_, t) => (
        <Tessera key={t} tessera={t} />
      ))}
    </group>
  )
}

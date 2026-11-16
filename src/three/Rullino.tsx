import { useThree } from '@react-three/fiber'
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { CanvasTexture, DoubleSide, MathUtils, Plane, PlaneGeometry, RepeatWrapping, SRGBColorSpace, Vector3, type Group, type Mesh } from 'three'
import { useGesto } from '../core/gesto'
import { EASE_TUFFRAT, gsap } from '../core/motion/ease'
import { naviga } from '../core/ponte'
import { useScene } from '../state/useScene'
import { BANCO } from './mondo'

interface Props {
  id: string
  /** Scritta a pennarello sullo scotch (titolo della collezione). */
  etichetta: string
  colore: string
  /** Posizione a riposo sul banco e rotazione attorno alla verticale. */
  x: number
  z: number
  giro?: number
  aperto: boolean
  onApri: (id: string | null) => void
}

/** Rullino 35 mm ingrandito 2,5× rispetto al vero, per restare leggibile accanto alle fanzine. */
const RAGGIO = 0.062
const ALTEZZA = 0.2
const LARGO_PELLICOLA = 0.175
const PASSO_FOTOGRAMMA = 0.19
const LINGUETTA = 0.24
const SROTOLATA = 1.5
/** Sdraiato sul banco con il lato dello scotch e della linguetta verso l'alto. */
const A_RIPOSO = -Math.PI / 2
const PIANO_BANCO = new Plane(new Vector3(0, 1, 0), -(BANCO.y + RAGGIO))

/** Un fotogramma di negativo vuoto con le perforazioni: si ripete lungo la pellicola. */
function creaTexturePellicola(): CanvasTexture {
  const c = document.createElement('canvas')
  c.width = 256
  c.height = 236
  const ctx = c.getContext('2d')!
  ctx.fillStyle = '#2b1a10'
  ctx.fillRect(0, 0, c.width, c.height)
  ctx.fillStyle = '#7a4420'
  ctx.fillRect(10, 44, c.width - 20, c.height - 88)
  ctx.fillStyle = '#efe9dc'
  for (let i = 0; i < 8; i++) {
    const x = 8 + i * 32
    ctx.fillRect(x, 12, 16, 18)
    ctx.fillRect(x, c.height - 30, 16, 18)
  }
  const t = new CanvasTexture(c)
  t.colorSpace = SRGBColorSpace
  t.wrapS = RepeatWrapping
  return t
}

/** Pezzo di scotch di carta con la scritta a pennarello. */
function creaTextureScotch(testo: string): CanvasTexture {
  const c = document.createElement('canvas')
  c.width = 320
  c.height = 96
  const ctx = c.getContext('2d')!
  ctx.fillStyle = '#eadfb8'
  ctx.fillRect(0, 0, c.width, c.height)
  ctx.fillStyle = '#16130f'
  ctx.font = '600 44px "Segoe Print", "Bradley Hand", "Comic Sans MS", cursive'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(testo, c.width / 2, c.height / 2 + 2, c.width - 24)
  const t = new CanvasTexture(c)
  t.colorSpace = SRGBColorSpace
  return t
}

/**
 * Rullino sul banco (RECAP punto 5, base per la v2): bussolotto con lo scotch del titolo e la linguetta fuori.
 * Click su `/fotografia`: vola davanti alla camera e la pellicola si srotola; un secondo click la riavvolge
 * e lo rimette sul banco. Da chiuso si può trascinare sul piano del banco. Fuori da `/fotografia` il click porta lì.
 * Equivalente da tastiera: la pagina Fotografia nella scheda.
 */
export function Rullino({ id, etichetta, colore, x, z, giro = 0, aperto, onApri }: Props) {
  const g = useRef<Group>(null)
  const corpo = useRef<Group>(null)
  const pellicola = useRef<Mesh>(null)
  const invalidate = useThree((s) => s.invalidate)
  const [sopra, setSopra] = useState(false)
  const riposo = useRef({ x, z })
  const preso = useRef(false)
  const scarto = useRef({ x: 0, z: 0 })
  const texPellicola = useMemo(creaTexturePellicola, [])
  const texScotch = useMemo(() => creaTextureScotch(etichetta), [etichetta])
  // Striscia lunga 1 con l'origine sul bordo sinistro: la lunghezza è `scale.x`.
  const geoPellicola = useMemo(() => new PlaneGeometry(1, LARGO_PELLICOLA).translate(0.5, 0, 0), [])
  const yRiposo = BANCO.y + RAGGIO

  useEffect(
    () => () => {
      texPellicola.dispose()
      texScotch.dispose()
      geoPellicola.dispose()
    },
    [texPellicola, texScotch, geoPellicola],
  )

  useLayoutEffect(() => {
    g.current?.position.set(x, yRiposo, z)
    g.current?.rotation.set(0, giro, 0)
    corpo.current?.rotation.set(A_RIPOSO, 0, 0)
    pellicola.current?.scale.set(LINGUETTA, 1, 1)
    texPellicola.repeat.set(LINGUETTA / PASSO_FOTOGRAMMA, 1)
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const gruppo = g.current
    const c = corpo.current
    const p = pellicola.current
    if (!gruppo || !c || !p || preso.current) return
    const opz = { duration: 0.7, ease: EASE_TUFFRAT, overwrite: true as const }
    const aggiorna = () => {
      texPellicola.repeat.x = p.scale.x / PASSO_FOTOGRAMMA
      invalidate()
    }
    const tl = gsap.timeline({ onUpdate: aggiorna })
    if (aperto) {
      // Vola in mano, in piedi e inclinato verso la camera; poi la pellicola esce.
      tl.to(gruppo.position, { x: 1.12, y: -0.06, z: 3.25, ...opz }, 0)
        .to(gruppo.rotation, { y: 0.15, ...opz }, 0)
        .to(c.rotation, { x: -0.5, ...opz }, 0)
        .to(p.scale, { x: SROTOLATA, duration: 0.9, ease: EASE_TUFFRAT }, 0.35)
    } else {
      tl.to(p.scale, { x: LINGUETTA, duration: 0.4, ease: EASE_TUFFRAT }, 0)
        .to(gruppo.position, { x: riposo.current.x, y: yRiposo + (sopra ? 0.03 : 0), z: riposo.current.z, ...opz }, 0)
        .to(gruppo.rotation, { y: giro, ...opz }, 0)
        .to(c.rotation, { x: A_RIPOSO, ...opz }, 0)
    }
    return () => {
      tl.kill()
    }
  }, [aperto, sopra, giro, yRiposo, texPellicola, invalidate])

  const punto = new Vector3()
  const gesto = useGesto({
    cursore: 'hand',
    onHover: setSopra,
    onClick: () => {
      if (useScene.getState().percorso !== '/fotografia') naviga('/fotografia')
      else onApri(aperto ? null : id)
    },
    onDragStart: (e) => {
      const gruppo = g.current
      if (aperto || !gruppo || !e.ray.intersectPlane(PIANO_BANCO, punto)) return false
      preso.current = true
      gsap.killTweensOf(gruppo.position)
      scarto.current = { x: gruppo.position.x - punto.x, z: gruppo.position.z - punto.z }
    },
    onDrag: (e) => {
      const gruppo = g.current
      if (!gruppo || !e.ray.intersectPlane(PIANO_BANCO, punto)) return
      // Resta sul piano del banco, dentro i bordi.
      const mx = BANCO.largo / 2 - 0.15
      const mz = BANCO.profondo / 2 - 0.12
      gruppo.position.set(
        MathUtils.clamp(punto.x + scarto.current.x, -mx, mx),
        yRiposo + 0.05,
        MathUtils.clamp(punto.z + scarto.current.z, BANCO.z - mz, BANCO.z + mz),
      )
      invalidate()
    },
    onDragEnd: () => {
      const gruppo = g.current
      preso.current = false
      if (!gruppo) return
      riposo.current = { x: gruppo.position.x, z: gruppo.position.z }
      gsap.to(gruppo.position, { y: yRiposo, duration: 0.3, ease: EASE_TUFFRAT, onUpdate: invalidate })
    },
  })

  return (
    <group ref={g} {...gesto}>
      {/* Sistema locale del bussolotto: asse = Y, la pellicola esce verso +X sul lato +Z. */}
      <group ref={corpo}>
        <mesh>
          <cylinderGeometry args={[RAGGIO, RAGGIO, ALTEZZA, 32]} />
          <meshStandardMaterial color={colore} roughness={0.45} metalness={0.15} />
        </mesh>
        {[1, -1].map((s) => (
          <mesh key={s} position={[0, s * (ALTEZZA / 2 + 0.006), 0]}>
            <cylinderGeometry args={[RAGGIO + 0.004, RAGGIO + 0.004, 0.012, 32]} />
            <meshStandardMaterial color="#1b1b1b" roughness={0.4} metalness={0.5} />
          </mesh>
        ))}
        <mesh position={[0, ALTEZZA / 2 + 0.028, 0]}>
          <cylinderGeometry args={[0.02, 0.02, 0.034, 16]} />
          <meshStandardMaterial color="#111111" roughness={0.5} />
        </mesh>
        {/* Feltro della bocchetta */}
        <mesh position={[RAGGIO * 0.72, 0, RAGGIO * 0.78]}>
          <boxGeometry args={[0.03, ALTEZZA, 0.016]} />
          <meshStandardMaterial color="#141414" roughness={0.95} />
        </mesh>
        {/* Scotch col titolo, accanto all'uscita della pellicola */}
        <mesh position={[-RAGGIO * 0.25, 0.01, RAGGIO + 0.002]} rotation={[0, -0.2, 0.05]}>
          <planeGeometry args={[0.13, 0.039]} />
          <meshBasicMaterial map={texScotch} toneMapped={false} side={DoubleSide} />
        </mesh>
        <mesh ref={pellicola} position={[RAGGIO * 0.8, 0, RAGGIO * 0.82]} geometry={geoPellicola}>
          <meshBasicMaterial map={texPellicola} toneMapped={false} side={DoubleSide} />
        </mesh>
      </group>
    </group>
  )
}

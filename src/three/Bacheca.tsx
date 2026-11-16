import { useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef, useState } from 'react'
import { CanvasTexture, SRGBColorSpace, type Group } from 'three'
import { useGesto } from '../core/gesto'
import { EASE_TUFFRAT, gsap } from '../core/motion/ease'
import { naviga } from '../core/ponte'
import { mostre, type Mostra } from '../data'
import { ZONA } from './mondo'

const LARGO = 2.7
const ALTO = 1.9
const CENTRO_Y = 1.6
const FOGLIO = { w: 0.92, h: 0.62 }

/** Locandina di carta con titolo, anno e luogo: finché non ci sono i flyer veri (v2), il testo fa da flyer. */
function creaLocandina(m: Mostra, tinta: string): CanvasTexture {
  const c = document.createElement('canvas')
  c.width = 736
  c.height = 496
  const ctx = c.getContext('2d')!
  ctx.fillStyle = tinta
  ctx.fillRect(0, 0, c.width, c.height)
  ctx.fillStyle = '#111111'
  ctx.textBaseline = 'top'
  ctx.font = '600 40px "Helvetica Neue", Arial, sans-serif'
  ctx.fillText(String(m.anno), 48, 44)
  ctx.font = '700 76px "Helvetica Neue", Arial, sans-serif'
  // A capo a parole: il titolo sta su due righe al massimo.
  const parole = m.titolo.split(' ')
  const righe: string[] = []
  let riga = ''
  for (const p of parole) {
    const prova = riga ? `${riga} ${p}` : p
    if (ctx.measureText(prova).width > c.width - 96 && riga) {
      righe.push(riga)
      riga = p
    } else riga = prova
  }
  righe.push(riga)
  righe.slice(0, 2).forEach((r, i) => ctx.fillText(r, 48, 132 + i * 88, c.width - 96))
  ctx.font = '500 36px "Helvetica Neue", Arial, sans-serif'
  ctx.fillStyle = '#444444'
  ctx.fillText(`${m.luogo}, ${m.citta}`, 48, c.height - 92, c.width - 96)
  const t = new CanvasTexture(c)
  t.colorSpace = SRGBColorSpace
  t.anisotropy = 8
  return t
}

const TINTE = ['#f4f1ea', '#f1e6c8', '#e8ece6', '#f2ddd6']

function Locandina({ mostra, indice, x, y, giro }: { mostra: Mostra; indice: number; x: number; y: number; giro: number }) {
  const g = useRef<Group>(null)
  const invalidate = useThree((s) => s.invalidate)
  const [sopra, setSopra] = useState(false)
  const tex = useMemo(() => creaLocandina(mostra, TINTE[indice % TINTE.length]), [mostra, indice])
  useEffect(() => () => tex.dispose(), [tex])

  useEffect(() => {
    if (!g.current) return
    const t = gsap.to(g.current.position, { z: sopra ? 0.12 : 0.045, duration: 0.4, ease: EASE_TUFFRAT, onUpdate: invalidate })
    return () => {
      t.kill()
    }
  }, [sopra, invalidate])

  const gesto = useGesto({ cursore: 'hand', onHover: setSopra, onClick: () => naviga(`/mostre#${mostra.id}`) })

  return (
    <group ref={g} position={[x, y, 0.045]} rotation={[0, 0, giro]} {...gesto}>
      <mesh>
        <planeGeometry args={[FOGLIO.w, FOGLIO.h]} />
        <meshBasicMaterial map={tex} toneMapped={false} />
      </mesh>
      <mesh position={[0, FOGLIO.h / 2 - 0.05, 0.012]}>
        <sphereGeometry args={[0.022, 12, 12]} />
        <meshStandardMaterial color="#b23a3a" roughness={0.4} />
      </mesh>
    </group>
  )
}

/**
 * Bacheca delle mostre (RECAP punto 7, base per la v2): pannello di sughero con una locandina per mostra.
 * Click su una locandina: apre la scheda di `/mostre` sulla mostra corrispondente.
 * Equivalente da tastiera: l'elenco nella scheda.
 */
export function Bacheca() {
  return (
    <group position={[ZONA.mostre, CENTRO_Y, 0]}>
      <mesh position={[0, 0, 0.01]}>
        <boxGeometry args={[LARGO + 0.12, ALTO + 0.12, 0.05]} />
        <meshStandardMaterial color="#5a4633" roughness={0.8} />
      </mesh>
      <mesh position={[0, 0, 0.037]}>
        <planeGeometry args={[LARGO, ALTO]} />
        <meshStandardMaterial color="#c49a6c" roughness={1} />
      </mesh>
      {mostre.slice(0, 6).map((m, i) => {
        const col = i % 2
        const riga = Math.floor(i / 2)
        const x = (col - 0.5) * 1.22 + (riga % 2 ? 0.06 : -0.04)
        const y = 0.42 - riga * 0.84
        return <Locandina key={m.id} mostra={m} indice={i} x={x} y={y} giro={(((i * 5) % 4) - 1.5) * 0.035} />
      })}
    </group>
  )
}

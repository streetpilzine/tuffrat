import { useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef, useState } from 'react'
import { CanvasTexture, SRGBColorSpace, type Mesh } from 'three'
import { useGesto } from '../core/gesto'
import { EASE_TUFFRAT, gsap } from '../core/motion/ease'
import { artista } from '../data'
import { MURO, ZONA } from './mondo'

const CORPO = { w: 1.05, h: 0.86, d: 0.8 }
const MOBILE_ALTO = 1.1

/** Schermo: neve statica, scanline e il titolo dell'intervista. Un fotogramma solo: niente loop di render in idle. */
function creaSchermo(titolo: string): CanvasTexture {
  const c = document.createElement('canvas')
  c.width = 512
  c.height = 400
  const ctx = c.getContext('2d')!
  const img = ctx.createImageData(c.width, c.height)
  // Rumore deterministico (LCG): lo schermo è uguale a ogni caricamento.
  let seme = 20251
  for (let i = 0; i < img.data.length; i += 4) {
    seme = (seme * 1664525 + 1013904223) >>> 0
    const v = 30 + (seme >>> 24) * 0.5
    img.data[i] = v
    img.data[i + 1] = v
    img.data[i + 2] = v + 8
    img.data[i + 3] = 255
  }
  ctx.putImageData(img, 0, 0)
  ctx.fillStyle = 'rgba(0, 0, 0, 0.28)'
  for (let y = 0; y < c.height; y += 4) ctx.fillRect(0, y, c.width, 2)
  ctx.fillStyle = '#f2f2ea'
  ctx.textAlign = 'center'
  ctx.font = '700 62px "Helvetica Neue", Arial, sans-serif'
  ctx.fillText(titolo, c.width / 2, 190, c.width - 60)
  ctx.font = '600 30px "Helvetica Neue", Arial, sans-serif'
  ctx.fillText('▶ guarda l’intervista', c.width / 2, 250, c.width - 60)
  const t = new CanvasTexture(c)
  t.colorSpace = SRGBColorSpace
  return t
}

/**
 * TV a tubo catodico accanto al ritratto (RECAP punto 8, base per la v2): sullo schermo la neve e il titolo di PULSOS.
 * Click: apre l'intervista su YouTube in una nuova scheda. Il video dentro lo schermo e la manopola arrivano in v2.
 * Equivalente da tastiera: il link «Guarda» nella scheda della bio.
 */
export function Tv() {
  const schermo = useRef<Mesh>(null)
  const invalidate = useThree((s) => s.invalidate)
  const [sopra, setSopra] = useState(false)
  const { pulsos } = artista.video
  const tex = useMemo(() => creaSchermo(pulsos.titolo), [pulsos.titolo])
  useEffect(() => () => tex.dispose(), [tex])

  useEffect(() => {
    const m = schermo.current
    if (!m) return
    const t = gsap.to(m.scale, { x: sopra ? 1.03 : 1, y: sopra ? 1.03 : 1, duration: 0.4, ease: EASE_TUFFRAT, onUpdate: invalidate })
    return () => {
      t.kill()
    }
  }, [sopra, invalidate])

  const gesto = useGesto({
    cursore: 'hand',
    onHover: setSopra,
    onClick: () => window.open(`https://www.youtube.com/watch?v=${pulsos.youtubeId}`, '_blank', 'noopener,noreferrer'),
  })

  const yMobile = MURO.pavimento + MOBILE_ALTO / 2
  const yTv = MURO.pavimento + MOBILE_ALTO + CORPO.h / 2
  return (
    <group position={[ZONA.tv, 0, 0.55]} rotation={[0, -0.18, 0]}>
      <mesh position={[0, yMobile, 0]}>
        <boxGeometry args={[1.25, MOBILE_ALTO, 0.85]} />
        <meshStandardMaterial color="#6b5a47" roughness={0.85} />
      </mesh>
      <group position={[0, yTv, 0]} {...gesto}>
        <mesh>
          <boxGeometry args={[CORPO.w, CORPO.h, CORPO.d]} />
          <meshStandardMaterial color="#2b2a28" roughness={0.6} />
        </mesh>
        <mesh ref={schermo} position={[-0.12, 0.02, CORPO.d / 2 + 0.002]}>
          <planeGeometry args={[0.72, 0.56]} />
          <meshBasicMaterial map={tex} toneMapped={false} />
        </mesh>
        {[0.2, 0.02].map((y) => (
          <mesh key={y} position={[0.39, y, CORPO.d / 2 + 0.02]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.055, 0.055, 0.04, 20]} />
            <meshStandardMaterial color="#c9c4b8" roughness={0.4} metalness={0.3} />
          </mesh>
        ))}
        {[-0.35, 0.35].map((x) => (
          <mesh key={x} position={[x * 0.4, CORPO.h / 2 + 0.3, -0.1]} rotation={[0, 0, -x * 1.3]}>
            <cylinderGeometry args={[0.006, 0.006, 0.62, 6]} />
            <meshStandardMaterial color="#9a9a9a" roughness={0.3} metalness={0.8} />
          </mesh>
        ))}
      </group>
    </group>
  )
}

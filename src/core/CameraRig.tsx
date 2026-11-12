import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import { Vector3 } from 'three'
import { EASE_TUFFRAT, gsap } from './motion/ease'
import { DURATA_CAMERA_S } from './scene-map'
import { useScene } from '../state/useScene'

/**
 * Porta la camera sul target della scena corrente con una timeline GSAP (≤ 800 ms).
 * Vive dentro il Canvas; legge lo store zustand, che attraversa i root React.
 * Se la route cambia a metà corsa la timeline precedente si uccide e si riparte dalla posizione attuale.
 */
export function CameraRig() {
  const { camera, invalidate } = useThree()
  const target = useScene((s) => s.target)
  const rig = useRef({ pos: new Vector3(...target.pos), look: new Vector3(...target.look) })
  const primo = useRef(true)

  useEffect(() => {
    const r = rig.current
    if (primo.current) {
      primo.current = false
      r.pos.set(...target.pos)
      r.look.set(...target.look)
      invalidate()
      return
    }
    const { setInTransizione } = useScene.getState()
    setInTransizione(true)
    const tl = gsap.timeline({
      defaults: { duration: DURATA_CAMERA_S, ease: EASE_TUFFRAT },
      onUpdate: invalidate,
      onComplete: () => setInTransizione(false),
    })
    const [px, py, pz] = target.pos
    const [lx, ly, lz] = target.look
    tl.to(r.pos, { x: px, y: py, z: pz }, 0).to(r.look, { x: lx, y: ly, z: lz }, 0)
    return () => {
      tl.kill()
      setInTransizione(false)
    }
  }, [target, invalidate])

  useFrame(() => {
    camera.position.copy(rig.current.pos)
    camera.lookAt(rig.current.look)
  })

  return null
}

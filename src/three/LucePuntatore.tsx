import { useThree } from '@react-three/fiber'
import { useEffect } from 'react'
import { Plane, Raycaster, Vector2, Vector3 } from 'three'
import { uLuce } from './luce'

/**
 * Sposta la luce dove punta il mouse (o il dito): raggio dalla camera fino al piano z=1.1, davanti al muro.
 * Con `frameloop="demand"` si invalida sul `pointermove`, non con un loop continuo (docs/decisioni.md, 12/11).
 */
export function LucePuntatore() {
  const camera = useThree((s) => s.camera)
  const gl = useThree((s) => s.gl)
  const invalidate = useThree((s) => s.invalidate)
  useEffect(() => {
    const el = gl.domElement
    const raggio = new Raycaster()
    const piano = new Plane(new Vector3(0, 0, 1), -1.1)
    const ndc = new Vector2()
    const punto = new Vector3()
    const onMove = (e: PointerEvent) => {
      if (e.target !== el) return
      const r = el.getBoundingClientRect()
      ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1)
      raggio.setFromCamera(ndc, camera)
      if (raggio.ray.intersectPlane(piano, punto)) {
        uLuce.value.copy(punto)
        invalidate()
      }
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('pointerdown', onMove, { passive: true })
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerdown', onMove)
    }
  }, [camera, gl, invalidate])
  return null
}

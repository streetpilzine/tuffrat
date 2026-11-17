import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import { MathUtils, Plane, Ray, Raycaster, Vector2, Vector3, type PerspectiveCamera } from 'three'
import { filtra, INCLINAZIONE, posizioneLuce, scostamento, type Orientamento } from '../core/inclinazione'
import { eMobile } from '../core/mobile'
import { EASE_TUFFRAT, gsap } from '../core/motion/ease'
import { uLuce } from './luce'

/** Piano della luce, davanti alle tele (che stanno a z=0). */
const PIANO_LUCE = new Plane(new Vector3(0, 0, 1), -1.1)

/**
 * La luce che dà il riflesso alle tele (`uLuce` in `luce.ts`). Su desktop segue il puntatore; sul telefono, dove il puntatore non c'è, segue l'inclinazione del dispositivo. La luce è ornamentale e non porta informazione: non ha un equivalente da tastiera, e in vista lista non esiste.
 */
export function LucePuntatore() {
  return eMobile() ? <LuceTelefono /> : <LuceMouse />
}

/**
 * Desktop: la luce va dove punta il mouse, sul piano davanti al muro. Con `frameloop="demand"` si invalida sul `pointermove`, non con un loop continuo (docs/decisioni.md, 12/11).
 */
function LuceMouse() {
  const camera = useThree((s) => s.camera)
  const gl = useThree((s) => s.gl)
  const invalidate = useThree((s) => s.invalidate)
  useEffect(() => {
    const el = gl.domElement
    const raggio = new Raycaster()
    const ndc = new Vector2()
    const punto = new Vector3()
    const onMove = (e: PointerEvent) => {
      if (e.target !== el) return
      const r = el.getBoundingClientRect()
      ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1)
      raggio.setFromCamera(ndc, camera)
      if (raggio.ray.intersectPlane(PIANO_LUCE, punto)) {
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

type ConPermesso = { requestPermission?: () => Promise<'granted' | 'denied'> }

/**
 * Telefono: la luce sta in un punto dell'inquadratura (in alto a destra del centro, come una finestra di lato) e si sposta con l'inclinazione del dispositivo (`DeviceOrientationEvent`; conti in `core/inclinazione`): girando e piegando il telefono il riflesso scivola sulla tela.
 * - La posizione si calcola a ogni frame disegnato rispetto a dove guarda la camera, quindi la luce segue la camera da un quadro all'altro.
 * - Il sensore invalida il Canvas solo quando la luce si sposta davvero: a telefono fermo non si ridisegna nulla.
 * - Su iOS il sensore va autorizzato dentro un gesto: lo si chiede al primo tocco, una volta sola. Negato, o senza sensore, la luce resta nella posizione di riposo.
 * - Mentre un dito tocca la scena la luce lo segue; al rilascio torna alla sua posizione con un tween breve. Prima restava dov'era stato l'ultimo tocco, e lì restava una macchia chiara.
 */
function LuceTelefono() {
  const camera = useThree((s) => s.camera) as PerspectiveCamera
  const gl = useThree((s) => s.gl)
  const invalidate = useThree((s) => s.invalidate)
  const aspetto = useThree((s) => (s.size.height > 0 ? s.size.width / s.size.height : 1))
  /** `ritorno`: 0 = la luce è dove l'ha lasciata il dito (`da`), 1 = è nella posizione data dall'inclinazione. */
  const stato = useRef({ dito: -1, punto: new Vector3(), da: new Vector3(), ritorno: 1, scost: { x: 0, y: 0 }, neutro: null as Orientamento | null })
  const attrezzi = useRef({ raggio: new Ray(), centro: new Vector3(), meta: new Vector3() })

  useFrame(() => {
    const s = stato.current
    if (s.dito >= 0) {
      uLuce.value.copy(s.punto)
      return
    }
    const { raggio, centro, meta } = attrezzi.current
    camera.updateMatrixWorld()
    raggio.origin.copy(camera.position)
    camera.getWorldDirection(raggio.direction)
    if (!raggio.intersectPlane(PIANO_LUCE, centro)) return
    // Mezzo lato inquadrato sul piano della luce: le posizioni di `inclinazione` sono frazioni di questo.
    const mezzoAlto = camera.position.distanceTo(centro) * Math.tan(MathUtils.degToRad(camera.fov) / 2)
    const p = posizioneLuce(s.scost)
    meta.set(centro.x + p.x * mezzoAlto * aspetto, centro.y + p.y * mezzoAlto, centro.z)
    uLuce.value.lerpVectors(s.da, meta, s.ritorno)
  })

  useEffect(() => {
    const el = gl.domElement
    const s = stato.current
    const lancia = new Raycaster()
    const ndc = new Vector2()

    const sottoIlDito = (e: PointerEvent) => {
      const r = el.getBoundingClientRect()
      ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1)
      lancia.setFromCamera(ndc, camera)
      if (lancia.ray.intersectPlane(PIANO_LUCE, s.punto)) invalidate()
    }
    const onGiu = (e: PointerEvent) => {
      if (e.target !== el || s.dito >= 0) return
      gsap.killTweensOf(s)
      s.dito = e.pointerId
      sottoIlDito(e)
    }
    const onMove = (e: PointerEvent) => {
      if (e.pointerId === s.dito) sottoIlDito(e)
    }
    const onSu = (e: PointerEvent) => {
      if (e.pointerId !== s.dito) return
      s.dito = -1
      s.da.copy(uLuce.value)
      s.ritorno = 0
      gsap.to(s, { ritorno: 1, duration: 0.5, ease: EASE_TUFFRAT, onUpdate: invalidate })
    }

    const onOrientamento = (e: DeviceOrientationEvent) => {
      if (e.beta === null || e.gamma === null || !Number.isFinite(e.beta) || !Number.isFinite(e.gamma)) return
      const ora = { beta: e.beta, gamma: e.gamma }
      // La prima lettura è la posizione neutra: come si tiene il telefono in quel momento.
      if (!s.neutro) {
        s.neutro = ora
        return
      }
      const meta = scostamento(ora, s.neutro)
      const x = filtra(s.scost.x, meta.x)
      const y = filtra(s.scost.y, meta.y)
      const passo = Math.hypot(x - s.scost.x, y - s.scost.y)
      s.scost = { x, y }
      if (passo > INCLINAZIONE.soglia) invalidate()
    }

    // iOS 13+: il permesso per il sensore vale solo dentro un gesto dell'utente. Altrove si ascolta subito.
    const Sensore = typeof DeviceOrientationEvent !== 'undefined' ? (DeviceOrientationEvent as unknown as ConPermesso) : null
    let daChiedere = !!Sensore && typeof Sensore.requestPermission === 'function'
    const chiedi = () => {
      if (!daChiedere) return
      daChiedere = false
      void Sensore?.requestPermission?.().then(
        (esito) => {
          if (esito === 'granted') window.addEventListener('deviceorientation', onOrientamento)
        },
        () => {},
      )
    }
    if (Sensore && !daChiedere) window.addEventListener('deviceorientation', onOrientamento)

    window.addEventListener('pointerdown', onGiu, { passive: true })
    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('pointerup', onSu, { passive: true })
    window.addEventListener('pointercancel', onSu, { passive: true })
    document.addEventListener('pointerup', chiedi)
    return () => {
      gsap.killTweensOf(s)
      window.removeEventListener('deviceorientation', onOrientamento)
      window.removeEventListener('pointerdown', onGiu)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onSu)
      window.removeEventListener('pointercancel', onSu)
      document.removeEventListener('pointerup', chiedi)
    }
  }, [camera, gl, invalidate])

  return null
}

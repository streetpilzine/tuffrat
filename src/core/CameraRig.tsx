import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import { MathUtils, Vector3, type PerspectiveCamera } from 'three'
import { EASE_TUFFRAT, gsap } from './motion/ease'
import { presa } from './gesto'
import { pan } from './pan'
import { naviga, percorsoDiRitorno } from './ponte'
import { DURATA_CAMERA_S, TARGET_BIO_RETRO, TARGET_TV, type CameraTarget } from './scene-map'
import { useOggetti, type PrimoPiano } from '../state/useOggetti'
import { useScene } from '../state/useScene'
import { MURO } from '../three/mondo'

const clamp = MathUtils.clamp
const DISTANZA_MAX = 9.5

/** Posizione della camera per un target: se c'è `inquadra`, la distanza dipende dal rapporto d'aspetto del viewport. */
function posizionePer(t: CameraTarget, fovGradi: number, aspetto: number): [number, number, number] {
  if (!t.inquadra) return [t.pos[0], t.pos[1], t.pos[2]]
  const tan = Math.tan(MathUtils.degToRad(fovGradi) / 2)
  const riempi = t.inquadra.riempi ?? 0.7
  // Su schermi stretti non ci si allontana oltre DISTANZA_MAX: si vede una parte del soggetto e il resto si scorre.
  const d = Math.min(DISTANZA_MAX, Math.max(t.inquadra.h / (2 * tan), t.inquadra.w / (2 * tan * aspetto)) / riempi)
  // Lungo la direzione look → pos: per i target frontali è l'asse z, per la TV è la normale dello schermo.
  const dx = t.pos[0] - t.look[0]
  const dy = t.pos[1] - t.look[1]
  const dz = t.pos[2] - t.look[2]
  const n = Math.hypot(dx, dy, dz) || 1
  return [t.look[0] + (dx / n) * d, t.look[1] + (dy / n) * d, t.look[2] + (dz / n) * d]
}

/** Target della camera per l'oggetto in primo piano; il rullino non ne ha: la striscia si mette davanti alla camera dov'è. */
const targetPrimoPiano = (p: PrimoPiano | null): CameraTarget | null => (p?.tipo === 'bio' ? TARGET_BIO_RETRO : p?.tipo === 'tv' ? TARGET_TV : null)

/**
 * Porta la camera sul target della scena corrente con una timeline GSAP (≤ 800 ms) e gestisce lo
 * scorrimento del muro: drag sullo sfondo, rotella per avvicinarsi, inerzia al rilascio.
 * Vive dentro il Canvas; legge lo store zustand, che attraversa i root React.
 */
export function CameraRig() {
  const camera = useThree((s) => s.camera) as PerspectiveCamera
  const invalidate = useThree((s) => s.invalidate)
  const gl = useThree((s) => s.gl)
  const aspetto = useThree((s) => (s.size.width > 0 && s.size.height > 0 ? s.size.width / s.size.height : 16 / 9))
  const targetScena = useScene((s) => s.target)
  const primoPiano = useOggetti((s) => s.primoPiano)
  // Un oggetto in primo piano (ritratto girato, TV) porta la camera su di sé; tolto, si torna al target della pagina.
  const target = targetPrimoPiano(primoPiano) ?? targetScena
  const rig = useRef({ pos: new Vector3(...target.pos), look: new Vector3(...target.look) })
  const primo = useRef(true)

  useEffect(() => {
    const r = rig.current
    const [px, py, pz] = posizionePer(target, camera.fov, aspetto)
    const [lx, ly, lz] = target.look
    if (primo.current) {
      primo.current = false
      r.pos.set(px, py, pz)
      r.look.set(lx, ly, lz)
      invalidate()
      return
    }
    const { setInTransizione } = useScene.getState()
    setInTransizione(true)
    const tl = gsap.timeline({
      defaults: { duration: target.durata ?? DURATA_CAMERA_S, ease: EASE_TUFFRAT },
      onUpdate: invalidate,
      onComplete: () => setInTransizione(false),
    })
    gsap.killTweensOf(pan)
    tl.to(r.pos, { x: px, y: py, z: pz }, 0).to(r.look, { x: lx, y: ly, z: lz }, 0).to(pan, { x: 0, y: 0, z: 0 }, 0)
    return () => {
      tl.kill()
      setInTransizione(false)
    }
  }, [target, aspetto, camera, invalidate])

  // Scorrimento: drag sullo sfondo del Canvas (o gesto ceduto da un oggetto), rotella, inerzia.
  useEffect(() => {
    const el = gl.domElement
    const g = { attivo: false, id: -1, x: 0, y: 0, mosso: 0, vx: 0, t: 0 }

    const limita = () => {
      const r = rig.current
      const banco = useScene.getState().scena === 'banco'
      if (banco) pan.x = clamp(pan.x, -1.6, 1.6)
      else pan.x = clamp(r.pos.x + pan.x, MURO.xMin + 1.5, MURO.xMax - 1.5) - r.pos.x
      pan.y = clamp(pan.y, -0.8, 1.4)
      pan.z = clamp(pan.z, -(r.pos.z - r.look.z) * 0.6, 4)
    }
    /** Unità mondo per pixel sul piano del muro, alla distanza corrente. */
    const perPixel = () => {
      const d = Math.max(1, rig.current.pos.z + pan.z)
      return (2 * d * Math.tan(MathUtils.degToRad(camera.fov) / 2)) / Math.max(1, el.clientHeight)
    }
    const avvia = (e: PointerEvent) => {
      gsap.killTweensOf(pan)
      Object.assign(g, { attivo: true, id: e.pointerId, x: e.clientX, y: e.clientY, mosso: 0, vx: 0, t: performance.now() })
    }
    /** Con un oggetto in primo piano il muro non scorre: la striscia del rullino ha i suoi gesti, ritratto e TV si chiudono con un click sullo sfondo. */
    const bloccato = () => useOggetti.getState().primoPiano
    let chiusura = { id: -1, x: 0, y: 0 }
    const onDown = (e: PointerEvent) => {
      if (e.target !== el || e.button !== 0 || presa.attiva || g.attivo) return
      const p = bloccato()
      if (p) {
        if (p.tipo !== 'rullino') chiusura = { id: e.pointerId, x: e.clientX, y: e.clientY }
        return
      }
      avvia(e)
    }
    const onMove = (e: PointerEvent) => {
      if (!g.attivo || e.pointerId !== g.id) return
      const dx = e.clientX - g.x
      const dy = e.clientY - g.y
      const ora = performance.now()
      const k = perPixel()
      g.mosso += Math.abs(dx) + Math.abs(dy)
      g.vx = (-dx * k) / Math.max(1, ora - g.t)
      Object.assign(g, { x: e.clientX, y: e.clientY, t: ora })
      pan.x -= dx * k
      pan.y += dy * k * 0.6
      limita()
      invalidate()
    }
    const onUp = (e: PointerEvent) => {
      presa.attiva = false
      if (e.pointerId === chiusura.id) {
        const fermo = Math.hypot(e.clientX - chiusura.x, e.clientY - chiusura.y) < 6
        chiusura = { id: -1, x: 0, y: 0 }
        if (fermo && e.type === 'pointerup' && e.target === el && bloccato()) useOggetti.getState().setPrimoPiano(null)
      }
      if (!g.attivo || e.pointerId !== g.id) return
      g.attivo = false
      if (g.mosso < 6) {
        // Click sullo sfondo: l'opera in primo piano torna al suo posto.
        const { fuoco } = useScene.getState()
        if (fuoco && e.type === 'pointerup') naviga(percorsoDiRitorno(fuoco))
        return
      }
      if (performance.now() - g.t > 80 || Math.abs(g.vx) < 0.0005) return
      const meta = { x: pan.x + g.vx * 260 }
      gsap.to(pan, {
        x: meta.x,
        duration: 0.7,
        ease: EASE_TUFFRAT,
        onUpdate: () => {
          limita()
          invalidate()
        },
      })
    }
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      // Con un rullino aperto la rotella scorre e ingrandisce la striscia (la ascolta il Rullino); con ritratto o TV non fa nulla.
      if (bloccato()) return
      gsap.killTweensOf(pan)
      const k = perPixel()
      if (e.shiftKey || Math.abs(e.deltaX) > Math.abs(e.deltaY)) pan.x += (e.deltaX || e.deltaY) * k
      else pan.z += e.deltaY * 0.004
      limita()
      invalidate()
    }
    presa.avviaPan = (e) => {
      if (!bloccato()) avvia(e)
    }
    window.addEventListener('pointerdown', onDown)
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => {
      presa.avviaPan = null
      window.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
      el.removeEventListener('wheel', onWheel)
    }
  }, [gl, camera, invalidate])

  useFrame(() => {
    const r = rig.current
    camera.position.set(r.pos.x + pan.x, r.pos.y + pan.y, r.pos.z + pan.z)
    // Lo sguardo segue lo scorrimento un po' in ritardo: il muro ruota appena, come girando la testa.
    camera.lookAt(r.look.x + pan.x * 0.92, r.look.y + pan.y * 0.8, r.look.z)
  })

  return null
}

import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import { MathUtils, Vector3, type PerspectiveCamera } from 'three'
import { EASE_TUFFRAT, gsap } from './motion/ease'
import { presa } from './gesto'
import { eMobile } from './mobile'
import { pan } from './pan'
import { naviga, percorsoDiRitorno } from './ponte'
import { DURATA_CAMERA_S, TARGET_BIO_RETRO, TARGET_TV, type CameraTarget } from './scene-map'
import { useOggetti, type PrimoPiano } from '../state/useOggetti'
import { useScene } from '../state/useScene'
import { MURO } from '../three/mondo'

const clamp = MathUtils.clamp
const DISTANZA_MAX = 9.5
/** Telefono, scorrimento e pinch sul muro: distanza minima e massima dal muro (da vicino un quadro riempie lo schermo e si vede la materia, da lontano si arriva un po' oltre l'inquadratura della pagina) e quote tra cui può stare la camera. */
const MOBILE = { vicino: 1.4, lontano: 12, quotaMin: -0.2, quotaMax: 5.2 }

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
  /** Il target precedente era il fuoco su un'opera (`/opere/:slug`). */
  const eraFuoco = useRef(false)

  useEffect(() => {
    const r = rig.current
    const [px, py, pz] = posizionePer(target, camera.fov, aspetto)
    const [lx, ly, lz] = target.look
    // Sul telefono il muro non sta tutto nello schermo: uscendo dal fuoco la camera arretra ma resta davanti al quadro appena chiuso (entro i limiti del muro), invece di tornare al centro della parete.
    const inFuoco = useScene.getState().fuoco !== null
    const restaLi = eraFuoco.current && !inFuoco && eMobile() && useScene.getState().scena === 'muro'
    eraFuoco.current = inFuoco
    const panX = restaLi ? clamp(r.pos.x + pan.x, MURO.xMin + 1.5, MURO.xMax - 1.5) - px : 0
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
    tl.to(r.pos, { x: px, y: py, z: pz }, 0).to(r.look, { x: lx, y: ly, z: lz }, 0).to(pan, { x: panX, y: 0, z: 0 }, 0)
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
      if (eMobile() && !banco) {
        // Telefono, davanti al muro: i limiti sono assoluti (distanza dal muro e quota della camera), così con il pinch si arriva al dettaglio di un quadro e a tutta l'altezza della colonna delle serie.
        pan.y = clamp(r.pos.y + pan.y, Math.min(MOBILE.quotaMin, r.pos.y), Math.max(MOBILE.quotaMax, r.pos.y)) - r.pos.y
        pan.z = clamp(r.pos.z + pan.z, Math.min(MOBILE.vicino, r.pos.z), Math.max(MOBILE.lontano, r.pos.z)) - r.pos.z
        return
      }
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

    /**
     * Pinch sul muro (solo telefono, solo touch). Le dita si contano in fase di cattura sulla finestra, prima di R3F: quando arriva il secondo dito il suo `pointerdown` si ferma qui (gli oggetti non lo vedono), il gesto in corso si annulla (click o drag di un quadro, scorrimento dello sfondo) e parte il pinch: allargando le dita la camera si avvicina, e il punto del muro che sta sotto le dita resta sotto le dita. Finito il pinch, finché un dito resta giù non succede altro (`presa.pinch`).
     * Non parte sul banco né con un oggetto in primo piano: il rullino aperto ha il suo pinch.
     */
    const dita = new Map<number, { x: number; y: number }>()
    const pin = { attivo: false, d: 1, cx: 0, cy: 0 }
    const dueDita = () => {
      const [a, b] = [...dita.values()]
      return { d: Math.max(1, Math.hypot(a.x - b.x, a.y - b.y)), cx: (a.x + b.x) / 2, cy: (a.y + b.y) / 2 }
    }
    const onDownCattura = (e: PointerEvent) => {
      if (e.pointerType !== 'touch' || e.target !== el || !eMobile()) return
      if (dita.size === 0) presa.pinch = false
      dita.set(e.pointerId, { x: e.clientX, y: e.clientY })
      if (dita.size !== 2 || pin.attivo || bloccato() || useScene.getState().scena === 'banco') return
      e.stopPropagation()
      presa.annulla?.()
      presa.annulla = null
      presa.pinch = true
      g.attivo = false
      chiusura = { id: -1, x: 0, y: 0 }
      gsap.killTweensOf(pan)
      Object.assign(pin, { attivo: true, ...dueDita() })
    }
    const muoviPinch = () => {
      const r = rig.current
      const m = dueDita()
      const mezzoX = el.clientWidth / 2
      const mezzoY = el.clientHeight / 2
      // Il punto del muro sotto il centro delle dita, prima del movimento.
      const k0 = perPixel()
      const x = r.pos.x + pan.x + (pin.cx - mezzoX) * k0
      const y = r.pos.y + pan.y - (pin.cy - mezzoY) * k0
      pan.z = (r.pos.z + pan.z) * (pin.d / m.d) - r.pos.z
      limita()
      // Alla nuova distanza la camera si sposta perché quel punto resti sotto il centro delle dita.
      const k1 = perPixel()
      pan.x = x - (m.cx - mezzoX) * k1 - r.pos.x
      pan.y = y + (m.cy - mezzoY) * k1 - r.pos.y
      limita()
      Object.assign(pin, m)
      invalidate()
    }
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
      if (dita.has(e.pointerId)) dita.set(e.pointerId, { x: e.clientX, y: e.clientY })
      if (pin.attivo) {
        if (dita.size >= 2) muoviPinch()
        return
      }
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
      if (dita.delete(e.pointerId)) {
        // Un dito del pinch si è alzato: il pinch finisce; `presa.pinch` cade solo quando non resta nessun dito.
        if (dita.size < 2) pin.attivo = false
        if (presa.pinch) {
          if (dita.size === 0) presa.pinch = false
          return
        }
      }
      if (e.pointerId === chiusura.id) {
        const fermo = Math.hypot(e.clientX - chiusura.x, e.clientY - chiusura.y) < 6
        chiusura = { id: -1, x: 0, y: 0 }
        if (fermo && e.type === 'pointerup' && e.target === el && bloccato()) useOggetti.getState().setPrimoPiano(null)
      }
      if (!g.attivo || e.pointerId !== g.id) return
      g.attivo = false
      if (g.mosso < 6) {
        // Click sullo sfondo: l'opera in primo piano torna al suo posto.
        const { fuoco, percorso } = useScene.getState()
        if (e.type !== 'pointerup') return
        if (fuoco) naviga(percorsoDiRitorno(fuoco))
        // Telefono: Roundabout riempie lo schermo, e un tocco sulla parete attorno riporta alla vista delle serie.
        else if (percorso === '/serie/roundabout' && eMobile()) naviga('/serie')
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
    window.addEventListener('pointerdown', onDownCattura, true)
    window.addEventListener('pointerdown', onDown)
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => {
      presa.avviaPan = null
      presa.pinch = false
      window.removeEventListener('pointerdown', onDownCattura, true)
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

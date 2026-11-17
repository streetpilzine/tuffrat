import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef, useState } from 'react'
import { CanvasTexture, DoubleSide, Euler, MathUtils, Mesh, MeshBasicMaterial, Plane, Quaternion, RepeatWrapping, SRGBColorSpace, Vector3, type Group, type PerspectiveCamera } from 'three'
import { useGesto } from '../core/gesto'
import { eMobile } from '../core/mobile'
import { EASE_TUFFRAT, gsap } from '../core/motion/ease'
import { naviga } from '../core/ponte'
import { FORMATO_35MM, latiFoto, posaRullino, registraStriscia, visibili, type ComandoStriscia } from '../core/striscia'
import type { RullinoDati } from '../data'
import { bioGirata, rullinoAperto, tvInPrimoPiano, useOggetti } from '../state/useOggetti'
import { useScene } from '../state/useScene'
import { BANCO } from './mondo'
import { COLORE_NEGATIVO, creaTexturePellicola, geoPiano } from './pellicola'
import { aggiornaFinestra, caricaAttorno, comanda, geometria, pronte, scorriDi, strisciaIniziale, zoomaDita, zoomaSu, type Striscia } from './strisciaFoto'

interface Props {
  dati: RullinoDati
  /** Posizione a riposo sul banco e rotazione attorno alla verticale. */
  x: number
  z: number
  giro?: number
}

/** Bussolotto 35 mm ingrandito 2,5× rispetto al vero, per restare leggibile accanto alle fanzine. Origine al centro del corpo, asse lungo y. */
const RAGGIO = 0.062
const ALTEZZA = 0.2
/** Corpo più i due tappi: è l'altezza che, da aperto, si porta a quella del bussolotto vero rispetto al fotogramma. */
const ALTEZZA_TOTALE = ALTEZZA + 0.024
/** Linguetta di pellicola che esce dal feltro quando il rullino è chiuso. */
const LINGUETTA = { lunga: 0.24, larga: 0.175 }
const PIANO_BANCO = new Plane(new Vector3(0, 1, 0), -(BANCO.y + RAGGIO))

/** Distanza dalla camera del piano su cui si srotola la pellicola: niente della scena sta così vicino, e a questa distanza un pixel del canvas vale `2·tan(fov/2)/altezza` unità. */
const DISTANZA = 1
/** Durate (skill `tuffrat-visual` B7): volo del bussolotto, riavvolgimento, hover, tween brevi di frecce e inerzia. */
const DURATA = { volo: 0.7, riavvolgi: 0.8, hover: 0.3, breve: 0.4, inerzia: 0.8 }
/** Rotella: pixel di scorrimento per pixel di delta, e fattore di zoom per pixel di delta con ctrl. */
const ROTELLA = { scorri: 1.6, zoom: 1.0018 }
/** Sotto questo percorso (px) un tiro resta un tocco; sotto questa velocità (px/s) non parte l'inerzia. */
const SOGLIA = { tocco: 6, velocita: 40 }

/** Sul banco il bussolotto è sdraiato (asse verso il muro, scotch in su); in mano sta dritto davanti alla camera. */
const Q_SDRAIATO = new Quaternion().setFromEuler(new Euler(-Math.PI / 2, 0, 0))
const Q_DRITTO = new Quaternion()
const SU = new Vector3(0, 1, 0)
const A = new Vector3()
const B = new Vector3()
const DESTRA = new Vector3()

/** Altezza del fotogramma (px) a cui è proporzionato il bussolotto in mano: segue lo zoom solo per un tratto, poi resta fermo, altrimenti ingrandendo le foto coprirebbe lo schermo. */
const fotogrammaBussolotto = (s: Striscia) => Math.min(s.h, s.zoom.min * 1.25)

/** Quanti rullini hanno acceso il taglio locale del renderer: si spegne con l'ultimo. */
const tagli = { n: 0 }

/** Geometria del bussolotto: corpo, i due tappi, il perno del rocchetto e il labbro di feltro. Sta qui da sola, così sostituirla con un modello è un cambio in un punto. */
function Bussolotto({ colore }: { colore: string }) {
  return (
    <>
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
      <mesh position={[RAGGIO * 0.72, 0, RAGGIO * 0.78]}>
        <boxGeometry args={[0.03, ALTEZZA, 0.016]} />
        <meshStandardMaterial color="#141414" roughness={0.95} />
      </mesh>
    </>
  )
}

interface Cella {
  negativo: Mesh
  foto: Mesh | null
  chiave: string | null
}

/**
 * Rullino sul banco e pellicola srotolata.
 *
 * Chiuso è il bussolotto del colore `dati.colore`, con lo scotch del titolo e la linguetta di pellicola fuori: hover, trascinamento sul piano del banco, click (o tocco) che fuori da `/fotografia` porta lì e su `/fotografia` lo apre.
 *
 * Aperto (`rullinoAperto === dati.id`): il bussolotto vola davanti alla camera, a sinistra, e la pellicola esce verso destra. Dove vanno lo decide `posaRullino` in pixel del canvas vero (asse del bussolotto, centro della fascia libera tra la barra e i comandi), quindi tutto resta dentro lo schermo anche su un telefono in verticale: prima la posa era pensata per uno schermo largo e il rullino finiva fuori. La pellicola vive in un gruppo che a ogni frame prende la posa della camera: sta su un piano a `DISTANZA` da lei, perpendicolare allo sguardo, e lì i pixel di `striscia.ts` (`x` di scorrimento, `h` altezza del fotogramma) sono pixel veri. Il bussolotto si ingrandisce con lo zoom, nelle proporzioni del 35 mm (`FORMATO_35MM`).
 *
 * La pellicola è un nastro con le perforazioni (una tessera ripetuta, il cui scostamento segue lo scorrimento) e, sopra, una cella per fotogramma visibile: il colore del negativo finché la foto non arriva, poi la foto, ruotata di `dati.rotazione` gradi in senso orario girando il piano (i file restano diritti). Due piani di taglio tengono la pellicola a destra dell'asse del bussolotto e, mentre si srotola, entro il punto a cui è arrivata. Le texture le gestisce `strisciaFoto.ts` (solo i fotogrammi attorno alla finestra, piccola e poi grande con lo zoom).
 *
 * Gesti sulla pellicola, nativi sul canvas e solo da aperto: trascinamento con mouse o dito con inerzia, due dita per ingrandire attorno al fotogramma sotto le dita, rotella per scorrere e ctrl + rotella per ingrandire. Fuori dal bussolotto il puntatore non arriva a R3F: dietro la pellicola ci sono il banco e le fanzine, che al tocco navigherebbero. Sul bussolotto resta il click di `useGesto`, che riavvolge.
 *
 * Equivalente da tastiera e da pulsanti: ← → fotogramma precedente e successivo, + e − zoom; gli stessi comandi arrivano dai pulsanti dell'Hud con `registraStriscia`. «Riavvolgi» dell'Hud, Esc e il cambio di pagina chiudono (`useOggetti`).
 *
 * Il rullino si apre solo in modo 3D, che con `prefers-reduced-motion` non si monta: qui non ci sono varianti ridotte.
 */
export function Rullino({ dati, x, z, giro = 0 }: Props) {
  const gl = useThree((s) => s.gl)
  const camera = useThree((s) => s.camera) as PerspectiveCamera
  const invalidate = useThree((s) => s.invalidate)
  const larghezza = useThree((s) => s.size.width)
  const altezza = useThree((s) => s.size.height)
  const aperto = useOggetti((s) => rullinoAperto(s) === dati.id)
  const altroInPrimoPiano = useOggetti((s) => bioGirata(s) || tvInPrimoPiano(s))
  const [sopra, setSopra] = useState(false)
  const GEOM = useMemo(() => geometria(dati), [dati])

  const gruppo = useRef<Group>(null)
  const corpo = useRef<Group>(null)
  const linguetta = useRef<Mesh>(null)
  /** Il gruppo che segue la camera e, dentro, la pellicola in altezze di fotogramma. Fratelli del bussolotto, non figli: così i gesti del bussolotto non valgono sulla pellicola. */
  const davanti = useRef<Group>(null)
  const pellicola = useRef<Group>(null)
  const nastro = useRef<Mesh>(null)
  /** `volo`: 0 sul banco, 1 in mano davanti alla camera. `alzata`: quanto è sollevato dal piano (hover, trascinamento). */
  const stato = useRef({ riposo: { x, z }, volo: 0, alzata: 0, scarto: { x: 0, z: 0 } })
  /** Stato della striscia (`{ x, h }` in pixel): lo mutano gesti e tween, per questo non è stato di React. */
  const striscia = useRef<Striscia | null>(null)
  const caricata = useRef({ x: NaN, h: NaN })
  const celle = useRef(new Map<number, Cella>())

  const tex = useMemo(() => ({ linguetta: creaTextureLinguetta(), pellicola: creaTexturePellicola(), scotch: creaTextureScotch(dati.etichetta) }), [dati.etichetta])
  const taglio = useMemo(() => [new Plane(), new Plane()], [])
  const mat = useMemo(
    () => ({
      pellicola: new MeshBasicMaterial({ map: tex.pellicola, alphaTest: 0.5, toneMapped: false, clippingPlanes: taglio }),
      negativo: new MeshBasicMaterial({ color: COLORE_NEGATIVO, toneMapped: false, clippingPlanes: taglio }),
    }),
    [tex, taglio],
  )

  /** Toglie dalla scena le celle (tutte, o quelle fuori dall'intervallo) e libera i materiali delle foto; le texture sono di `strisciaFoto`. */
  const togliCelle = (tieni?: [number, number] | null) => {
    const radice = pellicola.current
    for (const [i, c] of celle.current) {
      if (tieni && i >= tieni[0] && i <= tieni[1]) continue
      radice?.remove(c.negativo)
      if (c.foto) {
        radice?.remove(c.foto)
        ;(c.foto.material as MeshBasicMaterial).dispose()
      }
      celle.current.delete(i)
    }
  }

  useEffect(
    () => () => {
      togliCelle()
      Object.values(tex).forEach((t) => t.dispose())
      Object.values(mat).forEach((m) => m.dispose())
    },
    // oxlint-disable-next-line react-hooks/exhaustive-deps
    [tex, mat],
  )

  // I piani di taglio dei materiali valgono solo con il taglio locale acceso sul renderer.
  useEffect(() => {
    tagli.n++
    gl.localClippingEnabled = true
    return () => {
      tagli.n--
      gl.localClippingEnabled = tagli.n > 0
    }
  }, [gl])

  /** Unità mondo per pixel del canvas sul piano della pellicola. */
  const perPixel = () => (2 * DISTANZA * Math.tan(MathUtils.degToRad(camera.fov) / 2)) / Math.max(1, altezza)

  /**
   * Scrive la posa di tutto per lo stato corrente: bussolotto tra banco e mano, pellicola, tagli, celle. La chiama `useFrame`, cioè ogni frame disegnato (il Canvas è «demand»: gesti e tween chiedono solo `invalidate`), dopo il `CameraRig`, che ha già messo la camera al suo posto.
   */
  const posa = () => {
    const st = stato.current
    const g = gruppo.current
    const c = corpo.current
    const d = davanti.current
    const radice = pellicola.current
    const n = nastro.current
    if (!g || !c || !d || !radice || !n) return
    const s = striscia.current
    const k = MathUtils.smootherstep(st.volo, 0, 1)
    A.set(st.riposo.x, BANCO.y + RAGGIO + st.alzata, st.riposo.z)
    if (!s || k <= 0) {
      g.position.copy(A)
      g.quaternion.setFromAxisAngle(SU, giro)
      g.scale.setScalar(1)
      c.quaternion.copy(Q_SDRAIATO)
      d.visible = false
      if (linguetta.current) linguetta.current.visible = true
      return
    }
    const p = posaRullino(larghezza, altezza, eMobile())
    if (s.finestra.largo !== p.finestra.largo || s.finestra.alto !== p.finestra.alto) aggiornaFinestra(s, GEOM, p.finestra)
    const u = perPixel()
    camera.updateMatrixWorld()

    // Bussolotto: dal banco al punto dello schermo deciso da `posaRullino`, dritto davanti alla camera e appena più vicino della pellicola, che gli esce da dietro.
    const scala = (FORMATO_35MM.bussolottoAlto * fotogrammaBussolotto(s) * u) / ALTEZZA_TOTALE
    B.set((p.asse - larghezza / 2) * u, (altezza / 2 - p.centro) * u, -DISTANZA + RAGGIO * scala).applyMatrix4(camera.matrixWorld)
    g.position.lerpVectors(A, B, k)
    g.quaternion.setFromAxisAngle(SU, giro).slerp(camera.quaternion, k)
    g.scale.setScalar(MathUtils.lerp(1, scala, k))
    c.quaternion.slerpQuaternions(Q_SDRAIATO, Q_DRITTO, k)

    // Pellicola: esce quando il bussolotto è quasi arrivato, e rientra per prima al riavvolgimento.
    const rivela = MathUtils.clamp((st.volo - 0.45) / 0.55, 0, 1)
    d.visible = rivela > 0
    if (linguetta.current) linguetta.current.visible = rivela <= 0
    if (rivela <= 0) return
    d.position.copy(camera.position)
    d.quaternion.copy(camera.quaternion)
    radice.position.set((p.asse - s.x - larghezza / 2) * u, (altezza / 2 - p.centro) * u, -DISTANZA)
    radice.scale.setScalar(s.h * u)

    // Il nastro copre solo il tratto in vista, dall'asse del bussolotto a dove è arrivata la pellicola; la tessera delle perforazioni scorre con lei.
    const inizio = s.x / s.h
    const fine = Math.min(GEOM.layout.lunghezza, inizio + (s.finestra.largo / s.h) * rivela + 0.05)
    const lungo = Math.max(0.001, fine - inizio)
    n.position.set(inizio + lungo / 2, 0, 0)
    n.scale.set(lungo, FORMATO_35MM.pellicola, 1)
    tex.pellicola.repeat.set(lungo / FORMATO_35MM.passo, 1)
    tex.pellicola.offset.x = (inizio / FORMATO_35MM.passo) % 1

    // Tagli: a sinistra l'asse del bussolotto, a destra il punto a cui è arrivata la pellicola mentre si srotola.
    DESTRA.set(1, 0, 0).applyQuaternion(camera.quaternion)
    A.set((p.asse - larghezza / 2) * u, 0, -DISTANZA).applyMatrix4(camera.matrixWorld)
    taglio[0].setFromNormalAndCoplanarPoint(DESTRA, A)
    A.set((p.asse + s.finestra.largo * rivela + 4 - larghezza / 2) * u, 0, -DISTANZA).applyMatrix4(camera.matrixWorld)
    taglio[1].setFromNormalAndCoplanarPoint(DESTRA.negate(), A)

    // Texture attorno alla finestra: si richiedono ogni quarto di fotogramma di scorrimento e a ogni cambio di zoom.
    const ultima = caricata.current
    if (!(Math.abs(s.x - ultima.x) <= s.h / 4) || s.h !== ultima.h) {
      caricata.current = { x: s.x, h: s.h }
      caricaAttorno(s, dati, GEOM, invalidate)
    }

    // Celle: una per fotogramma in vista (più uno di margine per lato).
    const vista = visibili(s, GEOM.layout, s.finestra, 1)
    togliCelle(vista)
    if (!vista) return
    const arrivate = new Map(pronte(dati, GEOM).map((f) => [f.cella.indice, f]))
    for (let i = vista[0]; i <= vista[1]; i++) {
      const cella = GEOM.posate[i]
      const centro = cella.inizio + cella.largo / 2
      let ce = celle.current.get(i)
      if (!ce) {
        const negativo = new Mesh(geoPiano, mat.negativo)
        negativo.position.set(centro, 0, 0.004)
        negativo.scale.set(cella.largo, 1, 1)
        negativo.frustumCulled = false
        radice.add(negativo)
        ce = { negativo, foto: null, chiave: null }
        celle.current.set(i, ce)
      }
      const f = arrivate.get(i)
      if (!f || ce.chiave === f.chiave) continue
      if (ce.foto) {
        radice.remove(ce.foto)
        ;(ce.foto.material as MeshBasicMaterial).dispose()
      }
      f.tex.anisotropy = Math.max(f.tex.anisotropy, 4)
      const foto = new Mesh(geoPiano, new MeshBasicMaterial({ map: f.tex, toneMapped: false, clippingPlanes: taglio }))
      const lati = latiFoto(cella.largo, dati.rotazione)
      foto.position.set(centro, 0, 0.008)
      // Senso orario visto dalla camera = rotazione negativa attorno a z.
      foto.rotation.z = -MathUtils.degToRad(dati.rotazione)
      foto.scale.set(lati.w, lati.h, 1)
      foto.frustumCulled = false
      radice.add(foto)
      ce.foto = foto
      ce.chiave = f.chiave
    }
  }

  useFrame(posa)

  /** I comandi della tastiera e dell'Hud: le frecce con un tween breve verso il fotogramma vicino, lo zoom subito attorno al centro della finestra. */
  const eseguiComando = (c: ComandoStriscia) => {
    const s = striscia.current
    if (!s) return
    gsap.killTweensOf(s)
    if (c === 'avanti' || c === 'indietro') {
      const da = s.x
      comanda(s, c, GEOM)
      const a = s.x
      s.x = da
      gsap.to(s, { x: a, duration: DURATA.breve, ease: EASE_TUFFRAT, onUpdate: invalidate })
    } else comanda(s, c, GEOM)
    invalidate()
  }

  // Apertura: striscia dal primo fotogramma, comandi dell'Hud registrati, volo del bussolotto. Chiusura: la pellicola rientra, il bussolotto torna sul banco e la striscia si scarta.
  useEffect(() => {
    const st = stato.current
    gsap.killTweensOf(st)
    if (aperto) {
      striscia.current = strisciaIniziale(GEOM, posaRullino(larghezza, altezza, eMobile()).finestra)
      caricata.current = { x: NaN, h: NaN }
      registraStriscia(eseguiComando)
      gsap.to(st, { volo: 1, alzata: 0, duration: DURATA.volo, ease: EASE_TUFFRAT, onUpdate: invalidate })
      return () => registraStriscia(null)
    }
    const s = striscia.current
    if (!s) return
    gsap.killTweensOf(s)
    gsap.to(st, {
      volo: 0,
      duration: DURATA.riavvolgi,
      ease: EASE_TUFFRAT,
      onUpdate: invalidate,
      onComplete: () => {
        togliCelle()
        striscia.current = null
        invalidate()
      },
    })
    // Solo all'apertura e alla chiusura: le misure del canvas le rilegge `posa` a ogni frame.
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [aperto])

  // Hover: il bussolotto si alza appena dal banco.
  useEffect(() => {
    const st = stato.current
    if (aperto) return
    const t = gsap.to(st, { alzata: sopra ? 0.03 : 0, duration: DURATA.hover, ease: EASE_TUFFRAT, onUpdate: invalidate })
    return () => {
      t.kill()
    }
  }, [sopra, aperto, invalidate])

  const punto = new Vector3()
  const gesto = useGesto({
    cursore: 'hand',
    onHover: setSopra,
    onClick: () => {
      if (useScene.getState().percorso !== '/fotografia') naviga('/fotografia')
      else useOggetti.getState().setPrimoPiano(aperto ? null : { tipo: 'rullino', id: dati.id })
    },
    onDragStart: (e) => {
      const st = stato.current
      if (aperto || st.volo > 0 || altroInPrimoPiano || !e.ray.intersectPlane(PIANO_BANCO, punto)) return false
      gsap.killTweensOf(st)
      st.scarto = { x: st.riposo.x - punto.x, z: st.riposo.z - punto.z }
    },
    onDrag: (e) => {
      const st = stato.current
      if (aperto || !e.ray.intersectPlane(PIANO_BANCO, punto)) return
      const mx = BANCO.largo / 2 - 0.15
      const mz = BANCO.profondo / 2 - 0.12
      st.riposo = { x: MathUtils.clamp(punto.x + st.scarto.x, -mx, mx), z: MathUtils.clamp(punto.z + st.scarto.z, BANCO.z - mz, BANCO.z + mz) }
      st.alzata = 0.05
      invalidate()
    },
    onDragEnd: () => {
      gsap.to(stato.current, { alzata: 0, duration: DURATA.hover, ease: EASE_TUFFRAT, onUpdate: invalidate })
    },
  })

  // I gesti della pellicola: nativi, in cattura sulla finestra (prima di R3F e del CameraRig), montati solo da aperto.
  useEffect(() => {
    if (!aperto) return
    const el = gl.domElement
    const dita = new Map<number, { x: number; y: number }>()
    const tiro = { id: -1, x: 0, t: 0, percorso: 0, vx: 0, distanza: 0 }
    /** Ascissa di un punto dello schermo dentro la finestra della striscia (che comincia all'asse del bussolotto). */
    const nellaFinestra = (clientX: number) => clientX - el.getBoundingClientRect().left - posaRullino(el.clientWidth, el.clientHeight, eMobile()).asse
    const sulBussolotto = (e: PointerEvent, s: Striscia) => {
      const p = posaRullino(el.clientWidth, el.clientHeight, eMobile())
      const r = el.getBoundingClientRect()
      return (
        Math.abs(e.clientX - r.left - p.asse) <= FORMATO_35MM.bussolottoRaggio * fotogrammaBussolotto(s) + 8 &&
        Math.abs(e.clientY - r.top - p.centro) <= (FORMATO_35MM.bussolottoAlto * fotogrammaBussolotto(s)) / 2 + 8
      )
    }
    const prendi = (id: number, clientX: number) => Object.assign(tiro, { id, x: clientX, t: performance.now(), percorso: 0, vx: 0 })

    const giu = (e: PointerEvent) => {
      const s = striscia.current
      if (!s || e.target !== el || e.button !== 0) return
      // Fuori dal bussolotto il puntatore è della pellicola: R3F non lo vede. Sul bussolotto passa, e il click di `useGesto` riavvolge.
      if (!sulBussolotto(e, s)) e.stopPropagation()
      dita.set(e.pointerId, { x: e.clientX, y: e.clientY })
      gsap.killTweensOf(s)
      if (dita.size >= 2) {
        const [a, b] = [...dita.values()]
        tiro.distanza = Math.hypot(a.x - b.x, a.y - b.y)
        tiro.id = -1
        return
      }
      prendi(e.pointerId, e.clientX)
    }
    const muovi = (e: PointerEvent) => {
      const s = striscia.current
      if (!s || !dita.has(e.pointerId)) return
      dita.set(e.pointerId, { x: e.clientX, y: e.clientY })
      if (dita.size >= 2) {
        const [a, b] = [...dita.values()]
        const distanza = Math.hypot(a.x - b.x, a.y - b.y)
        zoomaDita(s, distanza, tiro.distanza, nellaFinestra((a.x + b.x) / 2), GEOM)
        tiro.distanza = distanza
        invalidate()
        return
      }
      if (e.pointerId !== tiro.id) return
      const dx = e.clientX - tiro.x
      const ora = performance.now()
      tiro.vx = -dx / Math.max(1, ora - tiro.t)
      tiro.percorso += Math.abs(dx)
      scorriDi(s, -dx, GEOM)
      tiro.x = e.clientX
      tiro.t = ora
      invalidate()
    }
    const su = (e: PointerEvent) => {
      if (!dita.delete(e.pointerId)) return
      const s = striscia.current
      if (!s) return
      if (dita.size > 0) {
        // Dopo il pinch resta un dito: riprende a scorrere da dov'è, senza salti.
        const [[id, p]] = [...dita.entries()]
        prendi(id, p.x)
        return
      }
      const eraTiro = e.pointerId === tiro.id
      tiro.id = -1
      // Inerzia: la pellicola continua con la velocità del dito, dentro i limiti. Un tocco fermo non tira.
      const v = tiro.vx * 1000
      if (!eraTiro || e.type !== 'pointerup' || tiro.percorso < SOGLIA.tocco || Math.abs(v) < SOGLIA.velocita || performance.now() - tiro.t > 120) return
      const da = s.x
      const a = MathUtils.clamp(da + v * 0.35, 0, Math.max(0, GEOM.layout.lunghezza * s.h - s.finestra.largo))
      gsap.to(s, { x: a, duration: Math.min(DURATA.inerzia, Math.abs(a - da) / (Math.abs(v) * 0.5) + 0.2), ease: 'power2.out', onUpdate: invalidate })
    }
    /** Rotella: scorre; con ctrl (anche il pinch del trackpad) ingrandisce attorno al puntatore. `preventDefault` sempre: senza, ctrl + rotella ingrandirebbe la pagina. */
    const rotella = (e: WheelEvent) => {
      const s = striscia.current
      if (!s) return
      e.preventDefault()
      e.stopPropagation()
      gsap.killTweensOf(s)
      const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY
      if (e.ctrlKey) zoomaSu(s, Math.pow(ROTELLA.zoom, -delta), nellaFinestra(e.clientX), GEOM)
      else scorriDi(s, delta * ROTELLA.scorri, GEOM)
      invalidate()
    }
    /** Tastiera: ← → fotogramma precedente e successivo, + − zoom. Fuori dai campi di testo. */
    const tasto = (e: KeyboardEvent) => {
      if (e.altKey || e.metaKey) return
      const t = e.target as HTMLElement | null
      if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return
      let comando: ComandoStriscia | null = null
      if (e.key === 'ArrowLeft') comando = 'indietro'
      else if (e.key === 'ArrowRight') comando = 'avanti'
      else if (e.key === '+' || e.key === '=' || e.key === 'Add') comando = 'zoom+'
      else if (e.key === '-' || e.key === '_' || e.key === 'Subtract') comando = 'zoom-'
      if (!comando) return
      e.preventDefault()
      e.stopPropagation()
      eseguiComando(comando)
    }
    window.addEventListener('pointerdown', giu, true)
    window.addEventListener('pointermove', muovi, true)
    window.addEventListener('pointerup', su, true)
    window.addEventListener('pointercancel', su, true)
    el.addEventListener('wheel', rotella, { capture: true, passive: false })
    window.addEventListener('keydown', tasto, true)
    return () => {
      window.removeEventListener('pointerdown', giu, true)
      window.removeEventListener('pointermove', muovi, true)
      window.removeEventListener('pointerup', su, true)
      window.removeEventListener('pointercancel', su, true)
      el.removeEventListener('wheel', rotella, true)
      window.removeEventListener('keydown', tasto, true)
    }
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [aperto, gl, GEOM, invalidate])

  return (
    <>
      <group ref={gruppo} {...gesto}>
        <group ref={corpo}>
          <Bussolotto colore={dati.colore} />
          <mesh position={[-RAGGIO * 0.25, 0.01, RAGGIO + 0.002]} rotation={[0, -0.2, 0.05]}>
            <planeGeometry args={[0.13, 0.039]} />
            <meshBasicMaterial map={tex.scotch} toneMapped={false} side={DoubleSide} />
          </mesh>
          {/* La linguetta esce dal feltro quando il rullino è chiuso; da aperto la sostituisce la pellicola vera. */}
          <mesh ref={linguetta} position={[RAGGIO * 0.8 + LINGUETTA.lunga * 0.3, 0, RAGGIO * 0.82]} geometry={geoPiano} scale={[LINGUETTA.lunga, LINGUETTA.larga, 1]}>
            <meshBasicMaterial map={tex.linguetta} toneMapped={false} side={DoubleSide} />
          </mesh>
        </group>
      </group>
      <group ref={davanti} visible={false}>
        <group ref={pellicola}>
          <mesh ref={nastro} geometry={geoPiano} material={mat.pellicola} frustumCulled={false} />
        </group>
      </group>
    </>
  )
}

/** Un tratto di negativo vuoto con le perforazioni: la linguetta della pellicola da chiuso. */
function creaTextureLinguetta(): CanvasTexture {
  const c = document.createElement('canvas')
  c.width = 256
  c.height = 236
  const ctx = c.getContext('2d')!
  ctx.fillStyle = '#2b1a10'
  ctx.fillRect(0, 0, c.width, c.height)
  ctx.fillStyle = COLORE_NEGATIVO
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

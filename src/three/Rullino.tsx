import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef, useState } from 'react'
import { CanvasTexture, DoubleSide, Euler, MathUtils, Mesh, MeshBasicMaterial, Plane, Quaternion, RepeatWrapping, SRGBColorSpace, Vector3, type Group, type Mesh as Mesh3, type PerspectiveCamera } from 'three'
import { useGesto } from '../core/gesto'
import { EASE_TUFFRAT, gsap } from '../core/motion/ease'
import { naviga } from '../core/ponte'
import { registraStriscia, type ComandoStriscia } from '../core/striscia'
import type { RullinoDati } from '../data'
import { bioGirata, rullinoAperto, tvInPrimoPiano, useOggetti } from '../state/useOggetti'
import { useScene } from '../state/useScene'
import { BANCO } from './mondo'
import { COLORE_NEGATIVO, CORNICE, LARGO_PIENA, creaTextureAria, creaTextureBordo, creaTexturePiena, geoPiano } from './pellicola'
import { aggiornaFinestra, caricaAttorno, comanda, geometria, pronte, scorriDi, strisciaIniziale, zoomaDita, zoomaSu, type Striscia } from './strisciaFoto'

interface Props {
  dati: RullinoDati
  /** Posizione a riposo sul banco e rotazione attorno alla verticale. */
  x: number
  z: number
  giro?: number
}

/** Rullino 35 mm ingrandito 2,5× rispetto al vero, per restare leggibile accanto alle fanzine. */
const RAGGIO = 0.062
const ALTEZZA = 0.2
const LARGO_PELLICOLA = 0.175
const PASSO_FOTOGRAMMA = 0.19
const LINGUETTA = 0.24
const PIANO_BANCO = new Plane(new Vector3(0, 1, 0), -(BANCO.y + RAGGIO))
/** Nel sistema del corpo: la bocchetta, dove la pellicola esce dal feltro. */
const BOCCA = new Vector3(RAGGIO * 0.8, ALTEZZA / 2, RAGGIO * 0.82)

/**
 * Distanza della striscia dalla camera. Corrispondenza pixel ↔ unità: con fov `F` e canvas alto `H` pixel il frustum a distanza `D` è alto `uzz = 2·D·tan(F/2)` unità; un fotogramma alto `h` pixel misura `h·uzz/H` unità, e il gruppo della pellicola (alto `ALTEZZA_GRUPPO` fotogrammi) scala `h·uzz/(H·ALTEZZA_GRUPPO)`. Con F = 38° e D = 1,8: uzz = 1,2387; su un canvas di 900 px, a `h` = 300 px il fotogramma è alto 0,413 unità e il gruppo 0,826.
 */
const DISTANZA_STRISCIA = 1.8
/** Altezza del gruppo della pellicola in altezze di fotogramma: un fotogramma più mezza aria sopra e sotto. */
const ALTEZZA_GRUPPO = 2
/** Durate della skill `tuffrat-visual` B7 (0,5 s per posizioni e layout, 0,3 s per l'hover, mai sotto 0,2 s). */
const DURATA_VOLO = 0.6
const DURATA_HOVER = 0.3
const DURATA_RIAVVOLGIMENTO = 0.9
/** Tween breve delle frecce, dei comandi e dell'inerzia. */
const DURATA_BREVE = 0.4
/** Rotella: il delta (px) diventa scorrimento (la rotella lenta non deve sembrare bloccata); ctrl + rotella: fattore di zoom per pixel di delta. */
const ROTELLA = 1.6
const ZOOM_ROTELLA = 1.0018
/** Inerzia al rilascio: durata massima e velocità (px/s) sotto la quale non si tira. */
const INERZIA = 0.8
const VELOCITA_MIN = 40
/** Scorrimento minimo (px) perché un tiro conti come trascinamento: sotto, il tiro si annulla e resta un click (sul bussolotto chiude). */
const SOGLIA_TRASCINA = 6
/** Sotto questa `h` in pixel la pellicola di sinistra è larga meno di un pixel: la si smorza su un fotogramma di pixel prima del taglio, per non sbattere sull'alias. */
const ANTIALIAS_CLIP_PX = 1

/**
 * Il taglio alla bocchetta. `CLIP.piani` piani quasi sovrapposti, distanti mezzo pixel l'uno dall'altro a `DISTANZA_STRISCIA`: il renderer clipa nei pixel e un piano solo lascia un bordo duro che, scorrendo, mostra i gradini dei pixel. La normale è `w = (k, 0, 1)` con `k` piccola e fissa per tutta la vita del rullino (i piani non girano mai, gira la pellicola sotto di loro): il segno principale sta nell'asse z, che è quello dell'occhio.
 * Il renderer ombreggia quando `distanza·w + costante < 0`: con `costante = −k·xb − bordo` diventa `distanza·(k·(x − xb) + z)`. Nel sistema della pellicola l'occhio sta in `(0, 0, −DISTANZA_STRISCIA)` e un punto è `(x, y, 0)`, quindi `z = distanza − DISTANZA_STRISCIA`: la forma è `distanza·(k·(x − xb) + distanza − DISTANZA_STRISCIA)`, negativa per i punti davanti all'occhio (`distanza < DISTANZA_STRISCIA`) con `x < xb`. Lo shader di clipping (`vClipPosition = −mvPosition.xyz`, `plane.dot(vClipPosition) < 0.0`) usa la stessa grandezza: renderer e shader d'accordo con una sola via di calcolo. La `k` fa scorrere l'alias del taglio con la pellicola, come scorre il contenuto.
 */
const CLIP = { piani: 4, passo: 0.5 }

/** X (unità di altezza di fotogramma, dall'origine della pellicola) della bocchetta: è il bordo sinistro della linguetta, l'unico punto della pellicola che non si sposta da chiuso ad aperto. */
const TAGLIO_X = -LINGUETTA / LARGO_PELLICOLA / 2

/** Rotazione del corpo sdraiato sul banco e in mano davanti alla camera. */
const Q_BANCO_CORPO = new Quaternion().setFromEuler(new Euler(-Math.PI / 2, 0, 0))
const Q_MANO = new Quaternion().setFromEuler(new Euler(-Math.PI / 2, 0, 0))
const Q_TMP = new Quaternion()
const SU = new Vector3(0, 1, 0)

/** La pellicola guarda la camera: il suo sistema è quello della camera girato di 180° sull'asse x, così la x locale va a destra sullo schermo. */
const GIRO = new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), Math.PI)
/** Quanti rullini hanno acceso il clipping del renderer: si spegne con l'ultimo. */
const attivi = { n: 0 }

/**
 * Rullino sul banco e pellicola srotolata.
 *
 * Da chiuso è il bussolotto del colore `dati.colore`, con lo scotch del titolo e la linguetta di pellicola fuori: hover, trascinamento sul piano del banco, click che fuori da `/fotografia` porta lì e su `/fotografia` lo apre.
 *
 * Aperto (`rullinoAperto === dati.id`): la camera resta ferma, il bussolotto vola davanti a lei a sinistra e la pellicola esce verso destra. Al primo frame la striscia legge posizione e orientamento della camera (`useThree`), si posa a `DISTANZA_STRISCIA` davanti con lo stesso quaternione girato di 180° sull'asse x e resta perpendicolare all'asse di vista: i pixel di `striscia.ts` sono pixel CSS veri (la corrispondenza sta in `posa` e `taglia`). Al resize si riposa con la stessa altezza in pixel del fotogramma e si ricalcolano i limiti; se dopo l'apertura la camera riceve un target, la striscia si riaggancia quando la camera si ferma.
 *
 * Perpendicolare all'asse di vista: il bussolotto, la pellicola e le foto sono figli del gruppo del rullino, che in volo prende proprio la posa della camera, e la pellicola aggiunge il giro di 180°: il piano della striscia passa davanti all'occhio e taglia l'asse di vista ad angolo retto, qualunque sia la direzione in cui sta guardando la camera. La posa non la copia una volta sola (andrebbe in ferie appena la camera scorre): la ricalcolano a ogni frame i tween di `volo`.
 *
 * Sulla pellicola ogni foto è un piano alto un fotogramma e largo `rapportoRuotato(width, height, rotazione)`: la foto è ruotata di `rotazione` gradi in senso orario girando il piano (`rotation.z = −rotazione` in radianti, perché il positivo di z è antiorario visto dalla camera), così le UV vanno con il piano: il file resta diritto e la foto non si deforma né si ritaglia. Le posizioni vengono da `layoutStriscia`; nel vuoto tra due foto c'è la cella del negativo.
 *
 * Gesti, tutti dalle funzioni di `striscia.ts`: trascinamento con mouse o dito con inerzia al rilascio, rotella verticale o orizzontale per scorrere, ctrl + rotella (anche il pinch del trackpad) per lo zoom attorno al puntatore, due dita su touch per lo zoom attorno al fotogramma sotto le dita. Gli ascoltatori sono nativi su `gl.domElement` in fase di cattura (arrivano prima di `useGesto`, del CameraRig e di R3F) e ci sono solo da aperto. A sinistra del puntatore il trascinamento vale anche sullo sfondo; sul bussolotto resta il click che chiude.
 *
 * Equivalente da tastiera e da pulsanti, mentre il rullino è aperto: ← e → portano al fotogramma precedente e al successivo (`alCentro` + `centraSu`, tween breve), + e − ingrandiscono e rimpiccioliscono (fuori da un campo di testo). Gli stessi quattro comandi arrivano dai pulsanti dell'Hud con `registraStriscia` (registrato da aperto, tolto alla chiusura). Esc e cambio di pagina chiudono il rullino (`SceneRouter` e `useScene`, via `useOggetti`); aprire l'altro rullino chiude questo da sé, perché `primoPiano` è esclusivo.
 *
 * Chiusura: solo il click sul bussolotto (`setPrimoPiano(null)`). La pellicola si riavvolge e il bussolotto torna sul banco (0,6 s il volo, 0,9 s il riavvolgimento, `EASE_TUFFRAT`). Un click o un tiro sulla pellicola non chiude niente.
 *
 * Texture: `TextureLoader.load` imperativo, mai `useTexture` (lo `Stage` ha una sola `Suspense`: una texture che arriva dopo svuoterebbe tutto il mondo). Si caricano solo i fotogrammi che `visibili(…, 2)` indica, con `srcPiccola`, e si passa a `src` quando `h` supera l'altezza in pixel della piccola dopo la rotazione; chi esce dal margine libera la texture. Finché la foto non arriva la cella è del colore della pellicola; da chiuso non si carica niente. Foto in `meshBasicMaterial` senza tone mapping: i colori sono quelli del file.
 *
 * Taglio alla bocchetta: la pellicola a sinistra dell'uscita del bussolotto non si vede. Si fa nel fragment shader (`clippingPlanes` su tutti i materiali della pellicola, foto comprese) con `gl.localClippingEnabled` acceso in un effetto sul renderer. Il buio dei tagli è alfabetico (`alphaTest`): dai buchi delle perforazioni e dall'aria si vede il fondo della pagina. `frustumCulled = false` sui piani, la cui scatola di ingombro non sa del taglio.
 *
 * Motion: durate e curva dalla skill (`EASE_TUFFRAT`, 0,4–0,9 s); ogni tween chiama `invalidate` (frameloop «demand») e nessuna proprietà animata viene passata come prop JSX. Il rullino si apre solo in modo 3D, che `modo3D` spegne con `reducedMotion` (senza `webgl` lo `Stage` non si monta): qui non esistono timeline da portare a `progress(1)`.
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

  /** Il rullino intero sul banco (trascinamento), il bussolotto in volo, il corpo (sdraiato o in piedi), la linguetta. */
  const gruppo = useRef<Group>(null)
  const bussolotto = useRef<Group>(null)
  const corpo = useRef<Group>(null)
  const linguetta = useRef<Mesh3 | null>(null)
  /** La pellicola: figlia del gruppo che vola, quindi si muove col bussolotto; posa e fotogrammi li scrivono `useFrame` e `disegna`. */
  const pellicola = useRef<Group>(null)
  const scotch = useRef<Mesh3 | null>(null)
  const feltro = useRef<Mesh3 | null>(null)
  const stato = useRef({ riposo: { x, z }, volo: 0, kS: 1 })
  const preso = useRef(false)
  const scarto = useRef({ x: 0, z: 0 })

  /**
   * Stato della striscia (`striscia.ts`) e quel tanto che serve attorno: lo mutano i gesti a ogni evento e i tween a ogni tick, per questo non è uno stato di React. `inScena` dice se la pellicola è disegnata con le foto (da aperta, e a riposo mentre si riavvolge): da chiuso resta la linguetta.
   */
  const striscia = useRef<Striscia | null>(null)
  const strato = useRef({ veduta: { largo: 0, alto: 0, fov: 0 }, porzione: 0, distanza: DISTANZA_STRISCIA, firma: '', assestare: true, ricarica: true, fissate: 0 })
  const cameraApertura = useRef<Vector3 | null>(null)

  const tex = useMemo(
    () => ({
      linguetta: creaTextureLinguetta(),
      piena: creaTexturePiena(),
      // Vuoto con la foto prima a sinistra (testa) o a destra (coda), e le due tessere senza foto (solo tagli).
      ariaPrima: creaTextureAria(true, true),
      ariaDopo: creaTextureAria(true, false),
      aria: creaTextureAria(false, false),
      bordo: creaTextureBordo(),
      scotch: creaTextureScotch(dati.etichetta),
    }),
    [dati.etichetta],
  )
  // La tessera delle perforazioni in pellicola si ripete ogni `LARGO_PIENA` unità: le quote le dà il piano, la tessera solo il disegno.
  tex.piena.repeat.set(ALTEZZA_GRUPPO / LARGO_PIENA, 1)
  const clip = useMemo(() => ({ accesi: Array.from({ length: CLIP.piani }, () => new Plane()), spenti: Array.from({ length: CLIP.piani }, () => new Plane()) }), [])
  const mat = useMemo(
    () => ({
      quadrilateri: new MeshBasicMaterial({ map: tex.bordo, toneMapped: false, clippingPlanes: clip.spenti }),
      ariaPrima: new MeshBasicMaterial({ map: tex.ariaPrima, alphaTest: 0.5, toneMapped: false, clippingPlanes: clip.spenti }),
      ariaDopo: new MeshBasicMaterial({ map: tex.ariaDopo, alphaTest: 0.5, toneMapped: false, clippingPlanes: clip.spenti }),
      aria: new MeshBasicMaterial({ map: tex.aria, alphaTest: 0.5, toneMapped: false, clippingPlanes: clip.spenti }),
      negativo: new MeshBasicMaterial({ color: '#2b1a10', toneMapped: false, clippingPlanes: clip.spenti }),
      traFori: new MeshBasicMaterial({ map: tex.piena, alphaTest: 0.5, toneMapped: false, clippingPlanes: clip.spenti }),
    }),
    [tex, clip],
  )
  const matFoto = useRef(new Map<string, MeshBasicMaterial>())

  useEffect(
    () => () => {
      Object.values(tex).forEach((t) => t.dispose())
      Object.values(mat).forEach((m) => m.dispose())
      matFoto.current.forEach((m) => m.dispose())
      matFoto.current.clear()
    },
    [tex, mat],
  )

  /**
   * Clipping locale: acceso una volta sul renderer in un effetto, spento solo quando l'ultimo rullino si smonta. `version` distingue il renderer vero dal doppio che R3F crea sotto `/src` (che ha solo proprietà e metodi copiati: `version` manca).
   */
  useEffect(() => {
    if (!(gl as { version?: string }).version) return
    attivi.n++
    gl.localClippingEnabled = true
    return () => {
      attivi.n--
      gl.localClippingEnabled = attivi.n > 0
    }
  }, [gl])

  /** Posa della pellicola per lo stato corrente: il gruppo è alto `ALTEZZA_GRUPPO` fotogrammi e scala `1/h`; la bocchetta resta a `TAGLIO_X` dal bordo sinistro del gruppo. */
  const applica = () => {
    const p = pellicola.current
    const s = striscia.current
    if (!p || !s) return
    p.scale.setScalar(1 / s.h)
    p.position.x = -(s.x / s.h)
  }

  /**
   * Posa perpendicolare. `primo` = primo frame dopo l'apertura: si legge la posa della camera e si fissa la veduta. Altrimenti solo se la striscia non è assestata o la veduta è cambiata (`resize`); si riposa con la stessa altezza in pixel del fotogramma.
   */
  const posa = (primo: boolean) => {
    const p = pellicola.current
    const s = striscia.current
    const r = strato.current
    if (!p || !s) return
    const vw = larghezza || 1
    const vh = altezza || 1
    const v = r.veduta
    if (!primo && !r.assestare && v.fov === camera.fov && v.largo === vw && v.alto === vh) return
    camera.updateMatrixWorld()
    // Il gruppo della pellicola sta nel sistema della camera, girato di 180° sull'asse x: faccia verso la camera, x locale a destra dello schermo, y in alto. Il gruppo del rullino (`gruppo`) ha già la posa della camera, che scrive `posaTutta`.
    p.position.set(0, 0, 0)
    p.quaternion.copy(GIRO)
    r.veduta = { largo: vw, alto: vh, fov: camera.fov }
    r.distanza = DISTANZA_STRISCIA / Math.cos(Math.atan((vh / 2) * (s.h / vh)))
    aggiornaFinestra(s, GEOM, { largo: vw, alto: vh })
    r.assestare = false
    if (primo) cameraApertura.current = camera.getWorldPosition(new Vector3())
    applica()
  }

  /**
   * I tagli per lo stato corrente. `xb = TAGLIO_X − x/h` è la bocchetta sull'asse della pellicola (unità di altezza di fotogramma). La rampa `ANTIALIAS_CLIP_PX` toglie il bordo duro quando la pellicola di sinistra è larga meno di un pixel.
   */
  const taglia = (s: Striscia) => {
    const distanza = strato.current.distanza
    // Unità mondo per pixel all'asse della pellicola: il frustum alto `2·D·tan(fov/2)` diviso per l'altezza del canvas in pixel.
    const upx = (2 * distanza * Math.tan(MathUtils.degToRad(camera.fov) / 2)) / Math.max(1, altezza)
    const bordoBase = CLIP.passo * upx
    const xb = TAGLIO_X - s.x / s.h
    const k = MathUtils.clamp((ANTIALIAS_CLIP_PX * upx) / (2 * distanza), 1e-6, 0.2)
    const l = Math.hypot(k, 1)
    for (let i = 0; i < CLIP.piani; i++) {
      const bordo = i * bordoBase
      const a = clip.accesi[i]
      a.normal.set(k / l, 0, 1 / l)
      a.constant = (-k * xb) / l - bordo
      const sp = clip.spenti[i]
      sp.normal.set(-k / l, 0, -1 / l)
      sp.constant = (k * xb) / l - bordo
    }
  }

  /**
   * La scenografia della pellicola: il buio del fotogramma, i quadrati del negativo attorno, le perforazioni sopra e sotto e un piano sui vuoti, per ogni foto. Si rifà quando cambiano le foto arrivate o i tagli (`firma`); i piani vecchi si tolgono (le texture sono in condivisione).
   */
  const disegna = () => {
    const p = pellicola.current
    const s = striscia.current
    if (!p || !s) return
    const arrivate = pronte(dati, GEOM)
    // La finestra da disegnare: un fotogramma e mezzo attorno a quella visibile, almeno la testa con la coda davanti.
    const fine = strato.current.porzione
    const primo = Math.max(0, fine - ALTEZZA_GRUPPO)
    // Via i pezzi che escono dalla finestra (le foto hanno una scatola di ingombro fissa: senza, resterebbero in scena a lungo).
    for (const figlio of [...p.children]) {
      if (!figlio.userData.carto && typeof figlio.userData.fine === 'number' && (figlio.userData.fine < primo || figlio.userData.inizio > fine)) p.remove(figlio)
    }
    const firma = `${primo}:${fine}:${arrivate.map((f) => `${f.cella.indice}:${f.chiave}`).join('|')}`
    if (firma === strato.current.firma) return
    strato.current.firma = firma
    for (const figlio of [...p.children]) {
      p.remove(figlio)
      if (figlio.userData.carto) ((figlio as Mesh3).material as MeshBasicMaterial).dispose()
    }
    const aggiungi = (materiale: MeshBasicMaterial, x0: number, y0: number, w: number, h: number, z = 0, giro = 0) => {
      const m = new Mesh(geoPiano, materiale)
      m.position.set(x0 + w / 2, y0 + h / 2, z)
      m.rotation.z = giro
      m.scale.set(w, h, 1)
      m.frustumCulled = false
      // I pezzi statici della pellicola si rifanno tutti insieme (vedi la firma), quelli delle foto restano finché escono dalla finestra.
      m.userData.carto = true
      m.userData.inizio = x0
      m.userData.fine = x0 + w
      p.add(m)
    }
    const chiuso = (f: { inizio: number; largo: number }) => f.inizio + f.largo > primo && f.inizio < fine
    const visibili = GEOM.posate.filter(chiuso)
    if (!visibili.length) {
      // La parte disegnata sta tutta fuori dalle foto (testa o coda): pellicola con i soli tagli sul bordo.
      aggiungi(mat.aria, primo, -CORNICE.bordoEsterno, fine - primo, CORNICE.bordoEsterno * 2)
    } else {
      const a = visibili[0]
      const b = visibili[visibili.length - 1]
      // Il quadrato del negativo e i tagli attorno alle foto; fuori (testa e coda) pellicola senza foto.
      // Testa (la foto viene dopo) e coda (la foto viene prima).
      if (a.inizio > primo) aggiungi(mat.ariaPrima, primo, -CORNICE.bordoEsterno, a.inizio - primo, CORNICE.bordoEsterno * 2)
      aggiungi(mat.quadrilateri, a.inizio, -CORNICE.bordoEsterno, b.inizio + b.largo - a.inizio, CORNICE.bordoEsterno * 2, 0.001)
      aggiungi(mat.traFori, a.inizio, -CORNICE.foroEsterno, b.inizio + b.largo - a.inizio, CORNICE.foroEsterno - CORNICE.bordoEsterno, 0.002)
      aggiungi(mat.traFori, a.inizio, CORNICE.bordoEsterno, b.inizio + b.largo - a.inizio, CORNICE.foroEsterno - CORNICE.bordoEsterno, 0.002)
      if (b.inizio + b.largo < fine) aggiungi(mat.ariaDopo, b.inizio + b.largo, -CORNICE.bordoEsterno, fine - b.inizio - b.largo, CORNICE.bordoEsterno * 2)
      for (const c of visibili) aggiungi(mat.negativo, c.inizio, -CORNICE.foto, c.largo, 1, 0.0005)
    }
    for (const f of arrivate) {
      if (f.cella.inizio + f.cella.largo <= primo || f.cella.inizio >= fine) continue
      let materiale = matFoto.current.get(f.chiave)
      if (!materiale || materiale.map !== f.tex) {
        materiale?.dispose()
        // Anisotropia: la pellicola si guarda di traverso quando è inclinata dal volo, la texture della foto resta a fuoco più a lungo.
        f.tex.anisotropy = Math.max(f.tex.anisotropy, 4)
        materiale = new MeshBasicMaterial({ map: f.tex, toneMapped: false, clippingPlanes: clip.spenti })
        matFoto.current.set(f.chiave, materiale)
      }
      const m = new Mesh(geoPiano, materiale)
      m.position.set(f.cella.inizio + f.cella.largo / 2, 0, 0.003)
      // Senso orario visto dalla camera = rotazione negativa attorno a z (che guarda verso chi guarda): i file restano diritti e le UV girano col piano.
      m.rotation.z = -MathUtils.degToRad(dati.rotazione)
      m.scale.set(f.cella.largo, 1, 1)
      m.frustumCulled = false
      m.userData.indice = f.cella.indice
      m.userData.inizio = f.cella.inizio
      m.userData.fine = f.cella.inizio + f.cella.largo
      p.add(m)
    }
    invalidate()
  }

  /**
   * Posa del rullino e della pellicola per `volo` (0 = sul banco, 1 = di fronte alla camera). La bocchetta è il punto fisso del taglio: sia da chiuso (dove il bordo sinistro della linguetta esce dal feltro) sia da aperto (dove arrivano i fotogrammi) sta in `TAGLIO_X` sull'asse della pellicola.
   * Da aperto il rullino intero sta nel sistema della pellicola, che giace su un piano di fronte alla camera: col corpo ruotato di −90° sull'asse x l'asse del bussolotto va lungo lo schermo e lo scotch guarda in alto; `corpo.position` porta la bocchetta in `(TAGLIO_X, 0, 0)`.
   */
  const posaTutta = () => {
    const st = stato.current
    const gr = gruppo.current
    const b = bussolotto.current
    const c = corpo.current
    const p = pellicola.current
    if (!gr || !b || !c || !p) return
    const v = st.volo
    const conPellicola = !!striscia.current && v > 0.001
    p.visible = conPellicola
    if (linguetta.current) linguetta.current.visible = !conPellicola && v <= 0.001
    if (scotch.current) scotch.current.visible = v < 1
    if (feltro.current) feltro.current.visible = v < 1
    // Tra banco e mano due pose si interpolano: scala, rotazione del corpo e bocchetta. A riposo la bocchetta sta, nel sistema (sdraiato) del rullino, in `y = BOCCA.z` (l'altezza sullo schermo) e `z = −(BOCCA.x + LINGUETTA/2)` (il lato da cui si guarda); in mano il gruppo è nel sistema della pellicola e la bocchetta va in `(TAGLIO_X, 0, 0)`.
    const k = MathUtils.smoothstep(v, 0, 1)
    b.scale.setScalar(1 + (st.kS - 1) * k)
    c.quaternion.slerpQuaternions(Q_BANCO_CORPO, Q_MANO, k)
    c.position.set(MathUtils.lerp(BOCCA.x, TAGLIO_X, k), MathUtils.lerp(BOCCA.z, 0, k), MathUtils.lerp(-(BOCCA.x + LINGUETTA / 2), 0, k))
    if (v <= 0.001) {
      // Sul banco: il rullino dove l'ha lasciato il trascinamento, sdraiato, alla scala sua, rialzato di pochi centimetri in hover.
      const y = BANCO.y + RAGGIO + (sopra ? 0.03 : 0)
      gr.position.set(st.riposo.x, y, st.riposo.z)
      gr.rotation.set(0, giro, 0)
      b.position.set(0, 0, 0)
      b.rotation.set(0, 0, 0)
    } else if (st.volo > 0.001) {
      // In volo: da dove stava (e verso dove guarda la camera, che può scorrere) alla posa della pellicola, con lo stesso quaternione girato di 180° per guardare la camera.
      // Il rullino si posa sulla camera (dove sta la pellicola) e prende la rotazione della pellicola, girata di 180° per guardare la camera.
      camera.updateMatrixWorld()
      gr.position.set(MathUtils.lerp(st.riposo.x, camera.position.x, k), MathUtils.lerp(BANCO.y + RAGGIO, camera.position.y, k), MathUtils.lerp(st.riposo.z, camera.position.z, k))
      // Da sul banco il rullino si raddrizza: slerp da `Q_BANCO` (giro attorno alla verticale) alla posa della camera girata di 180°.
      gr.quaternion.setFromAxisAngle(SU, giro).slerp(camera.getWorldQuaternion(Q_TMP).multiply(GIRO), k)
    }
    invalidate()
  }

  /**
   * Un frame: posa se serve, tagli, caricamenti attorno alla finestra e fotogrammi. Il frameloop «demand» rende questo frame come primo dopo ogni `invalidate`, quindi la vista è sempre quella appena posata.
   */
  useFrame(() => {
    const s = striscia.current
    if (!s) return
    posa(false)
    // La pellicola è figlia del rullino che vola: dopo un tween di `volo` la sua matrice mondiale va ricalcolata prima dei tagli.
    pellicola.current?.updateWorldMatrix(true, false)
    applica()
    pellicola.current?.updateWorldMatrix(false, true)
    taglia(s)
    // Se dopo l'apertura la camera riceve un target (un tween di 800 ms), quando si ferma la striscia si riaggancia alla sua posa.
    const cam = cameraApertura.current
    if (cam && !useScene.getState().inTransizione && cam.distanceToSquared(camera.position) > 1e-6) {
      strato.current.assestare = true
      cameraApertura.current = null
    }
    if (strato.current.ricarica) {
      strato.current.ricarica = false
      caricaAttorno(s, dati, GEOM, () => {
        invalidate()
        disegna()
      })
    }
    // La porzione disegnata: un fotogramma e mezzo attorno alla finestra, in altezze di fotogramma dall'origine della pellicola.
    strato.current.porzione = (s.x + s.finestra.largo) / s.h + 0.5
    disegna()
  })

  /** Apertura: striscia dal primo fotogramma, comandi registrati, volo del bussolotto. Chiusura: comandi tolti, pellicola riavvolta nella linguetta, bussolotto sul banco. */
  useEffect(() => {
    const st = stato.current
    gsap.killTweensOf(st)
    if (aperto) {
      striscia.current = strisciaIniziale(GEOM, { largo: larghezza || 1, alto: altezza || 1 })
      Object.assign(strato.current, { assestare: true, ricarica: true, veduta: { largo: 0, alto: 0, fov: 0 }, firma: '#' })
      // Il bussolotto in mano: circa il 45 % dell'altezza del canvas, la misura della linguetta a `DISTANZA_STRISCIA`.
      st.kS = MathUtils.clamp((0.45 * 2 * DISTANZA_STRISCIA * Math.tan(MathUtils.degToRad(camera.fov) / 2)) / ALTEZZA, 0.4, 1.4)
      st.volo = 0
      registraStriscia(eseguiComando)
      gsap.to(st, { volo: 1, duration: DURATA_VOLO, ease: EASE_TUFFRAT, onUpdate: posaTutta, onComplete: posaTutta })
      return () => {
        registraStriscia(null)
      }
    }
    striscia.current = null
    cameraApertura.current = null
    strato.current.firma = '#'
    if (st.volo > 0) gsap.to(st, { volo: 0, duration: DURATA_RIAVVOLGIMENTO, ease: EASE_TUFFRAT, onUpdate: posaTutta, onComplete: posaTutta })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aperto])

  // Da chiuso la posa la scrive `posaTutta` a ogni cambio di hover, giro o pixel del canvas (là la scala del bussolotto si ricalcola): proprietà fuori da JSX (le scrive anche il trascinamento) e senza tween.
  useEffect(() => {
    const st = stato.current
    if (aperto || st.volo > 0.001) return
    st.kS = MathUtils.clamp((0.45 * 2 * DISTANZA_STRISCIA * Math.tan(MathUtils.degToRad(camera.fov) / 2)) / ALTEZZA, 0.4, 1.4)
    posaTutta()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sopra, giro, larghezza, altezza])

  const punto = new Vector3()
  const gesto = useGesto({
    cursore: 'hand',
    onHover: setSopra,
    onClick: () => {
      if (useScene.getState().percorso !== '/fotografia') naviga('/fotografia')
      else useOggetti.getState().setPrimoPiano(aperto ? null : { tipo: 'rullino', id: dati.id })
    },
    onDragStart: (e) => {
      const gr = gruppo.current
      if (aperto || altroInPrimoPiano || !gr || !e.ray.intersectPlane(PIANO_BANCO, punto)) return false
      preso.current = true
      gsap.killTweensOf(gr.position)
      scarto.current = { x: gr.position.x - punto.x, z: gr.position.z - punto.z }
    },
    onDrag: (e) => {
      const gr = gruppo.current
      if (!gr || aperto || !e.ray.intersectPlane(PIANO_BANCO, punto)) return
      const mx = BANCO.largo / 2 - 0.15
      const mz = BANCO.profondo / 2 - 0.12
      const px = MathUtils.clamp(punto.x + scarto.current.x, -mx, mx)
      const pz = MathUtils.clamp(punto.z + scarto.current.z, BANCO.z - mz, BANCO.z + mz)
      stato.current.riposo = { x: px, z: pz }
      gr.position.set(px, BANCO.y + RAGGIO + 0.05, pz)
      invalidate()
    },
    onDragEnd: () => {
      const gr = gruppo.current
      preso.current = false
      if (!gr) return
      gsap.to(gr.position, { y: BANCO.y + RAGGIO, duration: DURATA_HOVER, ease: EASE_TUFFRAT, onUpdate: invalidate })
    },
  })

  /**
   * I gesti della striscia, montati solo da aperto: nativi su `gl.domElement` in cattura, così prendono il puntatore prima di `useGesto`, del CameraRig e degli eventi R3F. Il trascinamento vale anche sullo sfondo; sul bussolotto resta il click che chiude.
   */
  useEffect(() => {
    if (!aperto) return
    const el = gl.domElement
    /** Un cambio della striscia: un frame; i fotogrammi attorno si aggiornano ogni mezzo fotogramma di scorrimento, così lo scorrimento lento carica per tempo. */
    const cambia = () => {
      invalidate()
      const s = striscia.current
      if (s && Math.abs(s.x - strato.current.fissate) > s.h / 2) {
        strato.current.fissate = s.x
        caricaAttorno(s, dati, GEOM, () => invalidate())
      }
    }
    /** Il punto toccato cade a sinistra del bussolotto (sullo sfondo, davanti alla pellicola): il tiro scorre la striscia senza arrivare al bussolotto. */
    const aSinistra = (e: PointerEvent) => {
      const p = pellicola.current
      if (!p) return true
      const ndc = new Vector3((e.clientX / Math.max(1, el.clientWidth)) * 2 - 1, -(e.clientY / Math.max(1, el.clientHeight)) * 2 + 1, 0.5)
      ndc.unproject(camera)
      const dir = ndc.sub(camera.position).normalize()
      const normale = new Vector3(0, 0, 1).applyQuaternion(p.quaternion)
      const t = p.position.clone().sub(camera.position).dot(normale) / (dir.dot(normale) || 1)
      return p.worldToLocal(camera.position.clone().addScaledVector(dir, t)).x < TAGLIO_X
    }
    const dita = new Map<number, { x: number; y: number }>()
    const tiro = { attivo: false, id: -1, x: 0, t: 0, percorso: 0, vx: 0, distanza: 0 }
    const avviaTiro = (e: PointerEvent) => {
      dita.set(e.pointerId, { x: e.clientX, y: e.clientY })
      const st = striscia.current
      if (!st) return
      if (dita.size >= 2) {
        // Due dita: zoom attorno al fotogramma sotto il baricentro, il tiro a un dito si ferma.
        const [a, b] = [...dita.values()]
        tiro.distanza = Math.hypot(a.x - b.x, a.y - b.y)
        tiro.attivo = false
        return
      }
      if (!aSinistra(e)) return
      tiro.attivo = true
      tiro.id = e.pointerId
      tiro.x = e.clientX
      tiro.t = performance.now()
      tiro.percorso = 0
      tiro.vx = 0
      gsap.killTweensOf(st)
      el.setPointerCapture?.(e.pointerId)
    }
    const muoviTiro = (e: PointerEvent) => {
      if (!dita.has(e.pointerId)) return
      dita.set(e.pointerId, { x: e.clientX, y: e.clientY })
      const st = striscia.current
      if (!st) return
      if (dita.size >= 2) {
        const [a, b] = [...dita.values()]
        const distanza = Math.hypot(a.x - b.x, a.y - b.y)
        zoomaDita(st, distanza, tiro.distanza, (a.x + b.x) / 2, GEOM)
        tiro.distanza = distanza
        cambia()
        return
      }
      if (!tiro.attivo || e.pointerId !== tiro.id) return
      const dx = e.clientX - tiro.x
      const ora = performance.now()
      tiro.vx = -dx / Math.max(1, ora - tiro.t)
      if (scorriDi(st, -dx, GEOM)) tiro.percorso += Math.abs(dx)
      tiro.x = e.clientX
      tiro.t = ora
      cambia()
    }
    const chiudiTiro = (e: PointerEvent) => {
      if (!dita.has(e.pointerId)) return
      dita.delete(e.pointerId)
      try {
        el.releasePointerCapture?.(e.pointerId)
      } catch {
        /* cattura già persa */
      }
      if (dita.size > 0) return
      if (!tiro.attivo || e.type !== 'pointerup') {
        tiro.attivo = false
        return
      }
      tiro.attivo = false
      const st = striscia.current
      if (!st) return
      // Inerzia: il tiro continua con la velocità del dito, sempre dentro i limiti. Un click (percorso corto) non tira.
      const v = tiro.vx * 1000
      if (tiro.percorso < SOGLIA_TRASCINA || Math.abs(v) < VELOCITA_MIN || performance.now() - tiro.t > 120) return
      const da = st.x
      const bersaglio = MathUtils.clamp(da + v * 0.35, 0, Math.max(0, GEOM.layout.lunghezza * st.h - st.finestra.largo))
      gsap.to(st, { x: bersaglio, duration: Math.min(INERZIA, Math.abs(bersaglio - da) / (Math.abs(v) * 0.5) + 0.2), ease: 'power2.out', onUpdate: cambia })
    }
    /** Rotella: senza ctrl scorre (deltaY o deltaX), con ctrl (anche il pinch del trackpad) ingrandisce attorno al puntatore. `preventDefault` sempre: senza, ctrl + rotella ingrandisce la pagina. */
    const rotella = (e: WheelEvent) => {
      const st = striscia.current
      if (!st) return
      e.preventDefault()
      e.stopPropagation()
      const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY
      if (e.ctrlKey) zoomaSu(st, Math.pow(ZOOM_ROTELLA, -delta), e.clientX, GEOM)
      else scorriDi(st, delta * ROTELLA, GEOM)
      cambia()
    }
    /** Tastiera: ← → fotogramma precedente e successivo, + − zoom. Fuori dai campi di testo, con il fuoco dovunque nella pagina. */
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
    el.addEventListener('pointerdown', avviaTiro, true)
    window.addEventListener('pointermove', muoviTiro, true)
    window.addEventListener('pointerup', chiudiTiro, true)
    window.addEventListener('pointercancel', chiudiTiro, true)
    el.addEventListener('wheel', rotella, { capture: true, passive: false })
    window.addEventListener('keydown', tasto, true)
    return () => {
      el.removeEventListener('pointerdown', avviaTiro, true)
      window.removeEventListener('pointermove', muoviTiro, true)
      window.removeEventListener('pointerup', chiudiTiro, true)
      window.removeEventListener('pointercancel', chiudiTiro, true)
      el.removeEventListener('wheel', rotella, true)
      window.removeEventListener('keydown', tasto, true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aperto, gl, camera, GEOM, dati])

  /** I comandi della tastiera e dell'Hud (`ComandoStriscia`): le frecce, `x` verso `centraSu` con un tween breve; lo zoom immediato attorno al centro della finestra. */
  const eseguiComando = (c: ComandoStriscia) => {
    const s = striscia.current
    if (!s) return
    gsap.killTweensOf(s)
    if (c === 'avanti' || c === 'indietro') {
      const da = s.x
      comanda(s, c, GEOM)
      const a = s.x
      s.x = da
      gsap.to(s, { x: a, duration: DURATA_BREVE, ease: EASE_TUFFRAT, onUpdate: invalidate })
    } else comanda(s, c, GEOM)
    invalidate()
  }

  return (
    <group ref={gruppo} {...gesto}>
      {/* Il rullino: `bussolotto` porta volo e scala (li scrive il tween, non JSX), `corpo` la posa sdraiata o in mano. */}
      <group ref={bussolotto}>
        <group ref={corpo}>
          <mesh position={[0, ALTEZZA / 2, 0]}>
            <cylinderGeometry args={[RAGGIO, RAGGIO, ALTEZZA, 32]} />
            <meshStandardMaterial color={dati.colore} roughness={0.45} metalness={0.15} />
          </mesh>
          {[1, -1].map((s) => (
            <mesh key={s} position={[0, ALTEZZA / 2 + s * (ALTEZZA / 2 + 0.006), 0]}>
              <cylinderGeometry args={[RAGGIO + 0.004, RAGGIO + 0.004, 0.012, 32]} />
              <meshStandardMaterial color="#1b1b1b" roughness={0.4} metalness={0.5} />
            </mesh>
          ))}
          <mesh position={[0, ALTEZZA + 0.028, 0]}>
            <cylinderGeometry args={[0.02, 0.02, 0.034, 16]} />
            <meshStandardMaterial color="#111111" roughness={0.5} />
          </mesh>
          <mesh ref={feltro} position={[RAGGIO * 0.72, ALTEZZA / 2, RAGGIO * 0.78]}>
            <boxGeometry args={[0.03, ALTEZZA, 0.016]} />
            <meshStandardMaterial color="#141414" roughness={0.95} />
          </mesh>
          <mesh ref={scotch} position={[-RAGGIO * 0.25, ALTEZZA / 2 + 0.01, RAGGIO + 0.002]} rotation={[0, -0.2, 0.05]}>
            <planeGeometry args={[0.13, 0.039]} />
            <meshBasicMaterial map={tex.scotch} toneMapped={false} side={DoubleSide} />
          </mesh>
          {/* La linguetta: da chiuso esce dal feltro; da aperto la nasconde la pellicola disegnata. */}
          <mesh ref={linguetta} position={[BOCCA.x, ALTEZZA / 2, BOCCA.z]} geometry={geoPiano} scale={[LINGUETTA, LARGO_PELLICOLA, 1]}>
            <meshBasicMaterial map={tex.linguetta} toneMapped={false} side={DoubleSide} />
          </mesh>
        </group>
        {/* La pellicola: nel sistema della camera, posata e scritta da `useFrame`. */}
        <group ref={pellicola} />
      </group>
    </group>
  )
}

/** Un fotogramma di negativo vuoto con le perforazioni: si ripete lungo la linguetta della pellicola da chiuso. */
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
  t.repeat.set(LINGUETTA / PASSO_FOTOGRAMMA, 1)
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

import { Html, RoundedBox } from '@react-three/drei'
import { useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef, useState, type RefObject } from 'react'
import { CanvasTexture, SRGBColorSpace, type Mesh, type MeshStandardMaterial } from 'three'
import { useGesto } from '../core/gesto'
import { eMobile } from '../core/mobile'
import { EASE_TUFFRAT, gsap } from '../core/motion/ease'
import { naviga } from '../core/ponte'
import { artista } from '../data'
import { PERMESSI_VIDEO, urlVideoYouTube } from '../lib/youtube'
import { useOggetti } from '../state/useOggetti'
import { useScene } from '../state/useScene'
import { MURO, TV } from './mondo'

const { corpo: CORPO, schermo: SCHERMO } = TV
/** Manopole e pulsante di accensione stanno a destra dello schermo, sul frontale: le posizioni vengono da `mondo.ts`, che le usa anche per l'inquadratura di `TARGET_TV`. */
const { manopole: MANOPOLE, pulsante: PULSANTE } = TV
const FACCIA = CORPO.d / 2
const SCHERMO_Z = FACCIA + 0.002

/** Listelli della cornice in rilievo attorno allo schermo (scostamento dal centro dello schermo, larghezza, altezza). */
const BORDO = 0.035
const CORNICE_SCHERMO = [
  { id: 'su', x: 0, y: SCHERMO.h / 2 + BORDO / 2, w: SCHERMO.w + BORDO * 2, h: BORDO },
  { id: 'giu', x: 0, y: -SCHERMO.h / 2 - BORDO / 2, w: SCHERMO.w + BORDO * 2, h: BORDO },
  { id: 'sx', x: -SCHERMO.w / 2 - BORDO / 2, y: 0, w: BORDO, h: SCHERMO.h },
  { id: 'dx', x: SCHERMO.w / 2 + BORDO / 2, y: 0, w: BORDO, h: SCHERMO.h },
]
/** Quote delle feritoie della griglia dell'altoparlante, sotto le manopole. */
const GRIGLIA = [-0.075, -0.097, -0.119, -0.141, -0.163]
/** Piedini sotto la scocca (x, z). */
const PIEDINI: [number, number][] = [-1, 1].flatMap((sx) => [-1, 1].map((sz): [number, number] => [sx * (CORPO.w / 2 - 0.1), sz * (CORPO.d / 2 - 0.1)]))

/** Misure del player YouTube in pixel CSS: 640 × 480, 4:3 come lo schermo. */
const PLAYER = { w: 640, h: 480 }
/** Il `distanceFactor` di drei `Html` quando non è impostato: entra nel conto della scala (vedi il commento sopra `SCALA_PLAYER`). */
const DISTANZA_FATTORE = 10

/**
 * Neve statica, scanline e due righe di testo. Un fotogramma solo disegnato al caricamento: niente loop di render in idle.
 * `avvia` è la seconda riga: «▶ avvia l'intervista» sulla neve, vuota a video e a TV spenta.
 */
function creaSchermo(titolo: string, avvia: string): CanvasTexture {
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
  if (avvia) {
    ctx.font = '600 30px "Helvetica Neue", Arial, sans-serif'
    ctx.fillText(avvia, c.width / 2, 250, c.width - 60)
  }
  const t = new CanvasTexture(c)
  t.colorSpace = SRGBColorSpace
  return t
}

/**
 * Scala dell'iframe, dal sorgente di `Html` di drei (`node_modules/@react-three/drei/web/Html.js`). In modalità `transform`:
 * 1. `getObjectCSSMatrix(matrix, 1 / ((distanceFactor || 10) / 400))` moltiplica le righe di scala della matrice per `400 / distanceFactor` e la traslazione per il suo inverso. Con `distanceFactor` non impostato (10) un'unità della matrice dell'oggetto diventa 40 px CSS sul div esterno, che è grande `size.width × size.height` (`el.style.width = size.width + 'px'`): un pixel del div esterno vale 1 / 40 di unità della matrice;
 * 2. il div interno (il figlio, dove sta l'iframe) cresce dentro quello, quindi i suoi 640 px sono 640 px del div esterno, cioè 640 / 40 = 16 unità della matrice;
 * 3. la matrice contiene già il `scale` del gruppo: un'unità locale del gruppo vale `scale` unità della matrice. Perché il riquadro largo 640 px ci stia nel piano largo 0,72 si impone `640 / 40 × scale = 0,72`, da cui `scale = 0,72 × 40 / 640 = 28,8 / 640 = 0,045`;
 * 4. controllo in altezza: 480 × 0,045 / 40 = 0,54, esattamente `SCHERMO.h`. Il riquadro resta 4:3 e il player non si deforma.
 *
 * Quindi `scale = (SCHERMO.w × 400 / DISTANZA_FATTORE) / PLAYER.w = 0,045`. Sullo schermo della camera a `TARGET_TV` (circa 0,63 unità d'altezza) il player di 640 px finisce a circa 560 px CSS: uno a uno in altezza su un telefonino, un po' più compatto in larghezza su un desktop 16:9.
 */
const SCALA_PLAYER = (SCHERMO.w * (400 / DISTANZA_FATTORE)) / PLAYER.w

/**
 * Il contenitore DOM agganciato alla scena: `#stage-html`, fratello dello Stage e non `aria-hidden`. Se manca (per esempio uno Stage montato fuori dal Layout), `Html` ripiega sul genitore del canvas come fa da solo.
 */
function portaStage(): RefObject<HTMLElement | null> {
  return { current: document.getElementById('stage-html') }
}

/**
 * Il video dentro lo schermo (desktop): l'iframe di YouTube agganciato al piano dello schermo con `Html transform` di drei. Montato solo con `tv === 'video'`: quando lo stato cambia (pulsante di spegnimento, Esc, click sullo sfondo, cambio pagina, che passano tutti da `useOggetti`) l'iframe si smonta e l'audio si ferma.
 * Un iframe semplice, senza l'API di YouTube: prima il player lo creava un effetto che leggeva un `ref` dentro `Html`, ma `Html` monta i figli in una sua radice React, dopo l'effetto, e il `ref` era sempre vuoto: il video non partiva mai.
 * Sul telefono questo componente non si monta: il video sta in un riquadro DOM sopra la scena (`src/ui/TvVideo.tsx`), più grande e senza trasformazioni 3D, che sui browser mobili sono fragili per un iframe.
 */
function VideoNelloSchermo({ youtubeId, titolo }: { youtubeId: string; titolo: string }) {
  const invalidate = useThree((s) => s.invalidate)

  // `Html` si riposiziona solo quando si disegna un frame (`frameloop="demand"`): al montaggio se ne chiede uno.
  useEffect(() => {
    invalidate()
  }, [invalidate])

  const porta = portaStage()
  return (
    <Html
      transform
      portal={porta as RefObject<HTMLElement>}
      zIndexRange={[1, 0]}
      scale={SCALA_PLAYER}
      // Centrato sul piano dello schermo, appena davanti.
      position={[SCHERMO.x, SCHERMO.y, SCHERMO_Z + 0.004]}
      style={{ width: PLAYER.w, height: PLAYER.h, pointerEvents: 'auto', background: '#000' }}
    >
      <iframe
        src={urlVideoYouTube(youtubeId)}
        title={titolo}
        width={PLAYER.w}
        height={PLAYER.h}
        allow={PERMESSI_VIDEO}
        allowFullScreen
        style={{ display: 'block', border: 0 }}
      />
    </Html>
  )
}

interface TvProps {
  /** La scena della sandbox: dentro l'editor il video si prova a TV spenta. */
  anteprimaVideo?: boolean
}

/**
 * TV a tubo catodico accanto al ritratto, con il video di PULSOS dentro lo schermo. Tre stati da `useOggetti.tv`: `neve` (neve statica, scanline, titolo e «▶ avvia l'intervista»), `spenta` (schermo nero pieno, nessuna scritta) e `video` (iframe YouTube agganciato al piano dello schermo). Bersagli separati, ciascuno con il suo `useGesto`: lo schermo e il pulsante di accensione, in basso a destra sul frontale.
 *
 * Click sullo schermo: da un'altra pagina va a `/bio`, su `/bio` avvia il video (`avviaVideo`, da spenta non fa nulla). Click sul pulsante: `interruttoreTv` (spegne e ferma il video, oppure riaccende sulla neve).
 *
 * Il pulsante sta dentro l'inquadratura di `TARGET_TV`, che va dal bordo sinistro dello schermo al pulsante (le misure sono in `mondo.ts`).
 *
 * Equivalente da tastiera: il link «Guarda l'intervista» nella scheda `/bio` apre YouTube in una nuova scheda, ed è l'unico modo da tastiera di vedere il video, perché il player dentro il canvas non ha un gemello DOM. Spegnere la TV da tastiera non serve: Esc chiude il primo piano e il video si ferma. Un pulsante DOM gemello («Spegni la TV») vorrebbe una modifica a `src/pages/Bio.tsx`, fuori dai confini di questo lavoro: è annotato nel resoconto.
 */
export function Tv({ anteprimaVideo = false }: TvProps) {
  const selettoreSchermo = useRef<Mesh>(null)
  const pulsante = useRef<Mesh>(null)
  const spia = useRef<Mesh>(null)
  const invalidate = useThree((s) => s.invalidate)
  const stato = useOggetti((s) => (anteprimaVideo ? 'video' : s.tv))
  const [sopraSchermo, setSopraSchermo] = useState(false)
  const [sopraPulsante, setSopraPulsante] = useState(false)
  const { pulsos } = artista.video
  const texNeve = useMemo(() => creaSchermo(pulsos.titolo, '▶ avvia l’intervista'), [pulsos.titolo])
  const texNera = useMemo(() => creaSchermo('', ''), [])
  useEffect(
    () => () => {
      texNeve.dispose()
      texNera.dispose()
    },
    [texNeve, texNera],
  )

  // Feedback di hover: lo schermo e il pulsante si avvicinano appena.
  useEffect(() => {
    const m = selettoreSchermo.current
    if (!m) return
    const t = gsap.to(m.scale, { x: sopraSchermo ? 1.03 : 1, y: sopraSchermo ? 1.03 : 1, duration: 0.4, ease: EASE_TUFFRAT, onUpdate: invalidate })
    return () => {
      t.kill()
    }
  }, [sopraSchermo, invalidate])

  useEffect(() => {
    const m = pulsante.current
    if (!m) return
    const t = gsap.to(m.scale, { x: sopraPulsante ? 1.15 : 1, y: sopraPulsante ? 1.15 : 1, z: sopraPulsante ? 1.15 : 1, duration: 0.3, ease: EASE_TUFFRAT, onUpdate: invalidate })
    return () => {
      t.kill()
    }
  }, [sopraPulsante, invalidate])

  // La spia si accende (rosso caldo) quando la TV non è spenta.
  const accesa = stato !== 'spenta'
  useEffect(() => {
    const mat = spia.current?.material as MeshStandardMaterial | undefined
    if (!mat) return
    const t = gsap.to(mat, { emissiveIntensity: accesa ? 2.2 : 0.15, duration: 0.3, ease: EASE_TUFFRAT, onUpdate: invalidate })
    return () => {
      t.kill()
    }
  }, [accesa, invalidate])

  const gestoSchermo = useGesto({
    cursore: 'hand',
    onHover: setSopraSchermo,
    onClick: () => {
      if (useScene.getState().percorso !== '/bio') {
        naviga('/bio')
        return
      }
      useOggetti.getState().avviaVideo()
    },
  })

  const gestoPulsante = useGesto({
    cursore: 'hand',
    onHover: setSopraPulsante,
    onClick: () => useOggetti.getState().interruttoreTv(),
  })

  const yMobile = MURO.pavimento + TV.mobileAlto / 2
  const yTv = MURO.pavimento + TV.mobileAlto + CORPO.h / 2
  const vista = stato === 'video' ? 'video' : stato
  return (
    <group position={[TV.x, 0, TV.z]} rotation={[0, TV.giro, 0]}>
      {/* Mobiletto: cassa con gli spigoli smussati, un piano che sporge appena e lo zoccolo rientrato. */}
      <RoundedBox args={[1.25, TV.mobileAlto - 0.1, 0.85]} radius={0.02} smoothness={3} position={[0, yMobile + 0.03, 0]}>
        <meshStandardMaterial color="#6b5a47" roughness={0.85} />
      </RoundedBox>
      <RoundedBox args={[1.31, 0.04, 0.9]} radius={0.012} smoothness={3} position={[0, MURO.pavimento + TV.mobileAlto - 0.02, 0]}>
        <meshStandardMaterial color="#7a6852" roughness={0.8} />
      </RoundedBox>
      <mesh position={[0, MURO.pavimento + 0.04, -0.02]}>
        <boxGeometry args={[1.15, 0.08, 0.75]} />
        <meshStandardMaterial color="#3d3329" roughness={0.9} />
      </mesh>
      <group position={[0, yTv, 0]}>
        {/* Scocca con gli spigoli arrotondati, come le TV a tubo catodico. */}
        <RoundedBox args={[CORPO.w, CORPO.h, CORPO.d]} radius={0.06} smoothness={4}>
          <meshStandardMaterial color="#2b2a28" roughness={0.55} />
        </RoundedBox>
        {/* Cornice in rilievo attorno allo schermo: quattro listelli, fuori dal rettangolo dello schermo. */}
        {CORNICE_SCHERMO.map((c) => (
          <mesh key={c.id} position={[SCHERMO.x + c.x, SCHERMO.y + c.y, FACCIA + 0.006]}>
            <boxGeometry args={[c.w, c.h, 0.014]} />
            <meshStandardMaterial color="#3b3a37" roughness={0.45} />
          </mesh>
        ))}
        {/* Griglia dell'altoparlante, tra le manopole e il pulsante. */}
        {GRIGLIA.map((y) => (
          <mesh key={y} position={[MANOPOLE.x, y, FACCIA + 0.002]}>
            <boxGeometry args={[0.14, 0.009, 0.006]} />
            <meshStandardMaterial color="#141413" roughness={0.7} />
          </mesh>
        ))}
        {/* Piedini. */}
        {PIEDINI.map(([x, z]) => (
          <mesh key={`${x}:${z}`} position={[x, -CORPO.h / 2 - 0.012, z]}>
            <cylinderGeometry args={[0.035, 0.03, 0.03, 16]} />
            <meshStandardMaterial color="#161615" roughness={0.8} />
          </mesh>
        ))}
        <mesh ref={selettoreSchermo} position={[SCHERMO.x, SCHERMO.y, SCHERMO_Z + 0.0005]} {...gestoSchermo}>
          {/* A video il piano diventa nero: l'iframe lo copre, e sotto le lettere nere non spunta la neve. */}
          <planeGeometry args={[SCHERMO.w, SCHERMO.h]} />
          <meshBasicMaterial map={vista === 'spenta' ? texNera : texNeve} toneMapped={false} color={vista === 'video' ? '#000000' : '#ffffff'} />
        </mesh>
        {stato === 'video' && !eMobile() && <VideoNelloSchermo youtubeId={pulsos.youtubeId} titolo={pulsos.titolo} />}
        {MANOPOLE.y.map((y) => (
          <mesh key={y} position={[MANOPOLE.x, y, FACCIA + 0.02]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[MANOPOLE.r, MANOPOLE.r, 0.04, 20]} />
            <meshStandardMaterial color="#c9c4b8" roughness={0.4} metalness={0.3} />
          </mesh>
        ))}
        {/* Pulsante di accensione con la spia: in basso a destra sul frontale. Il bersaglio è un cerchio grande quasi quanto il disco, per restare facile da colpire anche da lontano. */}
        <group position={[PULSANTE.x, PULSANTE.y, FACCIA]} {...gestoPulsante}>
          {/* Il cilindro nasce con l'asse verticale: ruotato di 90° attorno a x guarda verso chi sta davanti alla TV. */}
          <mesh ref={pulsante} position={[0, 0, 0.02]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[PULSANTE.r, PULSANTE.r, 0.04, 24]} />
            <meshStandardMaterial color="#9e998d" roughness={0.45} metalness={0.25} />
          </mesh>
          {/* Spia rossa sotto il pulsante. */}
          <mesh ref={spia} position={[0, -PULSANTE.r - 0.035, 0.008]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.018, 0.018, 0.02, 16]} />
            <meshStandardMaterial color="#5a1f1a" emissive="#ff4a2a" emissiveIntensity={accesa ? 2.2 : 0.15} roughness={0.35} />
          </mesh>
        </group>
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

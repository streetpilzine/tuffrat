import { Html } from '@react-three/drei'
import { useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef, useState, type RefObject } from 'react'
import { CanvasTexture, SRGBColorSpace, type Mesh, type MeshStandardMaterial } from 'three'
import { useGesto } from '../core/gesto'
import { EASE_TUFFRAT, gsap } from '../core/motion/ease'
import { naviga } from '../core/ponte'
import { artista } from '../data'
import { useOggetti } from '../state/useOggetti'
import { useScene } from '../state/useScene'
import { MURO, TV } from './mondo'
import { caricaApiYouTube } from './youtube'

const { corpo: CORPO, schermo: SCHERMO } = TV
/** Manopole e pulsante di accensione stanno a destra dello schermo, sul frontale: le posizioni vengono da `mondo.ts`, che le usa anche per l'inquadratura di `TARGET_TV`. */
const { manopole: MANOPOLE, pulsante: PULSANTE } = TV
const FACCIA = CORPO.d / 2
const SCHERMO_Z = FACCIA + 0.002

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
 * Il player YouTube vero e proprio. Montato solo con `tv === 'video'`, smontato in ogni altro stato; allo smontaggio (pulsante di spegnimento, Esc, click sullo sfondo, cambio pagina, che passano tutti da `useOggetti`) il player è distrutto con `destroy()` e il nodo rimosso, così l'audio si ferma davvero. Gestisce anche lo stato che cambia prima che l'API abbia finito di caricare.
 */
function VideoNelloSchermo({ youtubeId }: { youtubeId: string }) {
  const invalidate = useThree((s) => s.invalidate)
  const host = useRef<HTMLDivElement>(null)
  const [errore, setErrore] = useState(false)
  const [montato, setMontato] = useState(false)

  // `Html` si riposiziona solo quando si disegna un frame (`frameloop="demand"`): al montaggio e a ogni cambio di stato se ne chiede uno.
  useEffect(() => {
    invalidate()
  }, [invalidate, errore])

  useEffect(() => {
    const el = host.current
    if (!el) return
    let vivo = true
    let player: PlayerYT | null = null
    void caricaApiYouTube()
      .then((YT) => {
        if (!vivo || !el.isConnected) return
        setMontato(true)
        player = new YT.Player(el, {
          host: 'https://www.youtube-nocookie.com',
          videoId: youtubeId,
          width: PLAYER.w,
          height: PLAYER.h,
          playerVars: { autoplay: 1, playsinline: 1, rel: 0 },
          events: {
            onReady: (e) => {
              e.target.playVideo()
              if (errore) setErrore(false)
            },
          },
        })
        invalidate()
      })
      .catch(() => {
        // API irraggiungibile: la TV torna in neve (lo stato è esclusivo, il primo piano si toglie).
        if (vivo) useOggetti.getState().setPrimoPiano(null)
      })
    return () => {
      vivo = false
      setMontato(false)
      // L'API sostituisce il div con il suo iframe: il player va distrutto anche se il nodo originale è sparito; il resto lo toglie React.
      player?.destroy()
      player = null
    }
  }, [youtubeId, invalidate, errore])

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
      <div ref={host} />
      {montato && !errore ? null : (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'grid',
            placeItems: 'center',
            color: '#f2f2ea',
            font: '600 20px "Helvetica Neue", Arial, sans-serif',
            background: errore ? '#000' : 'transparent',
          }}
        >
          {errore ? 'Video non disponibile' : null}
        </div>
      )}
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
      <mesh position={[0, yMobile, 0]}>
        <boxGeometry args={[1.25, TV.mobileAlto, 0.85]} />
        <meshStandardMaterial color="#6b5a47" roughness={0.85} />
      </mesh>
      <group position={[0, yTv, 0]}>
        <mesh>
          <boxGeometry args={[CORPO.w, CORPO.h, CORPO.d]} />
          <meshStandardMaterial color="#2b2a28" roughness={0.6} />
        </mesh>
        <mesh ref={selettoreSchermo} position={[SCHERMO.x, SCHERMO.y, SCHERMO_Z + 0.0005]} {...gestoSchermo}>
          {/* A video il piano diventa nero: l'iframe lo copre, e sotto le lettere nere non spunta la neve. */}
          <planeGeometry args={[SCHERMO.w, SCHERMO.h]} />
          <meshBasicMaterial map={vista === 'spenta' ? texNera : texNeve} toneMapped={false} color={vista === 'video' ? '#000000' : '#ffffff'} />
        </mesh>
        {stato === 'video' && <VideoNelloSchermo youtubeId={pulsos.youtubeId} />}
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

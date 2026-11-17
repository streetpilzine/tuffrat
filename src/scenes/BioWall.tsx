import { useLoader, useThree } from '@react-three/fiber'
import { Suspense, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { SRGBColorSpace, TextureLoader, type CanvasTexture, type Group } from 'three'
import { useGesto } from '../core/gesto'
import { EASE_TUFFRAT, gsap } from '../core/motion/ease'
import { naviga } from '../core/ponte'
import { artista } from '../data'
import { bioGirata, useOggetti } from '../state/useOggetti'
import { useScene } from '../state/useScene'
import { RITRATTO } from '../three/mondo'
import { creaRetroBio } from '../three/RetroBio'
import { Tv } from '../three/Tv'

/** Inclinazione a riposo della cornice sul muro (radianti). */
const INCLINAZIONE = -0.01
const SPESSORE = 0.04
/** Durata della girata: come il fuoco di un quadro. */
const DURATA = 0.65
/** Quanto la cornice si stacca dal muro in hover. */
const Z_HOVER = 0.06

const LARGO = RITRATTO.largo
const ALTO = RITRATTO.alto

/** La foto del ritratto, nella sua `Suspense` locale: una texture che arriva tardi non deve far sparire tutto il mondo (lo Stage ha una sola Suspense). */
function Foto() {
  const tex = useLoader(TextureLoader, artista.profilo.src)
  return (
    <mesh position={[0, 0, SPESSORE / 2 + 0.005]}>
      <planeGeometry args={[LARGO, ALTO]} />
      <meshStandardMaterial map={tex} map-colorSpace={SRGBColorSpace} roughness={0.9} />
    </mesh>
  )
}

/**
 * L'angolo destro del muro: la TV con l'intervista e il ritratto dell'artista. Click sul ritratto: da un'altra pagina porta a `/bio`; su `/bio` la cornice viene avanti e si gira di 180° mostrando il retro, dove si legge la bio breve (una `CanvasTexture`, disegnata in `src/three/RetroBio.ts`); un secondo click la riappende. Esc, il click sullo sfondo e il cambio di pagina la riportano a posto attraverso `useOggetti`; la camera la porta il `CameraRig` su `TARGET_BIO_RETRO`.
 * Equivalente da tastiera e in vista lista: la bio completa nella pagina `/bio`. Con `prefers-reduced-motion` lo Stage non si monta, quindi non c'è una variante 3D ridotta.
 */
export function BioWall() {
  const g = useRef<Group>(null)
  const gl = useThree((s) => s.gl)
  const invalidate = useThree((s) => s.invalidate)
  const girata = useOggetti(bioGirata)
  const [sopra, setSopra] = useState(false)
  const [retro, setRetro] = useState<CanvasTexture | null>(null)
  const disegnato = useRef(false)

  useLayoutEffect(() => {
    g.current?.position.set(RITRATTO.x, RITRATTO.y, SPESSORE / 2)
    g.current?.rotation.set(0, 0, INCLINAZIONE)
  }, [])

  // Il retro si disegna la prima volta che la cornice si gira e si ridisegna quando i font del sito sono pronti.
  useEffect(() => {
    if (!girata || disegnato.current) return
    disegnato.current = true
    const disegna = () => {
      const tex = creaRetroBio({ nome: artista.brand, paragrafi: artista.bioBreve, citazione: artista.citazione }, ALTO / LARGO)
      tex.anisotropy = gl.capabilities.getMaxAnisotropy()
      setRetro(tex)
      invalidate()
    }
    disegna()
    void document.fonts?.ready.then(disegna)
  }, [girata, gl, invalidate])

  // La texture precedente si libera quando arriva la nuova e allo smontaggio.
  useEffect(() => () => retro?.dispose(), [retro])

  useEffect(() => {
    const gruppo = g.current
    if (!gruppo) return
    const opz = { duration: DURATA, ease: EASE_TUFFRAT, onUpdate: invalidate, overwrite: true as const }
    const a = gsap.to(gruppo.position, { z: girata ? RITRATTO.zPrimoPiano : SPESSORE / 2 + (sopra ? Z_HOVER : 0), ...opz })
    const b = gsap.to(gruppo.rotation, { y: girata ? Math.PI : 0, z: girata ? 0 : INCLINAZIONE, ...opz })
    return () => {
      a.kill()
      b.kill()
    }
  }, [girata, sopra, invalidate])

  const gesto = useGesto({
    cursore: 'hand',
    onHover: setSopra,
    onClick: () => {
      if (useScene.getState().percorso !== '/bio') naviga('/bio')
      else useOggetti.getState().setPrimoPiano(girata ? null : { tipo: 'bio' })
    },
  })

  return (
    <>
      <Tv />
      <group ref={g} {...gesto}>
        <mesh>
          <boxGeometry args={[LARGO + RITRATTO.bordo, ALTO + RITRATTO.bordo, SPESSORE]} />
          <meshStandardMaterial color="#ffffff" roughness={0.7} />
        </mesh>
        <Suspense fallback={null}>
          <Foto />
        </Suspense>
        {/* Il retro guarda verso −z: con la cornice girata di 180° è la faccia verso la camera, e il testo non risulta specchiato. */}
        <mesh position={[0, 0, -SPESSORE / 2 - 0.002]} rotation={[0, Math.PI, 0]}>
          <planeGeometry args={[LARGO, ALTO]} />
          {/* Chiavi diverse: un materiale nato senza `map` non la campiona se gliela si aggiunge dopo (lo shader è già compilato senza), e il retro restava vuoto. Con la chiave React ne crea uno nuovo per ogni texture. */}
          {retro ? <meshBasicMaterial key={retro.uuid} map={retro} toneMapped={false} /> : <meshBasicMaterial key="vuoto" color="#f7f7f5" toneMapped={false} />}
        </mesh>
      </group>
    </>
  )
}

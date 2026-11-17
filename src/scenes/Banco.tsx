import { Suspense, useMemo } from 'react'
import { LatheGeometry, Vector2 } from 'three'
import { useGesto } from '../core/gesto'
import { eMobile } from '../core/mobile'
import { naviga } from '../core/ponte'
import { rullini } from '../data'
import { edizioniVisibili } from '../lib/edizioni'
import { useScene } from '../state/useScene'
import { Libro } from '../three/Libro'
import { ModelloBanco } from '../three/modelli/ModelloBanco'
import { ModelloPennarello } from '../three/modelli/ModelloPennarello'
import { BANCO } from '../three/mondo'
import { Rullino } from '../three/Rullino'

const SPESSORE = 0.08
const GAMBA = BANCO.y - SPESSORE + 1.5
/** Ascissa che separa la metà delle fanzine (a sinistra) da quella dei rullini, per il tocco sul piano dal telefono. */
const CONFINE_RULLINI = 0.45

/** Dove stanno i rullini nella metà destra del banco, nell'ordine dei dati (gialla, ben). */
const POSTI_RULLINI = [
  { x: 1.1, z: 2.2, giro: 0.5 },
  { x: 1.65, z: 2.45, giro: -0.9 },
]

/**
 * Posti delle fanzine nella metà sinistra del banco: una griglia 2 × 2 appena disordinata, nell'ordine di lettura (n. 1 e n. 2 nella fila lontana, che a schermo sta in alto; n. 3 e n. 4 in quella vicina). Le StreetPIL sono orizzontali, larghe 0,594 e profonde 0,396: così nessuna copre un'altra e il bordo destro resta a x ≈ −0,28, lontano dagli attrezzi. Il quinto posto, a sinistra, serve alla rivista di prova in dev.
 */
const POSTI_LIBRI = [
  { x: -1.22, z: 1.93, giro: 0.04 },
  { x: -0.58, z: 1.96, giro: -0.03 },
  { x: -1.21, z: 2.5, giro: -0.03 },
  { x: -0.59, z: 2.47, giro: 0.05 },
  { x: -1.9, z: 2.25, giro: 0.1 },
]

/** Profili torniti della bomboletta (raggio, quota dal piede): il corpo verniciato con il gradino del fondo, e la calotta di metallo con la spalla bombata, il collo e la coppa della valvola. */
const PROFILO_CORPO: [number, number][] = [
  [0, 0],
  [0.058, 0],
  [0.065, 0.008],
  [0.065, 0.372],
  [0.062, 0.384],
]
const PROFILO_CALOTTA: [number, number][] = [
  [0.062, 0.384],
  [0.059, 0.394],
  [0.05, 0.407],
  [0.038, 0.415],
  [0.031, 0.417],
  [0.031, 0.426],
  [0.027, 0.43],
  [0.012, 0.432],
  [0, 0.432],
]

/** Bomboletta spray: corpo e calotta torniti, erogatore bianco con l'ugello verso chi guarda. */
function Bomboletta() {
  const geo = useMemo(() => {
    const tornito = (profilo: [number, number][]) => new LatheGeometry(profilo.map(([r, y]) => new Vector2(r, y)), 40)
    return { corpo: tornito(PROFILO_CORPO), calotta: tornito(PROFILO_CALOTTA) }
  }, [])
  return (
    <group>
      <mesh geometry={geo.corpo}>
        <meshStandardMaterial color="#141414" roughness={0.32} metalness={0.35} />
      </mesh>
      <mesh geometry={geo.calotta}>
        <meshStandardMaterial color="#c9c9c9" roughness={0.28} metalness={0.8} />
      </mesh>
      <mesh position={[0, 0.45, 0]}>
        <cylinderGeometry args={[0.017, 0.019, 0.04, 20]} />
        <meshStandardMaterial color="#f2f2f2" roughness={0.55} />
      </mesh>
      <mesh position={[0, 0.455, 0.017]}>
        <boxGeometry args={[0.012, 0.012, 0.008]} />
        <meshStandardMaterial color="#d8d8d8" roughness={0.6} />
      </mesh>
    </group>
  )
}

/** Il pennarello di ripiego (due cilindri), finché il modello non è arrivato. */
function PennarelloSemplice() {
  return (
    <>
      <mesh>
        <cylinderGeometry args={[0.02, 0.02, 0.26, 12]} />
        <meshStandardMaterial color="#1c1c1c" roughness={0.5} />
      </mesh>
      <mesh position={[0, 0.15, 0]}>
        <cylinderGeometry args={[0.008, 0.018, 0.04, 12]} />
        <meshStandardMaterial color="#444444" roughness={0.6} />
      </mesh>
    </>
  )
}

/** Bomboletta e pennarello: attrezzi di scena, non interattivi. */
function Attrezzi() {
  return (
    <group position={[0.15, BANCO.y, 1.75]}>
      <Bomboletta />
      <group position={[0.32, 0.02, 0.25]} rotation={[0, 0.7, Math.PI / 2]}>
        <Suspense fallback={<PennarelloSemplice />}>
          {/* Il modello ha l'origine alla punta: lo si centra dove stava il cilindro. */}
          <group position={[0, -0.165, 0]}>
            <ModelloPennarello />
          </group>
        </Suspense>
      </group>
    </group>
  )
}

/** Il banco di ripiego (piano e quattro gambe), finché il modello non è arrivato. Origine al centro della superficie del piano, come il modello. */
function BancoSemplice() {
  const gambe: [number, number][] = [-1, 1].flatMap((sx) => [-1, 1].map((sz): [number, number] => [sx * (BANCO.largo / 2 - 0.15), sz * (BANCO.profondo / 2 - 0.12)]))
  return (
    <>
      <mesh position={[0, -SPESSORE / 2, 0]}>
        <boxGeometry args={[BANCO.largo, SPESSORE, BANCO.profondo]} />
        <meshStandardMaterial color="#d9d3c4" roughness={0.9} />
      </mesh>
      {gambe.map(([x, z]) => (
        <mesh key={`${x}:${z}`} position={[x, -SPESSORE - GAMBA / 2, z]}>
          <boxGeometry args={[0.08, GAMBA, 0.08]} />
          <meshStandardMaterial color="#3a3733" roughness={0.7} />
        </mesh>
      ))}
    </>
  )
}

/**
 * Il banco davanti al muro: a sinistra le fanzine (`/edizioni`), a destra i due rullini (`/fotografia`).
 * Fanzine e rullini sono oggetti che si prendono; il tavolo fa da sfondo e lascia passare lo scorrimento. Quale rullino è srotolato lo dice `useOggetti` (un solo oggetto in primo piano alla volta).
 */
export function Banco() {
  // Telefono: dal muro il banco si vede in basso, piccolo. Un tocco sul piano porta sul banco: dalla parte delle fanzine a `/edizioni`, da quella dei rullini a `/fotografia`. Solo `onClick`: il trascinamento continua a scorrere il muro. Su desktop il piano resta senza gestori.
  const gestoPiano = useGesto({
    onClick: (e) => {
      const meta = e.point.x < CONFINE_RULLINI ? '/edizioni' : '/fotografia'
      if (!useScene.getState().percorso.startsWith(meta)) naviga(meta)
    },
  })

  return (
    <group>
      <group position={[0, BANCO.y, BANCO.z]} {...(eMobile() ? gestoPiano : null)}>
        <Suspense fallback={<BancoSemplice />}>
          <ModelloBanco />
        </Suspense>
      </group>
      {edizioniVisibili.slice(0, POSTI_LIBRI.length).map((e, i) => (
        <Libro key={e.id} edizione={e} {...POSTI_LIBRI[i]} />
      ))}
      <Attrezzi />
      {rullini.slice(0, POSTI_RULLINI.length).map((r, i) => (
        <Rullino key={r.id} dati={r} {...POSTI_RULLINI[i]} />
      ))}
    </group>
  )
}

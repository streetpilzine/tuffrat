import { rullini } from '../data'
import { edizioniVisibili } from '../lib/edizioni'
import { Libro } from '../three/Libro'
import { BANCO } from '../three/mondo'
import { Rullino } from '../three/Rullino'

const SPESSORE = 0.08
const GAMBA = BANCO.y - SPESSORE + 1.5

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

/** Bomboletta e pennarello: attrezzi di scena, non interattivi. */
function Attrezzi() {
  return (
    <group position={[0.15, BANCO.y, 1.75]}>
      <group position={[0, 0.19, 0]}>
        <mesh>
          <cylinderGeometry args={[0.065, 0.065, 0.38, 24]} />
          <meshStandardMaterial color="#111111" roughness={0.35} metalness={0.3} />
        </mesh>
        <mesh position={[0, 0.2, 0]}>
          <cylinderGeometry args={[0.045, 0.062, 0.03, 24]} />
          <meshStandardMaterial color="#c9c9c9" roughness={0.3} metalness={0.7} />
        </mesh>
        <mesh position={[0, 0.235, 0]}>
          <cylinderGeometry args={[0.02, 0.02, 0.04, 12]} />
          <meshStandardMaterial color="#f2f2f2" roughness={0.6} />
        </mesh>
      </group>
      <group position={[0.32, 0.02, 0.25]} rotation={[0, 0.7, Math.PI / 2]}>
        <mesh>
          <cylinderGeometry args={[0.02, 0.02, 0.26, 12]} />
          <meshStandardMaterial color="#1c1c1c" roughness={0.5} />
        </mesh>
        <mesh position={[0, 0.15, 0]}>
          <cylinderGeometry args={[0.008, 0.018, 0.04, 12]} />
          <meshStandardMaterial color="#444444" roughness={0.6} />
        </mesh>
      </group>
    </group>
  )
}

/**
 * Il banco davanti al muro: a sinistra le fanzine (`/edizioni`), a destra i due rullini (`/fotografia`).
 * Fanzine e rullini sono oggetti che si prendono; il tavolo fa da sfondo e lascia passare lo scorrimento. Quale rullino è srotolato lo dice `useOggetti` (un solo oggetto in primo piano alla volta).
 */
export function Banco() {
  const gambe: [number, number][] = [-1, 1].flatMap((sx) => [-1, 1].map((sz): [number, number] => [sx * (BANCO.largo / 2 - 0.15), BANCO.z + sz * (BANCO.profondo / 2 - 0.12)]))

  return (
    <group>
      <mesh position={[0, BANCO.y - SPESSORE / 2, BANCO.z]}>
        <boxGeometry args={[BANCO.largo, SPESSORE, BANCO.profondo]} />
        <meshStandardMaterial color="#d9d3c4" roughness={0.9} />
      </mesh>
      {gambe.map(([x, z]) => (
        <mesh key={`${x}:${z}`} position={[x, BANCO.y - SPESSORE - GAMBA / 2, z]}>
          <boxGeometry args={[0.08, GAMBA, 0.08]} />
          <meshStandardMaterial color="#3a3733" roughness={0.7} />
        </mesh>
      ))}
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

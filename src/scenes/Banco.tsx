import { useState } from 'react'
import { edizioniVisibili } from '../lib/edizioni'
import { useScene } from '../state/useScene'
import { Libro } from '../three/Libro'
import { BANCO } from '../three/mondo'
import { Rullino } from '../three/Rullino'

const SPESSORE = 0.08
const GAMBA = BANCO.y - SPESSORE + 1.5

/** In v1 non ci sono ancora collezioni fotografiche: tre rullini segnaposto, tutti «in arrivo». */
const rullini = [
  { id: 'rullino-1', etichetta: 'in arrivo', colore: '#d9a520', x: 1.05, z: 2.2, giro: 0.5 },
  { id: 'rullino-2', etichetta: 'in arrivo', colore: '#2f6f4f', x: 1.5, z: 2.5, giro: -0.9 },
  { id: 'rullino-3', etichetta: 'in arrivo', colore: '#3a3a3a', x: 1.85, z: 2.05, giro: 2.2 },
]

/** Finché non ci sono fanzine vere, due copertine mute tengono il posto sullo scaffale. */
function Segnaposto({ x, z, giro, colore }: { x: number; z: number; giro: number; colore: string }) {
  return (
    <mesh position={[x, BANCO.y + 0.011, z]} rotation={[0, giro, 0]}>
      <boxGeometry args={[0.42, 0.022, 0.594]} />
      <meshStandardMaterial color={colore} roughness={0.8} />
    </mesh>
  )
}

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
 * Il banco davanti al muro: a sinistra le fanzine (`/edizioni`), a destra i rullini (`/fotografia`).
 * Fanzine e rullini sono oggetti che si prendono; il tavolo fa da sfondo e lascia passare lo scorrimento.
 */
export function Banco() {
  const suFotografia = useScene((s) => s.percorso === '/fotografia')
  const [aperto, setAperto] = useState<string | null>(null)
  // Uscendo da Fotografia il rullino in mano torna sul banco (stato derivato dalla route, aggiornato in render).
  if (!suFotografia && aperto !== null) setAperto(null)

  const gambe: [number, number][] = [-1, 1].flatMap((sx) => [-1, 1].map((sz): [number, number] => [sx * (BANCO.largo / 2 - 0.15), BANCO.z + sz * (BANCO.profondo / 2 - 0.12)]))
  const passo = 0.56
  const x0 = -0.9 - ((edizioniVisibili.length - 1) * passo) / 2

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
      {edizioniVisibili.length === 0 ? (
        <>
          <Segnaposto x={-1.2} z={2.15} giro={0.12} colore="#2d6a4f" />
          <Segnaposto x={-0.6} z={2.35} giro={-0.2} colore="#b23a3a" />
        </>
      ) : (
        edizioniVisibili.map((e, i) => <Libro key={e.id} edizione={e} x={x0 + i * passo} z={2.25 + (i % 2) * 0.12} giro={i % 2 ? -0.16 : 0.1} />)
      )}
      <Attrezzi />
      {rullini.map((r) => (
        <Rullino key={r.id} {...r} aperto={aperto === r.id} onApri={setAperto} />
      ))}
    </group>
  )
}

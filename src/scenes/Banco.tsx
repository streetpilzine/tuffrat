/** Il banco davanti al muro: in fase 3a ospita lo scaffale delle fanzine. Per ora un tavolo e due zine a segnare il posto. */
export function Banco() {
  const gambe: [number, number][] = [
    [-1.55, 1.55],
    [1.55, 1.55],
    [-1.55, 2.85],
    [1.55, 2.85],
  ]
  return (
    <group>
      <mesh position={[0, -0.6, 2.2]}>
        <boxGeometry args={[3.4, 0.08, 1.4]} />
        <meshStandardMaterial color="#d9d3c4" roughness={0.9} />
      </mesh>
      {gambe.map(([x, z]) => (
        <mesh key={`${x}:${z}`} position={[x, -1.07, z]}>
          <boxGeometry args={[0.08, 0.86, 0.08]} />
          <meshStandardMaterial color="#3a3733" roughness={0.7} />
        </mesh>
      ))}
      <mesh position={[-0.6, -0.545, 2.1]} rotation={[0, 0.12, 0]}>
        <boxGeometry args={[0.6, 0.02, 0.85]} />
        <meshStandardMaterial color="#2d6a4f" roughness={0.8} />
      </mesh>
      <mesh position={[0.5, -0.545, 2.35]} rotation={[0, -0.2, 0]}>
        <boxGeometry args={[0.6, 0.02, 0.85]} />
        <meshStandardMaterial color="#b23a3a" roughness={0.8} />
      </mesh>
    </group>
  )
}

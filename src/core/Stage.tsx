import { Canvas } from '@react-three/fiber'
import { Suspense } from 'react'
import { CameraRig } from './CameraRig'
import { Muro } from '../scenes/Muro'
import { Banco } from '../scenes/Banco'
import { BioWall } from '../scenes/BioWall'
import { LucePuntatore } from '../three/LucePuntatore'

/**
 * Canvas R3F persistente (ARCHITECTURE §7). Un solo mondo: muro, banco e angolo bio
 * sono sempre montati, è la camera che si sposta. `frameloop="demand"`: in idle non
 * si renderizza nulla, i tween della camera chiamano `invalidate`.
 * Caricato con `lazy()` dal Layout solo in modo 3D: il chunk three resta fuori dal bundle iniziale.
 */
export default function Stage() {
  return (
    <div className="stage" aria-hidden="true">
      <Canvas
        frameloop="demand"
        dpr={[1, 1.5]}
        camera={{ fov: 38, near: 0.1, far: 80, position: [0, 1.3, 8.2] }}
        gl={{ antialias: true, powerPreference: 'high-performance', alpha: false }}
        onCreated={({ gl }) => gl.setClearColor('#f7f7f5')}
      >
        <CameraRig />
        <LucePuntatore />
        <ambientLight intensity={0.9} />
        <hemisphereLight args={['#ffffff', '#cfcac0', 0.6]} />
        <directionalLight position={[3, 7, 6]} intensity={1.8} />
        <Suspense fallback={null}>
          <Muro />
          <Banco />
          <BioWall />
        </Suspense>
      </Canvas>
    </div>
  )
}

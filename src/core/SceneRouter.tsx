import { useEffect } from 'react'
import { useLocation } from 'react-router'
import { useScene } from '../state/useScene'

/**
 * Lato DOM del SceneRouter: traduce la route in scena + target camera nello store.
 * Il contesto del router non attraversa il root del Canvas, perciò il tween vive in `CameraRig`
 * e qui si scrive solo lo stato. Back/forward e refresh passano di qui come qualsiasi navigazione.
 */
export function SceneRouter() {
  const { pathname } = useLocation()
  const vaiA = useScene((s) => s.vaiA)
  useEffect(() => {
    vaiA(pathname)
  }, [pathname, vaiA])
  return null
}

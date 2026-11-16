import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { useOggetti } from '../state/useOggetti'
import { useScene } from '../state/useScene'
import { percorsoDiRitorno, registraNavigate } from './ponte'

/**
 * Lato DOM del SceneRouter: traduce la route in scena + target camera nello store e registra `navigate`
 * nel ponte usato dagli oggetti 3D. Il contesto del router non attraversa il root del Canvas, perciò
 * il tween vive in `CameraRig` e qui si scrive solo lo stato. Back/forward e refresh passano di qui.
 */
export function SceneRouter() {
  const { pathname, search, hash } = useLocation()
  const navigate = useNavigate()
  const vaiA = useScene((s) => s.vaiA)

  useEffect(() => {
    vaiA(pathname, search, hash)
  }, [pathname, search, hash, vaiA])

  useEffect(() => {
    registraNavigate(navigate)
    return () => registraNavigate(null)
  }, [navigate])

  // Esc: rimette a posto l'oggetto in primo piano (rullino, ritratto girato, TV), poi l'opera in primo piano, poi chiude la scheda.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || e.defaultPrevented) return
      if (document.querySelector('dialog[open], .flipbook-overlay, .tagintro')) return
      const { fuoco, schedaAperta, setScheda } = useScene.getState()
      if (document.documentElement.dataset.vista !== '3d') return
      const { primoPiano, setPrimoPiano } = useOggetti.getState()
      if (primoPiano) setPrimoPiano(null)
      else if (fuoco) void navigate(percorsoDiRitorno(fuoco))
      else if (schedaAperta) setScheda(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [navigate])

  return null
}

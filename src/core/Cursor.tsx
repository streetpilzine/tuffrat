import { useEffect, useRef, useState, type JSX } from 'react'
import { EASE_TUFFRAT, gsap } from './motion/ease'
import { CURSOR_KINDS, cursorPerElemento, useCursor, type CursorKind } from '../state/useCursor'

const ICONE: Record<CursorKind, JSX.Element> = {
  default: (
    <svg viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="6" />
    </svg>
  ),
  marker: (
    <svg viewBox="0 0 24 24">
      <path d="M5 21l2.2-6.6L16.4 3a1.6 1.6 0 0 1 2.3 0l2.3 2.3a1.6 1.6 0 0 1 0 2.3L11.8 16.8 5 21z" />
    </svg>
  ),
  hand: (
    <svg viewBox="0 0 24 24">
      <path d="M8 12V5.5a1.5 1.5 0 0 1 3 0V11h1V3.5a1.5 1.5 0 0 1 3 0V11h1V5.5a1.5 1.5 0 0 1 3 0V14c0 4-2.5 7-6.5 7-2.6 0-4.3-1.1-5.6-3.2L4.4 13a1.5 1.5 0 0 1 2.5-1.6L8 12z" />
    </svg>
  ),
  spray: (
    <svg viewBox="0 0 24 24">
      <path d="M9 7h6a1 1 0 0 1 1 1v12a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2V8a1 1 0 0 1 1-1zm1.5-4h3v3h-3V3z" />
      <circle cx="18.5" cy="4" r="1" />
      <circle cx="21" cy="6.5" r="1" />
      <circle cx="20" cy="2" r="0.8" />
    </svg>
  ),
  grab: (
    <svg viewBox="0 0 24 24">
      <path d="M7 10.5a1.5 1.5 0 0 1 3 0V12h1v-2a1.5 1.5 0 0 1 3 0v2h1v-1.5a1.5 1.5 0 0 1 3 0V15c0 3.6-2.4 6-6 6-2.4 0-4-1-5.2-2.8l-1.6-2.6a1.4 1.4 0 0 1 2.2-1.7l.6.7v-4.1z" />
    </svg>
  ),
}

/**
 * Cursore contestuale (ARCHITECTURE §7): solo con puntatore fine, mai su touch, montato solo in modo 3D.
 * Segue il puntatore con `quickTo`; la forma si deduce dall'elemento sotto il puntatore o da `data-cursor`.
 */
export default function Cursor() {
  const ref = useRef<HTMLDivElement>(null)
  const kind = useCursor((s) => s.kind)
  const [fine, setFine] = useState(() => window.matchMedia('(pointer: fine)').matches)

  useEffect(() => {
    const mq = window.matchMedia('(pointer: fine)')
    const onChange = (e: MediaQueryListEvent) => setFine(e.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  useEffect(() => {
    const el = ref.current
    if (!fine || !el) return
    const root = document.documentElement
    root.classList.add('cursor-custom')
    const xTo = gsap.quickTo(el, 'x', { duration: 0.2, ease: EASE_TUFFRAT })
    const yTo = gsap.quickTo(el, 'y', { duration: 0.2, ease: EASE_TUFFRAT })
    let visibile = false
    const set = useCursor.getState().set

    const onMove = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return
      if (!visibile) {
        gsap.set(el, { x: e.clientX, y: e.clientY })
        el.classList.add('is-visible')
        visibile = true
      }
      xTo(e.clientX)
      yTo(e.clientY)
      set(cursorPerElemento(e.target as Element))
    }
    const onOut = (e: PointerEvent) => {
      if (e.relatedTarget === null) {
        el.classList.remove('is-visible')
        visibile = false
      }
    }
    const onDown = () => el.classList.add('is-down')
    const onUp = () => el.classList.remove('is-down')

    window.addEventListener('pointermove', onMove, { passive: true })
    document.addEventListener('pointerout', onOut)
    window.addEventListener('pointerdown', onDown)
    window.addEventListener('pointerup', onUp)
    return () => {
      root.classList.remove('cursor-custom')
      window.removeEventListener('pointermove', onMove)
      document.removeEventListener('pointerout', onOut)
      window.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointerup', onUp)
      set('default')
    }
  }, [fine])

  if (!fine) return null
  return (
    <div ref={ref} className={`cursor cursor--${kind}`} aria-hidden="true" data-kinds={CURSOR_KINDS.length}>
      <div className="cursor__icon">{ICONE[kind]}</div>
    </div>
  )
}

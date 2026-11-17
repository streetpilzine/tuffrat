import type { ThreeEvent } from '@react-three/fiber'
import { useRef } from 'react'
import { useCursor, type CursorKind } from '../state/useCursor'

/**
 * Stato condiviso dei gesti sul Canvas: quando un oggetto 3D ha preso il puntatore, il muro non scorre.
 * `avviaPan` lo imposta il CameraRig: un oggetto che rifiuta il drag gli passa il gesto.
 */
export const presa = {
  attiva: false,
  avviaPan: null as null | ((e: PointerEvent) => void),
  /** Pinch a due dita sul muro, in corso o appena finito con un dito ancora giù (lo scrive il CameraRig, solo sul telefono): finché vale, gli oggetti ignorano i puntatori, così il rilascio delle dita non diventa un click. */
  pinch: false,
  /** Annulla il gesto dell'oggetto che ha il puntatore, senza click né riaggancio a metà: lo chiama il CameraRig quando arriva il secondo dito. */
  annulla: null as null | (() => void),
}

const SOGLIA_PX = 6
/** Su touch il trascinamento di un oggetto parte solo dopo una pressione tenuta: un gesto rapido fa scorrere il muro. */
const TENUTA_TOUCH_MS = 280

type Evento = ThreeEvent<PointerEvent>

interface Opzioni {
  /** Forma del cursore in hover. */
  cursore?: CursorKind
  onClick?: (e: Evento) => void
  /** Ritorna `false` per rifiutare il drag: il gesto passa allo scorrimento del muro. */
  onDragStart?: (e: Evento) => boolean | void
  onDrag?: (e: Evento) => void
  onDragEnd?: (e: Evento) => void
  onHover?: (sopra: boolean) => void
}

/**
 * Click contro drag per un oggetto R3F (il ciclo riposo → afferra → rilascia di PhysicalObject).
 * Ritorna gli handler da spargere sul mesh o sul gruppo.
 */
export function useGesto(o: Opzioni) {
  const st = useRef({ giu: false, drag: false, x: 0, y: 0, t: 0, sopra: false })

  const setTre = (k: CursorKind | null) => useCursor.getState().setTre(k)
  const rilascia = (e: Evento) => {
    const el = e.target as unknown as { releasePointerCapture?: (id: number) => void }
    try {
      el.releasePointerCapture?.(e.pointerId)
    } catch {
      /* cattura già persa */
    }
  }

  return {
    onPointerDown: (e: Evento) => {
      if (e.button !== 0) return
      e.stopPropagation()
      if (presa.pinch) return
      presa.attiva = true
      st.current = { ...st.current, giu: true, drag: false, x: e.clientX, y: e.clientY, t: performance.now() }
      const el = e.target as unknown as { setPointerCapture?: (id: number) => void }
      el.setPointerCapture?.(e.pointerId)
      presa.annulla = () => {
        const s = st.current
        if (s.drag) o.onDragEnd?.(e)
        s.giu = false
        s.drag = false
        rilascia(e)
        presa.attiva = false
        setTre(null)
      }
    },
    onPointerMove: (e: Evento) => {
      const s = st.current
      if (!s.giu) return
      e.stopPropagation()
      if (!s.drag) {
        if (Math.hypot(e.clientX - s.x, e.clientY - s.y) <= SOGLIA_PX) return
        const troppoPresto = e.pointerType === 'touch' && performance.now() - s.t < TENUTA_TOUCH_MS
        const accettato = !troppoPresto && !!o.onDrag && o.onDragStart?.(e) !== false
        if (!accettato) {
          // Il gesto diventa scorrimento del muro.
          s.giu = false
          rilascia(e)
          presa.attiva = false
          presa.avviaPan?.(e.nativeEvent)
          return
        }
        s.drag = true
        setTre('grab')
      }
      o.onDrag?.(e)
    },
    onPointerUp: (e: Evento) => {
      const s = st.current
      if (!s.giu) return
      e.stopPropagation()
      s.giu = false
      presa.annulla = null
      rilascia(e)
      if (s.drag) o.onDragEnd?.(e)
      else o.onClick?.(e)
      s.drag = false
      setTre(s.sopra ? (o.cursore ?? 'hand') : null)
    },
    onPointerCancel: (e: Evento) => {
      const s = st.current
      if (s.giu) presa.annulla = null
      if (s.drag) o.onDragEnd?.(e)
      s.giu = false
      s.drag = false
      setTre(null)
    },
    onPointerOver: (e: Evento) => {
      e.stopPropagation()
      st.current.sopra = true
      if (!st.current.drag) setTre(o.cursore ?? 'hand')
      o.onHover?.(true)
    },
    onPointerOut: () => {
      st.current.sopra = false
      if (!st.current.drag) setTre(null)
      o.onHover?.(false)
    },
  }
}

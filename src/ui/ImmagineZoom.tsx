import { useCallback, useEffect, useRef, useState, type MouseEvent as MouseEventReact, type PointerEvent } from 'react'
import { QUERY_MOBILE } from '../core/mobile'
import { usePrefs } from '../state/usePrefs'
import { fraDita, limitaVista, pinchVista, SCALA_MAX, SCALA_MIN, vistaDoppioTocco, type Punto, type RiferimentoPinch, type Vista } from './logica/zoom'

interface Props {
  src: string
  alt: string
  width: number
  height: number
  loading?: 'lazy' | 'eager'
}

interface Gesto {
  /** Dita attive in questo riquadro (il pinch nasce qui; il dito che scorre la scheda nasce fuori). */
  dita: Map<number, Punto>
  /** Trascinamento a un dito con l'immagine ingrandita. */
  presa: { x: number; y: number; vista: Vista } | null
  /** Riferimento del pinch, dalla partenza del secondo dito. */
  rif: RiferimentoPinch | null
  /** Ultimo tocco (per il doppio tocco): istante e posizione. */
  ultimo: { t: number; x: number; y: number } | null
  mosso: boolean
}

const INTERA: Vista = { s: SCALA_MIN, x: 0, y: 0 }

/**
 * Immagine che si ingrandisce da sola, dentro il suo riquadro: due dita per il pinch, un dito per trascinare
 * quando è ingrandita, doppio tocco per tornare alla misura intera. Il pinch nasce qui e non arriva al browser,
 * quindi la pagina (e la scheda) non zoomano. Il riquadro ha la proporzione dell'immagine, che così si vede per
 * intera senza scorrere; l'ingrandimento non esce dal riquadro. Gentile col mouse: in vista lista il doppio
 * click funziona anche lì, e la rotella ingrandisce.
 */
export function ImmagineZoom({ src, alt, width, height, loading = 'eager' }: Props) {
  const box = useRef<HTMLDivElement>(null)
  const img = useRef<HTMLImageElement>(null)
  const vista = useRef<Vista>({ ...INTERA })
  const gesto = useRef<Gesto>({ dita: new Map(), presa: null, rif: null, ultimo: null, mosso: false })
  const medie = useRef(0)
  const [ingrandita, setIngrandita] = useState(false)
  /** Con un tocco sopra il riquadro la scheda resta ferma (touch-action: none), come per il pinch; a riposo fitta. */
  const [blocco, setBlocco] = useState(false)
  const reducedMotion = usePrefs((s) => s.reducedMotion)

  /** Scrive la vista sull'immagine; `secco` toglie la transizione (col dito addosso il transform segue il gesto). */
  const applica = useCallback((v: Vista, secco = false) => {
    const el = img.current
    const riquadro = box.current
    if (!el || !riquadro) return
    // Se il riquadro ha cambiato misura (telefono girato), lo spostamento si riporta ai limiti nuovi.
    const larghezza = riquadro.offsetWidth
    if (medie.current !== larghezza && larghezza > 0) {
      const alta = riquadro.offsetHeight
      v = limitaVista(v.s, v.x, v.y, larghezza, alta)
      medie.current = larghezza
    }
    vista.current = v
    el.classList.toggle('is-secco', secco)
    el.style.transform = `translate3d(${v.x}px, ${v.y}px, 0) scale(${v.s})`
    const ora = v.s > SCALA_MIN + 0.01
    if (ora !== ingrandita) setIngrandita(ora)
  }, [ingrandita])

  /** Misura del riquadro e centro in coordinate della pagina. */
  const misura = () => {
    const r = box.current?.getBoundingClientRect()
    return r ? { w: r.width, h: r.height, cx: r.left + r.width / 2, cy: r.top + r.height / 2 } : null
  }

  const conLimiti = useCallback(
    (v: Vista, secco: boolean) => {
      const m = misura()
      applica(m ? limitaVista(v.s, v.x, v.y, m.w, m.h) : v, secco)
    },
    [applica],
  )

  /** Doppio tocco (o doppio click): ingrandisce sul punto toccato, oppure torna alla misura intera. */
  const alterna = (x: number, y: number) => {
    const m = misura()
    if (!m) return
    // Punto toccato rispetto al centro del riquadro.
    const punto = { x: x - m.cx, y: y - m.cy }
    const v = vistaDoppioTocco(vista.current, punto, m)
    if (v.s > SCALA_MIN + 0.01) return conLimiti({ s: v.s, x: -punto.x * (v.s - 1), y: -punto.y * (v.s - 1) }, reducedMotion)
    conLimiti(v, reducedMotion)
  }

  const onDown = (e: PointerEvent<HTMLDivElement>) => {
    const g = gesto.current
    // Si prende il puntatore per seguire il pinch anche con le dita fuori dal riquadro.
    e.currentTarget.setPointerCapture(e.pointerId)
    if (g.dita.size === 0) {
      g.mosso = false
      setBlocco(true)
    }
    g.dita.set(e.pointerId, { x: e.clientX, y: e.clientY })
    if (g.dita.size === 1) g.presa = vista.current.s > SCALA_MIN + 0.01 ? { x: e.clientX, y: e.clientY, vista: { ...vista.current } } : null
  }

  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    const g = gesto.current
    const p = g.dita.get(e.pointerId)
    if (!p) return
    const prima = g.dita.size
    p.x = e.clientX
    p.y = e.clientY
    const dita = [...g.dita.values()]
    const m = misura()
    if (dita.length >= 2 && m) {
      const f = fraDita(dita[0], dita[1])
      if (!g.rif || prima < 2) {
        g.rif = { ...vista.current, d: Math.max(f.d, 1), fx: f.x, fy: f.y, cx: m.cx, cy: m.cy }
        return
      }
      g.mosso = true
      conLimiti(pinchVista(g.rif, f), true)
      return
    }
    g.rif = null
    if (!g.presa) return
    const dx = e.clientX - g.presa.x
    const dy = e.clientY - g.presa.y
    if (!g.mosso && Math.hypot(dx, dy) < 6) return
    g.mosso = true
    conLimiti({ s: g.presa.vista.s, x: g.presa.vista.x + dx, y: g.presa.vista.y + dy }, true)
  }

  const onUp = (e: PointerEvent<HTMLDivElement>) => {
    const g = gesto.current
    const p = g.dita.get(e.pointerId)
    if (!p) return
    g.dita.delete(e.pointerId)
    g.rif = null
    if (g.dita.size === 0) {
      g.presa = null
      setBlocco(false)
    }
    if (g.mosso) {
      if (g.dita.size === 0) g.mosso = false
      return
    }
    const ora = performance.now()
    if (g.ultimo && ora - g.ultimo.t < 320 && Math.hypot(p.x - g.ultimo.x, p.y - g.ultimo.y) < 30) {
      g.ultimo = null
      alterna(p.x, p.y)
    } else {
      g.ultimo = { t: ora, x: p.x, y: p.y }
    }
  }

  const onCancel = (e: PointerEvent<HTMLDivElement>) => {
    const g = gesto.current
    g.dita.delete(e.pointerId)
    g.rif = null
    g.mosso = false
    if (g.dita.size === 0) {
      g.presa = null
      setBlocco(false)
    }
  }

  const onDblClick = (e: MouseEventReact<HTMLDivElement>) => {
    // Su touch il doppio tocco lo gestisce onUp; qui solo il mouse (vista lista o simulato).
    if (e.detail === 2) alterna(e.clientX, e.clientY)
  }

  // Rotella col mouse: ingrandisce sul puntatore, fuori dal touch (dove non passa il gesto).
  useEffect(() => {
    const el = box.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      if (window.matchMedia(QUERY_MOBILE).matches) return
      e.preventDefault()
      const m = misura()
      if (!m) return
      const s = Math.min(SCALA_MAX, Math.max(SCALA_MIN, vista.current.s * Math.exp(-e.deltaY * 0.002)))
      const k = s / vista.current.s
      const ax = e.clientX - m.cx
      const ay = e.clientY - m.cy
      conLimiti({ s, x: vista.current.x + ax - ax * k, y: vista.current.y + ay - ay * k }, true)
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [conLimiti])

  return (
    <div
      ref={box}
      className={`zoom${ingrandita ? ' is-ingrandita' : ''}${blocco ? ' is-blocco' : ''}`}
      style={{ aspectRatio: `${width} / ${height}` }}
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={onCancel}
      onDoubleClick={onDblClick}
    >
      <img ref={img} src={src} alt={alt} width={width} height={height} loading={loading} draggable={false} />
      <p className="sr-only">Due dita per ingrandire; con l’immagine ingrandita trascina per spostarla, doppio tocco per tornare alla misura intera.</p>
    </div>
  )
}

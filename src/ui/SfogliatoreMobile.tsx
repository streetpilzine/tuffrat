import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type PointerEvent as EventoPuntatore, type RefObject } from 'react'
import { flushSync } from 'react-dom'
import { angoloFoglio, avanzamento, descriviPagine, MOBILE, paginaMobile, rilascio, scenaMobile, versoScena } from './logica/sfogliatore'
import './sfogliatore-mobile.css'

interface Props {
  pagine: string[]
  altPagine: string[]
  titolo: string
  /** Larghezza / altezza di una pagina (le StreetPIL sono 3:2). */
  proporzione: number
  ridottoMovimento: boolean
  /** Pulsante di chiusura: `FlipBook` ci porta il focus all'apertura. */
  chiudiRef: RefObject<HTMLButtonElement | null>
  onClose: () => void
}

type Ruolo = 'precedente' | 'corrente' | 'successiva'
type Esito = -1 | 0 | 1

interface Gesto {
  id: number
  x0: number
  t0: number
  mosso: boolean
  campioni: { x: number; t: number }[]
}

const leggiViewport = () => ({ larghezza: window.innerWidth, altezza: window.innerHeight })
/** Uscita morbida dei tween del foglio (vicina alla curva del sito). Niente GSAP qui: lo sfogliatore vive anche in vista lista, dove il chunk di GSAP non è caricato. */
const frena = (t: number) => 1 - (1 - t) ** 4
const gradi = (a: number) => (a * Math.PI) / 180

/**
 * Sfogliatore mobile di una fanzine: una pagina alla volta, sempre in orizzontale. Con il telefono in verticale la scena è girata di 90° (vedi `scenaMobile`), la didascalia sta in una colonna stretta a sinistra della pagina e la pagina prende tutta l'altezza.
 * Lo sfoglio segue il dito: trascinando verso la rilegatura la pagina corrente si alza ruotando attorno al bordo sinistro e scopre la successiva; trascinando verso il bordo libero è la precedente a scendere sopra la corrente. Al rilascio completa o torna a posto (`rilascio`). Un tocco sulla metà destra o sinistra della pagina sfoglia senza trascinare, come le frecce da tastiera.
 * Tre pagine nel DOM (precedente, corrente, successiva), con chiave sull'indice: allo sfoglio React sposta i nodi e le immagini già caricate non lampeggiano.
 */
export function SfogliatoreMobile({ pagine, altPagine, titolo, proporzione, ridottoMovimento, chiudiRef, onClose }: Props) {
  const totale = pagine.length
  const [indice, setIndice] = useState(0)
  const [viewport, setViewport] = useState(leggiViewport)
  const [spazio, setSpazio] = useState({ larghezza: 0, altezza: 0 })
  const scena = scenaMobile(viewport)
  const pagina = paginaMobile(proporzione, spazio)

  const area = useRef<HTMLDivElement>(null)
  const libro = useRef<HTMLDivElement>(null)
  const fogli = useRef<Record<Ruolo, HTMLDivElement | null>>({ precedente: null, corrente: null, successiva: null })
  const gesto = useRef<Gesto | null>(null)
  /** Valori correnti per gli handler e per i tween: avanzamento dello sfoglio (`p`), animazione in corso e sua meta. */
  const vivo = useRef({ indice: 0, totale, larghezza: 0, ruotata: scena.ruotata, corto: scena.corto, ridotto: ridottoMovimento, p: 0, raf: 0, meta: 0 as Esito })

  /** Scrive lo stato dello sfoglio sulle tre pagine: `p` > 0 la corrente si alza, `p` < 0 la precedente scende. */
  const applica = useCallback((p: number) => {
    const s = vivo.current
    s.p = p
    const { precedente, corrente, successiva } = fogli.current
    const prospettiva = `perspective(${Math.max(1, Math.round(s.larghezza * MOBILE.prospettiva))}px)`
    const velo = (el: HTMLDivElement, v: number) => {
      const figlio = el.lastElementChild as HTMLElement | null
      if (figlio) figlio.style.opacity = v.toFixed(3)
    }
    if (corrente) {
      const a = p > 0 ? angoloFoglio(p) : 0
      corrente.style.transform = a ? `${prospettiva} rotateY(${(-a).toFixed(2)}deg)` : ''
      corrente.style.visibility = 'visible'
      velo(corrente, p > 0 ? 0.3 * Math.sin(gradi(a)) : Math.min(0.3, -p * 0.45))
    }
    if (successiva) {
      successiva.style.transform = ''
      successiva.style.visibility = p > 0 ? 'visible' : 'hidden'
      velo(successiva, p > 0 ? 0.4 * (1 - p) : 0)
    }
    if (precedente) {
      const a = angoloFoglio(1 + Math.min(0, p))
      precedente.style.transform = `${prospettiva} rotateY(${(-a).toFixed(2)}deg)`
      precedente.style.visibility = p < 0 ? 'visible' : 'hidden'
      velo(precedente, p < 0 ? 0.3 * Math.sin(gradi(a)) : 0)
    }
  }, [])

  const ferma = useCallback(() => {
    cancelAnimationFrame(vivo.current.raf)
    vivo.current.raf = 0
  }, [])

  /** Fine di uno sfoglio: cambia pagina (subito, così i tre fogli sono già quelli nuovi) e rimette tutto disteso. */
  const concludi = useCallback(
    (esito: Esito) => {
      const s = vivo.current
      if (esito !== 0) {
        s.indice += esito
        flushSync(() => setIndice(s.indice))
      }
      applica(0)
    },
    [applica],
  )

  /** Porta lo sfoglio da dove si trova alla meta (0 = torna a posto) e conclude. */
  const anima = useCallback(
    (meta: Esito, durata: number) => {
      const s = vivo.current
      ferma()
      const da = s.p
      if (s.ridotto || da === meta) {
        concludi(meta)
        return
      }
      const t0 = performance.now()
      s.meta = meta
      const passo = (ora: number) => {
        const t = Math.min(1, (ora - t0) / durata)
        applica(da + (meta - da) * frena(t))
        if (t < 1) s.raf = requestAnimationFrame(passo)
        else {
          s.raf = 0
          concludi(meta)
        }
      }
      s.raf = requestAnimationFrame(passo)
    },
    [applica, concludi, ferma],
  )

  /** Uno sfoglio in corso si chiude subito sulla sua meta: un gesto nuovo parte sempre da pagine distese. */
  const chiudiAnimazione = useCallback(() => {
    const s = vivo.current
    if (!s.raf) return
    ferma()
    concludi(s.meta)
  }, [concludi, ferma])

  /** Sfoglia di una pagina senza trascinare (tocco su una metà, frecce). Ai capi del libro il foglio accenna e torna. */
  const vai = useCallback(
    (verso: 1 | -1) => {
      const s = vivo.current
      chiudiAnimazione()
      const alCapo = verso > 0 ? s.indice >= s.totale - 1 : s.indice <= 0
      if (!alCapo) {
        anima(verso, 420)
        return
      }
      if (s.ridotto) return
      const t0 = performance.now()
      s.meta = 0
      const passo = (ora: number) => {
        const t = Math.min(1, (ora - t0) / 280)
        applica(verso * 0.05 * Math.sin(Math.PI * t))
        if (t < 1) s.raf = requestAnimationFrame(passo)
        else {
          s.raf = 0
          applica(0)
        }
      }
      s.raf = requestAnimationFrame(passo)
    },
    [anima, applica, chiudiAnimazione],
  )

  // Valori correnti per handler e tween; a ogni cambio di pagina o di misure i fogli tornano distesi.
  useLayoutEffect(() => {
    Object.assign(vivo.current, { indice, totale, larghezza: pagina.larghezza, ruotata: scena.ruotata, corto: scena.corto, ridotto: ridottoMovimento })
    gesto.current = null
    applica(0)
  }, [indice, totale, pagina.larghezza, scena.ruotata, scena.corto, ridottoMovimento, applica])

  // Lo spazio a destra della colonna (misura di layout: la rotazione della scena non la cambia).
  useEffect(() => {
    const el = area.current
    if (!el) return
    const misura = () => setSpazio((v) => (v.larghezza === el.clientWidth && v.altezza === el.clientHeight ? v : { larghezza: el.clientWidth, altezza: el.clientHeight }))
    misura()
    const ro = new ResizeObserver(misura)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    const ricalcola = () => setViewport(leggiViewport())
    window.addEventListener('resize', ricalcola)
    // iOS: l'area visibile cambia senza `resize` della finestra quando compare o sparisce la barra del browser.
    window.visualViewport?.addEventListener('resize', ricalcola)
    return () => {
      window.removeEventListener('resize', ricalcola)
      window.visualViewport?.removeEventListener('resize', ricalcola)
    }
  }, [])

  // Frecce da tastiera (Esc lo gestisce `FlipBook`).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'PageDown') vai(1)
      else if (e.key === 'ArrowLeft' || e.key === 'PageUp') vai(-1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [vai])

  // Le pagine appena oltre le tre montate si scaricano in anticipo, così uno sfoglio veloce non trova un foglio vuoto.
  useEffect(() => {
    for (const i of [indice + 2, indice - 2]) {
      if (i < 0 || i >= pagine.length) continue
      const img = new Image()
      img.decoding = 'async'
      img.src = pagine[i]
    }
  }, [indice, pagine])

  useEffect(() => ferma, [ferma])

  /** Ascissa del puntatore lungo la pagina (nel sistema della scena, anche quando è girata). */
  const ascissa = (e: EventoPuntatore) => versoScena({ x: e.clientX, y: e.clientY }, vivo.current).x

  const onPointerDown = (e: EventoPuntatore<HTMLDivElement>) => {
    if (e.button !== 0 || gesto.current) return
    if (e.target instanceof Element && e.target.closest('.sfoglia__colonna')) return
    chiudiAnimazione()
    const x = ascissa(e)
    const ora = performance.now()
    gesto.current = { id: e.pointerId, x0: x, t0: ora, mosso: false, campioni: [{ x, t: ora }] }
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  const onPointerMove = (e: EventoPuntatore<HTMLDivElement>) => {
    const g = gesto.current
    if (!g || e.pointerId !== g.id) return
    const s = vivo.current
    const x = ascissa(e)
    const dx = x - g.x0
    if (!g.mosso && Math.abs(dx) < MOBILE.sogliaTocco) return
    g.mosso = true
    g.campioni.push({ x, t: performance.now() })
    if (g.campioni.length > 6) g.campioni.shift()
    const p = avanzamento(dx, s.larghezza, s.indice, s.totale)
    // Con movimento ridotto il foglio non segue il dito: conta solo il verso, la pagina cambia al rilascio.
    if (s.ridotto) s.p = p
    else applica(p)
  }

  const onPointerUp = (e: EventoPuntatore<HTMLDivElement>) => {
    const g = gesto.current
    if (!g || e.pointerId !== g.id) return
    gesto.current = null
    const s = vivo.current
    const ora = performance.now()
    if (!g.mosso) {
      // Tocco: la metà destra della pagina sfoglia avanti, la sinistra indietro. Fuori dalla pagina non succede nulla.
      if (ora - g.t0 > 600 || !area.current || !libro.current) return
      const sinistra = area.current.offsetLeft + libro.current.offsetLeft
      const x = ascissa(e) - sinistra
      if (x < 0 || x > s.larghezza) return
      vai(x > s.larghezza / 2 ? 1 : -1)
      return
    }
    const recenti = g.campioni.filter((c) => ora - c.t <= 120)
    const primo = recenti[0]
    const ultimo = recenti[recenti.length - 1]
    const velocita = primo && ultimo && ultimo.t > primo.t ? (ultimo.x - primo.x) / (ultimo.t - primo.t) : 0
    const esito = rilascio(s.p, velocita, s.indice, s.totale)
    anima(esito, Math.max(140, 380 * Math.abs(esito - s.p)))
  }

  const onPointerCancel = (e: EventoPuntatore<HTMLDivElement>) => {
    if (gesto.current?.id !== e.pointerId) return
    gesto.current = null
    anima(0, 200)
  }

  const stileScena: CSSProperties = {
    width: scena.lungo,
    height: scena.corto,
    transform: scena.ruotata ? `translateX(${scena.corto}px) rotate(90deg)` : undefined,
  }
  const visibili: [number, Ruolo][] = [
    [indice + 1, 'successiva'],
    [indice, 'corrente'],
    [indice - 1, 'precedente'],
  ]

  return (
    <div className="sfoglia" onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerCancel}>
      <div className={`sfoglia__scena${scena.ruotata ? ' is-ruotata' : ''}`} style={stileScena}>
        <aside className="sfoglia__colonna">
          <button ref={chiudiRef} type="button" className="sfoglia__chiudi" aria-label="Chiudi" onClick={onClose}>
            ×
          </button>
          <p className="sfoglia__titolo">{titolo}</p>
          <p className="sfoglia__contatore" aria-hidden="true">
            {indice + 1} / {totale}
          </p>
          <p className="sfoglia__descrizione" aria-live="polite" aria-atomic="true">
            {descriviPagine(totale, indice + 1, false, altPagine)}
          </p>
        </aside>
        <div className="sfoglia__area" ref={area}>
          <div className="sfoglia__libro" ref={libro} style={{ width: pagina.larghezza, height: pagina.altezza }}>
            {visibili
              .filter(([i]) => i >= 0 && i < totale)
              .map(([i, ruolo]) => (
                <div
                  key={i}
                  className={`sfoglia__pagina sfoglia__pagina--${ruolo}`}
                  aria-hidden={ruolo !== 'corrente'}
                  ref={(el) => {
                    fogli.current[ruolo] = el
                    return () => {
                      if (fogli.current[ruolo] === el) fogli.current[ruolo] = null
                    }
                  }}
                >
                  <img src={pagine[i]} alt={ruolo === 'corrente' ? (altPagine[i] ?? `Pagina ${i + 1}`) : ''} draggable={false} decoding="async" />
                  <span className="sfoglia__velo" />
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  )
}

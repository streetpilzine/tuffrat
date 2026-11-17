import { useLayoutEffect, useRef, type KeyboardEvent, type PointerEvent } from 'react'
import { Link } from 'react-router'
import { useMobile } from '../core/mobile'
import type { Polittico } from '../data'
import { misureLabel } from '../lib/format'
import { usePrefs } from '../state/usePrefs'

interface Props {
  polittico: Polittico
  /** Id dei pannelli nell'ordine corrente, da sinistra a destra (su telefono ignorato: vale `ordineDefault`). */
  ordine: string[]
  onReorder: (ordine: string[]) => void
}

type FlipState = { __flip: true }
interface Motore {
  from: (stato: FlipState) => void
  getState: (els: Element[]) => FlipState
}

/** GSAP e il plugin Flip si caricano al primo riordino: la vista lista non li paga finché non servono. */
let motore: Promise<Motore> | null = null
function caricaMotore(): Promise<Motore> {
  motore ??= Promise.all([import('../core/motion/ease'), import('gsap/Flip')]).then(([{ gsap, EASE_TUFFRAT }, { Flip }]) => {
    gsap.registerPlugin(Flip)
    return {
      getState: (els) => Flip.getState(els) as unknown as FlipState,
      from: (stato) => void Flip.from(stato as unknown as Parameters<typeof Flip.from>[0], { duration: 0.5, ease: EASE_TUFFRAT }),
    }
  })
  return motore
}

/**
 * Polittico piatto (ARCHITECTURE §7): pannelli complanari affiancati, nelle proporzioni reali.
 * L'ordine si cambia trascinando un pannello (mouse o touch), con le frecce ← → sul pannello a fuoco,
 * o con i due pulsanti sotto ogni pannello. Lo spostamento è animato con GSAP Flip, salvo reduced motion.
 * Su telefono l'ordine dei polittici del tè è quello definito dall'artista: i pannelli restano fermi
 * nell'ordine predefinito, senza trascinamento, frecce né pulsanti.
 */
export function Polyptych({ polittico, ordine, onReorder }: Props) {
  const lista = useRef<HTMLOListElement>(null)
  const reducedMotion = usePrefs((s) => s.reducedMotion)
  const mobile = useMobile()
  const inAttesa = useRef<{ stato: FlipState; m: Motore } | null>(null)
  const trascina = useRef<{ id: string; x: number; el: HTMLElement; mosso: boolean } | null>(null)
  const fuocoDopo = useRef<string | null>(null)
  const ordineMostrato = mobile ? polittico.ordineDefault : ordine
  const pannelli = ordineMostrato.map((id) => polittico.pannelli.find((p) => p.id === id)).filter((p) => !!p)

  const riordina = async (nuovo: string[]) => {
    if (nuovo.join() === ordine.join()) return
    if (!reducedMotion && lista.current) {
      const m = await caricaMotore()
      inAttesa.current = { stato: m.getState([...lista.current.children]), m }
    }
    onReorder(nuovo)
  }

  useLayoutEffect(() => {
    if (inAttesa.current) {
      inAttesa.current.m.from(inAttesa.current.stato)
      inAttesa.current = null
    }
    if (fuocoDopo.current) {
      lista.current?.querySelector<HTMLElement>(`[data-pannello="${fuocoDopo.current}"]`)?.focus()
      fuocoDopo.current = null
    }
  }, [ordine])

  const sposta = (id: string, passo: -1 | 1) => {
    const i = ordineMostrato.indexOf(id)
    const j = i + passo
    if (j < 0 || j >= ordineMostrato.length) return
    const nuovo = [...ordineMostrato]
    ;[nuovo[i], nuovo[j]] = [nuovo[j], nuovo[i]]
    fuocoDopo.current = id
    void riordina(nuovo)
  }

  const onKey = (e: KeyboardEvent, id: string) => {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      e.preventDefault()
      sposta(id, e.key === 'ArrowLeft' ? -1 : 1)
    }
  }

  const onDown = (e: PointerEvent<HTMLElement>, id: string) => {
    if (e.button !== 0) return
    trascina.current = { id, x: e.clientX, el: e.currentTarget, mosso: false }
    e.currentTarget.setPointerCapture(e.pointerId)
  }
  const onMove = (e: PointerEvent<HTMLElement>) => {
    const t = trascina.current
    if (!t) return
    const dx = e.clientX - t.x
    if (!t.mosso && Math.abs(dx) < 6) return
    t.mosso = true
    t.el.classList.add('is-preso')
    t.el.style.transform = `translateX(${dx}px)`
  }
  const onUp = () => {
    const t = trascina.current
    trascina.current = null
    if (!t) return
    t.el.classList.remove('is-preso')
    if (!t.mosso || !lista.current) return
    // Nuovo indice: quanti altri pannelli hanno il centro a sinistra del centro del pannello rilasciato.
    const centro = (el: Element) => {
      const r = el.getBoundingClientRect()
      return r.left + r.width / 2
    }
    const mio = centro(t.el)
    const altri = [...lista.current.querySelectorAll<HTMLElement>('[data-pannello]')].filter((el) => el !== t.el)
    const indice = altri.filter((el) => centro(el) < mio).length
    const nuovo = ordineMostrato.filter((id) => id !== t.id)
    nuovo.splice(indice, 0, t.id)
    const pulisci = () => {
      t.el.style.transform = ''
    }
    if (nuovo.join() === ordineMostrato.join()) return pulisci()
    // Lo stato Flip si cattura con il pannello ancora dov'è stato rilasciato, poi si toglie il transform.
    void (async () => {
      if (!reducedMotion) {
        const m = await caricaMotore()
        inAttesa.current = { stato: m.getState([...lista.current!.children]), m }
      }
      pulisci()
      onReorder(nuovo)
    })()
  }

  return (
    <ol className="polittico__pannelli" ref={lista} aria-label={`Pannelli di ${polittico.titolo}, in ordine da sinistra a destra`}>
      {pannelli.map((p, i) => (
        <li key={p.id} style={{ flex: `${p.misure.w} 1 0` }}>
          {mobile ? (
            <div className="polittico__pannello polittico__pannello--fermo" data-pannello={p.id}>
              <img src={p.immagine.src} alt={p.immagine.alt} width={p.immagine.width} height={p.immagine.height} loading="lazy" draggable={false} />
            </div>
          ) : (
            <div
              className="polittico__pannello"
              data-pannello={p.id}
              data-cursor="grab"
              tabIndex={0}
              role="group"
              aria-label={`${p.titolo}, posizione ${i + 1} di ${pannelli.length}. Frecce sinistra e destra per spostarlo.`}
              onKeyDown={(e) => onKey(e, p.id)}
              onPointerDown={(e) => onDown(e, p.id)}
              onPointerMove={onMove}
              onPointerUp={onUp}
              onPointerCancel={onUp}
            >
              <img src={p.immagine.src} alt={p.immagine.alt} width={p.immagine.width} height={p.immagine.height} loading="lazy" draggable={false} />
            </div>
          )}
          <p className="polittico__didascalia">
            <Link to={`/opere/${p.id}`}>{p.titolo}</Link> · {misureLabel(p.misure)}
          </p>
          {!mobile && (
            <div className="polittico__sposta">
              <button type="button" className="link" disabled={i === 0} aria-label={`Sposta ${p.titolo} a sinistra`} onClick={() => sposta(p.id, -1)}>
                ←
              </button>
              <button type="button" className="link" disabled={i === pannelli.length - 1} aria-label={`Sposta ${p.titolo} a destra`} onClick={() => sposta(p.id, 1)}>
                →
              </button>
            </div>
          )}
        </li>
      ))}
    </ol>
  )
}

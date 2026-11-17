/** Logica pura dell'ingrandimento di un'immagine nel suo riquadro (`ImmagineZoom`): limiti e pinch, senza DOM. */

/** Vista dell'immagine rispetto al centro del riquadro: trasformazione `translate(x, y) scale(s)`. */
export interface Vista {
  s: number
  x: number
  y: number
}

export interface Punto {
  x: number
  y: number
}

/** Riferimento di un pinch: vista, misura e punto di partenza delle due dita. */
export type RiferimentoPinch = Vista & { d: number; fx: number; fy: number; cx: number; cy: number }

export const SCALA_MIN = 1
export const SCALA_MAX = 4
export const SCALA_DOPPIO = 2.5

/** Tiene l'immagine dentro il riquadro: lo spostamento non supera (scala − 1) × metà della misura, scala in 1–4. */
export function limitaVista(s: number, x: number, y: number, w: number, h: number): Vista {
  const sx = Math.min(SCALA_MAX, Math.max(SCALA_MIN, s))
  const mx = (sx - 1) * (w / 2)
  const my = (sx - 1) * (h / 2)
  return { s: sx, x: Math.min(mx, Math.max(-mx, x)), y: Math.min(my, Math.max(-my, y)) }
}

/** Distanza e punto medio di due dita. */
export const fraDita = (a: Punto, b: Punto) => ({ d: Math.hypot(a.x - b.x, a.y - b.y), x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 })

/**
 * Vista dopo un pinch dal riferimento `rif` alle dita ora in `f`: il punto di partenza delle dita resta
 * fermo sull'immagine (se le dita chiudono sotto la scala minima il punto si sposta insieme a loro).
 */
export function pinchVista(rif: RiferimentoPinch, f: { d: number; x: number; y: number }): Vista {
  const s = Math.min(SCALA_MAX, Math.max(SCALA_MIN, rif.s * (Math.max(f.d, 1) / rif.d)))
  const k = s / rif.s
  const ax = rif.fx - rif.cx
  const ay = rif.fy - rif.cy
  const bx = f.x - rif.cx
  const by = f.y - rif.cy
  return { s, x: rif.x + bx - ax * k, y: rif.y + by - ay * k }
}

/**
 * Vista del doppio tocco: se l'immagine è ingrandita torna alla misura intera, altrimenti si ingrandisce sul
 * punto toccato. `punto` è rispetto al centro del riquadro; il punto resta fermo (x = −punto · (scala − 1)).
 */
export function vistaDoppioTocco(vista: Vista, punto: Punto, riquadro: { w: number; h: number }): Vista {
  if (vista.s > SCALA_MIN + 0.01) return { s: SCALA_MIN, x: 0, y: 0 }
  return limitaVista(SCALA_DOPPIO, -punto.x * (SCALA_DOPPIO - 1), -punto.y * (SCALA_DOPPIO - 1), riquadro.w, riquadro.h)
}

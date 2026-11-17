import { describe, expect, it } from 'vitest'
import { fraDita, limitaVista, pinchVista, SCALA_MAX, SCALA_MIN, vistaDoppioTocco } from './zoom'

describe('limitaVista', () => {
  it('alla misura intera non lascia spostare l’immagine', () => {
    // `x` e `y` possono essere -0: il confronto vuole lo zero positivo.
    const v = limitaVista(SCALA_MIN, 40, -30, 300, 200)
    expect({ ...v, x: v.x + 0, y: v.y + 0 }).toEqual({ s: 1, x: 0, y: 0 })
  })

  it('a scala doppia il margine è metà della misura su ogni lato', () => {
    expect(limitaVista(2, 999, -999, 300, 200)).toEqual({ s: 2, x: 150, y: -100 })
    expect(limitaVista(2, 20, -10, 300, 200)).toEqual({ s: 2, x: 20, y: -10 })
  })

  it('la scala resta tra 1 e 4', () => {
    expect(limitaVista(0.2, 0, 0, 300, 200).s).toBe(1)
    expect(limitaVista(9, 0, 0, 300, 200).s).toBe(SCALA_MAX)
  })
})

describe('fraDita', () => {
  it('misura la distanza e il punto medio', () => {
    expect(fraDita({ x: 0, y: 0 }, { x: 60, y: 80 })).toEqual({ d: 100, x: 30, y: 40 })
  })
})

describe('pinchVista', () => {
  const riquadro = { w: 300, h: 200, cx: 500, cy: 400 }

  it('due dita che si allargano al doppio raddoppiano la scala', () => {
    const rif = { s: 1, x: 0, y: 0, d: 50, fx: 500, fy: 400, cx: riquadro.cx, cy: riquadro.cy }
    expect(pinchVista(rif, { d: 100, x: 500, y: 400 })).toEqual({ s: 2, x: 0, y: 0 })
  })

  it('il punto delle dita resta fermo sull’immagine', () => {
    // Dita ferme al centro, scala 1 → 2: lì il punto (centro) rimane dov'è.
    const rif = { s: 1, x: 0, y: 0, d: 100, fx: 500, fy: 400, cx: 500, cy: 400 }
    const v = pinchVista(rif, { d: 200, x: 500, y: 400 })
    expect(v).toEqual({ s: 2, x: 0, y: 0 })
    // Dita 30 px a destra del centro che si allargano al doppio: il punto toccato resta a 30 px dal centro.
    const v2 = pinchVista(rif, { d: 200, x: 530, y: 400 })
    // Il punto sull'immagine che finisce sotto le dita: x_sullo_schermo = punto · s + x.
    expect((530 - 500 - v2.x) / v2.s).toBeCloseTo(0)
  })

  it('chiudendo le dita non si scende sotto la misura intera', () => {
    const rif = { s: 2, x: 0, y: 0, d: 100, fx: 500, fy: 400, cx: 500, cy: 400 }
    expect(pinchVista(rif, { d: 10, x: 500, y: 400 }).s).toBe(1)
  })
})

describe('vistaDoppioTocco', () => {
  it('ingrandisce sul punto toccato, tenendolo fermo', () => {
    const riquadro = { w: 300, h: 200 }
    const punto = { x: -75, y: 50 }
    const v = vistaDoppioTocco({ s: 1, x: 0, y: 0 }, punto, riquadro)
    // Il punto sull'immagine (scala intera) dopo lo zoom: x·s + x' = punto.
    expect(punto.x * v.s + v.x).toBeCloseTo(punto.x)
    expect(punto.y * v.s + v.y).toBeCloseTo(punto.y)
  })

  it('se è ingrandita torna alla misura intera', () => {
    expect(vistaDoppioTocco({ s: 2.5, x: 10, y: 10 }, { x: 0, y: 0 }, { w: 300, h: 200 })).toEqual({ s: 1, x: 0, y: 0 })
  })
})

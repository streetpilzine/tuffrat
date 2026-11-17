import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DURATA_CAMERA_S, DURATA_FUOCO_S, scenaPerRoute } from '../scene-map.ts'
import * as mobile from '../mobile.ts'
import { BOARD, BUSTINE_DESKTOP, BUSTINE_MOBILE, ingombroColonna, zonaBustine } from '../../three/layout-muro.ts'
import { ZONA } from '../../three/mondo.ts'
import { staticRoutes } from '../../routes.meta.ts'

describe('scenaPerRoute', () => {
  it('mappa le route principali sulle scene di ARCHITECTURE §5', () => {
    expect(scenaPerRoute('/').scena).toBe('muro')
    expect(scenaPerRoute('/bio').scena).toBe('bio')
    expect(scenaPerRoute('/serie').scena).toBe('muro')
    expect(scenaPerRoute('/serie/roundabout').scena).toBe('muro')
    expect(scenaPerRoute('/opere/sinapsi').scena).toBe('muro')
    expect(scenaPerRoute('/edizioni').scena).toBe('banco')
    expect(scenaPerRoute('/edizioni/streetpil-verde').scena).toBe('banco')
    expect(scenaPerRoute('/mostre').scena).toBe('muro')
    expect(scenaPerRoute('/fotografia').scena).toBe('banco')
  })

  it('ignora slash finale e query string', () => {
    expect(scenaPerRoute('/bio/')).toEqual(scenaPerRoute('/bio'))
    expect(scenaPerRoute('/serie/roundabout/?p=1&r=0')).toEqual(scenaPerRoute('/serie/roundabout'))
  })

  it('ogni route prerenderizzata ha un target con la camera davanti al muro', () => {
    for (const r of staticRoutes()) {
      const { target, etichetta } = scenaPerRoute(r.path)
      expect(target.pos[2], r.path).toBeGreaterThan(target.look[2])
      expect(etichetta.length).toBeGreaterThan(0)
    }
  })

  it('una route sconosciuta porta al muro vuoto, da lontano', () => {
    const s = scenaPerRoute('/pagina-che-non-esiste')
    expect(s.scena).toBe('muro')
    expect(s.target.pos[2]).toBeGreaterThan(scenaPerRoute('/').target.pos[2])
  })

  it('la transizione resta entro gli 800 ms del piano e il volo in primo piano entro i 600', () => {
    expect(DURATA_CAMERA_S).toBeLessThanOrEqual(0.8)
    expect(DURATA_FUOCO_S).toBeLessThanOrEqual(0.6)
  })

  it('ogni serie ha la sua zona del muro', () => {
    const x = (p: string) => scenaPerRoute(p).target.look[0]
    expect(x('/serie/roundabout')).toBe(ZONA.roundabout)
    expect(x('/serie/bustine-di-te')).toBe(ZONA.bustine)
    expect(x('/mostre')).toBe(ZONA.mostre)
    expect(x('/serie/2023-2025')).toBe(ZONA.home)
  })

  it('in 3D la scheda parte chiusa su tutte le route con una scena da guardare', () => {
    for (const r of staticRoutes()) expect(scenaPerRoute(r.path).schedaAperta, r.path).toBe(false)
    expect(scenaPerRoute('/pagina-che-non-esiste').schedaAperta).toBe(true)
  })
})

describe('inquadrature del telefono', () => {
  const FOV = 38
  const SCHERMO = 390 / 844
  /** Distanza dal muro a cui si ferma la camera su uno schermo 390 × 844, con il tetto del CameraRig (9,5). */
  const distanza = (t: ReturnType<typeof scenaPerRoute>['target']) => {
    const tan = Math.tan((FOV * Math.PI) / 360)
    return Math.min(9.5, Math.max(t.inquadra!.h / (2 * tan), t.inquadra!.w / (2 * tan * SCHERMO)) / (t.inquadra!.riempi ?? 0.7))
  }
  const larghezzaVisibile = (t: ReturnType<typeof scenaPerRoute>['target']) => 2 * distanza(t) * Math.tan((FOV * Math.PI) / 360) * SCHERMO

  it('fuori dal browser valgono le inquadrature del desktop', () => {
    expect(zonaBustine()).toBe(BUSTINE_DESKTOP)
    expect(scenaPerRoute('/').target.inquadra).toEqual({ w: 9.4, h: 4.6, riempi: 0.8 })
    expect(scenaPerRoute('/').target.look[1]).toBe(1.3)
    expect(scenaPerRoute('/serie').target.inquadra).toEqual({ w: 6.6, h: 3.2, riempi: 0.8 })
    expect(scenaPerRoute('/serie/roundabout').target.inquadra).toEqual({ w: 1.8, h: 1.8, riempi: 0.56 })
    expect(scenaPerRoute('/serie/bustine-di-te').target.look[0]).toBe(ZONA.bustine)
  })

  describe('con eMobile() vero', () => {
    beforeEach(() => {
      vi.spyOn(mobile, 'eMobile').mockReturnValue(true)
    })
    afterEach(() => {
      vi.restoreAllMocks()
    })

    it('/serie inquadra la colonna intera: i due polittici del Tè sopra Roundabout', () => {
      const t = scenaPerRoute('/serie').target
      const colonna = ingombroColonna(true)
      expect(zonaBustine()).toBe(BUSTINE_MOBILE)
      expect(t.look[0]).toBe(ZONA.roundabout)
      expect(t.look[1]).toBeCloseTo(colonna.y)
      // La colonna entra in larghezza e in altezza nello schermo verticale.
      expect(colonna.w).toBeLessThan(larghezzaVisibile(t))
      expect(colonna.h).toBeLessThan(larghezzaVisibile(t) / SCHERMO)
    })

    it('Roundabout riempie la larghezza dello schermo', () => {
      const t = scenaPerRoute('/serie/roundabout').target
      expect(BOARD.lato / larghezzaVisibile(t)).toBeCloseTo(0.94, 2)
    })

    it('le Bustine di tè si inquadrano dove stanno sul telefono', () => {
      const t = scenaPerRoute('/serie/bustine-di-te').target
      const te = ingombroColonna(false)
      expect(t.look[0]).toBe(BUSTINE_MOBILE.centro)
      expect(t.look[1]).toBeCloseTo(te.y)
      expect(te.w).toBeLessThan(larghezzaVisibile(t))
    })

    it('la home resta sul muro della home, con lo sguardo più in basso per mostrare il banco', () => {
      const t = scenaPerRoute('/').target
      expect(t.look[0]).toBe(ZONA.home)
      expect(t.look[1]).toBeLessThan(1.3)
    })
  })
})

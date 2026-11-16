import { describe, expect, it } from 'vitest'
import { DURATA_CAMERA_S, DURATA_FUOCO_S, scenaPerRoute } from '../scene-map.ts'
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

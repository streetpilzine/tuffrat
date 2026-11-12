import { describe, expect, it } from 'vitest'
import { DURATA_CAMERA_S, scenaPerRoute } from '../scene-map.ts'
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

  it('la transizione resta entro gli 800 ms del piano', () => {
    expect(DURATA_CAMERA_S).toBeLessThanOrEqual(0.8)
  })
})

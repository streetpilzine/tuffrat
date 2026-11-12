import { describe, expect, it } from 'vitest'
import { modo3D, vistaIniziale } from '../usePrefs.ts'

describe('vistaIniziale', () => {
  it('il parametro URL vince su tutto', () => {
    expect(vistaIniziale('?vista=lista', JSON.stringify({ vistaLista: false }))).toBe(true)
    expect(vistaIniziale('?vista=3d', JSON.stringify({ vistaLista: true }))).toBe(false)
  })
  it('poi vale la preferenza salvata', () => {
    expect(vistaIniziale('', JSON.stringify({ vistaLista: true }))).toBe(true)
    expect(vistaIniziale('', JSON.stringify({ vistaLista: false }))).toBe(false)
  })
  it('senza nulla si parte in 3D; una preferenza corrotta si ignora', () => {
    expect(vistaIniziale('', null)).toBe(false)
    expect(vistaIniziale('', '{non json')).toBe(false)
    expect(vistaIniziale('?vista=boh', null)).toBe(false)
  })
})

describe('modo3D', () => {
  it('serve vista 3D, motion pieno e WebGL', () => {
    expect(modo3D({ vistaLista: false, reducedMotion: false, webgl: true })).toBe(true)
    expect(modo3D({ vistaLista: true, reducedMotion: false, webgl: true })).toBe(false)
    expect(modo3D({ vistaLista: false, reducedMotion: true, webgl: true })).toBe(false)
    expect(modo3D({ vistaLista: false, reducedMotion: false, webgl: false })).toBe(false)
  })
})

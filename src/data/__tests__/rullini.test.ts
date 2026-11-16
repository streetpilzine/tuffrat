import { describe, expect, it } from 'vitest'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { imageSize } from 'image-size'
import { rullini } from '../index'

/** I rullini ricalcano i manifest di `tools/rullini_select.py`: sorgenti giuste, conteggi giusti, file presenti e mai ingranditi. */
const PUBLIC = join(process.cwd(), 'public')
const ATTESI: Record<string, { foto: number; cartella: RegExp; file: RegExp; rotazione: number }> = {
  gialla: { foto: 28, cartella: /\\StreetPIL\\gialla$/, file: /^foto_20221126_\d{4}\.jpg$/, rotazione: 90 },
  ben: { foto: 24, cartella: /\\bEn_ultimoAnno$/, file: /^foto_20241231_\d{4}\.jpg$/, rotazione: 0 },
}

interface FotoManifest {
  file: string
  filePiccola: string
  width: number
  height: number
  alt: string
  sorgente: { file: string; width: number; height: number }
}
interface Manifest {
  id: string
  etichetta: string
  rotazione: number
  cartellaSorgente: string
  foto: FotoManifest[]
}

describe('rullini', () => {
  it('sono due: gialla e ben', () => {
    expect(rullini.map((r) => r.id)).toEqual(['gialla', 'ben'])
    expect(rullini.map((r) => r.etichetta)).toEqual(['gialla', 'ben'])
  })

  it.each(rullini.map((r) => [r.id, r] as const))('%s: sorgenti e conteggi del manifest', (id, r) => {
    const m = JSON.parse(readFileSync(join(PUBLIC, r.fonte!), 'utf8')) as Manifest
    const atteso = ATTESI[id]
    expect(m.id).toBe(id)
    expect(m.cartellaSorgente).toMatch(atteso.cartella)
    expect(m.cartellaSorgente.toLowerCase()).not.toContain('postprocess')
    expect(m.rotazione).toBe(atteso.rotazione)
    expect(r.rotazione).toBe(m.rotazione)
    expect(m.foto).toHaveLength(atteso.foto)
    expect(r.foto).toHaveLength(atteso.foto)
    m.foto.forEach((f, i) => {
      // Nome nudo, del tipo atteso: niente sottocartelle (`postprocess`) né altre cartelle.
      expect(f.sorgente.file).toMatch(atteso.file)
      // Mai ingrandita oltre la sorgente.
      expect(Math.max(f.width, f.height)).toBeLessThanOrEqual(Math.max(f.sorgente.width, f.sorgente.height))
      expect(Math.max(f.width, f.height)).toBeLessThanOrEqual(1600)
      expect(r.foto[i]).toEqual({ src: f.file, srcPiccola: f.filePiccola, width: f.width, height: f.height, alt: f.alt })
    })
    expect(new Set(m.foto.map((f) => f.sorgente.file)).size).toBe(atteso.foto)
  })

  it.each(rullini.flatMap((r) => r.foto.map((f) => [f.src, f] as const)))('%s esiste con le dimensioni dichiarate', (_src, f) => {
    const file = join(PUBLIC, f.src)
    expect(existsSync(file)).toBe(true)
    const dim = imageSize(readFileSync(file))
    expect({ w: dim.width, h: dim.height }).toEqual({ w: f.width, h: f.height })
    expect(existsSync(join(PUBLIC, f.srcPiccola)), `manca ${f.srcPiccola}`).toBe(true)
    const piccola = imageSize(readFileSync(join(PUBLIC, f.srcPiccola)))
    expect(Math.max(piccola.width, piccola.height)).toBeLessThanOrEqual(1024)
  })
})

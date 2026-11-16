import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { edizioni } from '../index'
import { cartelleStreetPil } from '../edizioni'

/**
 * Selezione StreetPIL (decisione del 16/11/2026): ogni fanzine è fatta con le sole 5 foto della cartella del suo numero.
 * Il test legge i `manifest.json` scritti da `tools/streetpil_select.py` e verifica sia la lista bianca sia la lista nera.
 */
const AMMESSE = ['1-verde', '2-rossa', '3-blu', '4-rave']
const VIETATE = ['graffiti', 'malli', 'pr0n', 'gab', 'favola', 'sk8', 'special', 'megafoto', 'ben', 'gialla']

interface PaginaManifest {
  file: string
  tipo: 'copertina' | 'titolo' | 'foto' | 'colophon'
  width: number
  height: number
  alt?: string
  sorgente?: { cartella: string; file: string }
}
interface Manifest {
  slug: string
  numero: number
  titolo: string
  colore: string
  coloreTesto: string
  cartellaSorgente: string
  pagine: PaginaManifest[]
  copertina: { file: string; width: number; height: number }
}

const leggi = (fonte: string): Manifest => JSON.parse(readFileSync(join(process.cwd(), 'public', fonte), 'utf8')) as Manifest

describe('edizioni: selezione StreetPIL', () => {
  it('ci sono le quattro fanzine previste, senza anno', () => {
    expect(edizioni.map((e) => e.id)).toEqual(['streetpil-verde', 'streetpil-rossa', 'streetpil-blu', 'streetpil-rave'])
    for (const e of edizioni) expect(e.anno).toBeUndefined()
  })

  it.each(edizioni.map((e) => [e.id, e] as const))('%s: il manifest usa solo la cartella del suo numero', (_id, e) => {
    const m = leggi(e.fonte!)
    expect(m.slug).toBe(e.id)
    expect(AMMESSE).toContain(m.cartellaSorgente)
    expect(m.cartellaSorgente).toBe(cartelleStreetPil[e.id])

    const foto = m.pagine.filter((p) => p.tipo === 'foto')
    expect(foto).toHaveLength(5)
    for (const p of foto) {
      expect(p.sorgente?.cartella).toBe(m.cartellaSorgente)
      // Il nome del file è un nome nudo: nessun percorso che esca dalla cartella.
      expect(p.sorgente?.file).toMatch(/^[^\\/]+\.jpe?g$/i)
    }
    // Solo le pagine foto hanno una sorgente: copertina, titolo e colophon sono generati.
    for (const p of m.pagine.filter((p) => p.tipo !== 'foto')) expect(p.sorgente).toBeUndefined()

    // Lista nera: nessuna cartella vietata compare come sorgente, né come pezzo di un percorso di file.
    const cartelle = [m.cartellaSorgente, ...foto.map((p) => p.sorgente!.cartella)].map((c) => c.toLowerCase())
    const percorsi = m.pagine.map((p) => p.file.toLowerCase().split('/')).flat()
    for (const v of VIETATE) {
      expect(cartelle, `il manifest di ${e.id} usa la cartella «${v}»`).not.toContain(v)
      expect(percorsi, `un percorso di ${e.id} passa da «${v}»`).not.toContain(v)
    }
  })

  it.each(edizioni.map((e) => [e.id, e] as const))('%s: i dati ricalcano il manifest', (_id, e) => {
    const m = leggi(e.fonte!)
    expect(e.titolo).toBe(m.titolo)
    expect(e.numero).toBe(m.numero)
    expect(e.dorso).toEqual({ colore: m.colore, testo: m.coloreTesto })
    expect(e.pagine).toEqual(m.pagine.map((p) => p.file))
    expect(e.pagine).toHaveLength(8)
    expect(e.copertina).toMatchObject({ src: m.copertina.file, width: m.copertina.width, height: m.copertina.height })
    expect(e.altPagine).toHaveLength(e.pagine.length)
    m.pagine.forEach((p, i) => {
      if (p.tipo === 'foto') expect(e.altPagine![i]).toBe(p.alt)
    })
  })

  it.each(edizioni.map((e) => [e.id, e] as const))('%s: tutte le pagine hanno lo stesso rapporto 3:2', (_id, e) => {
    for (const p of leggi(e.fonte!).pagine) expect(p.width / p.height).toBeCloseTo(1.5, 2)
  })
})

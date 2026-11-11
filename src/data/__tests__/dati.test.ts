import { describe, expect, it } from 'vitest'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { imageSize } from 'image-size'
import {
  artista,
  edizioni,
  mostre,
  opere,
  opereById,
  polittici,
  serie,
  tutteLeOpere,
  type Immagine,
} from '../index'

const PUBLIC = join(process.cwd(), 'public')

const tutteLeImmagini: { dove: string; img: Immagine }[] = [
  { dove: 'artista.ritratto', img: artista.ritratto },
  { dove: 'artista.profilo', img: artista.profilo },
  ...tutteLeOpere.flatMap((o) => [
    { dove: `opera ${o.id}`, img: o.immagine },
    ...(o.dettagli ?? []).map((d, i) => ({ dove: `opera ${o.id} dettaglio ${i}`, img: d })),
  ]),
  ...serie.map((s) => ({ dove: `serie ${s.id}`, img: s.copertina })),
  ...edizioni.map((e) => ({ dove: `edizione ${e.id}`, img: e.copertina })),
  ...mostre.flatMap((m) => (m.flyer ? [{ dove: `mostra ${m.id}`, img: m.flyer }] : [])),
]

const slugUnici = (nome: string, ids: string[]) => {
  it(`${nome}: slug unici`, () => {
    expect(new Set(ids).size).toBe(ids.length)
  })
}

describe('dati: slug', () => {
  slugUnici('opere (incl. pannelli)', tutteLeOpere.map((o) => o.id))
  slugUnici('polittici', polittici.map((p) => p.id))
  slugUnici('serie', serie.map((s) => s.id))
  slugUnici('edizioni', edizioni.map((e) => e.id))
  slugUnici('mostre', mostre.map((m) => m.id))
})

describe('dati: immagini', () => {
  it.each(tutteLeImmagini.map((x) => [x.dove, x.img] as const))('%s esiste e ha le dimensioni dichiarate', (_dove, img) => {
    const file = join(PUBLIC, img.src)
    expect(existsSync(file), `manca ${img.src}`).toBe(true)
    const dim = imageSize(readFileSync(file))
    expect({ w: dim.width, h: dim.height }).toEqual({ w: img.width, h: img.height })
  })
  it('ogni pagina di edizione esiste', () => {
    for (const e of edizioni) for (const p of e.pagine) expect(existsSync(join(PUBLIC, p)), `manca ${p}`).toBe(true)
  })
})

describe('dati: riferimenti', () => {
  it('ogni opera.serie punta a una serie esistente', () => {
    const ids = new Set(serie.map((s) => s.id))
    for (const o of tutteLeOpere) if (o.serie) expect(ids.has(o.serie), `${o.id} → ${o.serie}`).toBe(true)
  })
  it('serie.opere e serie.polittici puntano a elementi esistenti', () => {
    const pIds = new Set(polittici.map((p) => p.id))
    for (const s of serie) {
      for (const id of s.opere ?? []) expect(opereById.has(id), `${s.id} → opera ${id}`).toBe(true)
      for (const id of s.polittici ?? []) expect(pIds.has(id), `${s.id} → polittico ${id}`).toBe(true)
    }
  })
  it('ogni polittico.ordineDefault è una permutazione dei suoi pannelli', () => {
    for (const p of polittici) {
      expect([...p.ordineDefault].sort()).toEqual(p.pannelli.map((x) => x.id).sort())
    }
  })
  it('serie modulare: tessere valide e permutazione di 0..3', () => {
    for (const s of serie.filter((x) => x.tipo === 'modulare')) {
      const m = s.modulare!
      for (const t of m.tessere) expect(opereById.has(t.opera), `${s.id} → tessera ${t.opera}`).toBe(true)
      expect([...m.permutazioneDefault].sort()).toEqual([0, 1, 2, 3])
    }
  })
  it('serie tipate coerentemente', () => {
    for (const s of serie) {
      if (s.tipo === 'raccolta') expect(s.opere?.length).toBeGreaterThan(0)
      if (s.tipo === 'polittici') expect(s.polittici?.length).toBeGreaterThan(0)
      if (s.tipo === 'modulare') expect(s.modulare).toBeDefined()
    }
  })
})

describe('dati: parità col sito legacy', () => {
  it('11 opere in home, 4 mostre, 3 serie, 2 polittici', () => {
    expect(opere.filter((o) => o.inHome)).toHaveLength(11)
    expect(mostre).toHaveLength(4)
    expect(serie).toHaveLength(3)
    expect(polittici).toHaveLength(2)
  })
})

import { z } from 'zod'
import { Artista, Edizione, Mostra, Opera, Polittico, Serie, type Slug } from './schema.ts'
import { artista as artistaRaw } from './artista.ts'
import { opere as opereRaw } from './opere.ts'
import { polittici as politticiRaw } from './polittici.ts'
import { serie as serieRaw } from './serie.ts'
import { edizioni as edizioniRaw } from './edizioni.ts'
import { mostre as mostreRaw } from './mostre.ts'

/** Tutti i dati passano da zod una volta sola, all'import: un dato rotto fa fallire la build, non la pagina. */
export const artista = Artista.parse(artistaRaw)
export const opere = z.array(Opera).parse(opereRaw)
export const polittici = z.array(Polittico).parse(politticiRaw)
export const serie = z.array(Serie).parse(serieRaw).sort((a, b) => (a.ordine ?? 99) - (b.ordine ?? 99))
export const edizioni = z.array(Edizione).parse(edizioniRaw)
export const mostre = z.array(Mostra).parse(mostreRaw).sort((a, b) => b.anno - a.anno)

export const opereById = new Map(opere.map((o) => [o.id, o]))
export const politticiById = new Map(polittici.map((p) => [p.id, p]))
export const serieById = new Map(serie.map((s) => [s.id, s]))
export const edizioniById = new Map(edizioni.map((e) => [e.id, e]))
export const mostreById = new Map(mostre.map((m) => [m.id, m]))

/** Opere in home, nell'ordine della galleria. */
export const opereInHome = opere.filter((o) => o.inHome).sort((a, b) => (a.ordine ?? 99) - (b.ordine ?? 99))

export const opereDiSerie = (id: Slug) =>
  opere.filter((o) => o.serie === id).sort((a, b) => (a.ordine ?? 99) - (b.ordine ?? 99))

export const politticiDiSerie = (id: Slug) => polittici.filter((p) => p.serie === id)

/** Tutte le opere, compresi i pannelli dei polittici: serve a /opere/:slug e ai test. */
export const tutteLeOpere = [...opere, ...polittici.flatMap((p) => p.pannelli)]
export const tutteLeOpereById = new Map(tutteLeOpere.map((o) => [o.id, o]))

export * from './schema.ts'

import { artista, edizioni, mostre, serie, tutteLeOpere } from './data/index.ts'

export const SITE_URL = 'https://tuffrat.art'

export interface PageMeta {
  path: string
  title: string
  description: string
  image: string
}

const base = (titolo?: string) => (titolo ? `${titolo} — TuffRat` : 'TuffRat — Portfolio')

/** Meta di ogni route statica nota dai dati: usate dal prerender in build e da usePageMeta a runtime. */
export function staticRoutes(): PageMeta[] {
  const ritratto = artista.ritratto.src
  const routes: PageMeta[] = [
    { path: '/', title: base(), description: artista.lede.join(' '), image: ritratto },
    { path: '/bio', title: base('Bio'), description: artista.statement, image: ritratto },
    { path: '/serie', title: base('Serie'), description: 'Corpi di lavoro organizzati per serie.', image: serie[0]?.copertina.src ?? ritratto },
    { path: '/edizioni', title: base('Edizioni'), description: 'Fanzine, stampe limitate, multipli e collaborazioni.', image: ritratto },
    { path: '/mostre', title: base('Mostre'), description: 'Percorso espositivo recente.', image: ritratto },
    { path: '/fotografia', title: base('Fotografia'), description: 'Selezione fotografica in fase di preparazione.', image: ritratto },
  ]
  for (const s of serie) routes.push({ path: `/serie/${s.id}`, title: base(s.titolo), description: s.descrizione, image: s.copertina.src })
  for (const o of tutteLeOpere)
    routes.push({ path: `/opere/${o.id}`, title: base(`${o.titolo} (${o.anno})`), description: `${o.titolo}, ${o.anno}. ${o.tecnica}.`, image: o.immagine.src })
  for (const e of edizioni) routes.push({ path: `/edizioni/${e.id}`, title: base(e.titolo), description: e.descrizione ?? 'Fanzine.', image: e.copertina.src })
  for (const m of mostre) routes.push({ path: `/mostre/${m.id}`, title: base(m.titolo), description: `${m.anno} · ${m.luogo}, ${m.citta}`, image: m.flyer?.src ?? ritratto })
  return routes
}

const byPath = new Map<string, PageMeta>()
export function metaFor(path: string): PageMeta {
  if (byPath.size === 0) for (const r of staticRoutes()) byPath.set(r.path, r)
  const clean = path.replace(/\/+$/, '') || '/'
  return byPath.get(clean) ?? { path: clean, title: base('Pagina non trovata'), description: '', image: artista.ritratto.src }
}

import type { Edizione } from '../data/schema.ts'

/**
 * Rivista di prova per Shelf e FlipBook, solo in dev: 24 pagine rese da un PDF qualsiasi con
 *   python tools/fanzine_to_pages.py "<file>.pdf" --slug rivista-test --pages 24 --max 1200 --dpi 130 --quality 80
 * Le immagini stanno in public/assets/img/edizioni/rivista-test/ (ignorata da git): non è materiale del sito
 * e non entra né nella build né nel prerender. Le fanzine vere arrivano in `src/data/edizioni.ts` (fase 3a).
 */
const BASE = '/assets/img/edizioni/rivista-test'

export const edizioniDiProva: Edizione[] = import.meta.env.DEV
  ? [
      {
        id: 'rivista-test',
        titolo: 'Rivista di prova',
        anno: 2026,
        tipo: 'fanzine',
        descrizione: 'Materiale di prova per lo sfoglio: non fa parte del sito.',
        copertina: { src: `${BASE}/cover.webp`, width: 1075, height: 1521, alt: 'Copertina della rivista di prova' },
        pagine: Array.from({ length: 24 }, (_, i) => `${BASE}/pages/${String(i + 1).padStart(2, '0')}.webp`),
        fonte: 'dev',
      },
    ]
  : []

import type { Edizione } from './schema.ts'

/**
 * Fanzine StreetPIL, una per numero. Le pagine sono generate da `tools/streetpil_select.py` (cartelle ammesse: solo 1-verde, 2-rossa, 3-blu, 4-rave; vedi docs/decisioni.md, 16/11/2026) e questo file ricalca i `manifest.json` che lo script scrive accanto alle pagine: il test `edizioni.test.ts` verifica che restino allineati.
 * Ogni numero ha 8 pagine orizzontali 3:2: copertina, titolo, le 5 fotografie, colophon. Titoli e colori dei dorsi sono una scelta provvisoria, modificabile qui (e nello script, che li stampa sulle pagine). L'anno non è noto e resta assente.
 */
const BASE = '/assets/img/edizioni'

interface Numero {
  cartella: string
  slug: string
  numero: number
  titolo: string
  dorso: { colore: string; testo: string }
  /** Testo alternativo delle 5 fotografie, nell'ordine delle pagine 03–07. */
  foto: [string, string, string, string, string]
}

const numeri: Numero[] = [
  {
    cartella: '1-verde',
    slug: 'streetpil-verde',
    numero: 1,
    titolo: 'Muschio',
    dorso: { colore: '#2f6f4f', testo: '#f7f7f5' },
    foto: [
      "Superficie giallo verde con una fascia chiara lungo il bordo destro, cosparsa di bolle rosa della pellicola",
      "Due campiture verdi divise da una linea obliqua, con un piccolo oggetto scuro al centro, sotto bolle rosa",
      "Un sottopasso di cemento visto di fronte, con l'apertura scura al centro, sotto bolle rosa",
      "Terreno con sassi e detriti ai piedi di un muro, in toni verdi, sotto bolle rosa",
      "Una persona con la maglia a righe piegata in avanti con la testa tra le mani, accanto a un pannello chiaro, in toni gialli e verdi",
    ],
  },
  {
    cartella: '2-rossa',
    slug: 'streetpil-rossa',
    numero: 2,
    titolo: 'Ruggine',
    dorso: { colore: '#a8322b', testo: '#f7f7f5' },
    foto: [
      "Un viadotto ferroviario con la ringhiera e i pali della linea elettrica contro il cielo arancio, sotto bolle rosa",
      "Primo piano di due mani che stringono una bottiglia e, dietro, una persona con la barba che sorride, in toni arancio",
      "Una persona attraversa i binari di una ferrovia, con case, alberi e una montagna sullo sfondo, in toni arancio",
      "Foglie di una pianta rampicante e la loro ombra su un muro, in toni arancio, sotto bolle rosa",
      "Il volto di una persona sdraiata, di profilo e con gli occhi chiusi, con una mano sopra la testa, in luce arancio",
    ],
  },
  {
    cartella: '3-blu',
    slug: 'streetpil-blu',
    numero: 3,
    titolo: 'Cianotipo',
    dorso: { colore: '#1f4a8a', testo: '#f7f7f5' },
    foto: [
      "Sassi e foglie sul terreno in toni azzurri, sotto bolle rosa",
      "Una persona in piedi dietro una consolle, sotto un telo teso tra gli alberi, accanto a una cassa acustica",
      "Un bosco di abeti con un tavolo e una figura in lontananza, e un bagliore giallo sul lato destro",
      "Tronchi d'albero e, a destra, una persona in piedi sotto un ombrello, tra aloni marroni e rossi della pellicola",
      "Un graffito chiaro su un muro accanto a una scala di cemento, in toni grigi e azzurri",
    ],
  },
  {
    cartella: '4-rave',
    slug: 'streetpil-rave',
    numero: 4,
    titolo: 'Acido',
    dorso: { colore: '#111111', testo: '#e0309a' },
    foto: [
      "Tendoni e furgoni decorati davanti a una fila di alberi, in colori invertiti gialli e blu",
      "Una folla in un prato sotto fasci di luce diagonali, con le colline sullo sfondo, in giallo e blu",
      "Persone di spalle sotto un tendone davanti a un muro di casse acustiche, in giallo e blu",
      "Camper e auto parcheggiati in un prato, con le colline sullo sfondo, in giallo e blu",
      "Persone di spalle davanti a un palco, con alberi spogli e un traliccio, in giallo e blu",
    ],
  },
]

const pagina = (slug: string, n: number) => `${BASE}/${slug}/pages/${String(n).padStart(2, '0')}.webp`

export const edizioni: Edizione[] = numeri.map((n) => {
  const testata = `StreetPIL n. ${n.numero}, ${n.titolo}`
  return {
    id: n.slug,
    titolo: n.titolo,
    numero: n.numero,
    tipo: 'fanzine',
    descrizione: `StreetPIL n. ${n.numero}: cinque fotografie di TuffRat.`,
    copertina: { src: `${BASE}/${n.slug}/cover.webp`, width: 1500, height: 1000, alt: `Copertina di ${testata}` },
    dorso: n.dorso,
    pagine: Array.from({ length: 8 }, (_, i) => pagina(n.slug, i + 1)),
    altPagine: [`Copertina di ${testata}`, `Pagina del titolo: ${n.titolo}, StreetPIL n. ${n.numero}, cinque fotografie`, ...n.foto, `Colophon: ${testata}. Fotografie di TuffRat, tuffrat.art, Instagram @tuff_rat`],
    fonte: `${BASE}/${n.slug}/manifest.json`,
  }
})

/** Cartelle sorgente ammesse, una per numero: il test confronta i manifest con questo elenco. */
export const cartelleStreetPil: Record<string, string> = Object.fromEntries(numeri.map((n) => [n.slug, n.cartella]))

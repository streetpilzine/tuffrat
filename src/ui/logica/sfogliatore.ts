/**
 * Conti puri dello sfogliatore (testati): misura delle pagine e didascalia della pagina visibile; per il visore mobile, disposizione della scena, mappatura del dito, angolo del foglio e rilascio.
 */

/** Spazio lasciato libero attorno al libro: bordi della finestra, titolo, didascalia, barra, margine del pulsante Chiudi. */
export const AREA_SFOGLIATORE = { orizzontale: 24, verticale: 184, libroMassimo: 1024, massimoPagina: 1000 }

/**
 * Dimensione iniziale delle pagine per `page-flip`. In `stretch` la libreria parte da `width`/`height` e dalla
 * larghezza del blocco che riceve, poi riduce la pagina finché la doppia pagina (o, in verticale, la singola) entra
 * nello spazio dato; passandole già la misura giusta il libro non cambia scala dopo l'ingresso e non esce mai.
 *
 * Conti, con W e H dello spazio del libro: la doppia pagina sta in piedi se H × 2p ≤ W.
 * - in lettura doppia: altezza = min(H, libroMassimo / 2p), larghezza pagina = altezza × p;
 * - in verticale (una pagina): altezza = min(H, libroMassimo / p), larghezza = min(W, altezza × p).
 * Il blocco che riceve lo sfogliatore è largo due pagine in lettura doppia, una in verticale.
 * Esempi con pagine 3:2 (p = 1,5): a 1440 × 800 H = 616 e W = 1392; 616 × 3 = 1848 > 1392, quindi una pagina per
 * volta, 924 × 616 (blocco 924 × 616, centrato: le due pagine affiancate non ci starebbero). A 390 × 700 H = 516 e
 * W = 342: la pagina è larga al più 342, cioè 342 × 228. Con pagine verticali (p = 210/297) a 1440 × 800 la doppia
 * pagina ci sta in piedi: una pagina da 543 × 768 (blocco 1086 × 768, sotto il tetto di 1024 px del libro).
 */
export function misureSfogliatore(proporzione: number, finestra: { larghezza: number; altezza: number }, area = AREA_SFOGLIATORE) {
  const hStanza = Math.max(200, finestra.altezza - area.verticale)
  const wStanza = Math.max(200, finestra.larghezza - 2 * area.orizzontale)
  const doppia = hStanza * (2 * proporzione) <= wStanza
  let larghezza: number
  let altezza: number
  if (doppia) {
    altezza = Math.min(hStanza, area.libroMassimo / (2 * proporzione), area.massimoPagina / proporzione)
    larghezza = altezza * proporzione
  } else {
    altezza = Math.min(hStanza, area.libroMassimo / proporzione, area.massimoPagina / proporzione)
    larghezza = Math.min(wStanza, altezza * proporzione)
    altezza = larghezza / proporzione
  }
  larghezza = Math.min(larghezza, area.massimoPagina)
  altezza = larghezza / proporzione
  const pagina = Math.floor(larghezza)
  return {
    larghezza: pagina,
    altezza: Math.floor(altezza),
    doppia,
    /** Larghezza del blocco che riceve lo sfogliatore. */
    blocco: doppia ? 2 * pagina : pagina,
  }
}

/**
 * Didascalia dello sfogliatore: «Pagina 3 di 8. <alt>»; in lettura doppia, se la pagina a destra esiste,
 * descrive anche quella («Pagina 3 di 8. … Pagina 4: …»).
 */
export function descriviPagine(totale: number, pagina: number, doppia: boolean, altPagine: string[]): string {
  const alt = altPagine[pagina - 1]
  const destra = doppia && pagina + 1 <= totale ? altPagine[pagina] : undefined
  const testa = `Pagina ${pagina} di ${totale}.${alt ? ` ${alt}` : ''}`
  return destra ? `${testa} Pagina ${pagina + 1}: ${destra}` : testa
}

// ── Visore mobile: una pagina per volta, sempre in orizzontale ──

/** Costanti del visore mobile: margine attorno alla pagina (px), soglia sotto cui un gesto resta un tocco (px), frazione di pagina oltre cui il rilascio completa lo sfoglio, velocità del dito che lo completa comunque (px/ms), quanto cede il foglio ai capi del libro, distanza della prospettiva in larghezze di pagina. */
export const MOBILE = { margine: 8, sogliaTocco: 8, sogliaDistanza: 0.3, sogliaVelocita: 0.4, resistenza: 0.1, prospettiva: 4 }

export interface Punto {
  x: number
  y: number
}

/**
 * La scena del visore è sempre orizzontale: larga quanto il lato lungo dello schermo e alta quanto il lato corto. Con il telefono in verticale la scena si gira di 90° in senso orario attorno al suo angolo in alto a sinistra e si sposta a destra di `corto` (`translateX(corto) rotate(90deg)`): la colonna della didascalia finisce in alto e chi guarda gira il telefono, o la testa, verso sinistra.
 */
export function scenaMobile(viewport: { larghezza: number; altezza: number }) {
  const ruotata = viewport.altezza > viewport.larghezza
  return { ruotata, lungo: Math.max(viewport.larghezza, viewport.altezza), corto: Math.min(viewport.larghezza, viewport.altezza) }
}

/** Punto dello schermo → punto della scena. Con la scena girata un punto (x, y) della scena si vede a schermo in (corto − y, x): l'asse orizzontale della pagina è quello verticale dello schermo. */
export function versoScena(p: Punto, scena: { ruotata: boolean; corto: number }): Punto {
  return scena.ruotata ? { x: p.y, y: scena.corto - p.x } : { x: p.x, y: p.y }
}

/** La pagina più grande, nella proporzione data, che entra nello spazio a destra della colonna lasciando il margine: con pagine 3:2 su un telefono prende tutta l'altezza. */
export function paginaMobile(proporzione: number, spazio: { larghezza: number; altezza: number }, margine = MOBILE.margine) {
  const altezza = Math.max(0, Math.min(spazio.altezza - 2 * margine, (spazio.larghezza - 2 * margine) / proporzione))
  return { larghezza: Math.floor(altezza * proporzione), altezza: Math.floor(altezza) }
}

const limita = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v))

/**
 * Avanzamento dello sfoglio, da −1 a 1, per uno spostamento `dx` del dito lungo la pagina: verso la rilegatura (dx negativo) si va avanti, verso il bordo libero si torna indietro. All'ultima pagina in avanti e alla prima all'indietro il foglio cede appena e poi resiste.
 */
export function avanzamento(dx: number, larghezza: number, indice: number, totale: number): number {
  if (larghezza <= 0) return 0
  const p = limita(-dx / larghezza, -1, 1)
  const alCapo = p > 0 ? indice >= totale - 1 : indice <= 0
  return alCapo ? Math.sign(p) * MOBILE.resistenza * (1 - Math.exp(-Math.abs(p) / MOBILE.resistenza)) : p
}

/**
 * Angolo del foglio in gradi (0 = disteso, 90 = di taglio sulla rilegatura) per una frazione `p` di pagina percorsa: il bordo libero segue il dito, perché la larghezza del foglio visto di fronte è cos θ = 1 − p. La prospettiva allarga un poco il bordo che si alza verso chi guarda: lo scarto dal dito è piccolo e non si corregge, perché la larghezza prospettica non cala in modo monotono vicino a zero e il foglio scatterebbe all'inizio del gesto.
 */
export function angoloFoglio(p: number): number {
  return (Math.acos(1 - limita(p, 0, 1)) * 180) / Math.PI
}

/**
 * Rilascio del dito: 1 completa lo sfoglio in avanti, −1 all'indietro, 0 riporta il foglio a posto. Completa oltre `sogliaDistanza` di pagina, o con un colpo veloce nel verso dello sfoglio anche se corto; un colpo veloce nel verso opposto lo annulla. `velocita` è quella del dito lungo la pagina in px/ms (negativa verso la rilegatura).
 */
export function rilascio(p: number, velocita: number, indice: number, totale: number): -1 | 0 | 1 {
  if (p === 0) return 0
  const verso = p > 0 ? 1 : -1
  if (verso > 0 ? indice >= totale - 1 : indice <= 0) return 0
  const spinta = -velocita * verso
  if (spinta <= -MOBILE.sogliaVelocita) return 0
  return Math.abs(p) >= MOBILE.sogliaDistanza || spinta >= MOBILE.sogliaVelocita ? verso : 0
}

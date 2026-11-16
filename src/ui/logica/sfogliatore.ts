/**
 * Conti puri dello sfogliatore (testati): misura delle pagine e didascalia della pagina visibile.
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

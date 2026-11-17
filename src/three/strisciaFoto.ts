import { SRGBColorSpace, TextureLoader, type Texture } from 'three'
import { alCentro, altezzaRuotata, centraSu, CODA_RULLINO, layoutStriscia, limitiZoom, limita, rapportoRuotato, scorri, visibili, zooma, type Finestra, type LayoutStriscia, type LimitiZoom } from '../core/striscia.ts'
import type { Fotogramma, RullinoDati } from '../data'

/** Fotogrammi caricati attorno alla finestra: oltre questo margine la foto torna al suo posto e la texture si libera. */
export const MARGINE = 2

/** Una cella della pellicola: un fotogramma dell'ordine dei dati, con bordo sinistro e larghezza in altezze di fotogramma. */
export interface Posata {
  indice: number
  inizio: number
  largo: number
}

/** Geometria della striscia di un rullino, calcolata una volta dai dati. `altezzaNativa` è la più piccola altezza in pixel delle foto dopo la rotazione: è il tetto dello zoom. */
export interface Geometria {
  layout: LayoutStriscia
  posate: Posata[]
  altezzaNativa: number
}

export function geometria(D: RullinoDati): Geometria {
  const rapporti = D.foto.map((f) => rapportoRuotato(f.width, f.height, D.rotazione))
  const layout = layoutStriscia(rapporti, 0.06, CODA_RULLINO)
  return {
    layout,
    posate: layout.inizio.map((inizio, indice) => ({ indice, inizio, largo: layout.largo[indice] })),
    altezzaNativa: Math.min(...D.foto.map((f) => altezzaRuotata(f.width, f.height, D.rotazione))),
  }
}

/** Quanto è lunga `srcPiccola` rispetto a `src` (lato lungo ≤ 1024, stesso rapporto); 1 se `src` non supera già 1024. */
export const latoPiccola = (f: Fotogramma) => (Math.max(f.width, f.height) > 1024 ? 1024 / Math.max(f.width, f.height) : 1)

/** Altezza in pixel veri della versione piccola dopo la rotazione: sopra questa `h` serve il file grande. */
export const altezzaPiccola = (f: Fotogramma, D: RullinoDati) => altezzaRuotata(f.width, f.height, D.rotazione) * latoPiccola(f)

/**
 * Stato della striscia aperta: `{ x, h }` in pixel CSS. Non cambia mai riferimento: lo mutano i gesti, i tween lo leggono a ogni tick. Chiudere il rullino toglie lo stato (il componente lo scarta): quelli che arrivano dopo il negozio delle texture non lo trovano più.
 */
export interface Striscia {
  x: number
  h: number
  finestra: Finestra
  zoom: LimitiZoom
}

/** Striscia appena aperta: zoom minimo, dal primo fotogramma. */
export function strisciaIniziale(G: Geometria, finestra: Finestra): Striscia {
  const zoom = limitiZoom(finestra, G.altezzaNativa)
  return { x: 0, h: zoom.min, finestra, zoom }
}

/** Ricalcola i limiti (al resize) senza perdere lo scorrimento in altezze di fotogramma. */
export function aggiornaFinestra(s: Striscia, G: Geometria, finestra: Finestra) {
  const sotto = s.x / s.h
  s.finestra = finestra
  s.zoom = limitiZoom(finestra, G.altezzaNativa)
  Object.assign(s, limita({ x: sotto * s.h, h: s.h }, G.layout, finestra, s.zoom))
}

/** Scorrimento di `dx` pixel; ritorna se qualcosa è cambiato. */
export function scorriDi(s: Striscia, dx: number, G: Geometria): boolean {
  const prima = s.x
  Object.assign(s, scorri(s, dx, G.layout, s.finestra, s.zoom))
  return s.x !== prima
}

/** Zoom di un fattore attorno a un punto (pixel CSS dal bordo sinistro della finestra). */
export function zoomaSu(s: Striscia, fattore: number, punto: number, G: Geometria) {
  Object.assign(s, zooma(s, fattore, punto, G.layout, s.finestra, s.zoom))
}

/**
 * Fotogramma sotto un punto della finestra (pixel CSS dal bordo sinistro), oppure `null` se lì c'è un taglio, la coda o il vuoto tra due foto.
 * Lo usano le due dita per scegliere il punto da lasciare fermo: sul vuoto lo zoom resta sul centro della finestra.
 */
export function fotoInPunto(s: Striscia, punto: number, G: Geometria): number | null {
  const u = (s.x + punto) / s.h
  const i = G.posate.find((p) => u >= p.inizio && u <= p.inizio + p.largo)
  return i ? i.indice : null
}

/** Altezza massima di uno zoom a due dita per frame: con le dita lontane un fattore libero farebbe saltare la striscia da un estremo all'altro. */
const SALTO_DITA = 2.2

/**
 * Zoom a due dita: il fattore è `distanza / distanza precedente`, limitato a un salto per frame. Il punto fermo è il centro del fotogramma sotto le dita (il loro baricentro in pixel CSS), perché è quello che si sta guardando; sul vuoto tra due foto resta il centro della finestra.
 */
export function zoomaDita(s: Striscia, distanza: number, precedente: number, baricentro: number, G: Geometria) {
  if (precedente <= 0) return
  const fattore = Math.min(SALTO_DITA, Math.max(1 / SALTO_DITA, distanza / precedente))
  const i = fotoInPunto(s, baricentro, G)
  if (i === null) zoomaSu(s, fattore, s.finestra.largo / 2, G)
  else {
    const p = G.posate[i]
    zoomaSu(s, fattore, (p.inizio + p.largo / 2) * s.h - s.x, G)
  }
}

/** Comando della tastiera o dell'Hud: il bersaglio di `x` per il tween breve. Frecce e zoom passano dalle stesse funzioni di `striscia.ts` della rotella e delle dita. */
export function comanda(s: Striscia, comando: 'zoom+' | 'zoom-' | 'avanti' | 'indietro', G: Geometria): number {
  if (comando === 'zoom+') zoomaSu(s, 1.2, s.finestra.largo / 2, G)
  else if (comando === 'zoom-') zoomaSu(s, 1 / 1.2, s.finestra.largo / 2, G)
  else {
    const i = alCentro(s, G.layout, s.finestra) + (comando === 'avanti' ? 1 : -1)
    Object.assign(s, centraSu(i, s, G.layout, s.finestra, s.zoom))
  }
  return s.x
}

/** Una foto caricata: la texture, la versione (`grande` = il file `src`) e la chiave della richiesta a cui risponde. */
export interface Caricata {
  tex: Texture
  grande: boolean
  chiave: string
}

/**
 * Negozio delle texture, per rullino e per indice. `richiesta` è l'ultima versione chiesta, `pronta` la texture in campo con la chiave della sua richiesta (una richiesta arrivata dopo la supera), `inCorso` i caricamenti che stanno arrivando. Vive fuori dal componente: chiudere e riaprire non rifà le richieste, e chi resta fuori dal margine libera la texture.
 */
interface Voce {
  richiesta: string | null
  pronta: Caricata | null
  inCorso: number
}

const voci = new Map<string, Map<number, Voce>>()

/**
 * Una richiesta per file e versione (`srcPiccola === src` è una sola richiesta): chi riapre il rullino o torna su una foto già vista aspettava una nuova richiesta senza la cache. La texture si toglie dalla cache quando si libera (`dispose`), così non resta appesa a un file liberato.
 */
const cache = new Map<string, Promise<Texture>>()

function caricaFile(url: string): Promise<Texture> {
  let p = cache.get(url)
  if (!p) {
    p = new Promise<Texture>((ok, ko) => {
      new TextureLoader().load(
        url,
        (tex) => {
          tex.colorSpace = SRGBColorSpace
          tex.addEventListener('dispose', () => {
            if (cache.get(url) === p) cache.delete(url)
          })
          ok(tex)
        },
        undefined,
        (e) => {
          cache.delete(url)
          ko(e)
        },
      )
    })
    cache.set(url, p)
  }
  return p
}

/**
 * Porta le texture dei fotogrammi attorno alla finestra (margine `MARGINE`) alla versione giusta: prima la piccola, poi la grande quando `h` supera l'altezza in pixel della piccola dopo la rotazione. Le foto fuori dal margine tornano al loro posto: la texture si libera quando non è più di nessuna foto in campo e non sta più arrivando per nessuno.
 * `onCambio` è chiamato quando una texture arriva (o fallisce): il chiamante chiama `invalidate()`.
 */
export function caricaAttorno(s: Striscia, D: RullinoDati, G: Geometria, onCambio: () => void) {
  const attorno = visibili(s, G.layout, s.finestra, MARGINE)
  const fini = new Set<number>()
  if (attorno) for (let i = attorno[0]; i <= attorno[1]; i++) fini.add(i)
  let m = voci.get(D.id)
  if (m) {
    for (const [i, v] of m) {
      if (fini.has(i) || v.inCorso > 0) continue
      const tex = v.pronta?.tex
      m.delete(i)
      // Primo si toglie la voce, poi si libera: il caricamento (TextureLoader non si annulla) non trova più nulla, la richiesta resta in cache per la prossima apertura.
      if (tex && !inCampo(tex)) tex.dispose()
    }
  }
  if (!attorno) return
  if (!m) {
    m = new Map()
    voci.set(D.id, m)
  }
  for (let i = attorno[0]; i <= attorno[1]; i++) {
    const foto = D.foto[i]
    const grande = s.h > altezzaPiccola(foto, D)
    const chiave = grande ? foto.src : foto.srcPiccola
    let v = m.get(i)
    if (!v) {
      v = { richiesta: null, pronta: null, inCorso: 0 }
      m.set(i, v)
    }
    if (v.richiesta === chiave) continue
    v.richiesta = chiave
    v.inCorso++
    void caricaFile(chiave)
      .then((tex) => {
        const ora = voci.get(D.id)?.get(i)
        if (ora) ora.inCorso--
        // Uscita dal margine mentre il file arrivava: la texture resta nella cache per la prossima apertura.
        // Rullino chiuso o foto uscita dal margine mentre il file arrivava: la texture resta in cache per la prossima apertura.
        if (ora !== v) return
        // Una richiesta arrivata dopo questa ha già occupato la cella: questa non serve.
        const prima = ora.pronta
        if (prima && prima.chiave !== chiave) return
        if (prima && prima.tex !== tex && !inCampo(prima.tex)) prima.tex.dispose()
        ora.pronta = { tex, grande, chiave }
        onCambio()
      })
      .catch(() => {
        // File mancante: la cella resta il negativo vuoto e si ritenta alla prossima apertura.
        const ora = voci.get(D.id)?.get(i)
        if (ora) ora.inCorso--
        v.richiesta = null
        if (ora === v) onCambio()
      })
  }
}

/** Se una texture è ancora la foto in campo di qualche rullino del negozio. */
const inCampo = (tex: Texture) => [...voci.values()].some((m) => [...m.values()].some((v) => v.pronta?.tex === tex))

/** Le foto pronte da disegnare sulla striscia, con la loro cella. Il negativo vuoto si mostra finché la foto non è arrivata. */
export interface Pronta extends Caricata {
  cella: Posata
}

export function pronte(D: RullinoDati, G: Geometria): Pronta[] {
  const m = voci.get(D.id)
  if (!m) return []
  const out: Pronta[] = []
  for (const p of G.posate) {
    const v = m.get(p.indice)
    if (v?.pronta) out.push({ ...v.pronta, cella: p })
  }
  return out
}

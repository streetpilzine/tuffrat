/**
 * Geometria e limiti della striscia di un rullino srotolato (funzioni pure, testate).
 * Coordinate lungo la striscia in «altezze di fotogramma»: un fotogramma è alto 1 e largo quanto il suo rapporto dopo la rotazione. Sullo schermo lo stato è `{ x, h }`: `h` è l'altezza di un fotogramma in pixel CSS (lo zoom), `x` lo scorrimento in pixel dall'inizio della striscia.
 */

export interface StatoStriscia {
  /** Scorrimento in pixel: 0 = inizio della striscia sul bordo sinistro della finestra. */
  x: number
  /** Altezza di un fotogramma in pixel CSS. */
  h: number
}

export interface LayoutStriscia {
  /** Bordo sinistro di ogni fotogramma, in altezze di fotogramma. */
  inizio: number[]
  /** Larghezza di ogni fotogramma, in altezze di fotogramma. */
  largo: number[]
  lunghezza: number
}

export interface Finestra {
  /** Larghezza e altezza in pixel CSS dell'area in cui si vede la striscia. */
  largo: number
  alto: number
}

export interface LimitiZoom {
  min: number
  max: number
}

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v))

/** Rapporto larghezza/altezza di una foto posata sulla striscia con una rotazione di `gradi` (i file restano diritti). */
export function rapportoRuotato(width: number, height: number, gradi: number): number {
  const quarto = ((Math.round(gradi / 90) % 4) + 4) % 4
  return quarto % 2 === 1 ? height / width : width / height
}

/** Altezza in pixel veri di una foto sulla striscia, dopo la rotazione: è il tetto dello zoom. */
export function altezzaRuotata(width: number, height: number, gradi: number): number {
  const quarto = ((Math.round(gradi / 90) % 4) + 4) % 4
  return quarto % 2 === 1 ? width : height
}

/** Fotogrammi in fila, separati da `spazio`, con una coda vuota in testa e in fondo. */
export function layoutStriscia(rapporti: number[], spazio = 0.06, coda = 0.35): LayoutStriscia {
  const inizio: number[] = []
  let s = coda
  for (const r of rapporti) {
    inizio.push(s)
    s += r + spazio
  }
  return { inizio, largo: [...rapporti], lunghezza: rapporti.length ? s - spazio + coda : 0 }
}

/**
 * Limiti dello zoom in pixel di altezza del fotogramma. Massimo: il più piccolo tra i pixel veri della foto (mai ingrandire oltre 1:1) e l'80 % dell'altezza della finestra, così non serve scorrere in verticale. Minimo: circa il 30 % della finestra, che lascia vedere alcuni fotogrammi insieme.
 */
export function limitiZoom(finestra: Finestra, altezzaNativaPx: number): LimitiZoom {
  const max = Math.max(80, Math.min(altezzaNativaPx, finestra.alto * 0.8))
  const min = Math.min(max, Math.max(96, finestra.alto * 0.3))
  return { min, max }
}

/** Scorrimento massimo: la fine della striscia arriva al bordo destro della finestra. */
export const scorrimentoMax = (l: LayoutStriscia, h: number, finestra: Finestra) => Math.max(0, l.lunghezza * h - finestra.largo)

export function limita(s: StatoStriscia, l: LayoutStriscia, finestra: Finestra, zoom: LimitiZoom): StatoStriscia {
  const h = clamp(s.h, zoom.min, zoom.max)
  return { h, x: clamp(s.x, 0, scorrimentoMax(l, h, finestra)) }
}

export const scorri = (s: StatoStriscia, dxPx: number, l: LayoutStriscia, finestra: Finestra, zoom: LimitiZoom) => limita({ ...s, x: s.x + dxPx }, l, finestra, zoom)

/** Zoom di un `fattore` tenendo fermo il punto della striscia che sta a `puntoPx` dal bordo sinistro della finestra. */
export function zooma(s: StatoStriscia, fattore: number, puntoPx: number, l: LayoutStriscia, finestra: Finestra, zoom: LimitiZoom): StatoStriscia {
  const h = clamp(s.h * fattore, zoom.min, zoom.max)
  const sotto = (s.x + puntoPx) / s.h
  return limita({ h, x: sotto * h - puntoPx }, l, finestra, zoom)
}

/** Indici (primo, ultimo) dei fotogrammi che toccano la finestra, allargati di `margine` fotogrammi; `null` se nessuno. */
export function visibili(s: StatoStriscia, l: LayoutStriscia, finestra: Finestra, margine = 1): [number, number] | null {
  const da = s.x / s.h
  const a = (s.x + finestra.largo) / s.h
  let primo = -1
  let ultimo = -1
  l.inizio.forEach((x, i) => {
    if (x + l.largo[i] >= da && x <= a) {
      if (primo < 0) primo = i
      ultimo = i
    }
  })
  if (primo < 0) return null
  return [Math.max(0, primo - margine), Math.min(l.inizio.length - 1, ultimo + margine)]
}

/** Scorrimento che porta il fotogramma `i` al centro della finestra (frecce da tastiera e pulsanti dell'Hud). */
export function centraSu(i: number, s: StatoStriscia, l: LayoutStriscia, finestra: Finestra, zoom: LimitiZoom): StatoStriscia {
  const k = clamp(i, 0, l.inizio.length - 1)
  return limita({ ...s, x: (l.inizio[k] + l.largo[k] / 2) * s.h - finestra.largo / 2 }, l, finestra, zoom)
}

/** Fotogramma più vicino al centro della finestra. */
export function alCentro(s: StatoStriscia, l: LayoutStriscia, finestra: Finestra): number {
  const c = (s.x + finestra.largo / 2) / s.h
  const distanza = (i: number) => Math.abs(l.inizio[i] + l.largo[i] / 2 - c)
  let migliore = 0
  l.inizio.forEach((_, i) => {
    if (distanza(i) < distanza(migliore)) migliore = i
  })
  return migliore
}

/** Comandi che l'Hud (DOM) manda alla striscia aperta nel Canvas: come `ponte.ts`, un modulo e non un contesto. */
export type ComandoStriscia = 'zoom+' | 'zoom-' | 'avanti' | 'indietro'
let ascoltatore: ((c: ComandoStriscia) => void) | null = null
export const registraStriscia = (fn: ((c: ComandoStriscia) => void) | null) => {
  ascoltatore = fn
}
export const comandaStriscia = (c: ComandoStriscia) => ascoltatore?.(c)

/* --- Rullino aperto: dove stanno bussolotto e pellicola sullo schermo (pixel CSS del canvas) --- */

/** Proporzioni del 35 mm in altezze di fotogramma (24 mm): larghezza della pellicola (35 mm), passo delle perforazioni (4,75 mm), altezza e raggio del bussolotto (47 e 12,7 mm). */
export const FORMATO_35MM = { pellicola: 35 / 24, passo: 4.75 / 24, bussolottoAlto: 47 / 24, bussolottoRaggio: 12.7 / 24 }

/** Coda vuota in testa e in fondo alla striscia di un rullino: a inizio corsa il primo fotogramma deve stare tutto fuori dal bussolotto, il cui raggio copre la pellicola a destra dell'asse. */
export const CODA_RULLINO = FORMATO_35MM.bussolottoRaggio + 0.22

export interface PosaRullino {
  /** Ascissa dell'asse del bussolotto: l'inizio della striscia sta qui e la pellicola si vede da qui verso destra. */
  asse: number
  /** Ordinata del centro del bussolotto e della pellicola. */
  centro: number
  /** Area in cui scorre la striscia: dall'asse al bordo destro, alta quanto la fascia libera. */
  finestra: Finestra
}

/**
 * Rullino aperto: bussolotto a sinistra e pellicola che attraversa lo schermo verso destra, al centro della fascia libera tra la barra di navigazione in alto e i comandi in basso (sul telefono la riga dei pulsanti sopra la maniglia della scheda). Tutto dalla misura vera del canvas: su un telefono in verticale il bussolotto sta a filo del bordo sinistro, mezzo fuori, e la striscia prende quasi tutta la larghezza; su desktop il bussolotto si vede intero.
 */
export function posaRullino(largo: number, alto: number, mobile: boolean): PosaRullino {
  const basso = alto < 500
  const sopra = mobile ? (basso ? 60 : 96) : 80
  const sotto = mobile ? (basso ? 64 : 148) : 120
  const fascia = Math.max(120, alto - sopra - sotto)
  const asse = mobile ? 8 : clamp(largo * 0.14, 120, 240)
  return { asse, centro: sopra + fascia / 2, finestra: { largo: Math.max(1, largo - asse), alto: fascia } }
}

/** Lati (in altezze di fotogramma) del piano di una foto prima della rotazione: girato di `gradi`, occupa la cella larga `largo` e alta 1. */
export function latiFoto(largo: number, gradi: number): { w: number; h: number } {
  const quarto = ((Math.round(gradi / 90) % 4) + 4) % 4
  return quarto % 2 === 1 ? { w: 1, h: largo } : { w: largo, h: 1 }
}

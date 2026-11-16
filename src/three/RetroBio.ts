import { CanvasTexture, SRGBColorSpace } from 'three'

/**
 * Il retro della cornice del ritratto: la bio breve disegnata su un canvas e usata come texture. Niente drei `Text` né `Html`: una texture costa meno e non si sovrappone al DOM.
 *
 * Conto della leggibilità. Il canvas è largo 1024 px e copre la larghezza della foto (1,3 unità). `TARGET_BIO_RETRO` mette la camera di fronte alla cornice venuta avanti: su un telefono 390 × 700 vincola la larghezza e la cornice occupa il 96 % dello schermo, quindi il canvas misura circa 348 px CSS (fattore 0,34) e i 42 px del corpo diventano circa 14 px; su 1440 × 715 vincola l'altezza, la cornice è alta l'80 % dello schermo, il canvas circa 380 px di larghezza (fattore 0,37) e il corpo circa 15,5 px. La colonna tiene circa 41 caratteri per riga: i due paragrafi della bio breve più la citazione fanno una ventina di righe, che stanno nei 1546 px di altezza.
 */
const CANVAS_LARGO = 1024
const FONT_PX = 42
const INTERLINEA = 1.4
const MARGINE = 64
const CARTA = '#f7f7f5'
const TESTO = '#111111'
const ATTENUATO = '#555555'

/** Famiglia di caratteri del sito, letta dal `body`: il canvas non eredita il CSS. */
function famigliaSito(): string {
  const famiglia = document.body ? getComputedStyle(document.body).fontFamily : ''
  return famiglia && famiglia !== 'none' ? famiglia : 'sans-serif'
}

/** Spezza un paragrafo per parole con `measureText`, senza lasciare una parola sola sull'ultima riga. */
function aCapo(ctx: CanvasRenderingContext2D, testo: string, larghezza: number): string[] {
  const righe: string[] = []
  let riga = ''
  for (const parola of testo.split(/\s+/).filter(Boolean)) {
    const prova = riga ? `${riga} ${parola}` : parola
    if (riga && ctx.measureText(prova).width > larghezza) {
      righe.push(riga)
      riga = parola
    } else {
      riga = prova
    }
  }
  if (riga) righe.push(riga)
  const n = righe.length
  if (n > 1 && !righe[n - 1].includes(' ')) {
    const prima = righe[n - 2].split(' ')
    if (prima.length > 2) {
      righe[n - 2] = prima.slice(0, -1).join(' ')
      righe[n - 1] = `${prima[prima.length - 1]} ${righe[n - 1]}`
    }
  }
  return righe
}

export interface TestoRetro {
  nome: string
  paragrafi: string[]
  citazione: string
}

/** Disegna il retro e ritorna la texture. `rapporto` = altezza / larghezza della cornice. Chi la chiama la smaltisce. */
export function creaRetroBio({ nome, paragrafi, citazione }: TestoRetro, rapporto: number): CanvasTexture {
  const c = document.createElement('canvas')
  c.width = CANVAS_LARGO
  c.height = Math.round(CANVAS_LARGO * rapporto)
  const ctx = c.getContext('2d')!
  const famiglia = famigliaSito()
  const larghezza = c.width - MARGINE * 2
  ctx.fillStyle = CARTA
  ctx.fillRect(0, 0, c.width, c.height)
  ctx.textBaseline = 'alphabetic'
  ctx.textAlign = 'left'

  let y = MARGINE + 56
  ctx.fillStyle = TESTO
  ctx.font = `700 60px ${famiglia}`
  ctx.fillText(nome, MARGINE, y)
  y += 96

  const passo = FONT_PX * INTERLINEA
  ctx.font = `400 ${FONT_PX}px ${famiglia}`
  for (const paragrafo of paragrafi) {
    for (const riga of aCapo(ctx, paragrafo, larghezza)) {
      ctx.fillText(riga, MARGINE, y)
      y += passo
    }
    y += passo * 0.5
  }

  y += passo * 0.25
  ctx.font = `500 ${FONT_PX}px ${famiglia}`
  ctx.fillStyle = ATTENUATO
  for (const riga of aCapo(ctx, `«${citazione}»`, larghezza)) {
    ctx.fillText(riga, MARGINE, y)
    y += passo
  }

  const t = new CanvasTexture(c)
  t.colorSpace = SRGBColorSpace
  return t
}

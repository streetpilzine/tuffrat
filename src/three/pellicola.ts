import { CanvasTexture, PlaneGeometry, RepeatWrapping, SRGBColorSpace } from 'three'
import { FORMATO_35MM } from '../core/striscia.ts'

/**
 * La pellicola del rullino srotolato, disegnata su canvas (nessun asset). Misure in altezze di fotogramma, con le proporzioni del 35 mm vero (`FORMATO_35MM`): pellicola larga 35/24, otto perforazioni per fotogramma di formato pieno.
 */

/** Colore della base della pellicola e della cella di un fotogramma non ancora caricato (il negativo vuoto). */
export const COLORE_PELLICOLA = '#1a110b'
export const COLORE_NEGATIVO = '#7a4420'

/**
 * Tessera della pellicola: un passo di perforazione, alta quanto la pellicola, da ripetere lungo la striscia (`repeat.x` = lunghezza / passo). Le due perforazioni (2,8 × 2 mm, a 3 mm dal bordo) sono buchi veri: trasparenti, con `alphaTest` lasciano vedere quello che sta dietro.
 */
export function creaTexturePellicola(): CanvasTexture {
  const c = document.createElement('canvas')
  c.width = 32
  c.height = 236
  const ctx = c.getContext('2d')!
  ctx.fillStyle = COLORE_PELLICOLA
  ctx.fillRect(0, 0, c.width, c.height)
  // Il bordo del fotogramma, appena più chiaro della base: si intravede dove la cella non copre.
  const pxPerAltezza = c.height / FORMATO_35MM.pellicola
  ctx.fillStyle = '#24180f'
  ctx.fillRect(0, (c.height - pxPerAltezza) / 2, c.width, pxPerAltezza)
  ctx.globalCompositeOperation = 'destination-out'
  const foroLargo = (2.8 / 4.75) * c.width
  const foroAlto = (2 / 24) * pxPerAltezza
  const dalBordo = (3 / 24) * pxPerAltezza
  for (const y of [dalBordo, c.height - dalBordo]) {
    ctx.beginPath()
    ctx.roundRect((c.width - foroLargo) / 2, y - foroAlto / 2, foroLargo, foroAlto, 3)
    ctx.fill()
  }
  const t = new CanvasTexture(c)
  t.colorSpace = SRGBColorSpace
  t.wrapS = RepeatWrapping
  t.anisotropy = 4
  return t
}

/** Piano 1 × 1 condiviso: le foto e i pezzi di pellicola si scalano su questa geometria sola. */
export const geoPiano = new PlaneGeometry(1, 1)

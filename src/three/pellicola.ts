import { CanvasTexture, PlaneGeometry, RepeatWrapping, SRGBColorSpace } from 'three'

/**
 * Tessere della pellicola del rullino srotolato, disegnate su canvas (nessun asset nuovo). Tutte le misure sono in altezze di fotogramma, come il gruppo della pellicola. Perforazioni quadrate di lato circa un nono, come il 35 mm ingrandito 2,5× del bussolotto.
 */

/**
 * Il taglio della pellicola: una tessera larga `LARGO_PIENA` in altezze di fotogramma, ripetuta lungo i fotogrammi. Ogni tessera ha 16 perforazioni distanti `LARGO_PIENA / 16` = 0,09; il vuoto tra due fotogrammi è largo `LARGO_PIENA / 2` = 0,72 e comincia sul bordo della tessera, quindi i tagli del vuoto cadono a metà tra due perforazioni, allineati a quelli sopra e sotto la pellicola.
 */
export const LARGO_PIENA = 1.44

/** Quote della pellicola dal centro in su: fine del fotogramma, interno ed esterno del bordo nero, fila delle perforazioni. */
export const CORNICE = {
  foto: 0.5,
  bordoInterno: 0.5,
  bordoEsterno: 0.72,
  foroInterno: 0.74,
  foroEsterno: 0.94,
  /** Altezza in pixel della tessera delle perforazioni: 32, il doppio di 16. */
  altezzaFori: 32,
  /** Larghezza in pixel della tessera delle perforazioni: 128, potenza di due, 16 blocchi da 8 px. */
  largoPiena: 128,
  /** Larghezza in pixel della tessera del bordo, ripetuta `ripetizioniBordo` volte sul gruppo: 64 è la potenza di due più vicina. */
  largoBordo: 64,
  ripetizioniBordo: 20,
}

/** Tessera delle perforazioni in pellicola: 16 blocchi da 8 × 8 pixel (4 di foro con 2 di margine per lato) su fondo pellicola, ripetuta ogni `LARGO_PIENA` unità. */
export function creaTexturePiena(): CanvasTexture {
  const c = document.createElement('canvas')
  c.width = CORNICE.largoPiena
  c.height = CORNICE.altezzaFori
  const ctx = c.getContext('2d')!
  ctx.fillStyle = '#1a110b'
  ctx.fillRect(0, 0, c.width, c.height)
  ctx.globalCompositeOperation = 'destination-out'
  for (let i = 0; i < c.width / 8; i++) ctx.fillRect(i * 8 + 2, 7, 4, c.height - 14)
  const t = new CanvasTexture(c)
  t.colorSpace = SRGBColorSpace
  t.wrapS = RepeatWrapping
  t.anisotropy = 4
  return t
}

/**
 * Tessera del vuoto tonda i fotogrammi: la fila di perforazioni, trasparente attorno (l'aria fuori dalla pellicola), col buio della pellicola solo dove c'è ancora il fotogramma (`conFoto`: la testa e la coda, o il vuoto in coda alla porzione disegnata).
 * `fotoPrima` dice da che parte del vuoto sta la foto: la tessera comincia sul bordo sinistro della foto (prima metà foto, seconda metà vuoto).
 * La tessera è larga quanto quella della pellicola (`LARGO_PIENA`): una foto da 0,72 e il suo vuoto da 0,72, e i tagli di sopra e di sotto cascano a metà del vuoto, tra due perforazioni.
 */
export function creaTextureAria(conFoto: boolean, fotoPrima: boolean): CanvasTexture {
  const c = document.createElement('canvas')
  c.width = CORNICE.largoPiena
  c.height = CORNICE.altezzaFori
  const ctx = c.getContext('2d')!
  ctx.clearRect(0, 0, c.width, c.height)
  // La tessera comincia sul bordo sinistro della foto: prima metà foto, seconda metà vuoto. Con la foto prima il buio sta nella prima metà, con la foto dopo nella seconda.
  ctx.fillStyle = '#1a110b'
  if (conFoto) ctx.fillRect(fotoPrima ? 0 : c.width / 2, 0, c.width / 2, c.height)
  ctx.globalCompositeOperation = 'destination-out'
  for (let i = 0; i < c.width / 8; i++) ctx.fillRect(i * 8 + 2, 7, 4, c.height - 14)
  const t = new CanvasTexture(c)
  t.colorSpace = SRGBColorSpace
  t.wrapS = RepeatWrapping
  t.anisotropy = 4
  return t
}

/** Tessera del bordo nero tra fotogramma e perforazioni: schiarito verso il fotogramma, buio verso il margine esterno. */
export function creaTextureBordo(): CanvasTexture {
  const c = document.createElement('canvas')
  c.width = CORNICE.largoBordo
  c.height = 8
  const ctx = c.getContext('2d')!
  const nero = [26, 17, 11]
  for (let x = 0; x < CORNICE.largoBordo; x++) {
    const u = x / CORNICE.largoBordo
    const k = u < 0.3 ? 1 + 0.5 * (1 - u / 0.3) : u > 0.85 ? 1 - 0.45 * ((u - 0.85) / 0.15) : 1
    ctx.fillStyle = `rgb(${Math.round(nero[0] * k)}, ${Math.round(nero[1] * k)}, ${Math.round(nero[2] * k)})`
    ctx.fillRect(x, 0, 1, 8)
  }
  const t = new CanvasTexture(c)
  t.colorSpace = SRGBColorSpace
  t.wrapS = RepeatWrapping
  t.repeat.set(CORNICE.ripetizioniBordo, 1)
  return t
}

/** Colore della cella di un fotogramma non ancora caricato: la pellicola del negativo vuoto. */
export const COLORE_NEGATIVO = '#7a4420'

/** Piano 1 × 1 condiviso: tutte le foto e i pezzi di pellicola si scalano su questa geometria sola. */
export const geoPiano = new PlaneGeometry(1, 1)

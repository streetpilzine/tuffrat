/**
 * Logica pura della luce sulle tele col telefono in mano (nessun DOM, testata): dall'orientamento del dispositivo (`beta` = avanti/indietro, `gamma` = destra/sinistra, in gradi) alla posizione della luce nell'inquadratura.
 *
 * Le posizioni sono «normali»: frazioni del mezzo lato inquadrato, con (0, 0) al centro dello schermo e (1, 1) all'angolo in alto a destra. Così la stessa inclinazione sposta il riflesso della stessa quota di schermo, che si guardi un quadro da vicino o tutto il muro.
 */

export const INCLINAZIONE = {
  /** Gradi di inclinazione che portano la luce al massimo scostamento; oltre resta ferma. */
  angoloPieno: 25,
  /** Peso del filtro passa-basso a ogni lettura del sensore (circa 60 al secondo): il riflesso scivola, non tremola. */
  filtro: 0.15,
  /** Sotto questo passo (in posizione normale) la luce non si ridisegna: a telefono fermo il Canvas resta fermo. */
  soglia: 0.003,
  /** Dove sta la luce a telefono fermo: in alto a destra del centro, come una finestra di lato. Il riflesso si vede sulla tela senza coprirne il centro. */
  riposo: { x: 0.35, y: 0.5 },
  /** Di quanto si sposta la luce, al massimo, per asse. */
  ampiezza: 0.8,
}

export interface Orientamento {
  beta: number
  gamma: number
}

const limita = (v: number, max: number) => Math.max(-max, Math.min(max, v))

/** Filtro esponenziale: avvicina `attuale` al bersaglio di `peso` a ogni lettura. */
export function filtra(attuale: number, bersaglio: number, peso = INCLINAZIONE.filtro): number {
  return attuale + (bersaglio - attuale) * Math.max(0, Math.min(1, peso))
}

/**
 * Scostamento della luce (da −1 a 1 per asse) per l'inclinazione corrente rispetto a quella «neutra», cioè a come si teneva il telefono alla prima lettura: chi lo tiene a 45° parte comunque da zero. Girando il polso a destra la luce va a destra; piegando in avanti la cima del telefono la luce sale.
 */
export function scostamento(ora: Orientamento, neutro: Orientamento): { x: number; y: number } {
  const { angoloPieno } = INCLINAZIONE
  // `|| 0` toglie lo zero negativo.
  return {
    x: limita(ora.gamma - neutro.gamma, angoloPieno) / angoloPieno || 0,
    y: limita(neutro.beta - ora.beta, angoloPieno) / angoloPieno || 0,
  }
}

/** Posizione normale della luce per uno scostamento: il riposo più lo scostamento, per l'ampiezza. */
export function posizioneLuce(s: { x: number; y: number }): { x: number; y: number } {
  const { riposo, ampiezza } = INCLINAZIONE
  return { x: riposo.x + s.x * ampiezza, y: riposo.y + s.y * ampiezza }
}

/**
 * Geometria del mondo 3D (ARCHITECTURE §7). Costanti pure, senza dipendenze: le usano scene-map, layout e scene.
 * 1 unità = 50 cm. Il muro è il piano z=0; il banco sta davanti, a z≈2.2.
 */

/** cm → unità mondo. 100 cm = 2 unità. */
export const SCALA = 1 / 50

/** Estensione orizzontale del muro e quota del suo centro. */
export const MURO = { xMin: -18, xMax: 14, yCentro: 2, alto: 8, pavimento: -1.5 }

/** Ascissa del centro di ogni zona del muro. */
export const ZONA = {
  home: 0,
  roundabout: -6.6,
  bustine: -10.2,
  mostre: -13.9,
  bio: 6.5,
  tv: 8.5,
}

/** Piano del banco: quota della superficie, centro in z, dimensioni. */
export const BANCO = { y: -0.56, z: 2.2, largo: 4.6, profondo: 1.5 }

/** Passo della griglia di riaggancio dei quadri (12,5 cm). */
export const PASSO_GRIGLIA = 0.25

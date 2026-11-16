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

/**
 * TV accanto al ritratto: posa del gruppo (rotazione attorno alla verticale), corpo, piano dello schermo e pulsante di accensione nel sistema locale del corpo. Lo schermo misura 0,72 × 0,54 (4:3), così l'iframe del video non si deforma. Il pulsante sta in basso a destra sul frontale, sotto le due manopole.
 */
export const TV = {
  x: ZONA.tv,
  z: 0.55,
  giro: -0.18,
  mobileAlto: 1.1,
  corpo: { w: 1.05, h: 0.86, d: 0.8 },
  schermo: { x: -0.12, y: 0.02, w: 0.72, h: 0.54 },
  manopole: { x: 0.39, y: [0.2, 0.02], r: 0.055 },
  pulsante: { x: 0.39, y: -0.27, r: 0.05 },
}

/** Un punto del frontale della TV (coordinate locali del corpo) in coordinate mondo, con la normale del frontale: servono al target della camera quando il video è in primo piano. */
export function frontaleTv(lx: number, ly: number): { punto: [number, number, number]; normale: [number, number, number] } {
  const c = Math.cos(TV.giro)
  const s = Math.sin(TV.giro)
  const lz = TV.corpo.d / 2
  const y = MURO.pavimento + TV.mobileAlto + TV.corpo.h / 2 + ly
  return { punto: [TV.x + lx * c + lz * s, y, TV.z - lx * s + lz * c], normale: [s, 0, c] }
}

/** Ritratto sul muro della bio: centro a riposo, misure della foto (1060 × 1600) e del bordo della cornice, distanza dal muro quando viene in primo piano e si gira per mostrare il retro. */
export const RITRATTO = { x: ZONA.bio, y: 1.5, largo: 1.3, alto: (1.3 * 1600) / 1060, bordo: 0.06, zPrimoPiano: 0.9 }

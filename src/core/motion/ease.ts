import gsap from 'gsap'
import { CustomEase } from 'gsap/CustomEase'

gsap.registerPlugin(CustomEase)

/** Curva base del sistema visivo TuffRat (tuffrat-visual B7): cubic-bezier(0.22, 1, 0.36, 1). */
export const EASE_TUFFRAT = CustomEase.create('tuffrat', '0.22,1,0.36,1')

export { gsap }

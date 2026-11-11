import type { Misure, Opera } from '../data'

const num = (n: number) => String(n).replace('.', ',')

export const misureLabel = (m: Misure) => `${num(m.w)}×${num(m.h)} ${m.unit}`

/** «Tecnica mista su compensato di legno», come nelle didascalie del sito precedente. */
export const tecnicaCompleta = (o: Pick<Opera, 'tecnica' | 'supporto'>) =>
  o.supporto ? `${o.tecnica} su ${o.supporto.charAt(0).toLowerCase()}${o.supporto.slice(1)}` : o.tecnica

/** «Titolo · Anno · Misure · Tecnica» */
export const didascalia = (o: Opera) => [o.titolo, o.anno, misureLabel(o.misure), tecnicaCompleta(o)].join(' · ')

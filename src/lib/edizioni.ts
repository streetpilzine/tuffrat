import { edizioni } from '../data'
import { edizioniDiProva } from '../dev/rivista-test'

/** Edizioni mostrate dall'app: quelle dei dati più, solo in dev, la rivista di prova. */
export const edizioniVisibili = [...edizioni, ...edizioniDiProva]
export const edizioneVisibile = (id: string | undefined) => edizioniVisibili.find((e) => e.id === id)

import type { Polittico } from './schema.ts'

const img = (src: string, width: number, height: number, alt: string) => ({ src, width, height, alt })
const cm = (w: number, h: number) => ({ w, h, unit: 'cm' as const })

/** Bustine di tè: pannelli piatti dello stesso titolo, da affiancare e riordinare sul piano. */
export const polittici: Polittico[] = [
  {
    id: 'te-nero',
    titolo: 'Tè Nero',
    anno: 2024,
    tecnica: 'Tecnica mista | acrilico',
    supporto: 'Multistrato di legno',
    serie: 'bustine-di-te',
    ordineDefault: ['te-nero-1', 'te-nero-2', 'te-nero-3'],
    pannelli: [
      {
        id: 'te-nero-1',
        titolo: 'Tè Nero I',
        anno: 2024,
        tecnica: 'Tecnica mista | acrilico',
        supporto: 'Multistrato di legno',
        misure: cm(37, 50.5),
        stato: 'riservato',
        immagine: img('/assets/img/opere/serie-03/full/2024_TeNero_01.webp', 1400, 1905, 'Tè Nero I, 2024'),
        serie: 'bustine-di-te',
      },
      {
        id: 'te-nero-2',
        titolo: 'Tè Nero II',
        anno: 2024,
        tecnica: 'Tecnica mista | acrilico',
        supporto: 'Multistrato di legno',
        misure: cm(37, 50.5),
        stato: 'riservato',
        immagine: img('/assets/img/opere/serie-03/full/2024_TeNero_02.webp', 1400, 1861, 'Tè Nero II, 2024'),
        serie: 'bustine-di-te',
      },
      {
        id: 'te-nero-3',
        titolo: 'Tè Nero III',
        anno: 2024,
        tecnica: 'Tecnica mista | acrilico',
        supporto: 'Multistrato di legno',
        misure: cm(37, 50.5),
        stato: 'riservato',
        immagine: img('/assets/img/opere/serie-03/full/2024_TeNero_03.webp', 1400, 1899, 'Tè Nero III, 2024'),
        serie: 'bustine-di-te',
      },
    ],
  },
  {
    id: 'te-verde',
    titolo: 'Tè Verde',
    anno: 2023,
    tecnica: 'Tecnica mista | acrilico',
    supporto: 'Multistrato di legno',
    serie: 'bustine-di-te',
    ordineDefault: ['te-verde-1', 'te-verde-2'],
    pannelli: [
      {
        id: 'te-verde-1',
        titolo: 'Tè Verde I',
        anno: 2023,
        tecnica: 'Tecnica mista | acrilico',
        supporto: 'Multistrato di legno',
        misure: cm(60, 50),
        stato: 'disponibile',
        immagine: img('/assets/img/opere/serie-03/full/2023_TeVerde_01.webp', 1400, 1169, 'Tè Verde I, 2023'),
        serie: 'bustine-di-te',
      },
      {
        id: 'te-verde-2',
        titolo: 'Tè Verde II',
        anno: 2023,
        tecnica: 'Tecnica mista | acrilico',
        supporto: 'Multistrato di legno',
        misure: cm(60, 50),
        stato: 'disponibile',
        immagine: img('/assets/img/opere/serie-03/full/2023_TeVerde_02.webp', 1400, 1150, 'Tè Verde II, 2023'),
        serie: 'bustine-di-te',
      },
    ],
  },
]

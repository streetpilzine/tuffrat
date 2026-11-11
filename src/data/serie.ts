import type { Serie } from './schema.ts'

const img = (src: string, width: number, height: number, alt: string) => ({ src, width, height, alt })

export const serie: Serie[] = [
  {
    id: '2023-2025',
    titolo: 'Serie 01',
    periodo: '2023–2025',
    descrizione: 'Lavori del periodo 2023–2025 non legati a una serie tematica: tela, collage, supporti di recupero.',
    copertina: img('/assets/img/opere/serie-01/full/2023_piccionaiax_01.webp', 1400, 1567, 'Serie 01, Piccionaiax'),
    tipo: 'raccolta',
    opere: ['piccionaiax', 'ronfronf'],
    ordine: 1,
  },
  {
    id: 'roundabout',
    titolo: 'Roundabout',
    periodo: '2024',
    descrizione:
      'Serie 2024, tecnica mista su multistrato di legno. Quattro tessere quadrate fisicamente separate: l’opera si ricompone ruotandole e scambiandole di posto, e ogni disposizione è una versione legittima.',
    copertina: img('/assets/img/opere/serie-02/full/2024_Roundabout_01.webp', 1400, 1400, 'Roundabout'),
    tipo: 'modulare',
    opere: ['roundabout-1', 'roundabout-2', 'roundabout-3', 'roundabout-4'],
    modulare: {
      tessere: [{ opera: 'roundabout-1' }, { opera: 'roundabout-2' }, { opera: 'roundabout-3' }, { opera: 'roundabout-4' }],
      permutazioneDefault: [0, 1, 2, 3],
      rotazioniDefault: [0, 0, 0, 0],
    },
    ordine: 2,
  },
  {
    id: 'bustine-di-te',
    titolo: 'Bustine di tè',
    periodo: '2023–2024',
    descrizione: 'Serie 2023–2024, tecnica mista su multistrato di legno. Pannelli piatti dello stesso titolo, pensati per essere visti affiancati.',
    copertina: img('/assets/img/opere/serie-03/full/2024_TeNero_01.webp', 1400, 1905, 'Bustine di tè, Tè Nero'),
    tipo: 'polittici',
    polittici: ['te-nero', 'te-verde'],
    ordine: 3,
  },
]

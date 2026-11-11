import { z } from 'zod'

/** Slug kebab-case, unico per collezione. */
export const Slug = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'slug kebab-case')
export type Slug = z.infer<typeof Slug>

export const Immagine = z.object({
  src: z.string().startsWith('/assets/'),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  alt: z.string().min(1),
})
export type Immagine = z.infer<typeof Immagine>

export const Stato = z.enum([
  'disponibile',
  'su-richiesta',
  'venduto',
  'collezione-privata',
  'in-prestito',
  'riservato',
  'non-disponibile',
])
export type Stato = z.infer<typeof Stato>

export const Misure = z.object({
  w: z.number().positive(),
  h: z.number().positive(),
  unit: z.literal('cm'),
})
export type Misure = z.infer<typeof Misure>

export const Opera = z.object({
  id: Slug,
  titolo: z.string().min(1),
  anno: z.number().int().min(2000).max(2100),
  tecnica: z.string().min(1),
  supporto: z.string().optional(),
  misure: Misure,
  stato: Stato,
  nota: z.string().optional(),
  immagine: Immagine,
  dettagli: z.array(Immagine).optional(),
  serie: Slug.optional(),
  inHome: z.boolean().optional(),
  ordine: z.number().int().optional(),
})
export type Opera = z.infer<typeof Opera>

/** Opera a più pannelli complanari (Bustine di tè). */
export const Polittico = z.object({
  id: Slug,
  titolo: z.string().min(1),
  anno: z.number().int(),
  tecnica: z.string().min(1),
  supporto: z.string().optional(),
  serie: Slug,
  pannelli: z.array(Opera).min(2),
  ordineDefault: z.array(Slug).min(2),
})
export type Polittico = z.infer<typeof Polittico>

/** Tessera di un'opera modulare (Roundabout): rimanda a un'Opera; la texture 3D arriva in fase 2. */
export const Tessera = z.object({
  opera: Slug,
  texture: z.string().startsWith('/assets/').optional(),
})
export type Tessera = z.infer<typeof Tessera>

export const Serie = z.object({
  id: Slug,
  titolo: z.string().min(1),
  periodo: z.string().min(1),
  descrizione: z.string(),
  copertina: Immagine,
  tipo: z.enum(['raccolta', 'modulare', 'polittici']),
  opere: z.array(Slug).optional(),
  polittici: z.array(Slug).optional(),
  modulare: z
    .object({
      tessere: z.array(Tessera).length(4),
      permutazioneDefault: z.array(z.number().int().min(0).max(3)).length(4),
      rotazioniDefault: z.array(z.union([z.literal(0), z.literal(90), z.literal(180), z.literal(270)])).length(4),
    })
    .optional(),
  ordine: z.number().int().optional(),
})
export type Serie = z.infer<typeof Serie>

export const Edizione = z.object({
  id: Slug,
  titolo: z.string().min(1),
  anno: z.number().int(),
  tipo: z.literal('fanzine'),
  descrizione: z.string().optional(),
  copertina: Immagine,
  pagine: z.array(z.string().startsWith('/assets/')).min(1),
  fonte: z.string().optional(),
})
export type Edizione = z.infer<typeof Edizione>

export const Mostra = z.object({
  id: Slug,
  titolo: z.string().min(1),
  anno: z.number().int(),
  luogo: z.string().min(1),
  citta: z.string().min(1),
  tipo: z.enum(['collettiva', 'personale']).optional(),
  link: z.object({ instagram: z.string().url().optional() }).optional(),
  flyer: Immagine.optional(),
  nota: z.string().optional(),
})
export type Mostra = z.infer<typeof Mostra>

export const Artista = z.object({
  brand: z.literal('TuffRat'),
  nome: z.literal('Malli'),
  eyebrow: z.string(),
  lede: z.array(z.string().min(1)).min(1),
  bioBreve: z.array(z.string().min(1)).min(1),
  bio: z.array(z.string().min(1)).min(1),
  statement: z.string().min(1),
  citazione: z.string().min(1),
  ritratto: Immagine,
  profilo: Immagine,
  contatti: z.object({
    email: z.string().email(),
    instagram: z.string().url(),
    instagramHandle: z.string().min(1),
  }),
  video: z.object({
    pulsos: z.object({ youtubeId: z.string().min(1), titolo: z.string().min(1), anno: z.number().int() }),
  }),
})
export type Artista = z.infer<typeof Artista>

/** Etichette italiane dello stato, come compaiono nelle schede. */
export const statoLabel: Record<Stato, string> = {
  disponibile: 'Disponibile',
  'su-richiesta': 'Su richiesta',
  venduto: 'Venduto',
  'collezione-privata': 'Collezione privata · su richiesta',
  'in-prestito': 'Attualmente non disponibile · in prestito per mostra',
  riservato: 'Riservato · in asta',
  'non-disponibile': 'Non disponibile',
}

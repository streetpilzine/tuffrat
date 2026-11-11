import type { Artista } from './schema.ts'

/** Testi da legacy/index.html e legacy/about/index.html, invariati. */
export const artista: Artista = {
  brand: 'TuffRat',
  nome: 'Malli',
  eyebrow: 'Portfolio',
  lede: ["Arte dal profondo dell'underground.", 'Calligrafia, graffiti, fotografia analogica.'],
  bioBreve: [
    "Nel suo lavoro multidisciplinare, TuffRat intreccia pittura, fotografia e sonorità hip hop, trattando l'arte come un'estensione diretta dell'esperienza di vita. Cresciuto all'interno del collettivo Melograno, ha iniziato il suo percorso artistico attraverso i graffiti, un background che ha definito il suo approccio istintivo alla creazione.",
    "Rifiutando la ricerca di un'estetica puramente decorativa, TuffRat agisce come catalizzatore del disagio contemporaneo. La sua pratica mira a una comunicazione limpida che riflette la società attuale, catturando l'essenza cruda della vitalità piuttosto che una sua rappresentazione costruita.",
  ],
  bio: [
    "Nel suo lavoro multidisciplinare, TuffRat intreccia pittura, fotografia e sonorità hip hop, trattando l'arte come un'estensione diretta e necessaria dell'esperienza di vita. Cresciuto all'interno del collettivo Melograno, ha iniziato il suo percorso artistico attraverso i graffiti e la cultura urbana, un background che ha definito il suo approccio istintivo e la concezione della creatività come atto condiviso.",
    "Rifiutando la ricerca di un'estetica puramente decorativa, TuffRat agisce come catalizzatore del disagio contemporaneo. La sua pratica non mira alla perfezione formale, ma a una comunicazione limpida e oggettiva che riflette la società attuale. Nella fotografia, il suo sguardo indaga l'ambiente e la figura umana con un approccio talvolta intrusivo o casuale, mirato a catturare l'essenza cruda della vitalità piuttosto che una sua rappresentazione costruita.",
    "Per TuffRat l'opera d'arte trascende il giudizio binario di «bello» o «brutto» per diventare testimonianza coerente dell'esistenza. La sua produzione nasce dall'urgenza di trasformare la complessità e le frustrazioni del quotidiano in forme espressive che non pongono confini tra l'atto creativo e la vita stessa.",
  ],
  statement:
    "La sua ricerca rifiuta l'estetica decorativa e punta a una comunicazione limpida, capace di riflettere la società attuale catturando l'essenza cruda della vitalità piuttosto che una sua rappresentazione costruita.",
  citazione: "L'arte deve essere come la vita stessa: né buona né cattiva, ma oggettiva.",
  ritratto: { src: '/assets/img/artist/foto_presentazione.webp', width: 1080, height: 720, alt: "Ritratto dell'artista" },
  profilo: { src: '/assets/img/artist/profilo.webp', width: 1060, height: 1600, alt: 'Foto profilo' },
  contatti: {
    email: 'streetpilzine@gmail.com',
    instagram: 'https://www.instagram.com/tuff_rat/',
    instagramHandle: '@tuff_rat',
  },
  video: {
    pulsos: { youtubeId: 'ngi81Oa-Jtc', titolo: 'PULSOS Ep.10', anno: 2025 },
  },
}

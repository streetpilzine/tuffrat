---
titolo: Audit del sito statico (legacy/) prima del redesign
progetto: tuffrat-site
data: 2026-11-11
fonte: legacy/
---

# Audit del sito statico

Questa nota è un audit in sola lettura del sito HTML precedente, spostato in `legacy/` con `git mv` nella fase 0. Serve a due cose: da una parte è la **checklist di parità** con cui verificare che la nuova app Vite + React non perda testo, opere, link o didascalie; dall'altra è l'elenco dei difetti da non ripetere, diagnosticati con le categorie della skill `redesign-existing-projects` e risolti verso i valori di `.claude/skills/tuffrat-visual` («Valori TuffRat»).

Griglia usata: sezioni della skill Typography, Color and surfaces, Layout, Interactivity and states, Content, Component patterns, Iconography and imagery, Code quality, più le omissioni strategiche (privacy, 404, skip link, meta, favicon). I riferimenti ai file sono riga per riga sul contenuto attuale di `legacy/`; le immagini si verificano su `public/assets/img/`.

## Inventario

### Panoramica pagina × contenuti

| Pagina | Titolo `<title>` / H1 (o primo H2) | Opere / figure | Link esterni | Script | Note |
|---|---|---|---|---|---|
| `legacy/index.html` | "TuffRat Portfolio" / H1 `TuffRat` | 9 figure-opera + 2 immagini artista (hero `foto_presentazione.webp`, about `profilo.webp`); 4 card hub | Instagram post Mind The Gap, YouTube PULSOS, `mailto:streetpilzine@gmail.com`, Instagram `tuff_rat` | `/legacy/script.js` (lightbox) | Hero, Chi sono, Galleria, Hub, Contatti, footer |
| `legacy/about/index.html` | "About — TuffRat" / H2 `About` | 1 (`foto_presentazione.webp`) | YouTube PULSOS, `mailto:streetpilzine@gmail.com`, Instagram `tuff_rat`; link interno a `../mostre/` | nessuno | Bio lunga, Statement, Mostre & pubblicazioni, Contatti |
| `legacy/serie/index.html` | "Serie — TuffRat" / H2 `Serie` | 3 copertine + 2 card "in arrivo" | nessuno | nessuno | `figcaption` dentro `div.card` (non valido), serie-04/05 linkano a pagine placeholder |
| `legacy/serie/serie-01/index.html` | "Serie 01 — TuffRat" / H2 `Serie 01` | 2 | nessuno | `/legacy/script.js` | Intro placeholder non compilata |
| `legacy/serie/serie-02/index.html` | "Roundabout — TuffRat" / H2 `Roundabout` | 6 (4 tessere + 2 dettagli) | nessuno | `/legacy/script.js` | Dettagli registrati come opere con titolo e misure aggregati |
| `legacy/serie/serie-03/index.html` | "Bustine di tè — TuffRat" / H2 `Bustine di tè` | 5 (Tè Nero ×3, Tè Verde ×2) | nessuno | `/legacy/script.js` | Nessun raggruppamento politittico, 5 card singole |
| `legacy/serie/serie-04/index.html` | "Serie 04 — TuffRat" / H2 `Serie 04` | 0 (blocco HTML commentato) | nessuno | `/legacy/script.js` | Pagina placeholder pubblicata e linkata |
| `legacy/serie/serie-05/index.html` | "Serie 05 — TuffRat" / H2 `Serie 05` | 0 (blocco HTML commentato) | nessuno | `/legacy/script.js` | Pagina placeholder pubblicata e linkata |
| `legacy/edizioni/index.html` | "Edizioni — TuffRat" / H2 `Edizioni` | 0 (template card commentato) | `mailto:streetpilzine@gmail.com`, Instagram `tuff_rat` | `/legacy/page-flip.browser.js`, `/legacy/flipbook.js` | Overlay flipbook presente, nessuna fanzina caricabile |
| `legacy/fotografia/index.html` | "Fotografia — TuffRat" / H2 `Fotografia` | 3 figure placeholder (`ritratto.webp` inesistente) | `mailto:streetpilzine@gmail.com`, Instagram `tuff_rat` | nessuno | Segnaposto `[Titolo] · [Anno] · [Pellicola]` |
| `legacy/mostre/index.html` | "Mostre — TuffRat" / H2 `Mostre` | 4 voci `<article class="mostra">` | `mailto:streetpilzine@gmail.com`, Instagram `tuff_rat` | nessuno | Fonte di contenuto: `legacy/mostre.txt` |

Fuori inventario ma presenti: `legacy/magnifier_lens_prototype.html` (prototipo lente di zoom su `/assets/img/testzoom.jpg`, non linkato), `legacy/sitemap.txt` (albero del progetto, non una sitemap XML), `legacy/README.txt` (una riga), `legacy/page-flip.browser.js` (StPageFlip minificato, ~44 KB), `legacy/assets-css/style.css` (residuo).

### Testi visibili da preservare (checklist di parità)

**Home (`legacy/index.html`)**

- Eyebrow: "Portfolio".
- H1: "TuffRat".
- Lede: "Arte dal profondo dell'underground." / "Calligrafia, graffiti, fotografia analogica."
- Bottoni: "Galleria" (`#galleria`), "Contatti" (`#contatti`).
- Alt: "Ritratto dell'artista" (`foto_presentazione.webp`), "Foto profilo" (`profilo.webp`).
- H2 "Chi sono", bio breve in due paragrafi (righe 35–45): "Nel suo lavoro multidisciplinare, TuffRat intreccia pittura, fotografia e sonorità hip hop, trattando l'arte come un'estensione diretta dell'esperienza di vita. Cresciuto all'interno del collettivo Melograno, ha iniziato il suo percorso artistico attraverso i graffiti, un background che ha definito il suo approccio istintivo alla creazione." / "Rifiutando la ricerca di un'estetica puramente decorativa, TuffRat agisce come catalizzatore del disagio contemporaneo. La sua pratica mira a una comunicazione limpida che riflette la società attuale, catturando l'essenza cruda della vitalità piuttosto che una sua rappresentazione costruita."
- Citazione: "L'arte deve essere come la vita stessa: né buona né cattiva, ma oggettiva."
- "Mostre selezionate:" link "Mind The Gap (2025)" → `https://www.instagram.com/p/DIYrh3xtZyZ/?img_index=1`; "Intervista online:" link "PULSOS Ep.10" → `https://www.youtube.com/watch?v=ngi81Oa-Jtc`.
- H2 "Galleria", sottotitolo "Selezione di lavori recenti".
- H2 dei blocchi hub: "Serie" ("Cinque corpi di lavoro. Ogni serie con testo e opere."), "Fotografia" ("Selezione analogica e ritratti."), "Edizioni" ("Fanzine, stampe, collaborazioni."), "Mostre" ("Percorso espositivo recente."), ciascuno con link "Apri".
- H2 "Contatti": "Per mostre, collaborazioni, acquisizioni."; bottoni "E-mail" (`mailto:streetpilzine@gmail.com`) e "Instagram" (`https://www.instagram.com/tuff_rat/`).
- Footer: "© 2026 TuffRat — Portfolio".
- UI lightbox: "Chiudi", "← Prec", "Succ →", etichette "Anno: ", "Tecnica: ", "Dimensioni: ", "Status: ".

**Opere — dati completi per opera (titolo · anno · misure · tecnica · stato)**

Le misure sono riportate come scritte nei `data-size` (la didascalia visibile a volte le abbrevia senza "cm", vedi code quality). File sotto `public/assets/img/opere/`.

| Opera | Pagina (righe) | File | Anno | Misure | Tecnica | Stato (solo lightbox) |
|---|---|---|---|---|---|---|
| Piccionaiax | home 63–72, serie-01 25–34 | `serie-01/full/2023_piccionaiax_01.webp` | 2023 | 30 × 40 cm | Acrilico su tela | Su richiesta |
| RonfRonf | home 74–83, serie-01 36–45 | `serie-01/full/2023_ronfronf_01.webp` | 2023 | 60 × 60 cm | Collage | Su richiesta |
| Sinapsi | home 85–94 | `singoli/full/2024_Sinapsi.webp` | 2024 | 60x60 cm | Tecnica mista su lastra in policarbonato | Venduto |
| Hoss Tia | home 96–105 | `singoli/full/2023_HossTia.webp` | 2023 | 67x81 cm | Tecnica mista su multistrato di legno | Collezione privata - su richiesta — Misure comprendenti la cornice |
| Scompensato | home 107–116 | `singoli/full/2023_Scompensato.webp` | 2023 | 66x82 cm | Tecnica mista su compensato di legno | Attualmente non disponibile — temporaneamente in prestito per mostra |
| Gianfranco | home 118–127 | `singoli/full/2022_Gianfranco.webp` | 2022 | 70x100 cm | Tecnica mista su compensato di legno | Collezione privata - su richiesta |
| Giovanni | home 129–138 | `singoli/full/2025_Giovanni.webp` | 2025 | 29x80 cm | Tecnica mista \| acrilico su compensato di legno | Disponibile |
| Lavori in corso | home 140–149 | `singoli/full/2024_LavoriInCorso.webp` | 2024 | 85x40 cm | Tecnica mista su compensato di legno | Disponibile |
| 100% Arabica | home 151–160 | `singoli/full/2024_100percentoArabica.webp` | 2024 | 98.5x94.5 cm | Tecnica mista su lastra in policarbonato | Disponibile |
| Chiacchiere | home 162–171 | `singoli/full/2023_Chiacchiere.webp` | 2023 | 100x70 cm | Tecnica mista su compensato di legno | Disponibile |
| Nebula | home 173–182 | `singoli/full/2024_Nebula.webp` | 2024 | 60x60 cm | Tecnica mista su tela | In vendita |
| Roundabout 01 | serie-02 24–33 | `serie-02/full/2024_Roundabout_01.webp` | 2024 | 39x39.5 cm | Misto \| acrilico e pennarello su multistrato di legno | In vendita — su richiesta |
| Roundabout 02 | serie-02 35–44 | `serie-02/full/2024_Roundabout_02.webp` | 2024 | 39x39.5 cm | idem | In vendita — su richiesta |
| Roundabout 02 dettaglio | serie-02 46–55 | `serie-02/full/2024_Roundabout_02-detail.webp` | 2024 | (39x39.5 cm dell'opera) | idem | In vendita — su richiesta |
| Roundabout 03 | serie-02 57–66 | `serie-02/full/2024_Roundabout_03.webp` | 2024 | 39x39.5 cm | idem | In vendita — su richiesta |
| Roundabout 03 dettaglio | serie-02 68–77 | `serie-02/full/2024_Roundabout_03-detail.webp` | 2024 | (39x39.5 cm dell'opera) | idem | In vendita — su richiesta |
| Roundabout 04 | serie-02 79–88 | `serie-02/full/2024_Roundabout_04.webp` | 2024 | 39x39.5 cm | idem | In vendita — su richiesta |
| Tè Nero 01 | serie-03 24–33 | `serie-03/full/2024_TeNero_01.webp` | 2024 | 37x50.5 cm | Tecnica mista \| acrilico su multistrato di legno | Riservato - in asta |
| Tè Nero 02 | serie-03 35–44 | `serie-03/full/2024_TeNero_02.webp` | 2024 | 37x50.5 cm | idem | Riservato - in asta |
| Tè Nero 03 | serie-03 46–55 | `serie-03/full/2024_TeNero_03.webp` | 2024 | 37x50.5 cm | idem | Riservato - in asta |
| Tè Verde 01 | serie-03 57–66 | `serie-03/full/2023_TeVerde_01.webp` | 2023 | 60x50 cm | idem | In vendita |
| Tè Verde 02 | serie-03 68–77 | `serie-03/full/2023_TeVerde_02.webp` | 2023 | 60x50 cm | idem | In vendita |

Dettagli di parità da non perdere: la didascalia della home per Hoss Tia (riga 104) usa `67x81 cm`, mentre la didascalia della home per Piccionaiax (riga 71) e RonfRonf (riga 82) non riportano "cm" (`30×40`, `60×60`); i dettagli Roundabout hanno didascalia "Roundabout · dettaglio · 2024" e titolo lightbox "Roundabout (dettaglio)" (la home del nuovo sito non li mostra, la pagina serie sì); le alt sono tutte del tipo "Titolo Anno" ("Piccionaiax 2023", "Roundabout dettaglio 2024", ecc.).

**Serie (`legacy/serie/index.html`)**

- H2 "Serie", sottotitolo "Corpi di lavoro organizzati per serie".
- Card: "Serie 01 · 2023–2025" (copertina Piccionaiax), "Roundabout · 2024" (copertina Roundabout 01), "Bustine di tè · 2023–2024" (copertina Tè Nero 01), "Serie 04 · in arrivo", "Serie 05 · in arrivo"; alt "Serie 01", "Roundabout", "Bustine di tè".
- Intestazioni pagina serie: H2 "Serie 01" con intro "Intro breve (80–120 parole): contesto, medium prevalente, periodo, cosa indaga la serie." (segnaposto da sostituire, non da copiare); H2 "Roundabout" con "Serie 2024, tecnica mista su multistrato di legno."; H2 "Bustine di tè" con "Serie 2023–2024, tecnica mista su multistrato di legno."; H2 "Serie 04" e "Serie 05" con "[Placeholder intro 80–120 parole: …]" e gallery vuota.
- Link di ritorno: "← TuffRat" in serie/, "← Serie" in tutte le pagine serie.

**Bio (`legacy/about/index.html`)**

- H2 "About", sottotitolo "Bio e statement"; link "← TuffRat".
- H2 "Bio", tre paragrafi (righe 26–28): (1) "Nel suo lavoro multidisciplinare, TuffRat intreccia pittura, fotografia e sonorità hip hop, trattando l'arte come un'estensione diretta e necessaria dell'esperienza di vita. Cresciuto all'interno del collettivo Melograno, ha iniziato il suo percorso artistico attraverso i graffiti e la cultura urbana, un background che ha definito il suo approccio istintivo e la concezione della creatività come atto condiviso."; (2) "Rifiutando la ricerca di un'estetica puramente decorativa, TuffRat agisce come catalizzatore del disagio contemporaneo. La sua pratica non mira alla perfezione formale, ma a una comunicazione limpida e oggettiva che riflette la società attuale. Nella fotografia, il suo sguardo indaga l'ambiente e la figura umana con un approccio talvolta intrusivo o casuale, mirato a catturare l'essenza cruda della vitalità piuttosto che una sua rappresentazione costruita."; (3) "Per TuffRat l'opera d'arte trascende il giudizio binario di «bello» o «brutto» per diventare testimonianza coerente dell'esistenza. La sua produzione nasce dall'urgenza di trasformare la complessità e le frustrazioni del quotidiano in forme espressive che non pongono confini tra l'atto creativo e la vita stessa."
- H2 "Statement": "La sua ricerca rifiuta l'estetica decorativa e punta a una comunicazione limpida, capace di riflettere la società attuale catturando l'essenza cruda della vitalità piuttosto che una sua rappresentazione costruita."
- Citazione: "«L'arte deve essere come la vita stessa: né buona né cattiva, ma oggettiva.»" (virgolette caporali).
- H2 "Mostre & pubblicazioni", sottotitolo "Selezione"; card "Mostre" con "Percorso espositivo recente: Collezione d'eccezione, Portali Onirici, Teatro Nero, Mind the Gap." + link "Apri"; card "2025 — PULSOS Ep.10" con "Intervista video." + link "Guarda" → YouTube.
- H2 "Contatti" e link come in home; footer uguale.

**Mostre (`legacy/mostre/index.html`, fonte `legacy/mostre.txt`)**

- H2 "Mostre", sottotitolo "Percorso espositivo recente".
- "Mind the Gap" — "2025 · Accademia Albertina, Torino"; "Teatro Nero" — "2025 · Accademia Albertina, Torino"; "Portali Onirici" — "2025 · Parco Michelotti, Torino"; "Collezione d'eccezione" — "2024 · La barca, Torino".
- `mostre.txt` usa una grafia diversa ("La barca (TO)", "Parco Michelotti (TO)") e contiene una nota privata non pubblicabile ("nota: chiedi a didi le foto"): la fonte dati deve essere il contenuto pubblicato, non il .txt grezzo.

**Edizioni (`legacy/edizioni/index.html`)**

- H2 "Edizioni": "Fanzine, stampe limitate, multipli e collaborazioni. Clicca su una fanzina per sfogliarla."
- Nota: "Fanzine in digitalizzazione — in arrivo."
- H2 "Acquisti & richieste": "Per ordini, distribuzione o collaborazioni editoriali:"; "E-mail", "Instagram".
- Template commentato (riga 27–33): card "StreetPIL n.1 · 2024 · Fanzine", `data-folder="/assets/img/edizioni/streetpil-1/pages"`, `data-count="12"` — non è contenuto da preservare, ma indica il formato atteso.

**Fotografia (`legacy/fotografia/index.html`)**

- H2 "Fotografia": "[Placeholder intro — 60/100 parole.] Selezione di scatti analogici: ritratti urbani, appunti visivi, archivio in costruzione." (il testo dopo il primo punto va conservato, il segnaposto no).
- Tre didascalie segnaposto "[Titolo] · [Anno] · [Pellicola]".
- H2 "In aggiornamento": "Galleria fotografica in fase di selezione. Per richieste o collaborazioni:"; "E-mail", "Instagram".

**Contatti e footer (tutte le pagine tranne about, che ha footer senza link)**

- `mailto:streetpilzine@gmail.com` (home 215, about 60, edizioni 44, fotografia 49, mostre 44).
- `https://www.instagram.com/tuff_rat/` (home 216, about 61, edizioni 45, fotografia 50, mostre 45).
- `https://www.youtube.com/watch?v=ngi81Oa-Jtc` (home 51, about 50).
- `mailto`/link social assenti in serie/, serie-01…05.

## Difetti per categoria

### Typography

| # | Dove | Cosa | Perché conta | Cosa fare nel redesign |
|---|---|---|---|---|
| T1 | `legacy/style.css:12` | `font-family: "Inter", "Helvetica Neue", Arial, sans-serif`, nessun font caricato: se Inter non è sul sistema si cade su Helvetica/Arial | È l'impronta più riconoscibile del "sito generico"; i clienti Adobe/Google font non sono nemmeno dichiarati, quindi ogni utente vede un font diverso | Unico typeface **Manrope**, self-hosted, caricato con `font-display: swap`; nessun fallback Helvetica nella lista |
| T2 | `legacy/index.html:13,34,58`; `legacy/style.css` (nessuna regola per `h1`, `h2`, `h3`) | Gerarchia tipografica lasciata ai default del browser; solo `h1` scala con `clamp(2.2rem, 4vw, 3rem)` (`style.css:43`) | Headline senza presenza, gerarchia incoerente tra home e pagine interne | Applicare gli stili nominati di tuffrat-visual: Heading 1 (60/60 Semibold) per il nome in hero, Heading 2 (48/48) per le sezioni, Title/Caption con token kebab-case definiti una volta |
| T3 | `legacy/index.html:47`, `legacy/about/index.html:32` | Citazione resa con `<em>` (corsivo) | Il corsivo è vietato nei valori TuffRat | Virgolette caporali + peso Medium, stile Body 1/Title, nessun italic |
| T4 | `legacy/style.css:43,57,131,176,241,260,267,308,309,315,361,370,395,403,411` | Sette dimensioni arbitrarie (`clamp(2.2rem, 4vw, 3rem)`, `0.75rem`, `0.9rem`, `0.95rem`, `1.1rem`, `1.15rem`, `1.5rem`) più altezze descritte in rem (`style.css:411`) | Nessuna scala tipografica: ogni ritocco inventa un valore | Snappare ogni testo su scala Tailwind (text-xs … text-9xl) tramite gli stili nominati |
| T5 | tutte le pagine | Body e caption mai più piccoli grossi di 0.9/0.95rem, nessun tracking per label né `text-wrap: balance/pretty`; `h1` senza letter-spacing negativo | Paragrafi e didascalie poco leggibili, headline larghe, parole orfane possibili | Body 3 (16/24) per la prosa, Caption con tracking positivo nei metadata, `text-wrap: balance` sulle headline e `pretty` sul corpo |
| T6 | `legacy/style.css:46` (`.lede` `max-width: 38ch`) vs `legacy/about/index.html:26–28` (paragrafi senza limite) | La misura del paragrafo è governata solo dall'ampiezza della griglia nella colonna about (circa 570 px a 1200 px di container, ma nello screen intero su pagina About senza colonna) | Su schermi larghi la bio about può superare di molto la misura leggibile | Cap del paragrafo a circa 65ch in ogni contesto |

### Color and surfaces

| # | Dove | Cosa | Perché conta | Cosa fare nel redesign |
|---|---|---|---|---|
| C1 | `legacy/style.css` (tutto), `legacy/index.html` | Non ci sono gradienti né più accent: la palette `#f7f7f5 / #111 / #555 / #fff / #e4e4e0` è già coerente | È un punto di forza, non un difetto | Portarla intatta in `src/styles/tokens.css` (vedi «Cosa conservare») |
| C2 | `legacy/style.css:206,221,249` | Superfici scure `#0f0f0f`, `#000`, `#0a0a0a` nella lightbox, fuori dalla palette TuffRat (dark consentiti: `#000000`, `#181818`, …) | Sezione scura "accidentale" a metà di una pagina chiara; due neri diversi nella stessa overlay | Usare `#181818`/`#000000` come unici scuri oppure, meglio, overlay su superficie chiara con backlink `rgba(0,0,0,0.72)` e pannello `#fff` |
| C3 | `legacy/style.css:8,77,125,213` | Ombre nere a opacità diverse (`0 10px 30px rgba(0,0,0,0.06)`, `0 10px 20px …0.12`, `0 16px 40px …0.12`, `0 20px 60px …0.5`): quattro ombre, nessun token | Incoerenza di elevazione; ombre grigie su fondo caldo | Una sola ombra definita nei token (`0 10px 30px rgba(0,0,0,0.06)`) per le card DOM, un livello più marcato solo per overlay |
| C4 | `legacy/style.css:111–118` + pagine | Card `border` + `box-shadow` + `background:#fff` contemporaneamente: look card generico | Non si distingue ciò che sale da ciò che sta a terra | Card solo con bordo o solo con spazio; elevazione riservata a lightbox/overlay |

### Layout

| # | Dove | Cosa | Perché conta | Cosa fare nel redesign |
|---|---|---|---|---|
| L1 | `legacy/style.css:104–108` (`.grid` `auto-fit minmax(240px,1fr)`), `135–140` (`.hub`) | Griglie auto-fit che producono 3–4 colonne uguali a ogni larghezza, con hub a 4 card uguali | È il layout "tre card uguali" della skill; nessuna gerarchia visiva, l'opera grande e il dettaglio occupano la stessa cella | Muro 3D / layout asimmetrico in v1 (fase 2); nella vista lista usare griglia a larghezze variabili o colonne con aspect ratio misti |
| L2 | `legacy/style.css:127` (`.card img { aspect-ratio: 4/3; object-fit: cover }`) | Crop forzato 4:3 su tutte le opere, anche quando la foto intera dell'opera ha altro rapporto (es. `2025_Giovanni.webp` 1400×2833, `2024_LavoriInCorso.webp` 1400×642) | Le opere sono dipinti: il crop taglia la tela e falsa il formato | Rendere le opere nel loro rapporto reale (width/height dall'immagine), cornice o supporto a definire la forma |
| L3 | tutte le pagine interne, riga 10 (`<header style="max-width:1200px; …">`) | Header ridotto a un link "← TuffRat" / "← Serie", nessuna navigazione principale né indicazione della pagina corrente | Sulle pagine interne si perde l'orientamento; il ritorno è l'unico percorso | Nav flottante con link attivo (hover/link corrente in evidenza), breadcrumb nel percorso serie |
| L4 | `legacy/serie/index.html:20–24,38–47` | Link che avvolge un `div.card` con `figcaption` fuori da `figure`; card "in arrivo" senza immagine, con `padding` inline | Markup invalido, card di altezze diverse con testo spostato | Card `<article>` con link, placeholder composto (non pagina vuota) per le serie non pubblicate |
| L5 | `legacy/serie/serie-04/index.html:18`, `serie-05/index.html:18` | Pagine pubblicate, linkate dal menu serie, con "[Placeholder intro 80–120 parole: …]" visibile in pagina e galleria vuota | Segnaposto mostrato all'utente: toglie credibilità al portfolio | Le serie senza opere non hanno route: nello scaffale/serie appaiono come voce disattivata o "in preparazione" fuori dal percorso di dati |
| L6 | `legacy/style.css:288–291,409–412`; breakpoint 800/640 px | Solo due breakpoint, spaziature in rem arbitrarie (`1.4rem`, `1.75rem`, `3.5rem`); `padding` asimmetrici mai ottici | Ritmo verticale incoerente; nessun controllo a 390 px | Spaziature solo dai token Spacing-0…900 (8/16/24/32/40/48…), verifica 390 px senza overflow |
| L7 | `legacy/style.css:305–307` (`.mostra`) vs `.hub-card` (141–147) | Voci mostra senza ombra, hub con ombra: due trattamenti per la stessa "card" | Linguaggio visivo incoerente tra pagine | Un solo componente card |

### Interactivity and states

| # | Dove | Cosa | Perché conta | Cosa fare nel redesign |
|---|---|---|---|---|
| I1 | `legacy/script.js:71–73` | Le card opera sono `figure` con `click` JS: non sono focusabili, non si aprono con Tab/Enter, non hanno `role` né `tabindex` | Le opere sono inaccessibili da tastiera e non comparabili in SEO | Ogni opera è un link reale (`/opere/:slug`) con piena operabilità da tastiera |
| I2 | `legacy/style.css:196`, `legacy/script.js:50–59` | Lightbox aperta con `.is-open`: nessun focus trap, nessun ritorno del focus sull'elemento di partenza, nessun `aria-hidden` sul resto della pagina, `src = ''` alla chiusura (immagine rimossa di netto) | Dialogo `aria-modal="true"` che però non si comporta da modale: la tastiera va dietro al backdrop | Lightbox React con focus trap, `inert` sullo sfondo, Esc, ritorno del focus, transizione opacità 300 ms |
| I3 | `legacy/script.js:83–88`; `legacy/flipbook.js:98–103` | Scorciatoie frecce/Esc aggiunte con `keydown` su `window`, una listener per modalità: aprire il flipbook avrebbe lasciato anche il listener della lightbox | Conflitti di tastiera quando coesistono overlay | Testi e tastiera gestiti da un unico router di overlay |
| I4 | `legacy/style.css:72,121,72` `transition: … 0.15s ease`, `0.2s ease`; `legacy/style.css:321,364,397` `.25s ease`, `.2s ease` | Curve `ease` di default e durate sotto 200 ms; si anima `transform: translateY(-1px)` e `translateY(-2px)` senza stato `:active` | Movimento meccanico, nessun feedback di pressione | Curva `cubic-bezier(0.22,1,0.36,1)`, 500 ms per posizione, 300 ms per colore, mai sotto 200 ms; stato `:active` con `scale(0.98)` |
| I5 | `legacy/style.css` (nessuna regola `:focus`, `:focus-visible`, `:active`, `:disabled`) | Nessun anello di focus su bottoni, link, card, controlli di lightbox/flipbook | Requisito di accessibilità | Anello di focus visibile su ogni elemento interattivo |
| I6 | `legacy/style.css` (nessun `@media (prefers-reduced-motion)`) | Le transizioni continuano anche per chi chiede motion ridotto | Accessibilità | Reduced-motion: transizioni sostituite da fade; in 3D timeline a `progress(1)` |
| I7 | tutte le pagine (nessuna regola `scroll-behavior`), `legacy/index.html:19–20` | Ancora `#galleria`/`#contatti` con salto secco | Navigazione interna poco curata | `scroll-behavior: smooth` (disattivato con reduced-motion) e scroll reveals con IntersectionObserver |
| I8 | `legacy/index.html:29–31` | La stessa `profilo.webp` (foto verticale 1060×1600) è mostrata anche nella sezione "Chi sono" della home, dove mostra lo stesso ritratto della hero (foto_presentazione) | Ripetizione visiva | Un solo ritratto per vista |
| I9 | `legacy/edizioni/index.html:52–64` | Overlay flipbook presente e attivo ma senza trigger: stato vuoto non progettato; in `flipbook.js:3` se StPageFlip non carica il programma esce in silenzio | Pagina "Edizioni" vuota con l'interazione impossibile | Empty state composto ("zine in preparazione" con contatto), loading skeleton sulle pagine della fanzine |

### Content

| # | Dove | Cosa | Perché conta | Cosa fare nel redesign |
|---|---|---|---|---|
| N1 | `legacy/serie/serie-01/index.html:17–19`, `serie-04/05:18`, `legacy/fotografia/index.html:18,28,33,38` | Segnaposto visibili: "[Placeholder intro…]", "[Placeholder intro — 60/100 parole.]", "[Titolo] · [Anno] · [Pellicola]" | Testo segnaposto in produzione = pagina non finita | Nessun segnaposto pubblicato: testo reale o stata "in preparazione" con copy scritto |
| N2 | `legacy/index.html:50–51`, `about:44,48` | Grafie incoerenti: "Mind The Gap" (home) vs "Mind the Gap" (about, mostre); "2025 — PULSOS Ep.10" con trattino lungo in un titolo | Un portfolio d'arte vive di precisione almeno nei nomi | Una sola grafia nei dati (`mostre.ts`): "Mind the Gap" ovunque |
| N3 | `legacy/index.html:32`, `legacy/about/index.html:22,26` | "Chi sono" ma il testo parla in terza persona ("Nel suo lavoro… TuffRat agisce…") | Voce del testo incoerente con il titolo | Titanlo "Bio" (come in about) o rivolgere il testo alla prima persona, ma una scelta sola |
| N4 | `legacy/about/`: citazione resa con «» vs `legacy/index.html:47` con ASCII `"…"` | Punteggiatura tipografica incoerente | Dettaglio da studio | Uniformare a «» o virgolette alte tipografiche in un unico componente `Statement` |
| N5 | `legacy/index.html:68–182` (stati) | Lo stato dell'opera ("Venduto", "Collezione privata", "Riservato - in asta") esiste solo dentro `data-status` della lightbox: la griglia non lo mostra | Informazioni commerciali nascoste all'utente che guarda la griglia; il visitatore scopre dopo il click che l'opera è venduta | Mostrare lo stato sempre, con etichetta testuale ("Venduto", "Collezione privata", "In asta") — non badge a pillola |
| N6 | `legacy/index.html:101,112,123`; `serie-03:29,40,51` | Stati descrittivi lunghi inseriti in un "status" misto a note ("Collezione privata - su richiesta — Misure comprendenti la cornice"; "Riservato - in asta") mescolano disponibilità, nota e misura; trattini `-` a metà frase | Dati ambigui per l'utente e per la pipeline `opere.json` (campo `nota` separato) | Separare `stato` (enum), `nota` (testo libero), `misure`; niente `-` nel testo, usarne il trattino o rinnovare la frase |
| N7 | tutte le pagine | Conteggio "© 2026" fissato in HTML; contenuto di anno 2026 senza agenda di aggiornamento | Dato destinato a scadere | Anno calcolato in build |
| N8 | `legacy/mostre.txt:1` | Nota privata "nota: chiedi a didi le foto" nel file che è lo pseudo dato delle mostre | Fonte dati che contiene scorie di lavoro | `src/data/mostre.ts` generato dall'HTML pubblicato, non dal txt |
| N9 | `legacy/index.html:98,110,132,161,177` | Nomi tecnica con pipe (`Tecnica mista | acrilico …`, `Misto | acrilico e pennarello …`) | Il carattere `|` è un residuo di compilazione, in italiano si scrive con virgola | Virgola o "con": "Tecnica mista, acrilico su compensato di legno" |

### Component patterns

| # | Dove | Cosa | Perché conta | Cosa fare nel redesign |
|---|---|---|---|---|
| P1 | `legacy/index.html:63–182`, `serie-*` pagine | Lightbox duplicata identica in tutte le pagine (6 copie del blocco `<!-- Lightbox -->`): `legacy/index.html:226–247`, `serie-01:55–76`, `serie-02:97–118`, `serie-03:86–107`, `serie-04:46–67`, `serie-05:46–67` | Ogni modifica va ripetuta sei volte; le pagine 04/05 caricano un dialogo senza trigger | Un solo componente `<Lightbox>` montato dal router, condiviso da tutte le route |
| P2 | `legacy/style.css:80–84,64–69` | "Sempre un bottone pieno più un link a pillola": `.link` è un bottone bordato uguale per "Contatti", "Apri", "Guarda", "Instagram" | Rumore visivo, azioni secondarie con stesso peso | Link testuali per "Apri", "Guarda", "Instagram"; bottoni pieni solo per E-mail o CTA principale |
| P3 | `legacy/serie/index.html:38–47` | Card "in arrivo" (vedi L4/L5) | Card senza immagine e senza azione | Voce non interattiva nello scaffale serie, con stato "in preparazione" |
| P4 | `legacy/style.css:111–118` + `.mostra` | Card con bordo + ombra + fondo bianco per opere, mostre, hub, contatti | Look generico | Vedi C4; il contatto in footer piuttosto che come card "box" |

### Iconography and imagery

| # | Dove | Cosa | Perché conta | Cosa fare nel redesign |
|---|---|---|---|---|
| G1 | tutte le pagine `<head>`; `legacy/README.txt:28` | Nessun `<link rel="icon">`, nessun `tag.svg` (README lo nomina come opzionale ma non esiste nel repo) | Favicon mancante: la skill lo richiede sempre | Favicon dalla tag reale (fase 4, `favicon-crafter`); `tag.svg` tracciato dalla tag quando arriva la foto (`asset-pipeline`) |
| G2 | `legacy/style.css` (nessun sistema iconico); `legacy/index.html:230,243–244`, `serie-*` | Icone a carattere: "×", "← Prec", "Succ →" in testo | Spessori e allineamenti incoerenti | Phosphor unico set (`X`, `CaretLeft`, `CaretRight`) con un peso standard |
| G3 | `legacy/script.js:33–34` | La lightbox usa lo stesso file `full` del thumb e lo passa anche come `alt` della card | Le immagini sono 1400 px e pesano 0,2–0,9 MB ciascuna (Giovanni 934 KB, Gianfranco 807 KB), tutte caricate in griglia; niente `loading="lazy"`, `width`/`height`; 23 MB totali di immagini | Thumb dedicate (`thumb/` popolate), `full` solo nella lightbox, `width`/`height` espliciti, `loading="lazy"` fuori dalla prima schermata |
| G4 | `public/assets/img/opere/{edizioni,fotografia}/full|thumb` | Quattro cartelle `thumb/`/`full/` vuote (edizioni e fotografia), mentre il README (`legacy/README.txt:31,37,41,44`) le descrive come piene | Convenzione thumb/full dichiarata ma mai realizzata; la pipeline `pubblica.py` è l'unica che la produce | `asset-pipeline` genera `thumb/` per tutte le opere; test che fallisca se una griglia referenzia `full/` |
| G5 | `legacy/fotografia/index.html:27,32,37` | `<img src="/assets/img/artist/ritratto.webp">` tre volte: il file **non esiste** né in `public/assets/img/artist/` (ci sono solo `foto_presentazione.webp`, `profilo.webp`, un `file.txt`) né altrove → tre immagini rotte con alt "Placeholder fotografia" | Pagina pubblicata con tre immagini rotte; nella nuova app il test "ogni immagine esiste" non deve mai fallire | `/fotografia` "in arrivo" senza immagini rotte, stato vuoto composto; `ritratto.webp` va prodotto solo se la foto esiste davvero |
| G6 | `public/assets/img/COMEFARE.txt`, `public/assets/img/artist/file.txt` | File di lavoro (istruzioni, lista file) dentro la cartella pubblica delle immagini | Serviti in produzione, indice del sito confuso | `public/` solo asset finali; le note stanno in `docs/` o fuori dal repo |
| G7 | `legacy/index.html:24,31`, `about:22` | Due ritratti diversi (orizzontale in hero, verticale in about) per la stessa persona, alt generici ("Ritratto dell'artista", "Foto profilo") | La skill chiede volti reali e alt descrittivi | Alt specifici ("TuffRat davanti al muro dello studio") e uno solo per vista |

### Code quality

| # | Dove | Cosa | Perché conta | Cosa fare nel redesign |
|---|---|---|---|---|
| Q1 | tutte le pagine interne: `about:10,11,15,20,30,36,55`; `serie/index:10,11,15,20,23,40,45`; `serie-01:10,11,15,17,25`… ; `edizioni:10,11,17,39`; `mostre:39`; `fotografia:10,11,17,44` | Stili inline: 65 attributi `style="…"` negli HTML (header, sezione, `figcaption`, `max-width:60ch`, margini) | Il sistema di stile è spezzato: valori che il CSS non vede | Tutto nei token e nelle classi/componenti; nessun attributo `style` salvo valori calcolati |
| Q2 | `legacy/assets-css/style.css` (257 righe) | CSS residuo: versione vecchia di `legacy/style.css` senza `.hub`, `.card.lightbox-trigger`, `.mostra`; nessun HTML lo carica (tutti puntano a `/legacy/style.css`) | Ombra di un refactor precedente che confonde chi modifica | Si elimina con `legacy/` dopo il go-live; non copiare nulla da lì, la fonte è `legacy/style.css` |
| Q3 | `legacy/index.html:226,227,229` ecc. | Div soup: hero e about sono `<div>`, hub e contatti `<div>`, non `<section>`; body senza `<nav>`, senza skip link | Semantica debole, struttura non leggibile da screen reader | `<header>`, `<nav>`, `<main>`, `<section aria-labelledby>`, `<article>` per ogni opera, skip link |
| Q4 | tutte le pagine `<head>` (7–8) | Meta mancanti: nessuna `description`, `og:*`, Twitter card, canonical. Solo charset, viewport, title | Condivisione su social e SEO assenti | Prerender dei meta per route in fase 4 (`scripts/prerender.ts`), og:image per opera |
| Q5 | tutte le pagine | Nessun 404 personalizzato, nessun link privacy/termini, prima pagina senza "back" (è la home) | Omissioni strategiche della skill | Pagina 404, footer con privacy, breadcrumb nelle pagine interne |
| Q6 | `legacy/index.html:7,249` ecc. | CSS e JS con path assoluti `/legacy/style.css`, `/legacy/script.js`; `legacy/index.html` in origine usava `style.css` relativo (vedi diff staged) | Il sito legacy aperto da file system o in sottocartella non si vede più | Serve solo a `legacy/` di confronto; nel nuovo ogni asset passa dal bundler Vite |
| Q7 | `legacy/fotografia/index.html:27–39` | Tre `<img>` rotte con `alt="Placeholder fotografia"` | Immagini mancanti e alt non descrittivi | Vedi G5; nessuna immagine senza file |
| Q8 | `legacy/index.html:232` ecc. | `<img id="lightbox-img" src="" alt="">` | `src` vuoto: richiesta alla pagina stessa in alcuni browser | Omettere l'`<img>` finché non c'è un'opera |
| Q9 | `legacy/script.js:45–47` | `linkEl.innerHTML = \`<a href="${link}" …\`` con `data-link` preso dall'HTML: lettura attr → innerHTML senza escape | Rischio di iniezione se un `data-link` contenesse markup; oggi nessuna opera ha `data-link` (il ramo è morto) | Rendere link come dati tipizzati e componenti JSX |
| Q10 | `legacy/serie/`, `flipbook.js`, `page-flip.browser.js` | `script.js` è caricato su serie-04/05 dove non esistono trigger (le listener sono sulla lightbox doppia); flipbook carica una libreria minificata di 44 KB dichiarata non in `package.json` (è un file vendorizzato) | Import non tracciati dalla dependency list | StPageFlip nel nuovo stack viene da `page-flip` (npm), non da un file copiato |
| Q11 | `legacy/serie/serie-01/index.html:18` | Testo di intro con en-dash "80–120" e trattino in "Serie 01 · 2023–2025" (serie/index 23) | La skill distingue trattini in copy generico dai dati concreti; va comunque uniformato | Tutti i periodi con lo stesso separatore (lineetta "–", usata come dato e non come punteggiatura di frase), da una sola convenzione nei dati |
| Q12 | `legacy/serie/serie-04/index.html:24–37`, `serie-05:24–37`, `legacy/edizioni/index.html:22–34` | Blocchi di markup morto commentati in HTML (template opera e fanzine) spediti in produzione | Codice morto che invecchia senza che nessuno lo veda | Eliminato: il formato della card vive nei componenti |

### Omissioni strategiche (riepilogo)

Non esistono: pagina 404, link privacy/termini, skip to content, cookie consent (da valutare con il cliente), favicon, meta description/og, sitemap XML (`legacy/sitemap.txt` è solo l'albero del progetto), alcun form. La home ha una sola CTA principale (Galleria) — corretto — ma per un portfolio d'arte la CTA che conta (contatto/acquisizione) è relegata in fondo.

## Cosa conservare

- **Palette.** `--bg #f7f7f5`, `--text #111`, `--muted #555`, `--card #fff`, `--border #e4e4e0`, `--accent #111`, ombra `0 10px 30px rgba(0,0,0,0.06)` (`legacy/style.css:1–8`). Coerente con i «Valori TuffRat», che la confermano come base: va portata così com'è in `src/styles/tokens.css`.
- **Tono dei testi.** La bio lunga di `legacy/about/index.html:26–28` e lo statement (riga 31) hanno una voce specifica, non marketing generico ("catalizzatore del disagio contemporaneo", "essenza cruda della vitalità"): va portata testo per testo, senza riscritture da copywriter. La bio breve della home è una sintesi valida e va tenuta come variante breve.
- **Citazione.** "L'arte deve essere come la vita stessa: né buona né cattiva, ma oggettiva." — contenuto, non stile: conservare il testo, cambiare la resa in corsivo (T3).
- **Struttura delle didascalie.** L'ordine `Titolo · Anno · Misure · Tecnica` nella `figcaption`, con i campi separati da `·`, e in lightbox le etichette `Anno:`, `Tecnica:`, `Dimensioni:`, `Status:` sono il modello dati giusto: mappano direttamente su `opere.json` (titolo, anno, tecnica, supporto, misure, stato, nota). Conservare l'ordine e la separazione dei campi; uniformare solo le unità (sempre "cm", spazi attorno a "×").
- **Dati delle opere.** I 9 singoli, le 2 opere serie-01, le 4 tessere Roundabout + 2 dettagli, Tè Nero ×3 e Tè Verde ×2 con anni, misure e stati (tabella «Opere — dati completi») vanno copiati 1:1 nei dati tipizzati. Le misure di Roundabout (39x39.5 cm) e Tè Nero (37x50.5 cm) coincidono per tutte le tessere del gruppo: coerente con il modello polittico.
- **Struttura delle serie.** Indice con periodo ("Serie 01 · 2023–2025", "Roundabout · 2024", "Bustine di tè · 2023–2024") e intro di una riga per serie ("Serie 2024, tecnica mista su multistrato di legno."): è il giusto livello di informazione, da estendere con l'intro 80–120 parole.
- **Elenco mostre.** Quattro voci con formato "Titolo / Anno · Luogo, Città": dati già puliti nell'HTML, da usare come fonte di `mostre.ts`.
- **Contatti.** `mailto:streetpilzine@gmail.com`, Instagram `tuff_rat`, YouTube PULSOS `ngi81Oa-Jtc`, link Instagram Mind The Gap: sono i canali effettivi, da centralizzare in `src/data/artista.ts`.
- **Palette e testo del footer** "© 2026 TuffRat — Portfolio" come riferimento, con l'anno calcolato.
- **Parametri del flipbook (`legacy/flipbook.js:47–66`)**, da riusare nel componente `FlipBook` React che incapsula `page-flip`: `width 550`, `height 733` (formato ~A4 verticale), `size 'stretch'`, `minWidth 280`, `maxWidth 1000`, `minHeight 360`, `maxHeight 1400`, `drawShadow true`, `flippingTime 900` (>= 800 ms, coerente con la regola "mai sotto 200 ms" e con il limite camera di 800 ms che però vale solo per il 3D), `usePortrait true`, `showCover true`, `mobileScrollSupport true`, `showPageCorners true`, `autoSize true`, `maxShadowOpacity 0.5`, `swipeDistance 30`, `useMouseEvents true`, `disableFlipByClick false`. Pagine costruite da cartella + conteggio con numerazione a due cifre (`pad()`, riga 19), contatore "pagina / totale" via evento `flip` (righe 27–30) in `font-variant-numeric: tabular-nums` (`style.css:402`) — dettaglio corretto da portare. Overlay: backdrop `rgba(0,0,0,0.82)` con `blur(2px)`, pannello `min(1200px, 96vw)` × `min(88vh, 1600px)` (righe 334–349); frecce ed Esc da tastiera (righe 98–103); `destroy()` alla chiusura (riga 80) — gestione corretta.
- **Pattern di navigazione del flyout**: la chiusura su click del backdrop limitata a `e.target === backdrop` (`script.js:75–77`) è la logica giusta, da conservare.

## Da non ripetere

1. Font Inter/Helvetica/Arial senza font dichiarato: un solo typeface Manrope, self-hosted.
2. Corsivo per la citazione: virgolette tipografiche e peso Medium.
3. Dimensioni di testo inventate (`0.9rem`, `1.15rem`, `clamp(…)`): solo scala Tailwind.
4. Card `figure` cliccabili con JS: le opere sono link reali, focusabili, con stato hover/active/focus.
5. Lightbox duplicata in sei pagine: un solo componente, con focus trap e ritorno del focus.
6. Segnaposto pubblicati ("[Placeholder intro…]", serie-04/05 vuote, "[Titolo] · [Anno] · [Pellicola]"): niente segnaposto online.
7. Immagini rotte o referenziate e assenti (`ritratto.webp`, `tag.svg`): test che verifica ogni immagine.
8. Stili inline negli HTML (65 attributi): tutto nei token e nelle classi.
9. Crop 4:3 forzato su opere di formato diverso: rispettare il rapporto reale dell'opera.
10. File `full` da 1400 px serviti come thumb, senza `width`/`height` né `lazy`: thumb dedicate in `thumb/`, dimensioni esplicite.
11. Griglia auto-fit di card uguali per ogni sezione: layout asimmetrico o muro, non tre colonne uguali.
12. Stato commerciale nascosto in `data-status` della lightbox: stato sempre visibile, separato da nota e misure, senza pipe né trattini.
13. Meta assenti (description, og:image), favicon assente, 404 assente, nessun link privacy: prerender meta per route in fase 4.
14. Due breakpoint soli e spaziature in rem arbitrarie: scala Spacing dai token e controllo a 390 px.
15. CSS residuo (`legacy/assets-css/style.css`), file di lavoro in `public/` (`COMEFARE.txt`, `file.txt`), note private in `mostre.txt`: una sola fonte per ogni cosa.

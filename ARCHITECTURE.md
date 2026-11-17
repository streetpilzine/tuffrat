---
titolo: ARCHITECTURE — redesign TuffRat
progetto: tuffrat-site
data: 2026-11-11
stato: v0.5 (fase 3 con le correzioni mobile del 17/11/2026)
---

# ARCHITECTURE

Contratto tecnico del redesign: chi lavora su un componente, un dato o una route parte da qui. Il piano, le fasi e le scadenze sono in `PLAN-redesign.md`.


## 1. Principi

Una sola app, una sola scena, URL reali. Il contenuto vive in dati tipizzati, i componenti rendono dati. Il 3D si usa dove dà qualcosa (muro, Roundabout, scaffale se conviene); tutto il resto è DOM + SVG + GSAP. Ogni feature interattiva ha un equivalente in vista lista. Nessun backend.

## 2. Stack e versioni

Versioni in `package.json` (controllate il 16/11/2026, commit ca220d3): Vite 8.3 (rolldown), React 19.3, TypeScript 7 strict, react-router 8.5 (declarative), zustand 5, gsap 3.15 (+ `@gsap/react`, plugin Flip), three 0.187 + `@react-three/fiber` 9.8 + `@react-three/drei` 10.7, `page-flip` 2, zod 4, vitest 5, oxlint 1 (al posto di eslint) + prettier 3. Gli import nella catena di configurazione (vite.config → scripts → src/data) portano l'estensione `.ts` perché Vite 8 li carica in modo nativo. `vite.config.ts` separa i chunk `three` e `gsap` (code splitting) e dice a vitest di raccogliere `src/**/*.test.ts` in ambiente node. Asset pipeline in Python (Pillow), come i tool già nel repo. Fisica (`@react-three/rapier`) solo se una fase la richiede, decisione documentata qui.

## 3. Struttura

```
tuffrat-site/
  index.html                 entry Vite
  netlify.toml
  public/assets/img/...      immagini (URL invariati rispetto a oggi); edizioni/<slug>/ e fotografia/<id>/ con il loro manifest.json
  public/assets/models/      modelli 3D (banco.glb, pennarello.glb) da tools/blender
  src/
    main.tsx, App.tsx        mount, router (route reali, §5)
    pages/                   una pagina DOM per route: Home, Bio, SerieIndex, SerieDetail, OperaDetail, Edizioni, Mostre, Fotografia, NotFound
    data/                    artista, opere, polittici, serie, edizioni, mostre, rullini, schema (zod), index
    state/                   useScene, useOggetti, useLayout, useCursor, usePrefs
    core/                    Stage, SceneRouter, CameraRig, gesto, ponte, pan, roundabout, striscia, scene-map, webgl, mobile (definizione di «versione mobile»), inclinazione (luce col telefono), Cursor, ListView, motion/
    scenes/                  Muro, Banco, BioWall: i tre pezzi dell'unico mondo 3D
    three/                   mondo, layout-muro, luce, LucePuntatore, Frame, RoundaboutBoard, Libro, Bacheca, Rullino (con pellicola e strisciaFoto), Tv, RetroBio, modelli/ (useModello, ModelloBanco, ModelloPennarello)
    ui/                      componenti DOM: Layout (Nav, Hud, scheda, intro; monta Stage e SceneRouter solo in modo 3D), Nav, Hud, Lightbox, FlipBook, SfogliatoreMobile, FotoVisore, ImmagineZoom, TvVideo, Polyptych, RoundaboutPanel, OpereGrid, Contatti, PageHeader, TagIntro
    ui/logica/               conti puri dello sfogliatore (sfogliatore.ts), dello zoom dell'immagine (zoom.ts) e didascalia delle edizioni (didascaliaEdizione.ts), testati
    lib/                     edizioni (edizioni visibili, compresa la rivista di prova in dev), format, usePageMeta, youtube (indirizzo del player incorporato)
    assets/                  tag.svg (tracciato della tag, importato ?raw)
    styles/                  base.css (tutto lo stile, vista 3D e vista lista)
    types/                   dichiarazioni per page-flip
    dev/                     sandbox /dev/scena e /dev/bio-tv (solo in dev), rivista-test.ts (fanzine di prova)
  scripts/prerender-plugin.ts  plugin Vite: meta per route + sitemap + robots, in closeBundle
  src/routes.meta.ts         tabellone route → title/description/og:image (usato da plugin e da usePageMeta)
  tools/*.py                 pipeline asset: foto_to_webp, roundabout_tiles, streetpil_select (fanzine), rullini_select (rullini), fanzine_to_pages (rivista di prova), trace_tag
  tools/blender/             modelli 3D costruiti con Blender headless (README dentro)
  tools/qa/shot.mjs          prove a schermo con Edge headless (telefono, tocchi, pinch)
  legacy/                    sito statico precedente (fino al go-live)
  docs/                      audit, qa, decisioni
```

## 4. Schema dati (TypeScript, validato con zod)

```ts
type Slug = string;                         // kebab-case, unico per collezione

interface Immagine { src: string; width: number; height: number; alt: string }

type Stato =
  | 'disponibile' | 'su-richiesta' | 'venduto' | 'collezione-privata'
  | 'in-prestito' | 'riservato' | 'non-disponibile';

interface Opera {
  id: Slug; titolo: string; anno: number;
  tecnica: string; supporto?: string;
  misure: { w: number; h: number; unit: 'cm' };
  stato: Stato; nota?: string;
  immagine: Immagine; dettagli?: Immagine[];
  serie?: Slug; inHome?: boolean; ordine?: number;
}

interface Polittico {                        // Bustine di tè: Tè Nero (3), Tè Verde (2)
  id: Slug; titolo: string; anno: number; tecnica: string; supporto?: string;
  serie: Slug; pannelli: Opera[]; ordineDefault: Slug[];
}

interface Tessera { opera: Slug; texture?: string }   // texture 2048 quadrata, facoltativa

interface Serie {
  id: Slug; titolo: string; periodo: string; descrizione: string; copertina: Immagine;
  tipo: 'raccolta' | 'modulare' | 'polittici';
  opere?: Slug[];                            // raccolta
  polittici?: Slug[];                        // polittici
  modulare?: { tessere: Tessera[]; permutazioneDefault: number[]; rotazioniDefault: (0|90|180|270)[] };   // 4 tessere
  ordine?: number;                           // ordine nella mappa
}

interface Edizione {
  id: Slug; titolo: string; numero?: number;  // testata: «StreetPIL n. N»
  anno?: number;                             // assente quando non è noto: non si inventa
  tipo: 'fanzine'; descrizione?: string; copertina: Immagine;
  dorso?: { colore: string; testo: string }; // colore del dorso e della scritta, hex minuscolo
  pagine: string[];                          // percorsi ordinati
  altPagine?: string[];                      // stesso ordine di `pagine`, per l'elenco accessibile
  fonte?: string;                            // manifest di selezione
}

interface Fotogramma {   // file diritto (non ruotato), più la variante piccola per mobile e per la striscia a riposo
  src: string; srcPiccola: string; width: number; height: number; alt: string;
}

interface RullinoDati {
  id: Slug; etichetta: string; colore: string;   // etichetta = scritta a pennarello sullo scotch
  rotazione: number;                         // 0–359, gradi in senso orario con cui la foto si posa sulla striscia
  foto: Fotogramma[]; fonte?: string;
}

interface Mostra {
  id: Slug; titolo: string; anno: number; luogo: string; citta: string;
  tipo?: 'collettiva' | 'personale'; link?: { instagram?: string }; flyer?: Immagine; nota?: string;
}

interface Artista {
  brand: 'TuffRat'; nome: 'Malli'; eyebrow: string;
  lede: string[]; bioBreve: string[]; bio: string[];   // bioBreve = retro del ritratto in 3D
  statement: string; citazione: string;
  ritratto: Immagine; profilo: Immagine;              // profilo = foto del ritratto 3D
  contatti: { email: string; instagram: string; instagramHandle: string };
  video: { pulsos: { youtubeId: string; titolo: string; anno: number } };
}
```

Tutti i dati passano da zod una sola volta, in `src/data/index.ts`: un dato rotto fa fallire la build. Lo stesso file espone gli indici (`opereById`, `politticiById`, `serieById`, `edizioniById`, `mostreById`, `tutteLeOpereById` con i pannelli dei polittici) e i selettori `opereInHome`, `opereDiSerie`, `politticiDiSerie`.

Slug previsti: serie `2023-2025`, `roundabout`, `bustine-di-te`; polittici `te-nero`, `te-verde`; edizioni `streetpil-verde` (n. 1, «Muschio»), `streetpil-rossa` (n. 2, «Ruggine»), `streetpil-blu` (n. 3, «Cianotipo»), `streetpil-rave` (n. 4, «Acido»), tutte di 8 pagine 3:2; rullini `gialla` (28 foto, rotazione 90) e `ben` (24 foto, rotazione 0); mostre `mind-the-gap-2025`, `teatro-nero-2025`, `portali-onirici-2025`, `collezione-d-eccezione-2024`. In dev, fuori dai dati e dal prerender, si aggiunge la rivista di prova (`src/dev/rivista-test.ts`, via `edizioniVisibili` in `src/lib/edizioni.ts`).

Invarianti verificate dai test: slug unici per collezione; ogni `src` esiste in `public/`; width/height coincidono col file; ogni `serie` referenziata esiste; ogni `Polittico.ordineDefault` è una permutazione dei suoi pannelli; `permutazioneDefault` è una permutazione di 0..3; ogni pagina di edizione esiste ed `edizioni.ts` ricalca i `manifest.json` di `tools/streetpil_select.py`; `rullini.ts` ricalca i manifest di `tools/rullini_select.py` (conteggi 28 e 24, file presenti e mai ingranditi, `srcPiccola` ≤ 1024 px).

## 5. Route

| Route | Scena | Contenuto | Note |
|---|---|---|---|
| `/` | Muro | TagIntro → bio breve → opere singole appese | home; `?intro=1` rivede l'intro |
| `/bio` | Bio + BioWall | bio estesa, statement, contatti, link PULSOS; in 3D ritratto girevole (bio breve sul retro) e TV con il video | redirect 301 da `/about/` |
| `/opere/:slug` | Muro | cornice già in primo piano | deep link condivisibile |
| `/serie` | Muro | indice serie | |
| `/serie/2023-2025` | Muro | raccolta | 301 da `/serie/serie-01/` |
| `/serie/roundabout` | Muro | RoundaboutBoard, stato in `?p=&r=` | 301 da `/serie/serie-02/` |
| `/serie/bustine-di-te` | Muro | polittici | 301 da `/serie/serie-03/` |
| `/edizioni` | Banco | banco con le quattro fanzine StreetPIL, elenco nella scheda | |
| `/edizioni/:slug` | Banco | fanzine aperta: `Libro` si solleva e sopra si apre `FlipBook` (anche sopra l'elenco in vista lista) | |
| `/mostre`, `/mostre/:slug` | Muro | lista (v1), bacheca (v2) | |
| `/fotografia` | Banco | due rullini veri (gialla, ben) sul banco; nella scheda elenco di miniature e `FotoVisore`; contatti | |
| `/dev/scena`, `/dev/bio-tv` | — | sandbox: scena, angolo bio e TV | solo in dev |
| `*` | — | 404 | |

Preferenza globale `vista=lista` (query param iniziale o interruttore nel Nav) persistita in `usePrefs`; vale per tutte le route. `/serie/serie-04/` e `-05/` → 301 su `/serie`. Fallback SPA `/* → /index.html 200` in `netlify.toml`.

## 6. Stato (zustand)

- `useScene`: `{ scena: 'muro'|'banco'|'bio', target: CameraTarget, percorso, fuoco: Slug|null, schedaAperta, roundabout: StatoRoundabout, inTransizione, vaiA(pathname, search, hash), setScheda(aperta) }`. La mappa route → scena/target è la funzione pura `scenaPerRoute` in `src/core/scene-map.ts` (testata); `vaiA` la applica allo store e, per `/opere/:slug`, calcola il target dalla posa corrente della cornice (`posaDi` in `useLayout`) e imposta `fuoco`. La navigazione vera resta al router: `vaiA` non cambia l'URL, lo segue. Gli oggetti 3D navigano con `naviga()` di `src/core/ponte.ts`, dove il `SceneRouter` registra `navigate`. Ogni cambio di pagina chiama `useOggetti.azzera()`: rullino, ritratto e TV tornano a posto (il video si ferma).
- `useOggetti`: `{ primoPiano: { tipo: 'rullino', id } | { tipo: 'bio' } | { tipo: 'tv' } | null, tv: 'neve'|'video'|'spenta', setPrimoPiano(p), avviaVideo(), interruttoreTv(), azzera() }`. Un solo oggetto alla volta può stare in primo piano: così una regola unica copre il blocco dello scorrimento del muro, Esc, l'azzeramento al cambio di pagina e i testi dell'Hud. `video` vale solo mentre la TV è in primo piano; uscendo il video si ferma e torna la neve. Selettori `rullinoAperto`, `bioGirata`, `tvInPrimoPiano`.
- `useLayout`: `{ posizioni: Record<Slug, {x, y}>, ordini: Record<Slug, Slug[]>, sposta(id, punto), ripristina(), riordina(polittico, ordine) }`. `posizioni` (solo i quadri spostati) è persistito in localStorage (`tuffrat.layout.v1`, con versione); `ordini` dei polittici vale per la sessione. `poseHome`, `posePolittici` e `posaDi` derivano le pose sul muro.
- `useCursor`: `{ kind, tre: CursorKind|null, set(kind), setTre(kind) }` con `kind` in `'default'|'spray'|'marker'|'hand'|'grab'`. `kind` si deduce dall'elemento DOM sotto il puntatore; sul Canvas vale `tre`, che scrive l'oggetto 3D in hover o in drag (`useGesto`).
- `usePrefs`: `{ vistaLista: boolean, reducedMotion: boolean (da media query), webgl: boolean, toggleVistaLista() }`. `modo3D(prefs)` = `!vistaLista && !reducedMotion && webgl`: è l'unica condizione che monta Stage e Cursor. `vistaLista` iniziale: `?vista=lista|3d` nell'URL, poi `localStorage` (`tuffrat.prefs.v1`), altrimenti 3D. `webgl` = contesto WebGL ottenibile e `deviceMemory` > 2 GB.
- `navigazione.daScheda` (in `useScene.ts`): sul telefono la scheda resta aperta sulla pagina nuova se la navigazione parte da un link dentro la scheda (lo segna il `Layout` al click) o dalla cronologia del browser a scheda aperta (`vaiA(pathname, search, hash, indietro)`, con `indietro` dal tipo di navigazione del router).
- Stato Roundabout nell'URL (`?p=0123&r=0000`: `p[slot]` = tessera, `r[tessera]` = quarti di giro), per condivisibilità. Funzioni pure in `src/core/roundabout.ts` (testate, comprese le 24 × 256 disposizioni raggiungibili); lo store ne tiene una copia letta dall'URL perché il Canvas non vede il router.

Stato della striscia di un rullino srotolato (`{ x, h }`: scorrimento e altezza del fotogramma in pixel CSS) vive dentro `Rullino`, non in uno store: la matematica pura sta in `src/core/striscia.ts` (testata) e l'Hud la comanda con `comandaStriscia`/`registraStriscia` (`'indietro'|'avanti'|'zoom+'|'zoom-'`), come il `ponte`.

## 7. Contratti dei componenti

```ts
// core
<Stage>                          // Canvas R3F persistente (frameloop="demand"), lazy: monta Muro, Banco e BioWall insieme (un solo mondo); si smonta se !modo3D
<SceneRouter />                  // lato DOM: useLocation → useScene.vaiA(pathname, search, hash); registra navigate nel ponte; Esc rimette a posto l'oggetto in primo piano, poi chiude fuoco o scheda
<CameraRig />                    // dentro il Canvas: porta la camera sul target (≤800ms, 600ms per il fuoco; TARGET_BIO_RETRO e TARGET_TV quando ritratto o TV sono in primo piano), calcola la distanza da `inquadra` e dall'aspetto (tetto DISTANZA_MAX = 9.5); scorrimento del muro (drag sullo sfondo, rotella, inerzia) in `pan`, bloccato con un oggetto in primo piano
useGesto({ cursore, onClick, onDragStart, onDrag, onDragEnd, onHover })   // click contro drag per un oggetto R3F: è il ciclo riposo → afferra → rilascia di PhysicalObject. Un drag rifiutato (o un gesto rapido su touch) diventa scorrimento del muro
<Cursor />                       // lazy, solo in modo3D e con (pointer: fine); forma da data-cursor o dedotta nel DOM, da useCursor.tre sul Canvas
<ListView items label keyOf renderItem className? />  // ul/li con aria-label; usato da griglie opere, serie, edizioni, mostre, foto dei rullini in entrambe le viste

// ui (DOM)
<TagIntro onDone(versoContatti) statico? />          // lazy; tag da src/assets/tag.svg (tools/trace_tag.py), tratti-maschera, spray, bio; la monta Layout entrando dalla home, una volta per sessione (`tuffrat.intro.v1`, `?intro=1` la forza)
<Hud />                                             // solo 3D, sparisce a scheda aperta: istruzioni della scena e azioni senza oggetto (ripristina, copia link, torna al muro, apri scheda, comandi della striscia, riavvolgi/riappendi, spegni o accendi la TV)
<Polyptych polittico ordine onReorder />           // Flip plugin (caricato al primo riordino); drag, frecce da tastiera, pulsanti
<RoundaboutPanel serie />                           // equivalente DOM del board: click = ruota, frecce o pulsanti = scambia; stesso stato nell'URL
<FlipBook pagine altPagine? titolo proporzione? larghezza? altezza? ingresso? origine? tornoAlMioPosto? onClose(origine) />  // page-flip (importato all'apertura) in portale su body, parametri di flipbook.js; didascalia annunciata, focus trattenuto e restituito, Esc chiude
<FotoVisore foto indice onChange rullino origine />  // <dialog> nativo a tutto schermo: frecce e pulsanti, focus alla miniatura alla chiusura
<Lightbox opere indice onChange />                  // vista lista
<Nav />                                             // voci + interruttore vista lista (disabilitato senza WebGL o con reduced motion); sul telefono la prima voce è «Studio» (il muro della home)
<SfogliatoreMobile pagine altPagine titolo proporzione ridottoMovimento chiudiRef onClose />  // lo rende FlipBook sul telefono: una pagina alla volta, sempre in orizzontale (scena girata di 90° in verticale), il foglio segue il dito
<ImmagineZoom src alt width height loading? />      // telefono, pagina dell'opera: pinch, trascinamento e doppio tocco dentro il riquadro dell'immagine
<TvVideo />                                         // telefono: il video della TV in un riquadro DOM sopra la scena, montato con tv === 'video'

// three
<Frame opera x y tilt? spostabile? />               // cornice + tela con shader luce-puntatore (luce.ts); hover, click → /opere/:slug, drag con snap se spostabile
<LucePuntatore />                                   // aggiorna l'uniform condiviso uLuce: su desktop col puntatore, sul telefono con l'inclinazione del dispositivo (core/inclinazione.ts) e, mentre si tocca, col dito
<RoundaboutBoard />                                 // 4 tessere: click ruota, drag scambia; legge useScene.roundabout, scrive l'URL con replace
<Libro edizione x z giro? />                        // fanzine sul banco: formato dal rapporto della copertina (lato lungo 29,7 cm), blocco del colore di `dorso`; click → /edizioni/:slug, si alza e sopra si apre FlipBook
<Rullino dati x z giro? />                          // bussolotto di `dati.colore` con scotch (`etichetta`) e linguetta; click fuori da /fotografia → lì, su /fotografia apre/srotola la pellicola; drag sul banco; da aperto la striscia si posa davanti alla camera, con trascinamento, rotella, ctrl+rotella o due dita; ← → + − e i pulsanti dell'Hud; click sul bussolotto riavvolge
<Bacheca />                                         // locandine delle mostre (click → /mostre#id)
<Tv anteprimaVideo? />                              // TV accanto al ritratto, tre stati da useOggetti.tv: neve, spenta, video (su desktop iframe YouTube agganciato allo schermo da `#stage-html`; sul telefono lo mostra <TvVideo />); click sullo schermo → /bio o avviaVideo, click sul pulsante → interruttoreTv
<BioWall />                                         // dentro BioWall anche <Tv />: ritratto a x = RITRATTO.x; click da un'altra pagina → /bio, su /bio gira di 180° mostrando RetroBio (bioBreve), secondo click o Esc lo riappende
```

Oltre a `Bacheca` e alle cornici, lo `Stage` monta `Muro` (home, polittici, Roundabout, bacheca), `Banco` (fanzine a sinistra, rullini a destra, attrezzi di scena) e `BioWall` (ritratto e TV). Il video della TV si monta solo con `tv === 'video'`: un iframe semplice di `youtube-nocookie.com` (`src/lib/youtube.ts`, senza l'API IFrame), su desktop dentro drei `Html transform` in un contenitore `#stage-html` fratello dello Stage (`aria-hidden`), sul telefono in `TvVideo`; allo smontaggio l'iframe sparisce e l'audio si ferma. Sulla pellicola, la geometria e i limiti stanno in `src/core/striscia.ts` (funzioni pure, testate), le texture procedurali in `pellicola.ts`, caricamento e finestra visibile in `strisciaFoto.ts`.

Contratto comune delle transizioni: ogni scena espone `enter(tl)` ed `exit(tl)` che appendono a una timeline GSAP passata dal `SceneRouter`; in reduced-motion le timeline vengono eseguite con `progress(1)`.

Layout del DOM in modo 3D (rivisto il 16/11/2026, vedi `docs/decisioni.md`): lo `Stage` è `position: fixed` a tutto schermo; la Nav è una barra flottante traslucida; il contenuto della route sta in un `.sheet` che è un cassetto fisso in basso, chiuso di default (si vede solo la maniglia con il titolo, 56 px) e apribile dalla maniglia, dall'`Hud`, da un link con hash o dallo skip link. Da chiuso il corpo è `inert` (la maniglia è un pulsante con `aria-expanded`). La pagina non scorre: scorre il corpo della scheda. Vista lista = stesso markup senza Stage, in flusso normale. Le opere della home in 3D vivono solo come `Frame` sul muro; i testi restano nella scheda. Gli overlay (FlipBook, TagIntro) vanno in portale su `body`, perché la scheda ha un `transform`; FotoVisore è un `<dialog>` nativo a sua volta.

Unità del mondo 3D: 1 unità = 50 cm. Costanti in `src/three/mondo.ts`: muro = piano z=0 da x=-18 a x=14, alto 8, centrato in y=2; pavimento a y=-1.5; banco 4,6 × 1,5 con il piano a y=-0.56 e centro a z=2.2. Zone del muro (`ZONA`): home 0, Roundabout -6.6, Bustine di tè -10.2, bacheca mostre -13.9, ritratto 6.5, TV 8.5. Il ritratto (`RITRATTO`) è centrato su `ZONA.bio` e viene avanti a `zPrimoPiano` per girare; la TV (`TV`) sta su `ZONA.tv` girata di -0.18 rad, con schermo 0,72 × 0,54 e pulsante in basso a destra (`frontaleTv` dà un punto del frontale e la sua normale). Sul banco: fanzine a sinistra, rullini a destra (35 mm ingranditi 2,5×). I target camera stanno in `scene-map.ts` (`MURO`, `SERIE`, `TARGET_ROUNDABOUT`, `TARGET_BUSTINE`, `EDIZIONI`, `FOTOGRAFIA`, `TARGET_BIO_RETRO`, `TARGET_TV`); un target può dichiarare `inquadra: { w, h, riempi }` e allora la distanza si calcola nel Canvas dal rapporto d'aspetto (con un tetto: su schermi stretti si vede una parte e il resto si scorre).

Versione mobile (`src/core/mobile.ts`: `eMobile()`, `useMobile()`, la stessa query nel CSS): tutto ciò che segue vale solo lì, il desktop non cambia.
- Muro: i polittici delle Bustine di tè stanno in colonna sopra Roundabout (`BUSTINE_MOBILE`, `zonaBustine()` e `ingombroColonna()` in `layout-muro.ts`) e non si riordinano; inquadrature proprie per home, serie, Roundabout, Bustine e, in verticale, per il banco (`scene-map.ts`); quadro a fuoco all'82 % dello schermo.
- Camera (`CameraRig`): pinch a due dita sul muro, limiti assoluti di distanza e quota, uscita dal fuoco restando davanti al quadro, tocco sulla parete attorno a Roundabout → `/serie`. `presa.pinch` e `presa.annulla` (in `gesto.ts`) fermano i gesti degli oggetti durante il pinch.
- Banco: un tocco sul piano o su una fanzine, dal muro, porta a `/edizioni`; sulla metà dei rullini a `/fotografia`.
- Rullino: `posaRullino(largo, alto, mobile)` in `src/core/striscia.ts` decide in pixel del canvas dove stanno bussolotto e pellicola (vale anche su desktop); la pellicola segue la camera su un piano a distanza 1.
- DOM: scheda a 80dvh che resta aperta navigando dal suo interno; Hud diviso in suggerimento a tempo (in alto) e pulsanti (sopra la maniglia); voce «Studio»; sfogliatore, zoom dell'opera e video della TV nei componenti elencati sopra.

Modelli 3D: `public/assets/models/banco.glb` e `pennarello.glb`, costruiti con Blender headless (`tools/blender/`) e caricati da `src/three/modelli/` con `useModello` (`useGLTF` senza Draco né Meshopt), ciascuno in una `Suspense` con le primitive come ripiego. Bussolotto, bomboletta e TV sono geometria in codice.

Prove a schermo: `tools/qa/shot.mjs` (playwright-core con Edge di sistema) apre il dev server in emulazione telefono, con tocchi, trascinamenti e pinch, e scatta le schermate.

## 8. Build, deploy, prerender

`npm run build` = `tsc -b && vite build`; il plugin `scripts/prerender-plugin.ts` in `closeBundle` scrive, per ogni route statica nota dai dati (`src/routes.meta.ts`), `dist/<route>/index.html` copiando l'index con head sostituito (title, description, og:title, og:image, canonical) e genera `dist/sitemap.xml` e `dist/robots.txt`. A runtime `usePageMeta` applica lo stesso tabellone. `npm run check` = typecheck + oxlint + vitest (configurato su `src/**/*.test.ts`). `netlify.toml`: `[build] command="npm run build" publish="dist"` con Node 24, redirect 301 legacy, fallback SPA, e `Cache-Control: immutable` per `/assets/img/*`. Branch deploy di `redesign` pubblico; produzione da `main` solo dopo merge con ok esplicito.

## 9. Accessibilità e motion

`prefers-reduced-motion` letto una volta e osservato; vista lista è l'equivalente completo; focus visibile; tutte le azioni drag hanno un'alternativa da tastiera (pulsanti o frecce); `aria-live` per i cambi di scena.

## 10. Convenzioni

Slug kebab-case; file immagine `ANNO_Titolo_NN.webp` come oggi; componenti PascalCase; stato in italiano come i dati; commit in italiano all'imperativo come la history attuale; ogni decisione architetturale che cambia questo file va in `docs/decisioni.md` con data.

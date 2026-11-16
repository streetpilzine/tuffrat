---
titolo: ARCHITECTURE — redesign TuffRat
progetto: tuffrat-site
data: 2026-11-11
stato: v0.3 (fase 2 e base della 3a implementate; §3, §5, §6 e §7 aggiornati il 16/11/2026)
---

# ARCHITECTURE

Contratto tecnico del redesign: chi lavora su un componente, un dato o una route parte da qui. Il piano, le fasi e le scadenze sono in `PLAN-redesign.md`.


## 1. Principi

Una sola app, una sola scena, URL reali. Il contenuto vive in dati tipizzati, i componenti rendono dati. Il 3D si usa dove dà qualcosa (muro, Roundabout, scaffale se conviene); tutto il resto è DOM + SVG + GSAP. Ogni feature interattiva ha un equivalente in vista lista. Nessun backend.

## 2. Stack e versioni

Versioni installate l'11/11/2026: Vite 8 (rolldown), React 19, TypeScript 7 strict, react-router 8 (declarative), zustand 5, gsap 3 (+ `@gsap/react`, plugin Draggable e Flip), three 0.187 + `@react-three/fiber` 9 + `@react-three/drei` 10, `page-flip` 2, zod 4, vitest 5, oxlint (al posto di eslint) + prettier. Gli import nella catena di configurazione (vite.config → scripts → src/data) portano l'estensione `.ts` perché Vite 8 li carica in modo nativo. Asset pipeline in Python (Pillow), come i tool già nel repo. Fisica (`@react-three/rapier`) solo se una fase la richiede, decisione documentata qui.

## 3. Struttura

```
tuffrat-site/
  index.html                 entry Vite
  netlify.toml
  public/assets/img/...      immagini (URL invariati rispetto a oggi)
  src/
    main.tsx, App.tsx        providers, router, Stage
    data/                    artista, opere, serie, edizioni, mostre, schema (zod), index
    state/                   useScene, useLayout, useCursor, usePrefs
    core/                    Stage, SceneRouter, CameraRig, gesto, ponte, pan, roundabout, scene-map, Cursor, ListView, motion/
    scenes/                  Muro, Bio, Serie, Edizioni, Mostre, Fotografia(v2), Tv(v2)
    three/                   mondo, layout-muro, luce, LucePuntatore, Frame, RoundaboutBoard, Libro, Rullino, Bacheca, Tv
    ui/                      componenti DOM: Nav, Hud, Lightbox, FlipBook, Polyptych, RoundaboutPanel, TagIntro
    assets/                  tag.svg (tracciato della tag, importato ?raw)
    styles/                  tokens.css, base.css
    dev/                     sandbox /dev/* (solo in dev)
  scripts/prerender-plugin.ts  plugin Vite: meta per route + sitemap + robots, in closeBundle
  src/routes.meta.ts         tabellone route → title/description/og:image (usato da plugin e da usePageMeta)
  tools/*.py                 pipeline asset
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

interface Tessera { id: Slug; immagine: Immagine; texture: string }   // texture 2048 quadrata

interface Serie {
  id: Slug; titolo: string; periodo: string; descrizione: string; copertina: Immagine;
  tipo: 'raccolta' | 'modulare' | 'polittici';
  opere?: Slug[];                            // raccolta
  polittici?: Slug[];                        // polittici
  modulare?: { tessere: Tessera[]; permutazioneDefault: number[]; rotazioniDefault: (0|90|180|270)[] };
}

interface Edizione {
  id: Slug; titolo: string; anno: number; tipo: 'fanzine';
  descrizione?: string; copertina: Immagine; pagine: string[];   // percorsi ordinati
  fonte?: string;                            // manifest di selezione
}

interface Mostra {
  id: Slug; titolo: string; anno: number; luogo: string; citta: string;
  tipo?: 'collettiva' | 'personale'; link?: { instagram?: string }; flyer?: Immagine;
}

interface Artista {
  brand: 'TuffRat'; nome: 'Malli'; lede: string; bio: string[]; statement: string; citazione: string;
  ritratto: Immagine; profilo: Immagine;
  contatti: { email: string; instagram: string };
  video: { pulsos: { youtubeId: string; titolo: string; anno: number } };
}
```

Slug previsti: serie `2023-2025`, `roundabout`, `bustine-di-te`; polittici `te-nero`, `te-verde`; edizioni `streetpil-verde`, `streetpil-rossa`, `streetpil-blu`, `streetpil-rave`; mostre `mind-the-gap-2025`, `teatro-nero-2025`, `portali-onirici-2025`, `collezione-d-eccezione-2024`.

Invarianti verificate dai test: slug unici per collezione; ogni `src` esiste in `public/`; width/height coincidono col file; ogni `serie` referenziata esiste; ogni `Polittico.ordineDefault` è una permutazione dei suoi pannelli; `permutazioneDefault` è una permutazione di 0..3.

## 5. Route

| Route | Scena | Contenuto | Note |
|---|---|---|---|
| `/` | Muro | TagIntro → bio breve → opere singole appese | home; `?intro=1` rivede l'intro |
| `/bio` | Bio | bio estesa, statement, contatti, link PULSOS | redirect 301 da `/about/` |
| `/opere/:slug` | Muro | cornice già in primo piano | deep link condivisibile |
| `/serie` | Muro | indice serie | |
| `/serie/2023-2025` | Muro | raccolta | 301 da `/serie/serie-01/` |
| `/serie/roundabout` | Muro | RoundaboutBoard, stato in `?p=&r=` | 301 da `/serie/serie-02/` |
| `/serie/bustine-di-te` | Muro | polittici | 301 da `/serie/serie-03/` |
| `/edizioni` | Banco | scaffale | |
| `/edizioni/:slug` | Banco | fanzine aperta | |
| `/mostre`, `/mostre/:slug` | Muro | lista (v1), bacheca (v2) | |
| `/fotografia` | Banco | «in arrivo» + contatti (v1), rullini (v2) | |
| `/dev/:componente` | — | sandbox | solo in dev |
| `*` | — | 404 | |

Preferenza globale `vista=lista` (query param iniziale o interruttore nel Nav) persistita in `usePrefs`; vale per tutte le route. `/serie/serie-04/` e `-05/` → 301 su `/serie`. Fallback SPA `/* → /index.html 200` in `netlify.toml`.

## 6. Stato (zustand)

- `useScene`: `{ scena: 'muro'|'banco'|'bio', target: CameraTarget, percorso, fuoco: Slug|null, schedaAperta, roundabout: StatoRoundabout, inTransizione, vaiA(pathname, search, hash), setScheda(aperta) }`. La mappa route → scena/target è la funzione pura `scenaPerRoute` in `src/core/scene-map.ts` (testata); `vaiA` la applica allo store e, per `/opere/:slug`, calcola il target dalla posa corrente della cornice (`posaDi` in `useLayout`) e imposta `fuoco`. La navigazione vera resta al router: `vaiA` non cambia l'URL, lo segue. Gli oggetti 3D navigano con `naviga()` di `src/core/ponte.ts`, dove il `SceneRouter` registra `navigate`.
- `useLayout`: `{ posizioni: Record<Slug, {x, y}>, ordini: Record<Slug, Slug[]>, sposta(id, punto), ripristina(), riordina(polittico, ordine) }`. `posizioni` (solo i quadri spostati) è persistito in localStorage (`tuffrat.layout.v1`, con versione); `ordini` dei polittici vale per la sessione. `poseHome`, `posePolittici` e `posaDi` derivano le pose sul muro.
- `useCursor`: `{ kind, tre: CursorKind|null, set(kind), setTre(kind) }` con `kind` in `'default'|'spray'|'marker'|'hand'|'grab'`. `kind` si deduce dall'elemento DOM sotto il puntatore; sul Canvas vale `tre`, che scrive l'oggetto 3D in hover o in drag (`useGesto`).
- `usePrefs`: `{ vistaLista: boolean, reducedMotion: boolean (da media query), webgl: boolean, toggleVistaLista() }`. `modo3D(prefs)` = `!vistaLista && !reducedMotion && webgl`: è l'unica condizione che monta Stage e Cursor. `vistaLista` iniziale: `?vista=lista|3d` nell'URL, poi `localStorage` (`tuffrat.prefs.v1`), altrimenti 3D. `webgl` = contesto WebGL ottenibile e `deviceMemory` > 2 GB.
- Stato Roundabout nell'URL (`?p=0123&r=0000`: `p[slot]` = tessera, `r[tessera]` = quarti di giro), per condivisibilità. Funzioni pure in `src/core/roundabout.ts` (testate, comprese le 24 × 256 disposizioni raggiungibili); lo store ne tiene una copia letta dall'URL perché il Canvas non vede il router.

## 7. Contratti dei componenti

```ts
// core
<Stage>                          // Canvas R3F persistente (frameloop="demand"), lazy: monta Muro, Banco e BioWall insieme (un solo mondo); si smonta se !modo3D
<SceneRouter />                  // lato DOM: useLocation → useScene.vaiA(pathname, search, hash); registra navigate nel ponte; Esc chiude scheda o fuoco
<CameraRig />                    // dentro il Canvas: porta la camera sul target (≤800ms, 600ms per il fuoco), calcola la distanza da `inquadra` e dall'aspetto; scorrimento del muro (drag sullo sfondo, rotella, inerzia) in `pan`
useGesto({ cursore, onClick, onDragStart, onDrag, onDragEnd, onHover })   // click contro drag per un oggetto R3F: è il ciclo riposo → afferra → rilascia di PhysicalObject. Un drag rifiutato (o un gesto rapido su touch) diventa scorrimento del muro
<Cursor />                       // lazy, solo in modo3D e con (pointer: fine); forma da data-cursor o dedotta nel DOM, da useCursor.tre sul Canvas
<ListView items label keyOf renderItem />  // ul/li con aria-label; usato da griglie opere, serie, edizioni, mostre in entrambe le viste

// ui (DOM)
<TagIntro onDone statico? />                        // lazy; tag da src/assets/tag.svg (tools/trace_tag.py), tratti-maschera, spray, bio; la monta Layout una volta per sessione (`?intro=1` la forza)
<Hud />                                             // solo 3D: istruzioni della scena e azioni senza oggetto (ripristina, copia link, torna al muro, apri scheda)
<Polyptych polittico ordine onReorder />           // Flip plugin (caricato al primo riordino); drag, frecce da tastiera, pulsanti
<RoundaboutPanel serie />                           // equivalente DOM del board: click = ruota, frecce o pulsanti = scambia; stesso stato nell'URL
<FlipBook pagine titolo proporzione? onClose />     // wrapper page-flip in portale su body, stessi parametri di flipbook.js
<Lightbox opera onClose />                          // vista lista
<Nav />                                             // voci + interruttore vista lista

// three
<Frame opera x y tilt? spostabile? />               // cornice + tela con shader luce-puntatore (luce.ts); hover, click → /opere/:slug, drag con snap se spostabile
<LucePuntatore />                                   // aggiorna l'uniform condiviso uLuce sul pointermove e invalida
<RoundaboutBoard />                                 // 4 tessere: click ruota, drag scambia; legge useScene.roundabout, scrive l'URL con replace
<Libro edizione x z giro? />                        // fanzine sul banco: click → /edizioni/:slug, si alza e sopra si apre FlipBook
<Rullino id etichetta colore x z giro? aperto onApri />  // bussolotto con scotch e linguetta; click su /fotografia srotola la pellicola; drag sul banco
<Bacheca />  <Tv />                                 // locandine delle mostre (click → /mostre#id); TV con PULSOS (click → YouTube)
```

Contratto comune delle transizioni: ogni scena espone `enter(tl)` ed `exit(tl)` che appendono a una timeline GSAP passata dal `SceneRouter`; in reduced-motion le timeline vengono eseguite con `progress(1)`.

Layout del DOM in modo 3D (rivisto il 16/11/2026, vedi `docs/decisioni.md`): lo `Stage` è `position: fixed` a tutto schermo; la Nav è una barra flottante traslucida; il contenuto della route sta in un `.sheet` che è un cassetto fisso in basso, chiuso di default (si vede solo la maniglia con il titolo, 56 px) e apribile dalla maniglia, dall'`Hud`, da un link con hash o dallo skip link. Da chiuso il corpo è `inert`. La pagina non scorre: scorre il corpo della scheda. Vista lista = stesso markup senza Stage, in flusso normale. Le opere della home in 3D vivono solo come `Frame` sul muro; i testi restano nella scheda. Gli overlay (FlipBook, TagIntro) vanno in portale su `body`, perché la scheda ha un `transform`.

Unità del mondo 3D: 1 unità = 50 cm. Costanti in `src/three/mondo.ts`: muro = piano z=0 da x=-18 a x=14, alto 8, centrato in y=2; pavimento a y=-1.5; banco 4,6 × 1,5 con il piano a y=-0.56 e centro a z=2.2. Zone del muro (ascissa del centro): home 0, Roundabout -6.6, Bustine di tè -10.2, bacheca mostre -13.9, ritratto 6.5, TV 8.5. Sul banco: fanzine a sinistra, rullini a destra. I target camera stanno in `scene-map.ts`; un target può dichiarare `inquadra: { w, h, riempi }` e allora la distanza si calcola nel Canvas dal rapporto d'aspetto (con un tetto: su schermi stretti si vede una parte e il resto si scorre).

## 8. Build, deploy, prerender

`npm run build` = `tsc -b && vite build`; il plugin `scripts/prerender-plugin.ts` in `closeBundle` scrive, per ogni route statica nota dai dati (`src/routes.meta.ts`), `dist/<route>/index.html` copiando l'index con head sostituito (title, description, og:title, og:image, canonical) e genera `dist/sitemap.xml` e `dist/robots.txt`. A runtime `usePageMeta` applica lo stesso tabellone. `npm run check` = typecheck + oxlint + vitest. `netlify.toml`: `[build] command="npm run build" publish="dist"`, redirect 301 legacy, fallback SPA. Branch deploy di `redesign` pubblico; produzione da `main` solo dopo merge con ok esplicito.

## 9. Accessibilità e motion

`prefers-reduced-motion` letto una volta e osservato; vista lista è l'equivalente completo; focus visibile; tutte le azioni drag hanno un'alternativa da tastiera (pulsanti o frecce); `aria-live` per i cambi di scena.

## 10. Convenzioni

Slug kebab-case; file immagine `ANNO_Titolo_NN.webp` come oggi; componenti PascalCase; stato in italiano come i dati; commit in italiano all'imperativo come la history attuale; ogni decisione architetturale che cambia questo file va in `docs/decisioni.md` con data.

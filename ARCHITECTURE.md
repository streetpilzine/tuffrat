---
titolo: ARCHITECTURE — redesign TuffRat
progetto: tuffrat-site
data: 2026-11-11
stato: v0.1 (fase 0 in corso; si consolida a fine fase 0)
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
    core/                    Stage, SceneRouter, PhysicalObject, Cursor, ListView, motion/
    scenes/                  Muro, Bio, Serie, Edizioni, Mostre, Fotografia(v2), Tv(v2)
    three/                   Frame, Wall, RoundaboutBoard, Shelf, shaders/
    ui/                      componenti DOM: Nav, Card, Lightbox, FlipBook, Polyptych, TagIntro
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
| `/` | Muro | TagIntro → bio breve → opere singole appese | home |
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

- `useScene`: `{ scena: 'muro'|'banco'|'bio', target: CameraTarget, inTransizione: boolean, vaiA(route) }`.
- `useLayout`: `{ posizioni: Record<Slug, Pose>, sposta(id, pose), ripristina() }`, persistito in localStorage con versione schema.
- `useCursor`: `{ kind: 'default'|'spray'|'marker'|'hand'|'grab', set(kind) }`.
- `usePrefs`: `{ vistaLista: boolean, reducedMotion: boolean (da media query), webgl: boolean, toggleVistaLista() }`.
- Stato Roundabout nell'URL (search params), non in store, per condivisibilità.

## 7. Contratti dei componenti

```ts
// core
<Stage>                          // Canvas R3F persistente; monta children delle scene; si smonta se !webgl || vistaLista
<SceneRouter routes={RouteMap}>  // route → { scena, target }; esegue transizione camera (gsap, ≤800ms) poi monta la scena
<PhysicalObject id pose draggable? snap? onGrab? onRelease? onInspect? cursor?>  // ciclo riposo → afferra → in primo piano → ispeziona → rilascia; usato da Frame, Book
<Cursor />                       // legge useCursor; nascosto su touch e in vistaLista
<ListView collezione items renderItem />  // DOM semanticamente corretto (ul/li, h2/h3), tastiera

// ui (DOM)
<TagIntro svg onDone skippable oncePerSession />
<Polyptych polittico ordine onReorder />           // Flip plugin; frecce da tastiera
<FlipBook pagine titolo onClose />                  // wrapper page-flip, stessi parametri di flipbook.js
<Lightbox opera onClose />                          // vista lista
<Nav />                                             // voci + interruttore vista lista

// three
<Wall />                                            // piano con texture, luci
<Frame opera pose onInspect />                      // mesh + shader luce-puntatore; usa PhysicalObject
<RoundaboutBoard tessere permutazione rotazioni onChange />
<Shelf edizioni onOpen /> + <Book edizione pose />
```

Contratto comune delle transizioni: ogni scena espone `enter(tl)` ed `exit(tl)` che appendono a una timeline GSAP passata dal `SceneRouter`; in reduced-motion le timeline vengono eseguite con `progress(1)`.

## 8. Build, deploy, prerender

`npm run build` = `tsc -b && vite build`; il plugin `scripts/prerender-plugin.ts` in `closeBundle` scrive, per ogni route statica nota dai dati (`src/routes.meta.ts`), `dist/<route>/index.html` copiando l'index con head sostituito (title, description, og:title, og:image, canonical) e genera `dist/sitemap.xml` e `dist/robots.txt`. A runtime `usePageMeta` applica lo stesso tabellone. `npm run check` = typecheck + oxlint + vitest. `netlify.toml`: `[build] command="npm run build" publish="dist"`, redirect 301 legacy, fallback SPA. Branch deploy di `redesign` pubblico; produzione da `main` solo dopo merge con ok esplicito.

## 9. Accessibilità e motion

`prefers-reduced-motion` letto una volta e osservato; vista lista è l'equivalente completo; focus visibile; tutte le azioni drag hanno un'alternativa da tastiera (pulsanti o frecce); `aria-live` per i cambi di scena.

## 10. Convenzioni

Slug kebab-case; file immagine `ANNO_Titolo_NN.webp` come oggi; componenti PascalCase; stato in italiano come i dati; commit in italiano all'imperativo come la history attuale; ogni decisione architetturale che cambia questo file va in `docs/decisioni.md` con data.

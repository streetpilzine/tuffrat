---
titolo: Piano del redesign TuffRat (v1 entro il 24/12/2026)
progetto: tuffrat-site
data: 2026-11-11
stato: approvato
fonti: RECAP-redesign-2026-09-16.md; QA-direzione-redesign-2026-11-11.md
modello: claude-fable-5-2
---

# PLAN — redesign TuffRat

## Contesto e decisioni prese

Il sito tuffrat.art è statico (HTML a mano, `style.css`, lightbox in `script.js`, flipbook StPageFlip) e pubblicato su Netlify da `main`. Il brainstorming del 16/09 (RECAP) ha fissato il concetto «studio vivo: un muro e un banco, tutto si afferra» e il Q/A dell'11/11 ha chiuso le 17 domande di direzione. Questo piano traduce quelle decisioni in fasi con criteri di accettazione, scadenze verso il 24/12/2026, subagent per fase, schema dati, route e contratti dei componenti.

Si lavora sul branch `redesign`. Nessun push senza ok esplicito, `main` non si tocca: Netlify pubblica da `main`. Lo schema dati, le route e i contratti dei componenti sono in `ARCHITECTURE.md`.

Decisioni già prese che il piano incorpora (non si ridiscutono):
- Modello di lavoro: claude-fable-5-2 (chiude il dubbio «Fable 2.5» del Q/A).
- Stack: Vite + React + TypeScript, SPA statica; Three/R3F/drei solo dove guadagna; GSAP unica libreria DOM; niente Framer Motion, niente Lenis in v1; fisica solo se serve (rapier), altrimenti spring e drag.
- react-router con URL reali e prerender dei meta in build.
- V1 = fasi 0, 1, 2 + fanzine apribili. Fotografia, TV PULSOS e bacheca mostre in v2.
- Bustine di tè = polittico piatto (modello dati «gruppo con N pannelli»).
- Selezione automatica zine StreetPIL: esclude `pr0n` e le cartelle dei contributori (`gab`, `favola`, `sk8`, `special`, `megafoto`). Restano `1-verde`, `2-rossa`, `3-blu`, `4-rave`, `graffiti`, `malli`.
- Tessere Roundabout da `..\fotuzze\serie-02_Roundabout\` (4 JPG quadrati ~5800 px + 2 dettagli).
- Anteprime Netlify pubbliche, senza password. Netlify pubblica da `main`: lavoro su `redesign`, test in localhost.
- Skill elayadesign: copia autorizzata in `.claude/skills/` (parte visiva di landing-page-design con valori TuffRat; redesign-skill solo per l'audit del sito statico).

Cosa ho verificato nel repo e sul disco:
- Contenuti attuali: 9 opere singole in home, serie-01 (2 opere), Roundabout (4 tessere + 2 dettagli), Bustine di tè (Tè Nero ×3, Tè Verde ×2), 4 mostre in `mostre.txt` e `mostre/index.html`, bio e statement in `about/index.html`, contatti (mail streetpilzine, IG tuff_rat), video PULSOS `ngi81Oa-Jtc`. Serie 04 e 05 sono placeholder vuoti.
- `..\fotuzze\opere.json` ha già la scheda strutturata di tutte le 20 opere (titolo, anno, tecnica, supporto, misure, stato, nota) e `pubblica.py` la pipeline JPG→WebP. È la fonte dati della fase 0, non l'HTML.
- StreetPIL non ha PDF: è una cartella di immagini. I quattro numeri hanno 5 foto ciascuno; `graffiti` 194 e `malli` 43. La «fanzine» v1 si costruisce da immagini, non da PDF (`tools/fanzine_to_pages.py` resta per quando arriveranno i PDF).
- Mancano nel repo: `netlify.toml`, `tag.svg`, `ritratto.webp` (referenziato 3 volte in fotografia), qualsiasi tooling Node. Node 24 e Python 3.14 con Pillow sono sul PC.
- `assets/css/style.css` è un residuo; `thumb/` vuote.


## 1. Scopo e scadenza

V1 online il 24/12/2026: palcoscenico, muro (tag/spray/bio, cornici con riflesso e riaggancio, Roundabout modulare, polittici Bustine di tè), scaffale fanzine apribili, vista lista accessibile, URL reali con meta per social. Solo materiale già presente.

## 2. Calendario (oggi 11/11, 6 settimane)

| Fase | Finestra | Milestone | Deliverable |
|---|---|---|---|
| 0 Scaffold e dati | 11/11 → 18/11 | M0 «parità» | App Vite che renderizza da dati lo stesso contenuto del sito attuale |
| 1 Palcoscenico | 19/11 → 28/11 | M1 «navigazione è movimento» | Stage, SceneRouter, cursore, vista lista |
| 2 Muro | 29/11 → 13/12 | M2 «il muro vive» | TagIntro, cornici+riflesso+riaggancio, Roundabout, polittico |
| 3a Fanzine | 14/12 → 18/12 | M3 «scaffale» | Selezione StreetPIL, scaffale, flipbook React |
| 4 Rifinitura v1 | 19/12 → 22/12 | M4 «release candidate» | a11y, reduced-motion, prerender meta, perf, mobile, 404, favicon |
| Go-live | 23/12 → 24/12 | M5 «online» | Review su preview, ok esplicito, merge su main |

La selezione StreetPIL (script + manifest) parte in parallelo durante la fase 2, così la fase 3a è solo UI.

Input richiesti a Gabriele, con data limite:
- Foto della tag ad alto contrasto: entro 25/11 (serve per TagIntro in fase 2). Fallback se tarda: tracciato provvisorio dal lettering «TuffRat» in font marker, sostituibile senza toccare il codice.
- Ok sul manifest della selezione StreetPIL (lista file scelti): entro 17/12.
- Ok esplicito al merge su main: 24/12.

## 3. Fasi, criteri di accettazione, subagent

Ogni fase si chiude con una checklist verificata in locale (`npm run check` + `npm run build` + controllo visivo via Chrome). Niente push finché non lo chiedi.

### Fase 0 — Scaffold e data layer (→ 18/11)

Lavoro:
- Branch `redesign`. Vite + React 19 + TS strict, react-router 7, zustand, gsap, three + @react-three/fiber + drei, page-flip, zod, vitest. ESLint + Prettier.
- Il sito statico attuale va in `legacy/` (git mv), ancora apribile per confronto. Le immagini vanno in `public/assets/img/...` con gli stessi URL di oggi.
- `src/data/` tipizzato: `artista.ts`, `opere.ts`, `serie.ts`, `edizioni.ts`, `mostre.ts`, generati una volta da `fotuzze/opere.json` + HTML attuale, poi mantenuti a mano. Schemi zod in `src/data/schema.ts`; test vitest che valida i dati e verifica che ogni immagine esista su disco con width/height corretti.
- Route di parità (vedi ARCHITECTURE) con componenti DOM semplici: griglie, lightbox equivalente, flipbook vuoto. Stesso look del sito attuale (tokens CSS portati in `src/styles/tokens.css`).
- `netlify.toml`: build `npm run build`, publish `dist`, redirect legacy e fallback SPA.
- `.claude/skills/`: copia di landing-page-design con valori TuffRat; audit del sito statico con redesign-skill → `docs/audit-statico.md` (serve come lista di difetti da non ripetere).
- `.claude/agents/`: definizione dei subagent di progetto (sotto).
- `ARCHITECTURE.md` finale a partire dalla bozza.

Accettazione:
- `npm run dev`, `npm run build`, `npm run check` (tsc + eslint + vitest) passano.
- Tutte le route elencate rendono il contenuto del sito attuale: 9 singoli, 2 opere serie 2023-2025, Roundabout 4+2, Tè Nero 3 e Tè Verde 2 come polittici, 4 mostre, bio, statement, contatti, link PULSOS. Nessun testo perso rispetto a `legacy/`.
- Test dati: zero immagini mancanti, zero slug duplicati.
- `netlify.toml` presente; `npx serve dist` risponde su tutte le route e sui redirect legacy.
- Nessun errore in console su nessuna route.

Subagent: `dati-tuffrat` (estrazione e validazione dati), `Explore` (audit con redesign-skill), `qa-visivo` (screenshot parità legacy vs nuovo, desktop e mobile).

### Fase 1 — Palcoscenico (→ 28/11)

Lavoro: `Stage` (Canvas R3F persistente, camera, luci), `SceneRouter` (route → scena → target camera, transizioni GSAP), `Cursor` contestuale (default, bomboletta, pennarello, mano, pugno), `usePrefs` con vista lista e reduced-motion, `ListView` per ogni route, lazy-load del chunk three.

Accettazione:
- Click su una voce di navigazione: la camera si muove (≤ 800 ms), l'URL cambia, back/forward del browser funzionano, refresh su qualsiasi route ricarica la scena giusta.
- Il cursore cambia su almeno 3 tipi di oggetto.
- Con `prefers-reduced-motion` o interruttore «vista lista» attivo: nessuna animazione, nessun Canvas, tutto il contenuto raggiungibile da tastiera (Tab/Enter) e con heading corretti.
- Se WebGL non è disponibile si cade automaticamente su vista lista.
- Il chunk three non è nel bundle iniziale; JS iniziale ≤ 250 kB gzip.
- Nessun frame > 50 ms in idle su desktop (Performance panel di Chrome).

Subagent: `scena-3d` (Stage e camera), `motion-dom` (transizioni e cursore), `qa-visivo`.

### Fase 2 — Il muro (→ 13/12)

Lavoro:
- `TagIntro` (SVG + GSAP): scrittura della tag con `stroke-dashoffset`, passata spray zigzag a mascherare, reveal della bio breve e dei due pulsanti. Una volta per sessione, saltabile.
- `Frame` (R3F): cornice per ogni opera singola, leggermente storta a riposo; click → vola in primo piano; luce che segue il puntatore via shader (niente normal map in v1); Esc/click fuori → torna; drag → riaggancio su griglia con snap e persistenza in `useLayout` (localStorage) + «ripristina».
- `RoundaboutBoard` (R3F): 4 tessere fisiche separate; drag per scambiarle, tap/tasto R per ruotare di 90°; stato nell'URL (`?p=…&r=…`) così una disposizione si condivide; «ripristina».
- `Polyptych` (DOM + GSAP Flip): pannelli piatti affiancati; drag per riordinare, scambio con frecce da tastiera.
- Texture Roundabout: `tools/roundabout_tiles.py` da `fotuzze/serie-02_Roundabout/*.jpg` → `public/assets/img/opere/serie-02/tiles/tile-0N.webp` a 2048 px, quadrate.
- Pagina `/bio` estesa (scroll normale, niente Lenis).

Accettazione:
- TagIntro ≤ 3 s totali, salta con click/Esc, non si ripete nella sessione, in reduced-motion mostra lo stato finale.
- Muro: tutti i singoli appesi; fly-in ≤ 600 ms; il riflesso cambia col puntatore (desktop) e col tilt o col touch (mobile); drag con snap; la disposizione sopravvive al refresh; deep link `/opere/:slug` apre con la cornice già in primo piano.
- Roundabout: 24 permutazioni × rotazioni raggiungibili; URL riflette lo stato e ricarica lo stesso stato; funziona in touch.
- Polittico: ordine modificabile con mouse, touch e tastiera; nessuna curvatura, pannelli complanari.
- Vista lista aggiornata per tutte le nuove feature (le opere restano consultabili senza drag).
- 60 fps sul muro con 9 cornici su laptop medio; su mobile medio niente stutter visibile al fly-in.

Subagent: `scena-3d` (Frame + shader, RoundaboutBoard), `motion-dom` (TagIntro, Polyptych), `asset-pipeline` (tiles, tag.svg quando arriva la foto), `qa-visivo`.

Ordine di taglio se la fase sfora (si rimanda alla v1.1, non si rompe il resto): 1) riaggancio con persistenza, 2) stato Roundabout nell'URL, 3) drag del polittico (restano i pulsanti di scambio).

### Fase 3a — Fanzine (→ 18/12; selezione in parallelo dal 29/11)

Lavoro:
- `tools/streetpil_select.py`: legge `D:\ANALOGIC_DREAM\malli\StreetPIL\`, applica le esclusioni, produce 4 zine (una per numero: verde, rossa, blu, rave). Ogni zine = le 5 foto del numero + immagini da `graffiti` e `malli` fino a 16–20 pagine, scelte con criteri espliciti (nitidezza, varietà di soggetto, preferenza per immagini senza volti riconoscibili). Output: `public/assets/img/edizioni/<slug>/pages/NN.webp` ≤ 1600 px + `manifest.json` con i file sorgente per la curatela v2.
- `Shelf` (R3F o DOM 2.5D, decido in base al costo nel momento): dorsi sullo scaffale; click → la fanzine vola e si apre; `FlipBook` React che incapsula `page-flip` (logica di `flipbook.js` attuale); chiusura → si richiude e torna a posto.
- `edizioni.ts` popolato dal manifest.

Accettazione:
- 4 zine generate, zero file dalle cartelle escluse (test che confronta il manifest con la blacklist).
- Scaffale con ≥ 4 fanzine; apertura ≤ 800 ms; sfoglio con mouse, touch e frecce; `/edizioni/:slug` apre direttamente la fanzine; chiusura riporta sullo scaffale.
- Vista lista: elenco fanzine + flipbook accessibile.

Subagent: `asset-pipeline` (selezione e conversione), `motion-dom` (Shelf e FlipBook), `qa-visivo`.

### Fase 4 — Rifinitura v1 (→ 22/12)

Lavoro: audit accessibilità, prerender dei meta per route (`scripts/prerender.ts` post-build: una `index.html` per route con title, description, og:image, canonical + `sitemap.xml`), pagina 404, favicon, Lighthouse, immagini con width/height, fallback low-end, pagina `/fotografia` «in arrivo» con contatti, `/mostre` lista pulita.

Accettazione:
- a11y-auditor: zero problemi critici; tutta la vista lista navigabile da tastiera; contrasto AA.
- `dist/serie/roundabout/index.html` (e ogni altra route) contiene i meta propri; sitemap generata.
- Lighthouse su `/`: desktop ≥ 90 perf, mobile ≥ 75 perf, a11y ≥ 95, SEO ≥ 95.
- Nessun errore in console su nessuna route, desktop e mobile.
- Build riproducibile da zero (`rm -rf node_modules dist && npm ci && npm run build`).

Subagent: `a11y-auditor`, `seo-generator` (meta e JSON-LD), `favicon-crafter`, `qa-visivo`.

### Go-live (23–24/12)

- 23/12: push del branch `redesign` (su tuo ok) → Netlify branch deploy pubblico; review tua sulla preview.
- 24/12: con ok esplicito, PR `redesign → main`, merge, verifica di tuffrat.art. Rollback = revert del merge commit.
- Dopo il go-live: `legacy/` si elimina in un commit separato.

## 4. Subagent di progetto (definiti in fase 0 in `.claude/agents/`)

| Nome | Base | Compito | Confini |
|---|---|---|---|
| `dati-tuffrat` | general-purpose | Estrae e valida i dati in `src/data/` da `fotuzze/opere.json` e HTML legacy; scrive i test vitest sui dati | Non tocca componenti |
| `asset-pipeline` | general-purpose | Script Python in `tools/`: tiles Roundabout, selezione StreetPIL, conversioni WebP, tracciatura tag | Legge D:\ e fotuzze, scrive solo in `public/assets` e `tools/` |
| `scena-3d` | general-purpose | Componenti R3F in `src/three/` e scene 3D, con sandbox `/dev/:componente` | Non tocca `src/data` né il router |
| `motion-dom` | general-purpose | Timeline GSAP, TagIntro, Polyptych, Shelf, FlipBook, transizioni DOM | Idem |
| `qa-visivo` | general-purpose + claude-in-chrome | Avvia `vite preview`, screenshot desktop/mobile per route, console, confronto con legacy; produce `docs/qa/<fase>.md` | Solo lettura del codice |
| built-in | a11y-auditor, seo-generator, favicon-crafter, Explore | Fase 0 (audit) e fase 4 | — |

Regola: un subagent per compito isolato e parallelizzabile; l'integrazione la faccio io nella sessione principale contro i contratti di ARCHITECTURE.md.

## 5. Rischi e risposte

- Tag non vettoriale in tempo → fallback lettering provvisorio; la sostituzione è un file.
- WebGL su mobile scarso → rilevamento (contesto fallito, `deviceMemory` ≤ 2, reduced-motion) e vista lista automatica; texture 2048 → 1024 su mobile.
- StreetPIL e volti riconoscibili → in v1 solo materiale proprio e graffiti; manifest consultabile; curatela in v2.
- Fase 2 troppo grande → ordine di taglio dichiarato sopra.
- Deploy: `netlify.toml` fissa build e publish, così il merge su main non dipende dalla dashboard.

## Verifica end-to-end (per ogni fase)

1. `npm run check` (tsc, eslint, vitest dati) verde.
2. `npm run build` e `npx serve dist`: tutte le route e i redirect rispondono.
3. Chrome (claude-in-chrome) su localhost: screenshot desktop 1440 e mobile 390 per ogni route, console pulita, confronto con `legacy/` in fase 0.
4. Lighthouse in fase 4.
5. Checklist di accettazione della fase spuntata in `docs/qa/<fase>.md`.

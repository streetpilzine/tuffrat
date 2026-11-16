---
titolo: QA fase 1 — palcoscenico
progetto: tuffrat-site
data: 2026-11-12
stato: parziale (prima iterazione verificata in dev; mancano Performance panel e test su dispositivo reale)
---

# QA fase 1

## Verifica automatica (12/11)

| Controllo | Esito |
|---|---|
| `npm run check` (tsc, oxlint senza warning, vitest 51 test: dati, scene-map, prefs, layout-muro) | verde |
| `npm run build` | verde, 33 route prerenderizzate |
| JS iniziale | 367 kB (112 kB gzip): entro i 250 kB gzip del piano |
| Chunk three (lazy, solo in modo 3D) | 932 kB (248 kB gzip) |
| Chunk gsap (lazy, con Cursor e Stage) | 76 kB (31 kB gzip) |

## Verifica in Chrome (dev server, 12/11)

| Criterio | Esito | Come |
|---|---|---|
| Click su una voce di nav: la camera si muove, l'URL cambia | ok | `/` → `/edizioni` (banco) → `/bio` (ritratto): screenshot a 1440 |
| Back del browser riporta alla scena precedente | ok | `history.back()` da `/bio` → `/edizioni`, store aggiornato |
| Refresh su una route carica la scena giusta | ok | `/serie/roundabout` caricata da zero: camera sulla parte sinistra del muro |
| Durata transizione ≤ 800 ms | ok | `DURATA_CAMERA_S = 0.8`, test vitest |
| Cursore cambia su almeno 3 tipi di oggetto | ok per costruzione | link → pennarello, bottoni → spray, card opere → mano, `data-cursor` esplicito per gli altri; montato solo con `(pointer: fine)` |
| Vista lista: nessun Canvas, nessun cursore, contenuto completo | ok | toggle in nav: `.stage` e `.cursor` smontati, `html.cursor-custom` rimosso, `aria-pressed` coerente; preferenza salvata |
| Reduced motion: nessun Canvas | ok per costruzione | `modo3D` è falso con la media query attiva; toggle disabilitato con spiegazione nel `title` |
| WebGL assente → vista lista | ok per costruzione | `rilevaWebGL()` e `deviceMemory ≤ 2` in `usePrefs` |
| aria-live annuncia pagina e scena | ok | «Mostre — TuffRat. La camera si sposta sulle mostre.» |
| 390 px: nessun overflow orizzontale, nav a due righe leggibile | ok | `scrollWidth ≤ innerWidth` su `/serie/roundabout` |
| Console | nessun errore su `/`, `/edizioni`, `/bio`, `/serie/roundabout`, `/mostre` |

## Da fare prima di chiudere la fase (entro 28/11)

Aggiornamento del 16/11: la scheda DOM che copriva la scena (e impediva gli screenshot del palco) è stata sostituita da un cassetto chiuso di default; vedi `docs/qa/fase-2.md` e `docs/decisioni.md`. Gli screenshot delle route ora si possono fare.

- Performance panel di Chrome: confermare nessun frame > 50 ms in idle (atteso: con `frameloop="demand"` in idle non si renderizza). Misurare anche durante la transizione su laptop medio.
- Prova su telefono reale (touch): cursore assente, nav, foglio traslucido, costo del Canvas.
- Emulare `prefers-reduced-motion` e `?vista=lista` in Chrome e fare il giro completo da tastiera (Tab/Invio) su tutte le route.
- Screenshot di tutte le 12 route a 1440 e 390 in modo 3D e in vista lista (subagent `qa-visivo`, build + preview).
- Decidere la nav mobile (pannello a tutta altezza, tuffrat-visual B7) o rimandarla alla fase 4.

## Note per la fase 2

- La home in modo 3D mostra ancora la griglia opere nel foglio: va tolta quando i `Frame` sul muro diventano cliccabili.
- Il target `/opere/:slug` è un avvicinamento generico: in fase 2 va calcolato dalla posizione della cornice (`layout-muro.ts`).
- Canonical e sitemap usano URL senza slash finale, ma Netlify risponde 301 verso `/bio/` ecc.: allineare in fase 4 (prerender) o disattivare i pretty URL in `netlify.toml`.

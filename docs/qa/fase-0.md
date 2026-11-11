---
titolo: QA fase 0 — scaffold e parità
progetto: tuffrat-site
data: 2026-11-11
stato: parziale (verifica automatica fatta; screenshot rimandati)
---

# QA fase 0

## Verifica automatica (11/11, prima iterazione)

| Controllo | Esito |
|---|---|
| `npm run check` (tsc, oxlint, vitest 39 test dati) | verde |
| `npm run build` | verde, 33 route prerenderizzate, sitemap e robots |
| JS iniziale | 372 kB (113 kB gzip), nessun chunk three/gsap ancora usato |
| `/` testo completo (hero, bio breve, citazione, link IG e YT, 11 opere, hub, contatti) | parità con legacy/index.html |
| `/serie/serie-03/` → `/serie/bustine-di-te` | redirect ok, titolo documento corretto |
| Console errori su `/` e `/serie/bustine-di-te` | nessuno |
| Meta prerender (`dist/serie/roundabout/index.html`, `dist/opere/te-nero-2/index.html`) | title, canonical, og:image corretti |

## Da fare prima di chiudere la fase (entro 18/11)

- Screenshot desktop 1440 e mobile 390 di tutte le route (il driver CDP di Chrome ha mandato in timeout `captureScreenshot` in questa sessione; testo e console rispondevano).
- Confronto pagina per pagina con l'inventario di `docs/audit-statico.md`.
- Verifica `npx serve dist` per i redirect Netlify (in preview Vite i redirect legacy sono gestiti dal router).
- Tastiera: Tab su tutta la home, apertura lightbox con Invio, frecce, Esc.

---
titolo: QA fase 2 — il muro (con le basi della 3a e degli oggetti v2)
progetto: tuffrat-site
data: 2026-11-16
stato: parziale (prima iterazione verificata in dev su Chrome desktop e a 390 px; mancano telefono reale, Performance panel e reduced motion emulato)
---

# QA fase 2

## Verifica automatica (16/11)

| Controllo | Esito |
|---|---|
| `npm run check` (tsc, oxlint senza warning, vitest 67 test: dati, scene-map, prefs, layout-muro, roundabout) | verde |
| `npm run build` | verde, 33 route prerenderizzate |
| JS iniziale | 385 kB (118 kB gzip): entro i 250 kB gzip del piano |
| Chunk three (lazy, solo in modo 3D) | 932 kB (248 kB gzip) |
| Chunk gsap (lazy) | 101 kB (40 kB gzip), ora con Flip |
| Chunk TagIntro (lazy, una volta per sessione) | 97 kB (38 kB gzip), di cui 45 kB sono il tracciato della tag |
| Chunk page-flip (lazy, all'apertura di una fanzine) | 44 kB (10 kB gzip) |

## Bug della fase 1 risolto

La scheda DOM copriva la scena e bloccava gli screenshot. Ora in 3D è un cassetto fisso in basso, chiuso di default: si vede solo la maniglia (56 px) e tutto il resto è palco. Verificato a 457 × 710, a 390 × 660 e a 1568 × 681. Dettagli in `docs/decisioni.md` (16/11).

## Verifica in Chrome (dev server, 16/11)

Finestra desktop 1568 × 681 e, per il formato telefono, il sito caricato in riquadri larghi 390 px (la finestra non accettava il ridimensionamento). In questi riquadri il puntatore resta un mouse: i gesti touch veri non sono stati provati.

| Criterio del piano | Esito | Come |
|---|---|---|
| TagIntro ≤ 3 s, saltabile, una volta per sessione | ok | `/?intro=1`: scrittura 1,35 s + spray 0,75 s + reveal ≈ 2,7 s; visti i fotogrammi intermedi e lo stato finale; «Galleria» chiude e mostra il muro. Chiave `tuffrat.intro.v1` in sessionStorage |
| TagIntro in reduced motion mostra lo stato finale | per costruzione | `statico` da `prefs.reducedMotion`; non emulato in Chrome |
| Muro: tutti i singoli appesi | ok | 11 cornici in home (9 singoli + 2 della serie 2023–2025) |
| Click → la cornice vola in primo piano, ≤ 600 ms | ok | click su Hoss Tia: URL `/opere/hoss-tia`, camera sull'opera, `DURATA_FUOCO_S = 0.6` (test) |
| Esc o click fuori → torna | ok | click sullo sfondo e tasto Esc riportano a `/` (o alla serie dell'opera) |
| Il riflesso cambia col puntatore | ok a vista su desktop | shader `luce.ts`; su touch segue il dito, il tilt del dispositivo non è implementato |
| Drag con snap, la disposizione sopravvive al refresh | ok | Scompensato trascinato: `localStorage` = `{"scompensato":{"x":2,"y":3}}`, ritrovato dopo il reload; «Ripristina il muro» nell'Hud |
| Deep link `/opere/:slug` apre con la cornice in primo piano | ok | `/opere/sinapsi` e `/opere/te-nero-2` caricati da zero |
| Scorrere la galleria | ok | drag sullo sfondo: la camera scorre lungo il muro, con inerzia; rotella per avvicinarsi |
| Roundabout: permutazioni × rotazioni raggiungibili | ok | test vitest: 24 × 256 stati raggiunti con le sole mosse dell'interfaccia |
| Roundabout: l'URL riflette lo stato e lo ricarica | ok | click (ruota) + drag (scambia) sul board 3D → `?p=3120&r=1000`; pannello DOM → `?p=1023&r=1000` |
| Roundabout in touch | non provato su dispositivo | i tap nel riquadro a 390 px ruotano; lo scambio su touch richiede la pressione tenuta (280 ms) o i pulsanti della scheda |
| Polittico: ordine modificabile con mouse e tastiera, pannelli complanari | ok | drag di Tè Nero I in ultima posizione → ordine 2, 3, 1; pulsanti ← → e frecce; sul muro i pannelli seguono l'ordine |
| Vista lista aggiornata | ok | `/?vista=lista`: nessun Canvas, galleria con 11 card; Roundabout e polittici interattivi anche senza 3D |
| Console | pulita | solo l'avviso `THREE.Clock deprecated`, che viene da R3F |

## Oltre la fase 2 (basi anticipate)

| Cosa | Esito |
|---|---|
| Rivista di prova da PDF (24 pagine) sul banco | click → `/edizioni/rivista-test`, sfoglio con ← →, Esc chiude e la rivista torna sul banco. Solo in dev |
| Rullini su `/fotografia` | click → il rullino vola in mano e la pellicola si srotola; fotogrammi vuoti («in arrivo») |
| Bacheca mostre | 4 locandine; click → scheda di `/mostre` aperta sulla mostra |
| TV accanto al ritratto | schermo con il titolo di PULSOS; il click apre YouTube (non provato per non aprire schede esterne) |

## Da fare prima di chiudere la fase

- Telefono reale: tap, scorrimento del muro con il dito, pressione tenuta per spostare un quadro o una tessera, sfoglio della rivista, costo del Canvas.
- Performance panel: 60 fps sul muro con 16 cornici e 4 tessere a 2048 px; nessun frame lungo in idle (atteso, con `frameloop="demand"`).
- Emulare `prefers-reduced-motion` e fare il giro completo da tastiera in vista lista (Roundabout con frecce e R, polittico con frecce).
- Sfogliatore nella build di produzione: in prod non ci sono ancora edizioni, quindi `FlipBook` è stato provato solo in dev.
- Screenshot di tutte le route a 1440 e 390, 3D e lista, salvati in `docs/qa/screens/` (ora possibile: la scheda non copre più la scena).
- Tratti della TagIntro: sono una traccia a mano in ordine di scrittura; da rifinire guardandola a velocità ridotta con Gabriele.
- Tilt del dispositivo per il riflesso su mobile (richiede il permesso su iOS): da decidere se farlo o lasciare il solo touch.

## Note per le fasi successive

- Fase 3a: lo scaffale è per ora un piano del banco con le riviste appoggiate; `Libro` e `FlipBook` sono pronti, mancano la selezione StreetPIL e `edizioni.ts`.
- Il font di sistema è ancora Inter/Helvetica (ereditato dalla parità di fase 0), contro la regola B1 di tuffrat-visual: da cambiare in fase 4 insieme ai token.
- Canonical e slash finale: invariato rispetto alla nota di fase 1.

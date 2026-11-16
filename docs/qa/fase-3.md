---
titolo: QA fase 3 — fanzine, rullini veri, bio con retro, TV con video
progetto: tuffrat-site
data: 2026-11-16
stato: non verificato a vista (codice, test e build verdi; nessuna prova in Chrome riuscita; prove visive a carico di Gabriele sulla preview Netlify)
---

# QA fase 3

## Verifica automatica (16/11)

| Controllo | Esito |
|---|---|
| `npm run check` (tsc, oxlint senza warning, vitest 155 test in 9 file) | verde |
| `npm run build` | verde, 37 route prerenderizzate (le 4 fanzine comprese) |
| Chunk three (lazy, solo in modo 3D) | 1147 kB (314 kB gzip): cresciuto da 248 kB gzip per drei `Html`, usato dall'iframe della TV |
| JS iniziale | 210 kB (63 kB gzip) |
| Test nuovi | `edizioni.test.ts` (lista bianca e nera delle cartelle StreetPIL, 5 foto per numero, pagine 3:2, dati allineati ai manifest), `rullini.test.ts` (28 + 24 foto, sorgenti giuste, niente `postprocess`, nessun ingrandimento), `striscia.test.ts` (limiti di zoom e scorrimento), `sfogliatore.test.ts` (dimensioni dello sfogliatore) |

## Verifica in Chrome: non fatta

Il Chrome collegato rispondeva «connessione negata» al dev server locale (anche lanciato fuori dalla sandbox), quindi nessun componente della fase è stato visto in esecuzione. Tutto ciò che segue è scritto, compila e passa i test, ma il comportamento a schermo è da provare. Gabriele fa le prove sulla preview `redesign--tuffrat.netlify.app`.

## Cosa provare, per componente

| Componente | Da guardare |
|---|---|
| Fanzine sul banco (`/edizioni`) | quattro copertine orizzontali in griglia 2 × 2 a sinistra del banco, nessuna sopra l'altra né addosso agli attrezzi; click → la rivista si alza (0,7 s) e si apre lo sfogliatore; Esc o × la riportano sul banco; `/edizioni/streetpil-blu` caricato da zero apre direttamente |
| Sfogliatore | pagine orizzontali 3:2: a 1440 una pagina per volta (la doppia non sta in larghezza), a 390 una pagina larga quanto lo schermo senza scorrimento orizzontale; frecce ← →, pulsanti, trascinamento dell'angolo, touch; didascalia «Pagina 3 di 8. …» sotto il libro |
| Vista lista `/edizioni` | quattro card, didascalia «StreetPIL n. 1 · Muschio · Fanzine», nessun anno |
| Rullini (`/fotografia`) | due rullini con scotch «gialla» e «ben»; click → il rullino vola a sinistra e la pellicola esce verso destra con le foto vere; gialla ruotate di 90° in senso orario, ben diritte; trascinamento, rotella, ctrl + rotella, pulsanti ← → − + dell'Hud, tasti; lo zoom si ferma ai pixel veri della foto; click sul bussolotto o Esc riavvolge; il muro non scorre mentre il rullino è aperto |
| Vista lista `/fotografia` | due sezioni con griglia di miniature, visore a tutto schermo con frecce ed Esc |
| Bio (`/bio`) | click sul ritratto → la cornice viene avanti e si gira; sul retro nome, bio breve e citazione, diritti e leggibili (attesi circa 14 px a 390 e 15 px a 1440); secondo click, Esc o click sullo sfondo la riappendono |
| TV (`/bio`) | click sullo schermo → la camera si avvicina e parte il video dentro lo schermo (iframe `youtube-nocookie`, allineato e non in scorcio); i click arrivano al player; pulsante in basso a destra → schermo nero e audio fermo; di nuovo → neve; Esc, click sullo sfondo e cambio pagina fermano il video |
| Console | pulita su tutte le route |

## Rischi noti del codice non visto

- Striscia dei rullini (`src/three/Rullino.tsx`, 679 righe scritte da un subagent e non riviste riga per riga): piani di clipping, pinch a due dita e inerzia sono i punti più fragili.
- Iframe della TV: la scala di drei `Html transform` (0,045) viene dalla lettura del sorgente, non da una prova; da controllare l'allineamento allo schermo e che il cursore personalizzato non resti fermo sul bordo dell'iframe. Esc con il focus dentro l'iframe non arriva alla pagina: si esce con il pulsante della TV o con l'Hud.
- Retro della bio: l'Hud in basso può coprire le ultime righe su telefono.
- Pinch e gesti touch veri non si possono provare da desktop.

## Da decidere con Gabriele

- Manifest delle fanzine: titoli provvisori (Muschio, Ruggine, Cianotipo, Acido), anno assente, colophon «Fotografie di TuffRat». Due foto della rossa mostrano un volto (pagine 04 e 07).
- Orientamento delle «gialla»: i file non hanno tutti lo stesso verso (alcuni soggetti risultano capovolti o di lato già nel file), quindi con la rotazione unica di 90° alcune foto restano storte. Si può aggiungere una rotazione per singola foto.
- Volti: nelle «gialla» cinque foto con volti riconoscibili (14, 15, 18, 20, 21); nelle «ben» sette foto con un neonato o un volto (05, 08, 09, 12, 14, 20, 24). Sono online sulla preview pubblica dal push del 16/11.
- Testi alternativi di tutte le 72 fotografie: scritti guardando i fogli di contatto, da rileggere.

## Residui della fase 2

Invariati: telefono reale, Performance panel, reduced motion emulato, screenshot di tutte le route. Lo sfogliatore in produzione ora ha edizioni vere e si può provare sulla preview.

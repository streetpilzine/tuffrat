Sei l'advisor-guidato che lavora sul redesign di tuffrat.art. Ripartiamo dalla fase 3 sul branch `redesign` (HEAD c28626d, albero pulito salvo i file di contesto aggiornati il 16/11/2026). Io sono Gabriele; tu orchestri, l'advisor (Fable) rivede i punti di svolta, gli esecutori sono subagent Sonnet.

PRIMA DI TUTTO leggi, in ordine: PLAN-redesign.md, ARCHITECTURE.md, docs/decisioni.md (soprattutto l'ultima voce, «Fase 3 riscopata», che prevale su tutto il resto), docs/qa/fase-2.md, e le skill `.claude/skills/tuffrat-visual`. Le decisioni già prese non si ridiscutono. Non committare né pubblicare su main senza mio ok esplicito. Prosa nei file senza hard-wrap.

OBIETTIVO DELLA FASE 3 (tutto in v1), in quest'ordine:

1. Fanzine (subagent `asset-pipeline` poi `motion-dom`)
- `tools/streetpil_select.py`: legge SOLO `D:\ANALOGIC_DREAM\malli\StreetPIL\1-verde`, `2-rossa`, `3-blu`, `4-rave`. Vietati `graffiti`, `malli`, `pr0n`, `gab`, `favola`, `sk8`, `special`, `megafoto`. Ogni zine = le 5 foto del numero più copertina, titolo e colophon generati; pagine ≤ 1600 px in `public/assets/img/edizioni/<slug>/pages/NN.webp`, più `manifest.json` con i file sorgente. Test vitest che confronta il manifest con la blacklist.
- `src/data/edizioni.ts` popolato dal manifest. Titoli e dorsi scelti: n.1 «Muschio» verde #2f6f4f, n.2 «Ruggine» rossa #a8322b, n.3 «Cianotipo» blu #1f4a8a, n.4 «Acido» rave nero con scritta fluo #e0309a. Anno vuoto, non inventarlo.
- Scaffale con ≥ 4 fanzine sul banco (parte da `src/scenes/Banco.tsx`), apertura ≤ 800 ms con `Libro` e `FlipBook` già pronti, `/edizioni/:slug` apre direttamente la fanzine, chiusura riporta sullo scaffale, sfoglio con mouse, touch e frecce. Vista lista: elenco più flipbook accessibile. Togli `src/dev/rivista-test.ts` dalle route di produzione se interferisce.

2. Rullini veri (`asset-pipeline` per le immagini, `scena-3d` per `src/three/Rullino.tsx`)
- Rullino «gialla» = le 28 foto di `D:\ANALOGIC_DREAM\malli\StreetPIL\gialla\` (ritratti ~560×880 px, bassa risoluzione: non ingrandirle oltre il lecito). Rullino «ben» = le 24 scansioni `foto_20241231_*.jpg` di `D:\ANALOGIC_DREAM\bEn_ultimoAnno\` (3408×2263 px; ignora la sottocartella `postprocess`).
- Ogni foto va ruotata di 45° a destra e messa in fila, una dopo l'altra, al posto dei fotogrammi vuoti: una sola striscia continua che si scorre. ATTENZIONE: «45°» è la richiesta letterale ma una rotazione di 45° produce angoli vuoti e un fotogramma diagonale. Prima di convertire tutto, fai UNA prova su due foto, mostrami lo screenshot e chiedimi conferma (potrebbe essere 90°). Poi converti in WebP (≤ 1600 px sul lato lungo, ≤ 1024 su mobile) e scrivi un manifest.
- Etichette sullo scotch: «gialla» e «ben». Togli i segnaposto «in arrivo»: restano due rullini.
- Striscia scorrevole (drag orizzontale, rotella) con zoom a pinch a due dita e ctrl+rotella su desktop; limiti min/max di zoom; tutto con `frameloop="demand"`. Equivalente da tastiera e vista lista: griglia delle foto con alt text sensati.

3. Bio con retro (`scena-3d`, in `src/scenes/BioWall.tsx`)
- Click sul ritratto: la cornice va in primo piano e si gira di 180° mostrando il retro, dove il testo della bio è leggibile (testo da `src/data/artista.ts`, resa su canvas o con drei `Html`, a tua scelta in base al costo; contrasto e dimensione da skill `tuffrat-visual`). Secondo click o Esc: torna al suo posto. Il testo resta anche in vista lista e nella scheda. Rispetta `prefers-reduced-motion`.

4. TV con video (`scena-3d`/`motion-dom`, `src/three/Tv.tsx`)
- Il video PULSOS (`youtubeId` in `artista.video.pulsos`, `ngi81Oa-Jtc`) dentro lo schermo del monitor. Il click sullo schermo AVVIA il video, non apre YouTube. L'iframe si carica solo al primo click (`youtube-nocookie.com`, YouTube IFrame API per play/pausa/stop), agganciato allo schermo 3D (drei `Html` con `transform` e `occlude`, o equivalente) in modo che i click arrivino all'iframe e non al muro.
- Il pulsante in basso a destra della TV la spegne: video fermato e schermo nero; un altro click sul pulsante la riaccende (schermo con la neve). Il link «Guarda» nella scheda resta come alternativa da tastiera.

5. QA (subagent `qa-visivo`) con screenshot a 1440 e 390 (usare iframe larghi 390 se la finestra non si ridimensiona), console pulita, `npm run check` e build verdi, `docs/qa/fase-3.md`. Aggiorna `docs/qa/fase-2.md` e la memoria quando chiudi i residui.

ORDINE DI TAGLIO se sfora: 1) zoom a pinch (resta ctrl+rotella e pulsanti +/−), 2) retro della bio con testo su canvas semplice, 3) riaccensione della TV.

COME LAVORARE
- Chiama l'advisor (Fable) prima di scegliere come inserire l'iframe YouTube nella scena 3D, prima di fissare la rotazione/layout delle foto sulla striscia, e a fine fase.
- Delega ai subagent per area con confini rigidi (asset-pipeline scrive solo in `tools/` e `public/assets`; scena-3d non tocca `src/data` né il router; motion-dom idem). Gli script Python non leggono mai le cartelle escluse.
- Una prova in Chrome per ogni componente prima di dichiararlo fatto. Resoconto finale con: cosa è verificato, cosa no, cosa serve da me (ok sul manifest delle fanzine e sul titolo/anno dei numeri).
- Non toccare i file di lavoro residui in `public/assets/img` (COMEFARE.txt, artist/file.txt, testzoom.jpg) senza mio ok.
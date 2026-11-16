---
titolo: Decisioni architetturali del redesign
progetto: tuffrat-site
---

# Decisioni

Registro delle scelte che cambiano `ARCHITECTURE.md`, una voce per data. La motivazione sta qui, il contratto aggiornato sta in ARCHITECTURE.

## 2026-11-12 — SceneRouter diviso in due (DOM + Canvas)

Il contesto di react-router non attraversa il root React del Canvas R3F. Invece di un bridge di contesto, il `SceneRouter` lato DOM scrive scena e target nello store zustand (che è un modulo, non un contesto) e il `CameraRig` dentro il Canvas lo legge e muove la camera. Meno magia, testabile: la mappa route → target è una funzione pura.

## 2026-11-12 — Un solo mondo, non una scena per route

Muro, banco e angolo bio sono montati insieme; cambia solo la camera. Le transizioni sono tween della camera (≤ 800 ms), non smontaggi: niente flash, niente ricaricamento texture tra route, e il deep link `/opere/:slug` in fase 2 si riduce a un target camera più vicino.

## 2026-11-12 — `frameloop="demand"` da subito

In idle non si renderizza nulla: zero frame lunghi a riposo (criterio di accettazione fase 1), batteria risparmiata su mobile. Chi anima deve chiamare `invalidate()` (il CameraRig lo fa a ogni tick del tween). Da ricordare in fase 2 per lo shader luce-puntatore: si invalida sul `pointermove`, non con un loop continuo.

## 2026-11-12 — Contenuto DOM in un foglio traslucido sopra la scena

In modo 3D il DOM della route non sparisce: scorre in un `.sheet` sopra lo Stage fisso, lasciando libera la fascia alta dello schermo. Vista lista e vista 3D condividono il markup, quindi parità di contenuto e accessibilità sono garantite per costruzione. In fase 2 la home toglie dal foglio la griglia delle opere (vivono sul muro) e tiene solo i testi.

## 2026-11-12 — Cursore e Stage caricati con `lazy()`

Il chunk three (248 kB gzip) e gsap (31 kB) si scaricano solo quando `modo3D` è vero. Il bundle iniziale resta a ~112 kB gzip. Reduced-motion, vista lista e assenza di WebGL non pagano nulla.

## 2026-11-16 — La scheda in 3D diventa un cassetto chiuso

Sostituisce la decisione del 12/11 sul foglio traslucido. Il foglio con `margin-top: 56vh` copriva la scena appena la finestra era bassa o stretta: non si riusciva né a vedere né a fotografare il palco. Ora in modo 3D la scheda è `position: fixed` in basso e parte chiusa su tutte le route con qualcosa da guardare (resta aperta solo su 404 e sandbox): si vede la maniglia con il titolo della pagina, tutto il resto è scena. Da chiusa il contenuto è `inert`, quindi il Tab non entra in testo invisibile; la maniglia è un pulsante con `aria-expanded`. Il markup resta lo stesso della vista lista, quindi la parità di contenuto non cambia.

## 2026-11-16 — Un muro lungo a zone, e lo scorrimento

Il muro passa da 18 a 32 unità e ogni contenuto ha la sua zona (home, Roundabout, Bustine di tè, bacheca mostre, ritratto e TV), così le serie non si sovrappongono più ai singoli. Trascinando lo sfondo la camera scorre lungo il muro (con inerzia), la rotella avvicina: è il «girare per la galleria» che mancava. Lo scostamento (`pan`) si azzera a ogni cambio di route.

## 2026-11-16 — `useGesto` al posto del componente `PhysicalObject`

Il ciclo riposo → afferra → rilascia è un hook che ritorna gli handler R3F, non un componente contenitore: Frame, tessere, rullini, libri e locandine hanno pose e animazioni troppo diverse per condividere un wrapper, ma condividono la distinzione click/drag, la cattura del puntatore e il cursore. Regola per il touch: un trascinamento rapido su un oggetto fa scorrere il muro, quello dopo una pressione tenuta (280 ms) sposta l'oggetto; senza, su telefono il muro pieno di quadri non si potrebbe scorrere.

## 2026-11-16 — Tela con shader proprio, non illuminata dalla scena

La tela usa uno `ShaderMaterial` senza luci e senza tone mapping: i colori sono quelli della foto dell'opera. La «luce del puntatore» è un uniform condiviso (`uLuce`) che schiarisce la zona vicina e aggiunge un riflesso speculare; niente normal map in v1. Si invalida sul `pointermove`, come deciso il 12/11.

## 2026-11-16 — Polittici anche sul muro, oltre che nel DOM

Il piano prevedeva il polittico solo come componente DOM. Con la scheda chiusa di default la zona delle Bustine di tè sarebbe rimasta vuota: i pannelli sono quindi anche `Frame` complanari sul muro, nell'ordine tenuto in `useLayout.ordini`. Il riordino si fa nel DOM (`Polyptych`: drag, frecce, pulsanti) e il muro lo segue.

## 2026-11-16 — Oggetti della v2 anticipati come basi

Rullini, bacheca delle mostre e TV erano in v2. Sono stati anticipati in forma minima, procedurale e senza asset nuovi, perché il banco e il muro non restassero vuoti: i rullini si srotolano ma mostrano fotogrammi vuoti («in arrivo»), le locandine sono testo su carta, la TV mostra la neve e apre YouTube. Il contenuto vero (collezioni fotografiche, flyer, video nello schermo con la manopola) resta in v2.

## 2026-11-16 — Rivista di prova solo in dev

Per provare scaffale e sfogliatore prima della selezione StreetPIL si usa un PDF qualsiasi reso con `tools/fanzine_to_pages.py`. L'edizione sta in `src/dev/rivista-test.ts` dietro `import.meta.env.DEV`, le immagini in una cartella ignorata da git: non entra né nella build né nel prerender.

## 2026-11-16 — Fase 3 riscopata: fanzine, rullini veri, bio con retro, TV con video

Gabriele ha chiuso le scelte aperte della fase 3 e le ha ampliate; tutto rientra nella v1. Sorgenti StreetPIL ammesse: solo `1-verde`, `2-rossa`, `3-blu`, `4-rave`. Escluse `graffiti` e `malli` (oltre a `pr0n`, `gab`, `favola`, `sk8`, `special`, `megafoto`): ogni zine è quindi fatta con le sole 5 foto del suo numero, più eventuali ritagli o pagine tipografiche generate (titolo, colophon), non con foto prese da altre cartelle.

Titoli e dorsi scelti da Claude, modificabili in `src/data/edizioni.ts`: n.1 «Muschio» (verde, dorso #2f6f4f), n.2 «Ruggine» (rossa, #a8322b), n.3 «Cianotipo» (blu, #1f4a8a), n.4 «Acido» (rave, nero con scritta fluo #e0309a). L'anno non è noto: va lasciato vuoto, non inventato.

Rullini: sostituiscono i fotogrammi vuoti «in arrivo». Rullino «gialla» = le 28 foto di `D:\ANALOGIC_DREAM\malli\StreetPIL\gialla\` (ritratti ~560×880 px). Rullino «ben» = le 24 scansioni di `D:\ANALOGIC_DREAM\bEn_ultimoAnno\` (3408×2263 px, escludere la sottocartella `postprocess`). Le foto vanno ruotate di 45° a destra e messe in fila al posto dei fotogrammi vuoti, in un'unica striscia continua che si scorre. Con il pinch (due dita) e con ctrl+rotella la striscia si ingrandisce. Il terzo segnaposto «in arrivo» (verde e grigio) si toglie: restano due rullini.

Bio: click sul ritratto → la cornice va in primo piano e si gira mostrando il retro, dove si legge il testo della bio. Secondo click (o Esc) la riporta a posto. Il testo della bio resta anche nella vista lista e nella scheda.

TV: il video YouTube PULSOS (`ngi81Oa-Jtc`) sta dentro lo schermo; il click sullo schermo lo avvia (niente nuova scheda). Il pulsante in basso a destra della TV la spegne (video fermo, schermo nero). L'iframe si carica solo al primo click, con `youtube-nocookie.com`, per privacy e prestazioni.

## 2026-11-16 — Fase 3 implementata: contratti e scelte

Rotazione dei rullini: Gabriele ha visto la prova (45°, 90°, nessuna) e ha scelto 90° in senso orario per «gialla» e nessuna rotazione per «ben», così tutti i fotogrammi risultano orizzontali. I file WebP restano diritti; la rotazione è un numero nel manifest e in `src/data/rullini.ts`, applicato dal componente.

Fanzine orizzontali: tutte le 20 foto dei quattro numeri sono 3:2 orizzontali, quindi le pagine sono 3:2 (8 per numero: copertina, titolo, 5 foto, colophon) e `Libro` prende il formato dalla copertina. `Edizione.anno` diventa facoltativo e si aggiungono `numero`, `dorso` e `altPagine`.

Un solo oggetto in primo piano: `src/state/useOggetti.ts` tiene un campo esclusivo `primoPiano` (rullino srotolato, ritratto girato, TV con il video) più lo stato della TV. Esc, click sullo sfondo e cambio di pagina lo azzerano; con un oggetto in primo piano il muro non scorre. Ritratto e TV hanno un target camera proprio (`TARGET_BIO_RETRO`, `TARGET_TV`, quest'ultimo sulla normale del frontale); il rullino no, perché la striscia si posa davanti alla camera dov'è, perpendicolare all'asse di vista.

Striscia: la matematica (layout, limiti di zoom in pixel veri, scorrimento) sta nel modulo puro `src/core/striscia.ts`; l'Hud comanda la striscia attraverso `comandaStriscia`, come `ponte.ts`.

Retro della bio: `CanvasTexture` con la bio breve (la completa non starebbe leggibile a 390 px), non drei `Html`.

Video nella TV: drei `Html transform` montato in `#stage-html`, un contenitore fratello dello Stage (che è `aria-hidden`) con il suo contesto di impilamento sotto Nav, Hud e scheda; niente `occlude`. L'iframe esiste solo nello stato `video` e alla chiusura il player viene distrutto. Costo: il chunk three passa da 248 a 314 kB gzip.

Stato della verifica: nessuna prova in Chrome riuscita il 16/11 (vedi `docs/qa/fase-3.md`); push del branch `redesign` chiesto da Gabriele per provare sulla preview Netlify.

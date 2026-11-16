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

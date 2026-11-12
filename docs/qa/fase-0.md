---
titolo: QA fase 0 — scaffold e parità
progetto: tuffrat-site
data: 2026-11-12
stato: chiudibile sì con tre ritocchi (D3, D6, conferma D7); D1 è un artefatto di verifica
---

# QA fase 0

## Metodo (12/11)

Build corrente servita da `npx vite preview` su `http://localhost:4173` (server non ricostruito in questa sessione). Gli screenshot sono stati presi con un driver CDP minimale su Microsoft Edge headless 157 (porta 9333), viewport emulata con `Emulation.setDeviceMetricsOverride` (1440×900 e 390×844, DPR 1, `mobile: true` sotto i 600 px). Per ogni route sono stati raccolti: screenshot full-page, screenshot sopra la piega, `innerText`, titolo, H1/H2, tutti i link e tutte le immagini (`naturalWidth`), misure di overflow (`scrollWidth` contro `clientWidth`, più gli elementi con bordo fuori viewport), console (`Runtime.consoleAPICalled` error/warning/assert, `Runtime.exceptionThrown`, `Log.entryAdded` error/warning). La tastiera è stata provata con eventi `Input.dispatchKeyEvent` reali (Tab, Invio, Spazio, frecce, Esc). Gli artefatti (screenshot, `results.json`) sono in una cartella temporanea di sessione, non nel repo.

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

## Tabella route × viewport × esito

Legenda: Screenshot = cattura full-page riuscita; Console = errori/warning/eccezioni; Overflow = `scrollWidth` > 390 a 390 px (o > 1440 a 1440).

| Route | 1440 screenshot | 1440 console | 1440 overflow | 390 screenshot | 390 console | 390 overflow | Note |
|---|---|---|---|---|---|---|---|
| `/` | ok | 0 | no | ok | 0 | no | D1: ultime 3 immagini vuote solo nello screenshot (lazy); D7: titoli hub |
| `/bio` | ok | 0 | no | ok | 0 | no | D6: H1 «About»; ritratto e testi completi, link PULSOS presente |
| `/serie` | ok | 0 | no | ok | 0 | no | 3 card con periodo |
| `/serie/2023-2025` | ok | 0 | no | ok | 0 | no | 2 opere |
| `/serie/roundabout` | ok | 0 | no | ok | 0 | no | 4 tessere, intro completa (legacy aveva una riga) |
| `/serie/bustine-di-te` | ok | 0 | no | ok | 0 | no | 2 polittici (Tè Nero 3, Tè Verde 2), 5 card |
| `/opere/sinapsi` | ok | 0 | no | ok | 0 | no | Anno, Tecnica, Dimensioni, Status |
| `/opere/te-nero-2` | ok | 0 | no | ok | 0 | no | Status "Riservato · in asta" |
| `/edizioni` | ok | 0 | no | ok | 0 | no | testi legacy completi |
| `/mostre` | ok | 0 | no | ok | 0 | no | 4 mostre; D3: sottotitolo legacy perso |
| `/fotografia` | ok | 0 | no | ok | 0 | no | nessuna immagine rotta (segnaposto legacy tolti come previsto) |
| `/pagina-inesistente` | ok | 0 | no | ok | 0 | no | 404 personalizzata |

Console: zero errori, zero warning e zero eccezioni su tutte le 24 aperture (12 route × 2 viewport).

Overflow: nessuna route sborda a nessun viewport. L'unico elemento segnalato dal probe (`left: -999`) è il `.skip-link` "Vai al contenuto" (`src/styles/base.css:415`), nascosto fuori schermo apposta: non conta. I link interni (`a[href^="/"]`) di tutte le route rispondono 200 in preview; le ancore `#galleria` e `#contatti` della home hanno l'elemento di destinazione.

## Redirect lato client

| Da | A | Esito |
|---|---|---|
| `/about` | `/bio` (title "Bio — TuffRat") | ok |
| `/serie/serie-01` | `/serie/2023-2025` | ok |
| `/serie/serie-02` | `/serie/roundabout` | ok |
| `/serie/serie-03` | `/serie/bustine-di-te` | ok |
| `/serie/serie-04` | resta su `/serie/serie-04` con la 404 | D4 |
| `/serie/serie-05` | resta su `/serie/serie-05` con la 404 | D4 |

## Tastiera (home, 1440)

| Passo | Esito |
|---|---|
| Tab da inizio pagina | 1 skip link, 2 brand, 3–7 nav (Serie, Edizioni, Fotografia, Mostre, Bio), 8–9 Galleria/Contatti, 10 Mind the Gap, 11 PULSOS, 12 Bio completa, 13–23 le 11 card, poi hub | ok, ordine logico, anello di focus visibile su link, bottoni e card |
| Invio sulla card Piccionaiax | lightbox modale aperta, titolo «Piccionaiax» | ok |
| Freccia destra / sinistra | RonfRonf / Piccionaiax; dopo la 11ª si torna alla 1ª | ok |
| Esc | lightbox chiusa, focus di nuovo su «Apri Piccionaiax, 2023» | ok |
| Spazio su una card (`/` e `/serie/bustine-di-te`) | apre la lightbox | ok |
| Tab dentro la lightbox | ruota su «Chiudi», «Scheda completa», «Prec», «Succ», non esce dal dialogo | ok (il primo giro di Tab passa dal `body` una volta: comportamento del `<dialog>` nativo) |
| Click sul backdrop | chiude e riporta il focus sulla card | ok |

## Confronto con legacy, pagina per pagina

Fonti: `legacy/index.html`, `legacy/about/index.html`, `legacy/serie/*`, `legacy/edizioni`, `legacy/mostre`, `legacy/fotografia` e la checklist «Testi visibili da preservare» di `docs/audit-statico.md`.

| Pagina | Parità |
|---|---|
| Home | Hero (eyebrow, H1, lede, bottoni), alt dei due ritratti, bio breve integrale, citazione, link Mind the Gap e PULSOS, Galleria + sottotitolo, 11 didascalie con anno/misure/tecnica, contatti, footer: presenti. Differenze: "Mind The Gap" → "Mind the Gap" (previsto, N2 dell'audit); titoli h3 del blocco hub e copy delle card cambiati (D7). |
| `/bio` | H2 Bio (3 paragrafi), Statement, citazione con caporali, Mostre e pubblicazioni, contatti: testo identico. H1 «About» (D6), ritratto presente. |
| `/serie` | 3 card con periodo e copertine, sottotitolo: presenti. Card «Serie 04 / 05 · in arrivo» tolte (previsto, L5). |
| `/serie/2023-2025` | Piccionaiax e RonfRonf con dati leggibili. Segnaposto «Intro breve…» non copiato (previsto, N1). |
| `/serie/roundabout` | 4 tessere + intro: presenti. I 2 dettagli non hanno card propria; sono nella scheda dell'opera (verificato: i due file sono referenziati in `src/data/opere.ts:173,187` e presenti su disco). |
| `/serie/bustine-di-te` | 5 pannelli nei 2 polittici con anno, misure, tecnica: presenti. |
| `/mostre` | 4 mostre con anno, luogo, città: testo identico. Sottotitolo «Percorso espositivo recente» perso (D3). Link Instagram aggiunto su Mind the Gap. |
| `/edizioni` | Testi di legacy presenti tutti. |
| `/fotografia` | Testi definitivi presenti; segnaposto e immagini rotte tolte (previsto, G5/N1). |
| Contatti e footer | `mailto:streetpilzine@gmail.com`, Instagram `tuff_rat`, PULSOS, «© 2026 TuffRat — Portfolio» presenti su tutte le route con contatti. |

Nessun testo, link o didascalia di legacy è sparito; le eccezioni sono i segnaposto, la card Serie 04/05 e i titoli hub (D7), già dichiarati o da confermare.

## Difetti (in ordine di gravità)

### D1 — Artefatto di verifica, non un difetto dell'utente: tre immagini della home vuote nello screenshot full-page

- Dove: `/` a 1440 e a 390, ultima riga della Galleria (100% Arabica, Chiacchiere, Nebula).
- Cosa: la cattura full-page prende le card in fondo prima che le immagini `loading="lazy"` (`src/ui/OpereGrid.tsx:28`) siano caricate (`complete=false`, `naturalWidth=0`). RIPROVA eseguita: dopo lo scroll fino alla riga, le tre immagini risultano caricate (1400 px). Con lo scroll normale l'utente le vede come nel legacy.
- Riproduzione (del falso positivo): apri `/` e cattura full-page senza scroll; le tre card in basso escono vuote. Con lo scroll compaiono.
- Da fare: nella prossima verifica scrollare la pagina fino in fondo (o disattivare `lazy` nel profilo di test) prima di catturare, e confermare a schermo reale.
- Priorità: correggere la tecnica di verifica; non blocca la fase.

### D2 — Parità visiva (minore): in `/bio` lo statement non ha stacco dalla bio

- Dove: `http://localhost:4173/bio`, colonna testuale, sotto il terzo paragrafo.
- Cosa: legacy dà `margin-top: 2rem` a «Statement»; nel nuovo «Statement», la citazione e «Mostre & pubblicazioni» seguono il paragrafo senza spazio. A 390 si legge come un unico blocco. Nessun testo manca, il ritratto c'è.
- Riproduzione: apri `/bio` a 390 px, scorri dal terzo paragrafo di «Bio» a «Statement».
- Priorità: bassa; probabilmente assorbita dal layout della fase 1.

### D3 — Parità testuale: sottotitolo «Percorso espositivo recente» perso in `/mostre`

- Dove: `http://localhost:4173/mostre`.
- Cosa: legacy ha H2 «Mostre» + sottotitolo «Percorso espositivo recente»; il nuovo mostra solo l'H1. Il sottotitolo è nella checklist dell'audit tra i testi da preservare.
- Riproduzione: apri `/mostre`, confronta con `legacy/mostre/index.html`.
- Priorità: bassa, una riga.

### D4 — Redirect `/serie/serie-04` e `/serie/serie-05` non reindirizzano lato client

- Dove: `http://localhost:4173/serie/serie-04`, `/serie/serie-05`.
- Cosa: `ARCHITECTURE.md` §5 prevede 301 su `/serie`; `netlify.toml` li definisce, ma in preview il router mostra la 404 e l'URL resta quello vecchio.
- Riproduzione: apri `/serie/serie-04`; titolo «Pagina non trovata — TuffRat», URL invariato.
- Priorità: bassa (netlify.toml copre la produzione; da confermare con `npx serve dist` o anteprima Netlify).

### D5 — Nav: le pagine serie evidenziano solo «Serie», senza breadcrumb

- Dove: `/serie/2023-2025`, `/serie/roundabout`, `/serie/bustine-di-te`.
- Cosa: `aria-current` corretto sulla voce «Serie», ma nessun percorso «Serie › Roundabout» (L3 dell'audit). Solo orientamento, non parità.
- Priorità: bassa, fase 1/2.

### D6 — Incoerenza di etichetta: H1 «About» su `/bio`

- Dove: `/bio`, H1 «About», title «Bio — TuffRat», nav «Bio».
- Cosa: testo del legacy ripreso con voce incoerente (l'audit N3 chiedeva una sola grafia).
- Priorità: bassa.

### D7 — Home: titoli del blocco hub e copy delle card cambiati

- Dove: `/`, blocco hub sotto la Galleria.
- Cosa: legacy ha h3 «Serie», «Edizioni», «Fotografia», «Mostre» con testi «Cinque corpi di lavoro. Ogni serie con testo e opere.», «Selezione analogica e ritratti.», «Fanzine, stampe, collaborazioni.»; il nuovo usa «Corpi di lavoro organizzati per serie.», «Selezione fotografica.», «Fanzine, stampe e collaborazioni.» e i titoli delle card non risultano nella gerarchia dell'`innerText` (appaiono come testo). È una riscrittura fuori dalla parità: confermare con il committente o ripristinare.
- Priorità: bassa, decisione di contenuto.

Nota sulla lightbox: comportamento e tastiera corretti (Invio, Spazio, frecce, Esc, focus che torna sulla card, focus trattenuto). La resa è ancora quella legacy (pannello scuro, «← Prec»/«Succ →» come testo): fuori perimetro della fase 0, si rifà nel redesign visivo.

## Checklist di accettazione

- [ ] Tutte le route rendono il contenuto del sito attuale: **quasi** — nessun testo, link o didascalia manca; restano aperte D3 e la conferma di D7. D1 non è un contenuto mancante.
- [x] 9 singoli in home + 2 opere serie-01 = 11 card: presenti con didascalie complete.
- [x] 2 opere in `/serie/2023-2025`: sì.
- [x] Roundabout 4 tessere + 2 dettagli: sì (dettagli nella scheda opera).
- [x] Tè Nero 3 e Tè Verde 2 come polittici in `/serie/bustine-di-te`: sì.
- [x] 4 mostre in `/mostre`: sì.
- [x] Bio, statement, contatti, link PULSOS in `/bio`: sì.
- [x] Nessun errore in console su nessuna route (24 aperture): zero errori, warning o eccezioni.
- [x] Nessun overflow orizzontale a 390 px su nessuna route.
- [x] Redirect client `/about`, `/serie/serie-01`, `/serie/serie-02`, `/serie/serie-03`: ok.
- [ ] Redirect client `/serie/serie-04`, `/serie/serie-05` → `/serie`: no (D4).
- [x] Tastiera: Tab raggiunge nav, bottoni e card; Invio apre la lightbox; le frecce cambiano opera; Esc chiude e il focus torna sulla card.
- [x] Nessun errore di tipo sul codice corrente (`tsc -b` verde; build non rifatta in questa sessione).

## Da fare prima di chiudere la fase (entro 18/11)

- D3: inserire il sottotitolo in `/mostre`; D6: allineare l'H1 a «Bio»; D7: confermare il copy hub.
- D1: rifare lo screenshot della home scrollando fino alla Galleria.
- D4: verificare i redirect Netlify con `npx serve dist` o l'anteprima Netlify.
- Aggiungere un test e2e (Playwright) che riusi i controlli di questa nota: conteggio card, immagini caricate dopo lo scroll (`naturalWidth > 0`), console vuota, `scrollWidth` a 390.

Fase 0: chiudibile sì — tutte le 12 route rendono a 1440 e 390 senza errori di console né overflow, i redirect obbligatori funzionano, la tastiera della lightbox è completa e ogni testo, link e didascalia del legacy è presente (niente segnaposto pubblicati, niente immagini rotte reali). Propongo di chiudere insieme a tre ritocchi di una riga: D3, D6 e la conferma di D7; D4 e D5 prima della fase 4.

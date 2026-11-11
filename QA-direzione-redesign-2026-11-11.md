---
titolo: Q/A — direzione del redesign TuffRat
progetto: tuffrat-site
data: 2026-11-11
fonti: RECAP-redesign-2026-09-16.md; indice di sessione _session_index-GABOTOWER.csv (sessioni 54fffa37 e 8ee520d0); repo github.com/elayadesign/ai-design-skills
modello di lavoro: Fable (claude-fable-5-2)
---

# Q/A — direzione del redesign

Come si usa: ogni domanda ha la mia raccomandazione per prima. Se va bene, rispondi "ok a tutto", oppure scrivi il numero e la scelta diversa. Le domande 1–5 bloccano la fase 0 (scaffold); le altre servono entro la fase 2 o la 3.

## Cosa ho letto

Dei due JSONL indicati non ho trovato i file originali nella cartella del progetto: ci sono solo cbfbff81 (3,2 MB, 11/11) e la sessione corrente. Ho quindi usato altre fonti.

Per 8ee520d0 (redesign, 16/09 12:19–13:09) il RECAP è la fonte completa: il brainstorming della sezione 4 è di circa 8.900 caratteri, coerente con gli 8.800 che ricordavi. Tu parli di 13 risposte mie; nel RECAP e nell'indice ne trovo due (R1 e R2). Le altre potrebbero essere passaggi intermedi che né RECAP né indice conservano. Se ti servono i JSONL originali, dovrebbero essere ancora nel cestino OneDrive: la pulizia li ha cancellati il 16/10 e il cestino li conserva 93 giorni, cioè fino a circa metà gennaio 2027. Il ripristino passa dal browser e non l'ho fatto.

Per 54fffa37 (ANALOGIC_DREAM, 16/09 10:40–11:09) ho usato l'indice: riassunto di compattazione, tutti i tuoi messaggi, e i miei messaggi troncati a circa 3.400 caratteri. I tre subagent (mappa del sito, stato di asset e file non tracciati, ricerca su disco) sono riportati per intero nei messaggi dell'indice; le loro cartelle non le ho trovate su disco.

## Stato del repo oggi

Il lavoro ANALOGIC_DREAM del 16/09 non è committato. Risultano modificati about, edizioni, index e style.css; sono nuovi flipbook.js, page-flip.browser.js (StPageFlip in locale, senza CDN), la cartella mostre/, la cartella tools/ (foto_to_webp.py, fanzine_to_pages.py) e mostre.txt. È fermo da due mesi.

Restano aperti questi problemi. `fotografia/index.html` punta tre volte a `assets/img/artist/ritratto.webp`, che non esiste. `file.txt` nella cartella artist cita `tag.svg` come opzionale, ma il file non c'è. La cartella `thumb/` è vuota e il sito usa solo `full/`. `assets/css/style.css` è un residuo non usato: il CSS attivo è `style.css` in root. Non c'è `netlify.toml`, quindi la configurazione di deploy sta solo nella dashboard Netlify.

Dalla todolist del 16/09 ti mancano ancora: la selezione di foto da D:\ANALOGIC_DREAM (cartelle prioritarie: malli, primo_rullo_sviluppato_malli, ultimo_scan, colore2024, AUTO_SVILUPPATE); i PDF delle fanzine; il transcript dell'intervista PULSOS Ep.10; la conferma del nome; le foto delle mostre; le opere mancanti (MisunderstoodmygAPP, Mind The Gap e Teatro Nero x3).

## A. Punto di partenza

### 1. Il lavoro del 16/09 diventa la base del redesign?

Si

### 2. Dove e quando si pubblica?

Sul branch `redesign`, con deploy preview su Netlify quando il branch è pronto da vedere. Netlify pubblica da main, intanto testiamo in localhost.

## B. Architettura

### 3. Stack e approccio ibrido

Confermo quanto nel RECAP. Vite + React + TypeScript, una SPA che produce file statici per Netlify. Il 3D (Three.js con react-three-fiber e drei) solo dove guadagna: muro, banco, rullini, Roundabout, TV. Tutto il resto (tag, bio, transizioni, flipbook) in DOM e SVG con GSAP. "Dinamico" qui vuol dire app interattiva nel browser: niente backend, niente database.

### 4. Riduciamo le librerie?

- GSAP come unica libreria di animazione del DOM. Togliamo Framer Motion, perché due sistemi di animazione sono più difficili da tenere coerenti tra sessioni e tra LLM.
- Lenis fuori dalla v1. La navigazione è movimento di camera al click, non scroll. Lo reintroduciamo solo se una sezione richiede scroll lungo, per esempio la bio.
- Una sola libreria di fisica, e solo quando serve davvero per il lancio di rullini e fanzine: @react-three/rapier se la scena è 3D. Fino ad allora bastano spring e drag di GSAP e R3F.
- Zustand, Three, R3F e drei restano.

### 5. URL reali per opere, serie e mostre?

Sì. Un router (react-router) con route tipo /serie/roundabout e /mostre/…, così i link da Instagram e la condivisione funzionano. La scena 3D resta una sola. Per indicizzazione e anteprime social, ogni route ha titolo e immagine propri, generati con un passaggio di prerender in build.

### 6. Chi aggiorna i contenuti?

Per la v1, file dati tipizzati nel repo (opere, serie, edizioni, mostre), modificati con un LLM e pubblicati con git.

## C. Concept e scope

### 7. Confermi "studio vivo" e il cursore al posto delle mani?

Sì. Il sito è un muro (tag, opere, serie, mostre) e un banco (rullini, fanzine, TV): tutto si afferra e si sposta. Le mani renderizzate restano rimandate alla fase 5. Il cursore cambia a seconda di cosa tocchi: bomboletta sul muro, pennarello sui titoli, mano sui rullini.

### 8. Cosa va nella v1, e c'è una scadenza?

V1 = fasi 0, 1 e 2 (palcoscenico, muro con tag, spray e bio, cornici con riflesso, Roundabout, polittici) più le fanzine apribili della fase 3. Per la v2 restano fotografia (preselezione in corso, non ancora pronta), TV PULSOS (transcript da generare dal video YT già presente come link nel sito attuale) e la bacheca delle mostre (foto in arrivo). La v1 si costruisce solo con materiale già presente.

Data: 24 dicembre 2026.

### 9. Bustine di tè: polittico piatto invece del semicerchio?

Sì. I pannelli restano piatti e diventano un compositore: si affiancano, si scambiano, si riordinano sul piano. Cambia il modello dati: un'opera "gruppo" con N pannelli.

### 10. TV PULSOS: iframe YouTube o video ospitato?

iframe YouTube dentro la TV 3D, con un overlay CRT sopra (scanlines, rumore, vignettatura) con pointer-events disattivati. La manopola chiama seekTo.

## D. Materiali e identità (da te)

### 11. Nome sul sito: TuffRat, Malli, o entrambi?

Blocca bio, titoli e logo. TuffRat come brand del sito, come oggi. Confermo il nome dell'artista (Malli) nella bio.

### 12. Hai la tag TuffRat in vettoriale?

No, la ricostruiamo tracciando la tag da una scansione ad alto contrasto (la prendiamo da una foto del quadro, te la fornirò io). Serve per l'animazione di scrittura dell'idea 1. Il file tag.svg non è nel repo. 

### 13. Roundabout e riflesso: tessere separate, luce radente?

Due domande sulle opere in 3D.

Roundabout: le quattro tessere sono pezzi fisici separati, già fotografati uno per uno.

Riflesso: non ci sono foto in luce radente. La v1 la testiamo con uno shader che sposta la luce col puntatore, senza normal map. La normal map la aggiungiamo in seguito sulle lavorazioni ai singoli quadri.

### 14. Fanzine StreetPIL: quali contributi, e con quale consenso?

La zine in D:\ANALOGIC_DREAM\malli\StreetPIL\ ha 329 immagini, divise per numero (verde, rossa, blu, rave) e per contributo: graffiti 193, malli 43, gab 36, sk8 9, pr0n 9, favola 7, special 7, megafoto 4. Prima di pubblicare online serve sapere quali contributi includere, e se i contributori e le persone riconoscibili hanno dato il consenso.
LLM sceglie autonomamente alcune foto delle varie cartelle, in maniera da avere fruibile un MVP nella V1. Poi seguirà curatela per la v2.

## E. UI, skill e processo

### 15. Quali skill elayadesign usiamo, e dove le installiamo?

Il repo ha tre skill:
- landing-page-design: costruisce landing page con una strategia di conversione (una sola call to action) e un sistema visivo (tipografia, spaziatura, raggi, motion).
- figma-designer: lavora dentro Figma.
- redesign-skill (repo separato): fa un audit di un sito esistente e corregge sul posto, senza riscrivere.

Prendiamo la parte visiva di landing-page-design. La parte di conversione non si applica a un portfolio. Cambiamo i valori nella sezione finale del file con quelli TuffRat, come suggerisce il README. Redesign-skill lo usiamo per un audit dell'attuale sito statico, non per la riscrittura. Figma-designer solo se lavori in Figma. Sei autorizzato a copiare le skill nella cartella del progetto (.claude/skills/).

### 16. Fable e Astra/ChatGPT: chi fa cosa?

Fable 2.5 per architettura, integrazione e componenti, con ARCHITECTURE.md come contratto. Astra/ChatGPT resta fuori, salvo prototipi isolati di animazioni, che genereremo con Gemini quando necessario (fornirò l'API).

### 17. Accessibilità: vista lista accanto al muro e al banco?

Sì. Drag e movimento di camera non funzionano da tastiera né con lettore di schermo. Il minimo è un interruttore "vista lista" e il rispetto di prefers-reduced-motion.

## Cosa faccio dopo le tue risposte

Con le risposte a 1–5 parto dalla fase 0 nel branch redesign: scaffold Vite + React + TypeScript, data layer tipizzato estratto dall'HTML attuale, ARCHITECTURE.md, e una pagina che renderizza dai dati con la stessa resa del sito di oggi. Non faccio push senza tuo ok, e main non lo tocco.

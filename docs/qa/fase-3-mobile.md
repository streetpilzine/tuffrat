---
titolo: QA fase 3 — correzioni mobile
progetto: tuffrat-site
data: 2026-11-17
stato: verificato in emulazione telefono (Edge headless, touch e pinch veri); da confermare su un telefono reale i punti segnati sotto
---

# QA delle correzioni mobile della fase 3

Riscontri di Gabriele dalla prova sul telefono della preview (16/11), dodici punti. Qui: cosa è stato fatto, come è stato verificato, cosa resta da provare su un telefono vero.

## Come è stato verificato

`npm run check` verde (typecheck, oxlint, 189 test in 11 file) e `npm run build` verde (37 route prerenderizzate). Le prove a schermo sono fatte con `tools/qa/shot.mjs`: Edge headless in emulazione telefono 390 × 844 (e 844 × 390, e desktop 1440 × 900), con tocchi, trascinamenti e pinch inviati come eventi touch veri, sul dev server locale. Il rendering è software: fluidità e prestazioni non si giudicano da qui.

## Punto per punto

| # | Riscontro | Correzione | Verificato a schermo |
|---|---|---|---|
| 1 | Tè Nero e Tè Verde non si riordinano | Sul telefono niente «Riordina» nell'Hud; nella scheda i pannelli sono fermi nell'ordine dei dati | sì |
| 2 | «Serie» inquadra la parete vuota | I due polittici del Tè stanno in colonna sopra Roundabout; `/serie` li mostra tutti e tre, larghi quanto lo schermo | sì |
| 2b | Manca un pulsante per lo studio | Voce «Studio» nella barra, prima delle altre | sì |
| 3 | Manca il pinch sul muro | Due dita avvicinano e allontanano la camera, anche partendo sopra un quadro; nessun click al rilascio | sì (pinch in avvicinamento e in allontanamento) |
| 4 | Roundabout piccola; «Copia link» inutile | Le quattro tessere riempiono la larghezza; tocco = ruota, pressione tenuta e trascinamento = scambia; tocco sulla parete attorno = torna a `/serie`; tolto «Copia link» | sì |
| 4b | Nella scheda le quattro tele e i pulsanti «scambia» | Tolti sul telefono | sì |
| 4c | Toccando una tela nella scheda si torna al muro; lo zoom ingrandisce tutta la pagina | La scheda resta aperta sulla pagina dell'opera (anche tornando indietro); l'immagine si ingrandisce con due dita dentro il suo riquadro | sì (zoom della pagina fermo a 1) |
| 5 | La scheda non mostra per intero «Gianfranco» | Scheda a quattro quinti dello schermo, immagine adattata all'altezza | sì |
| 6 | Il secondo tocco riporta al centro del muro | Uscendo dal fuoco la camera arretra ma resta davanti al quadro | sì |
| 6b | Il riflesso resta dove si è toccato; nessun effetto con l'inclinazione | La luce segue l'inclinazione del telefono e, al rilascio del dito, torna alla sua posizione | in parte: con eventi di inclinazione simulati il riflesso si sposta (confronto dei pixel) |
| 7 | Le istruzioni coprono il banco; dal muro non si arriva al banco | Le istruzioni sono un suggerimento in alto che sparisce dopo 4 secondi o al primo tocco; un tocco su fanzine, rullini o piano del banco porta a `/edizioni` o `/fotografia` | sì |
| 8 | Sfogliatore: due pagine, verso sbagliato, non segue il dito | Una pagina alla volta; trascinando verso la rilegatura si va avanti, nel verso opposto indietro, e il foglio segue il dito | sì (schermate a metà trascinamento) |
| 8b | Vista orizzontale mal organizzata, da forzare anche in verticale | Pagina a tutta altezza, didascalia e chiusura in una colonna a sinistra, niente frecce; in verticale la stessa vista è girata di 90° | sì, in verticale e in orizzontale |
| 9 | Il rullino esce dallo schermo | Riscritto: bussolotto a sinistra e pellicola verso destra dentro lo schermo; scorrimento, pinch, pulsanti dell'Hud, tocco sul bussolotto per riavvolgere | sì, in verticale, orizzontale e desktop |
| 10 | Il retro del ritratto è vuoto | Nome, bio breve e citazione leggibili (era un bug anche su desktop) | sì |
| 11 | La TV non fa partire il video | Il video parte in un riquadro sopra la TV (sul telefono) o dentro lo schermo (desktop); era rotto su entrambi | sì: il video è partito in entrambe le viste |
| 12 | Modelli 3D primitivi | Banco in legno e pennarello fatti con Blender; bomboletta tornita e TV rifinita in codice | in parte: i modelli Blender di TV, bussolotto e bomboletta non sono riusciti e non sono in uso |

## Da provare su un telefono vero

- Punto 6b: il sensore di inclinazione reale. Su iPhone il browser chiede il permesso per «movimento e orientamento» al primo tocco: va accettato, altrimenti la luce resta ferma. Da controllare che il verso del movimento sia naturale.
- Punto 11: su iPhone il video può non partire da solo (Safari non concede l'avvio automatico con l'audio a un iframe): in quel caso si vede l'anteprima di YouTube e basta un tocco sul riquadro.
- Punto 8: fluidità dello sfoglio e comodità della vista girata, con tacca e barra del browser vere (le aree sicure sono gestite in CSS ma non si vedono in emulazione).
- Punto 3 e punto 9: fluidità del pinch sul muro e sulla pellicola.
- Safari su iOS in generale: tutte le prove sono fatte con il motore di Chrome.

## Limiti noti

- Le foto del rullino «gialla» hanno versi diversi nel file: con la rotazione unica di 90° alcune restano storte (decisione aperta dalla fase 3: rotazione per singola foto).
- Sul telefono l'inquadratura del banco cambia tra verticale e orizzontale solo al cambio di pagina, non mentre si ruota il dispositivo.
- A zoom molto alto la pellicola è più alta del bussolotto, che smette di ingrandirsi per non coprire lo schermo.

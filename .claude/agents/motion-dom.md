---
name: motion-dom
description: Animazioni DOM e SVG con GSAP per il redesign TuffRat: TagIntro, transizioni di scena, cursore contestuale, Polyptych (Flip), FlipBook (page-flip), Shelf se in DOM. Lavora in src/ui/ e src/core/motion/. Non tocca src/data né i componenti three.
tools: Read, Grep, Glob, Bash, Write, Edit
---

Costruisci le animazioni DOM del redesign TuffRat. GSAP è l'unica libreria di animazione del DOM (con `@gsap/react` `useGSAP`, plugin Flip e Draggable). Contratti in `ARCHITECTURE.md` sezione 7; regole visive nella skill `tuffrat-visual` (B7 motion, B9 stati).

Regole:
- Ogni timeline rispetta `usePrefs().reducedMotion`: stato finale immediato, nessun movimento.
- Anima solo `transform` e `opacity`; mai `top/left/width/height`.
- Ogni componente ha una sandbox in `src/dev/` e funziona da tastiera.
- Il `FlipBook` conserva i parametri di `legacy/flipbook.js` (dimensioni, `showCover`, `usePortrait`, `mobileScrollSupport`).
- Prima di consegnare: `npm run check` verde, nessun errore in console.

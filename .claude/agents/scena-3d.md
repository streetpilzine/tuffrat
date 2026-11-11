---
name: scena-3d
description: Componenti Three.js / react-three-fiber / drei del redesign TuffRat in src/three/ e src/scenes/ (Stage, Wall, Frame con shader luce-puntatore, RoundaboutBoard, Shelf), ciascuno con una sandbox in src/dev/. Non tocca src/data né il router.
tools: Read, Grep, Glob, Bash, Write, Edit
---

Costruisci componenti 3D per il redesign TuffRat rispettando i contratti di `ARCHITECTURE.md` sezione 7 e lo stato di sezione 6. Stack: three, @react-three/fiber 9, @react-three/drei 10, gsap per le timeline, zustand per lo stato.

Regole:
- Ogni componente ha una sandbox raggiungibile in dev su `/dev/<nome>` (registro in `src/dev/`), così si prova isolato.
- Niente fisica (`rapier`) senza decisione scritta in `docs/decisioni.md`.
- Texture ≤ 2048 px, lazy-load con `Suspense`; su `usePrefs().webgl === false` il componente non deve neppure essere importato.
- Ogni interazione drag ha un equivalente da tastiera o un pulsante; documentalo nel JSDoc del componente.
- Motion: durate e curva dalla skill `tuffrat-visual`; con `reducedMotion` le timeline vanno a `progress(1)`.
- Prima di consegnare: `npm run check` verde e nessun warning di three in console nella sandbox.

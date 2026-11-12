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

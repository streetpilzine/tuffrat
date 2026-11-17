/**
 * Indirizzo del player incorporato di YouTube per il video nella TV. Dominio senza cookie; `autoplay` perché l'iframe nasce da un click o da un tocco sullo schermo della TV (dove il browser non lo concede, per esempio Safari su iPhone, resta il pulsante di riproduzione di YouTube e basta un tocco); `playsinline` perché sul telefono il video resti nel riquadro invece di andare a tutto schermo.
 */
export const urlVideoYouTube = (id: string) => `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?autoplay=1&playsinline=1&rel=0`

/** Permessi dell'iframe del video. */
export const PERMESSI_VIDEO = 'autoplay; encrypted-media; picture-in-picture; fullscreen'

/**
 * Dichiarazione minima dell'API IFrame di YouTube (`https://www.youtube.com/iframe_api`), solo ciò che usa la TV.
 * Vedi https://developers.google.com/youtube/iframe_api_reference. `YT` esiste sulla finestra solo dopo che lo script è stato caricato.
 */

/** L'elemento che l'API sostituisce con il proprio iframe: un `div` vuoto. */
type ElementoTargetYT = HTMLElement | string

interface ParametriPlayerYT {
  /** Altezza in pixel CSS del player: coincide con il riquadro scalato da `Html transform`. */
  height?: number | string
  /** Larghezza in pixel CSS del player, idem. */
  width?: number | string
  /** Un solo id o una playlist. */
  videoId?: string
  /** `https://www.youtube-nocookie.com`: cookies tecnici non impostati finché non si avvia il video. */
  host?: string
  playerVars?: {
    /** 1: parte da solo (può essere bloccato dal browser: resta il pulsante del player). */
    autoplay?: 0 | 1
    /** 1: su iOS il video va a schermo intero al posto del player. */
    playsinline?: 0 | 1
    /** 0: alla fine niente suggeriti di altri canali. */
    rel?: 0 | 1
    /** 1: non mostra il titolo in alto. */
    modestbranding?: 0 | 1
  }
  events?: {
    onReady?: (evento: { target: PlayerYT }) => void
  }
}

interface PlayerYT {
  playVideo(): void
  pauseVideo(): void
  /** Smonta il player, ferma l'audio e toglie l'iframe dal documento. */
  destroy(): void
}

interface YTNamespace {
  Player: new (elemento: ElementoTargetYT, opzioni: ParametriPlayerYT) => PlayerYT
  /** Il caricamento dell'API è finito: da qui `new YT.Player` è sicuro. */
  loaded?: number
}

interface Window {
  YT?: YTNamespace
  /** Callback globale che l'API chiama quando ha finito di caricarsi. */
  onYouTubeIframeAPIReady?: () => void
}

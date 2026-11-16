/**
 * Caricamento dello script dell'API IFrame di YouTube, una volta sola per tutta la pagina.
 * `caricaApiYouTube` ritorna una promessa condivisa (`API`, unica per il modulo); dopo la prima risoluzione la promessa resta la stessa, niente doppio `<script>`.
 */

const SORGENTE = 'https://www.youtube.com/iframe_api'

let api: Promise<YTNamespace> | null = null

/** Monta la promessa: se l'API è già pronta si risolve subito, se lo script c'è già si attende la callback globale. */
function avvia(): Promise<YTNamespace> {
  if (window.YT?.Player) return Promise.resolve(window.YT)
  return new Promise<YTNamespace>((risolvi, rifiuta) => {
    const precedente = window.onYouTubeIframeAPIReady
    window.onYouTubeIframeAPIReady = () => {
      precedente?.()
      if (window.YT?.Player) risolvi(window.YT)
      else rifiuta(new Error('yt-api-senza-player'))
    }
    if (!document.querySelector(`script[src="${SORGENTE}"]`)) {
      const s = document.createElement('script')
      s.src = SORGENTE
      s.async = true
      // Se la pagina non raggiunge YouTube la promessa si rifiuta una volta sola: la TV torna in neve, nessun nuovo `<script>`.
      s.onerror = () => rifiuta(new Error('yt-api-non-caricata'))
      document.head.appendChild(s)
    }
  })
}

export function caricaApiYouTube(): Promise<YTNamespace> {
  api ??= avvia()
  return api
}

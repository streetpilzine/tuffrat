import { useMobile } from '../core/mobile'
import { artista } from '../data'
import { PERMESSI_VIDEO, urlVideoYouTube } from '../lib/youtube'
import { useOggetti } from '../state/useOggetti'

/**
 * Telefono: il video della TV in un riquadro DOM sopra la scena, largo quanto lo schermo consente. Compare quando la TV è in stato `video` (tocco sullo schermo della TV: la camera si avvicina e sopra si apre il player), sparisce in ogni altro stato: l'iframe si smonta e l'audio si ferma.
 * L'iframe nasce subito dopo il tocco, quindi dove il browser lo permette il video parte da solo; dove non lo permette (Safari su iPhone) si vede l'anteprima di YouTube con il suo pulsante, e basta un tocco. Fuori dal riquadro i tocchi arrivano alla scena: un tocco sullo sfondo chiude, come i pulsanti dell'Hud.
 * Su desktop il video sta dentro lo schermo 3D (`VideoNelloSchermo` in `src/three/Tv.tsx`).
 */
export function TvVideo() {
  const mobile = useMobile()
  const acceso = useOggetti((s) => s.tv === 'video')
  if (!mobile || !acceso) return null
  const { pulsos } = artista.video
  return (
    <div className="tv-video">
      <div className="tv-video__riquadro">
        <iframe src={urlVideoYouTube(pulsos.youtubeId)} title={pulsos.titolo} allow={PERMESSI_VIDEO} allowFullScreen />
      </div>
    </div>
  )
}

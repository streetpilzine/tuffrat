import { useSyncExternalStore } from 'react'

/**
 * «Versione mobile» del sito: telefono in verticale (o finestra stretta) oppure telefono in orizzontale (puntatore grossolano e poca altezza). È l'unica definizione: i componenti la leggono da qui e il CSS usa la stessa query (`@media (max-width: 800px), (pointer: coarse) and (max-height: 600px)`), così le correzioni pensate per il telefono non cambiano il comportamento su desktop.
 */
export const QUERY_MOBILE = '(max-width: 800px), (pointer: coarse) and (max-height: 600px)'

const lista = () => (typeof window !== 'undefined' && typeof window.matchMedia === 'function' ? window.matchMedia(QUERY_MOBILE) : null)

/** Lettura istantanea, per codice fuori da React (store, moduli three, handler). Fuori dal browser (test, prerender) vale `false`: restano i valori desktop. */
export const eMobile = (): boolean => lista()?.matches ?? false

const ascolta = (avvisa: () => void) => {
  const mq = lista()
  mq?.addEventListener('change', avvisa)
  return () => mq?.removeEventListener('change', avvisa)
}

/** Hook: si aggiorna quando il telefono ruota o la finestra cambia larghezza. */
export function useMobile(): boolean {
  return useSyncExternalStore(ascolta, eMobile, () => false)
}

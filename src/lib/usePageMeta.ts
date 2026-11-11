import { useEffect } from 'react'
import { useLocation } from 'react-router'
import { metaFor } from '../routes.meta'

/** Allinea title e description del documento alla route corrente (lo stesso tabellone usato dal prerender). */
export function usePageMeta() {
  const { pathname } = useLocation()
  useEffect(() => {
    const m = metaFor(pathname)
    document.title = m.title
    let tag = document.querySelector<HTMLMetaElement>('meta[name="description"]')
    if (!tag) {
      tag = document.createElement('meta')
      tag.name = 'description'
      document.head.appendChild(tag)
    }
    tag.content = m.description
  }, [pathname])
}

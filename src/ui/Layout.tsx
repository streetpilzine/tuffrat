import { useEffect } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router'
import { artista } from '../data'
import { usePageMeta } from '../lib/usePageMeta'

const voci = [
  { to: '/serie', label: 'Serie' },
  { to: '/edizioni', label: 'Edizioni' },
  { to: '/fotografia', label: 'Fotografia' },
  { to: '/mostre', label: 'Mostre' },
  { to: '/bio', label: 'Bio' },
]

const annoCorrente = new Date().getFullYear()

function ScrollToTop() {
  const { pathname, hash } = useLocation()
  useEffect(() => {
    if (hash) {
      document.getElementById(hash.slice(1))?.scrollIntoView()
    } else {
      window.scrollTo(0, 0)
    }
  }, [pathname, hash])
  return null
}

export function Layout() {
  usePageMeta()
  return (
    <>
      <a className="skip-link" href="#main">
        Vai al contenuto
      </a>
      <ScrollToTop />
      <nav className="nav" aria-label="Principale">
        <NavLink to="/" className="nav__brand">
          {artista.brand}
        </NavLink>
        <ul className="nav__links">
          {voci.map((v) => (
            <li key={v.to}>
              <NavLink to={v.to}>{v.label}</NavLink>
            </li>
          ))}
        </ul>
      </nav>
      <main id="main">
        <Outlet />
      </main>
      <footer className="footer">
        <p>© {annoCorrente} {artista.brand} — Portfolio</p>
      </footer>
    </>
  )
}

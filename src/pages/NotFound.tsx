import { Link } from 'react-router'

export function NotFound() {
  return (
    <section className="notfound">
      <p className="eyebrow">404</p>
      <h1>Pagina non trovata</h1>
      <p>Il muro qui è vuoto.</p>
      <Link className="button" to="/">
        Torna alla home
      </Link>
    </section>
  )
}

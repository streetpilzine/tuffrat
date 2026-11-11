import { Link } from 'react-router'
import { artista, mostre } from '../data'
import { Contatti } from '../ui/Contatti'
import { PageHeader } from '../ui/PageHeader'

export function Bio() {
  const { pulsos } = artista.video
  return (
    <>
      <PageHeader titolo="About" sotto="Bio e statement" />
      <section className="about" aria-labelledby="bio-titolo">
        <div className="about__image">
          <img src={artista.ritratto.src} alt={artista.ritratto.alt} width={artista.ritratto.width} height={artista.ritratto.height} />
        </div>
        <div className="about__text">
          <h2 id="bio-titolo">Bio</h2>
          {artista.bio.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
          <h2 style={{ marginTop: '2rem' }}>Statement</h2>
          <p>{artista.statement}</p>
          <p>
            <em>«{artista.citazione}»</em>
          </p>
        </div>
      </section>

      <section className="gallery" aria-labelledby="mostre-pub">
        <div className="section-header">
          <h2 id="mostre-pub">Mostre &amp; pubblicazioni</h2>
          <p>Selezione</p>
        </div>
        <div className="hub" style={{ marginTop: 0 }}>
          <div className="hub-card">
            <h3>Mostre</h3>
            <p>Percorso espositivo recente: {mostre.map((m) => m.titolo).join(', ')}.</p>
            <Link className="link" to="/mostre">
              Apri
            </Link>
          </div>
          <div className="hub-card">
            <h3>
              {pulsos.anno} — {pulsos.titolo}
            </h3>
            <p>Intervista video.</p>
            <a className="link" href={`https://www.youtube.com/watch?v=${pulsos.youtubeId}`} target="_blank" rel="noreferrer">
              Guarda
            </a>
          </div>
        </div>
      </section>
      <Contatti />
    </>
  )
}

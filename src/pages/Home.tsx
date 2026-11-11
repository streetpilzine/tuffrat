import { Link } from 'react-router'
import { artista, mostre, opereInHome } from '../data'
import { Contatti } from '../ui/Contatti'
import { OpereGrid } from '../ui/OpereGrid'

const hub = [
  { to: '/serie', titolo: 'Serie', testo: 'Corpi di lavoro organizzati per serie.' },
  { to: '/edizioni', titolo: 'Edizioni', testo: 'Fanzine, stampe e collaborazioni.' },
  { to: '/fotografia', titolo: 'Fotografia', testo: 'Selezione fotografica.' },
  { to: '/mostre', titolo: 'Mostre', testo: 'Percorso espositivo recente.' },
]

export function Home() {
  const mindTheGap = mostre.find((m) => m.link?.instagram)
  const { pulsos } = artista.video
  return (
    <>
      <header className="hero">
        <div className="hero__text">
          <p className="eyebrow">{artista.eyebrow}</p>
          <h1>{artista.brand}</h1>
          <p className="lede">
            {artista.lede.map((r, i) => (
              <span key={i}>
                {r}
                {i < artista.lede.length - 1 && <br />}
              </span>
            ))}
          </p>
          <div className="hero__actions">
            <a className="button" href="#galleria">
              Galleria
            </a>
            <a className="link" href="#contatti">
              Contatti
            </a>
          </div>
        </div>
        <div className="hero__image">
          <img src={artista.ritratto.src} alt={artista.ritratto.alt} width={artista.ritratto.width} height={artista.ritratto.height} />
        </div>
      </header>

      <section className="about" id="about" aria-labelledby="chi-sono">
        <div className="about__image">
          <img src={artista.profilo.src} alt={artista.profilo.alt} width={artista.profilo.width} height={artista.profilo.height} loading="lazy" />
        </div>
        <div className="about__text">
          <h2 id="chi-sono">Chi sono</h2>
          {artista.bioBreve.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
          <p>
            <em>"{artista.citazione}"</em>
          </p>
          <p>
            {mindTheGap && (
              <>
                Mostre selezionate:{' '}
                <a href={mindTheGap.link!.instagram} target="_blank" rel="noreferrer">
                  {mindTheGap.titolo} ({mindTheGap.anno})
                </a>
                <br />
              </>
            )}
            Intervista online:{' '}
            <a href={`https://www.youtube.com/watch?v=${pulsos.youtubeId}`} target="_blank" rel="noreferrer">
              {pulsos.titolo}
            </a>
          </p>
          <p>
            <Link to="/bio">Bio completa →</Link>
          </p>
        </div>
      </section>

      <section className="gallery" id="galleria" aria-labelledby="galleria-titolo">
        <div className="section-header">
          <h2 id="galleria-titolo">Galleria</h2>
          <p>Selezione di lavori recenti</p>
        </div>
        <OpereGrid opere={opereInHome} label="Galleria di opere" />
      </section>

      <section className="hub" aria-label="Sezioni del sito">
        {hub.map((h) => (
          <div className="hub-card" key={h.to}>
            <h3>{h.titolo}</h3>
            <p>{h.testo}</p>
            <Link className="link" to={h.to}>
              Apri
            </Link>
          </div>
        ))}
      </section>

      <Contatti />
    </>
  )
}

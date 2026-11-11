import { artista } from '../data'

interface Props {
  titolo?: string
  testo?: string
}

export function Contatti({ titolo = 'Contatti', testo = 'Per mostre, collaborazioni, acquisizioni.' }: Props) {
  return (
    <section className="contact" id="contatti" aria-labelledby="contatti-titolo">
      <div className="contact__box">
        <h2 id="contatti-titolo">{titolo}</h2>
        <p>{testo}</p>
        <div className="contact__links">
          <a className="button" href={`mailto:${artista.contatti.email}`}>
            E-mail
          </a>
          <a className="link" href={artista.contatti.instagram} target="_blank" rel="noreferrer">
            Instagram
          </a>
        </div>
      </div>
    </section>
  )
}

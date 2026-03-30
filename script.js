/**
 * Lightbox — TuffRat Portfolio
 * BUG FIX rispetto alla versione precedente:
 *  1. Il selettore usava querySelectorAll prima che il DOM fosse pronto
 *     → ora tutto è dentro DOMContentLoaded
 *  2. Il click sul backdrop chiudeva anche quando si cliccava sul content
 *     → ora verifichiamo che il target sia esattamente il backdrop
 *  3. data-src (full) distinto da src (thumb): se presente, la lightbox
 *     mostra la versione full; altrimenti usa lo stesso src della card
 */

document.addEventListener('DOMContentLoaded', function () {

  const triggers = document.querySelectorAll('.lightbox-trigger');
  const lightbox  = document.getElementById('lightbox');
  const backdrop  = document.getElementById('lightbox-backdrop');
  const btnClose  = document.getElementById('lightbox-close');
  const btnPrev   = document.getElementById('lb-prev');
  const btnNext   = document.getElementById('lb-next');

  const imgEl    = document.getElementById('lightbox-img');
  const tEl      = document.getElementById('lb-title');
  const yEl      = document.getElementById('lb-year');
  const techEl   = document.getElementById('lb-tech');
  const sizeEl   = document.getElementById('lb-size');
  const statusEl = document.getElementById('lb-status');
  const linkEl   = document.getElementById('lb-link');

  // Sicurezza: se manca il lightbox nel DOM esci subito
  if (!lightbox || !triggers.length) return;

  let currentIndex = -1;
  const nodes = Array.from(triggers);

  /* ── Apri la lightbox all'indice dato ── */
  function openAt(index) {
    const node = nodes[index];
    if (!node) return;
    currentIndex = index;

    const imgTag = node.querySelector('img');
    // Usa data-src (full) se esiste, altrimenti il src del thumb
    const imgSrc = node.dataset.src || (imgTag ? imgTag.getAttribute('src') : '');
    const imgAlt = imgTag ? (imgTag.getAttribute('alt') || '') : '';

    imgEl.src = imgSrc;
    imgEl.alt = imgAlt;

    tEl.textContent      = node.dataset.title  || '';
    yEl.textContent      = node.dataset.year   ? 'Anno: '        + node.dataset.year   : '';
    techEl.textContent   = node.dataset.tech   ? 'Tecnica: '     + node.dataset.tech   : '';
    sizeEl.textContent   = node.dataset.size   ? 'Dimensioni: '  + node.dataset.size   : '';
    statusEl.textContent = node.dataset.status ? 'Status: '      + node.dataset.status : '';

    const link   = node.dataset.link   || '';
    const status = node.dataset.status || '';
    if (link && status.toLowerCase().includes('online')) {
      linkEl.innerHTML = `<a href="${link}" target="_blank" rel="noreferrer">Acquista / Vedi →</a>`;
    } else {
      linkEl.innerHTML = '';
    }

    lightbox.classList.add('is-open');
    document.body.style.overflow = 'hidden'; // blocca scroll pagina
  }

  /* ── Chiudi ── */
  function close() {
    lightbox.classList.remove('is-open');
    currentIndex = -1;
    imgEl.src = '';
    document.body.style.overflow = '';
  }

  /* ── Naviga ── */
  function next() {
    if (currentIndex < 0) return;
    openAt((currentIndex + 1) % nodes.length);
  }

  function prev() {
    if (currentIndex < 0) return;
    openAt((currentIndex - 1 + nodes.length) % nodes.length);
  }

  /* ── Event listeners ── */
  nodes.forEach(function (node, idx) {
    node.addEventListener('click', function () { openAt(idx); });
  });

  // BUG FIX: chiudi solo se il click è sul backdrop stesso, non sul content
  backdrop.addEventListener('click', function (e) {
    if (e.target === backdrop) close();
  });

  btnClose.addEventListener('click', close);
  btnNext.addEventListener('click', next);
  btnPrev.addEventListener('click', prev);

  window.addEventListener('keydown', function (e) {
    if (!lightbox.classList.contains('is-open')) return;
    if (e.key === 'Escape')     close();
    if (e.key === 'ArrowRight') next();
    if (e.key === 'ArrowLeft')  prev();
  });

});

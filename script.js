(function() {
  const triggers = document.querySelectorAll('.lightbox-trigger');
  const lightbox = document.getElementById('lightbox');
  const backdrop = document.getElementById('lightbox-backdrop');
  const btnClose = document.getElementById('lightbox-close');
  const btnPrev = document.getElementById('lb-prev');
  const btnNext = document.getElementById('lb-next');

  const imgEl = document.getElementById('lightbox-img');
  const tEl = document.getElementById('lb-title');
  const yEl = document.getElementById('lb-year');
  const techEl = document.getElementById('lb-tech');
  const sizeEl = document.getElementById('lb-size');
  const statusEl = document.getElementById('lb-status');
  const linkEl = document.getElementById('lb-link');

  let currentIndex = -1;
  let nodes = Array.from(triggers);

  function openAt(index) {
    const node = nodes[index];
    currentIndex = index;
    const img = node.querySelector('img').getAttribute('src');
    const title = node.dataset.title || '';
    const year = node.dataset.year || '';
    const tech = node.dataset.tech || '';
    const size = node.dataset.size || '';
    const status = node.dataset.status || '';
    const link = node.dataset.link || '';

    imgEl.src = img;
    tEl.textContent = title;
    yEl.textContent = year ? `Anno: ${year}` : '';
    techEl.textContent = tech ? `Tecnica: ${tech}` : '';
    sizeEl.textContent = size ? `Dimensioni: ${size}` : '';
    statusEl.textContent = status ? `Status: ${status}` : '';

    if (link && status.toLowerCase().includes('online')) {
      linkEl.innerHTML = `<a href="${link}" target="_blank" rel="noreferrer">Acquista / Vedi</a>`;
    } else {
      linkEl.innerHTML = '';
    }

    lightbox.classList.add('is-open');
  }

  function close() {
    lightbox.classList.remove('is-open');
    currentIndex = -1;
  }

  function next() {
    if (currentIndex < 0) return;
    const nextIndex = (currentIndex + 1) % nodes.length;
    openAt(nextIndex);
  }

  function prev() {
    if (currentIndex < 0) return;
    const prevIndex = (currentIndex - 1 + nodes.length) % nodes.length;
    openAt(prevIndex);
  }

  nodes.forEach((node, idx) => {
    node.addEventListener('click', () => openAt(idx));
  });

  backdrop.addEventListener('click', close);
  btnClose.addEventListener('click', close);
  btnNext.addEventListener('click', next);
  btnPrev.addEventListener('click', prev);

  window.addEventListener('keydown', (e) => {
    if (!lightbox.classList.contains('is-open')) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowRight') next();
    if (e.key === 'ArrowLeft') prev();
  });
})();
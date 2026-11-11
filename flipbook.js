// Viewer "sfoglia" per le fanzine — effetto pagina stile Issuu (libreria StPageFlip in page-flip.browser.js)
(function () {
  if (typeof St === 'undefined' || !St.PageFlip) return;

  var overlay = document.getElementById('flipbook-overlay');
  var backdrop = document.getElementById('flipbook-backdrop');
  var btnClose = document.getElementById('flipbook-close');
  var btnPrev = document.getElementById('flipbook-prev');
  var btnNext = document.getElementById('flipbook-next');
  var titleEl = document.getElementById('flipbook-title');
  var countEl = document.getElementById('flipbook-count');
  var bookEl = document.getElementById('flipbook');

  if (!overlay || !bookEl) return;

  var pageFlip = null;
  var total = 0;

  function pad(i) { return String(i).padStart(2, '0'); }

  function buildPages(folder, count) {
    var pages = [];
    for (var i = 1; i <= count; i++) pages.push(folder + '/' + pad(i) + '.webp');
    return pages;
  }

  function updateCount() {
    if (!pageFlip || !countEl) return;
    countEl.textContent = (pageFlip.getCurrentPageIndex() + 1) + ' / ' + total;
  }

  function open(card) {
    var folder = card.getAttribute('data-folder');
    var count = parseInt(card.getAttribute('data-count'), 10);
    if (!folder || !count) return;

    total = count;
    titleEl.textContent = card.getAttribute('data-title') || '';
    countEl.textContent = '';

    overlay.classList.add('is-open');
    document.body.style.overflow = 'hidden';

    requestAnimationFrame(function () {
      bookEl.innerHTML = '';
      try {
        pageFlip = new St.PageFlip(bookEl, {
          width: 550,
          height: 733,
          size: 'stretch',
          minWidth: 280,
          maxWidth: 1000,
          minHeight: 360,
          maxHeight: 1400,
          drawShadow: true,
          flippingTime: 900,
          usePortrait: true,
          showCover: true,
          mobileScrollSupport: true,
          showPageCorners: true,
          autoSize: true,
          maxShadowOpacity: 0.5,
          swipeDistance: 30,
          useMouseEvents: true,
          disableFlipByClick: false
        });
        pageFlip.loadFromImages(buildPages(folder, count));
        pageFlip.on('flip', updateCount);
        updateCount();
      } catch (err) {
        console.error('Errore flipbook:', err);
      }
    });
  }

  function close() {
    overlay.classList.remove('is-open');
    document.body.style.overflow = '';
    if (pageFlip) {
      try { pageFlip.destroy(); } catch (e) {}
      pageFlip = null;
    }
    if (bookEl) bookEl.innerHTML = '';
  }

  function next() { if (pageFlip) pageFlip.flipNext(); }
  function prev() { if (pageFlip) pageFlip.flipPrev(); }

  Array.prototype.forEach.call(document.querySelectorAll('.flipbook-trigger'), function (card) {
    card.addEventListener('click', function () { open(card); });
  });

  backdrop.addEventListener('click', close);
  btnClose.addEventListener('click', close);
  btnNext.addEventListener('click', next);
  btnPrev.addEventListener('click', prev);

  window.addEventListener('keydown', function (e) {
    if (!overlay.classList.contains('is-open')) return;
    if (e.key === 'Escape') close();
    else if (e.key === 'ArrowRight') next();
    else if (e.key === 'ArrowLeft') prev();
  });

  window.addEventListener('resize', function () {
    if (pageFlip) { try { pageFlip.update(); } catch (e) {} }
  });
})();

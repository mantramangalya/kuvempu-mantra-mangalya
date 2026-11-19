/* Mantra Mangalya - main app (vanilla JS, no dependencies) */
(function () {
  'use strict';
  var C = window.MM_CONFIG, I = window.MM_I18N;
  var PAGE = document.body.dataset.page || 'home';
  var NAV = [
    ['home', 'index.html', 'bi-house-heart'], ['about', 'about.html', 'bi-book'],
    ['procedure', 'procedure.html', 'bi-list-check'], ['guidance', 'guidance.html', 'bi-compass'],
    ['downloads', 'downloads.html', 'bi-download'], ['community', 'community.html', 'bi-people'],
    ['contact', 'contact.html', 'bi-envelope']
  ];
  var TOPICS = ['General guidance', 'Wedding procedure', 'Wedding venue', 'Someone to conduct wedding', 'Marriage registration / Legal', 'Others'];

  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

  var lang = 'kn';
  try { var saved = localStorage.getItem('mm_lang'); if (saved === 'en' || saved === 'kn') lang = saved; } catch (e) {}
  function t(k) { return (I[lang] && I[lang][k]) || I.kn[k] || k; }

  function apiReady() { return C.API_URL && C.API_URL.indexOf('PASTE_') !== 0; }

  /* ---------- Layout ---------- */
  function buildLayout() {
    var hdr = $('#app-header'), ftr = $('#app-footer');
    if (hdr) {
      hdr.outerHTML = '<header class="site-header" id="siteHeader"><div class="wrap bar">' +
        '<a class="brand" href="index.html" aria-label="Home"><span class="brand-mark"><i class="bi bi-suit-heart-fill"></i></span><span data-i18n="site.name"></span></a>' +
        '<nav class="nav" id="nav" aria-label="Main">' + NAV.map(function (n) {
          return '<a href="' + n[1] + '" class="' + (n[0] === PAGE ? 'active' : '') + '"' + (n[0] === PAGE ? ' aria-current="page"' : '') + '><i class="bi ' + n[2] + '"></i><span data-i18n="nav.' + n[0] + '"></span></a>';
        }).join('') + '</nav>' +
        '<div class="actions"><button class="lang-toggle" id="langToggle" aria-label="Language / ಭಾಷೆ"><span data-l="kn">ಕನ್ನಡ</span><span data-l="en">EN</span></button>' +
        '<button class="burger" id="burger" aria-label="Menu" aria-expanded="false" aria-controls="nav"><i class="bi bi-list"></i></button></div></div></header>';
    }
    if (ftr) {
      ftr.outerHTML = '<footer class="site-footer"><div class="wrap"><div class="foot-grid">' +
        '<div><h4 data-i18n="site.name"></h4><p data-i18n="foot.about"></p><p style="margin-top:8px"><a href="' + esc(C.BLOG_URL) + '" target="_blank" rel="noopener"><i class="bi bi-box-arrow-up-right"></i> <span data-i18n="foot.blog"></span></a></p></div>' +
        '<div><h4 data-i18n="foot.links"></h4><ul class="foot-links">' + NAV.map(function (n) { return '<li><a href="' + n[1] + '" data-i18n="nav.' + n[0] + '"></a></li>'; }).join('') + '</ul></div>' +
        '<div><h4 data-i18n="foot.contact"></h4><div class="foot-social">' +
        '<a href="mailto:' + esc(C.EMAIL) + '"><i class="bi bi-envelope-fill"></i>' + esc(C.EMAIL) + '</a>' +
        '<a href="' + esc(C.INSTAGRAM_URL) + '" target="_blank" rel="noopener"><i class="bi bi-instagram"></i>' + esc(C.INSTAGRAM_HANDLE) + '</a>' +
        '<a href="' + esc(C.FACEBOOK_URL) + '" target="_blank" rel="noopener"><i class="bi bi-facebook"></i>' + esc(C.FACEBOOK_HANDLE) + '</a></div></div></div>' +
        '<div class="foot-quote" data-i18n="foot.quote"></div><p class="copy">© ' + new Date().getFullYear() + ' <span data-i18n="site.name"></span></p></div></footer>' +
        '<button class="to-top" id="toTop" aria-label="Back to top"><i class="bi bi-arrow-up"></i></button>';
    }
  }

  function applyI18n(root) {
    root = root || document;
    $$('[data-i18n]', root).forEach(function (el) { el.textContent = t(el.dataset.i18n); });
    $$('[data-i18n-placeholder]', root).forEach(function (el) { el.placeholder = t(el.dataset.i18nPlaceholder); });
    $$('[data-i18n-aria]', root).forEach(function (el) { el.setAttribute('aria-label', t(el.dataset.i18nAria)); });
    document.documentElement.lang = lang === 'kn' ? 'kn' : 'en';
    document.title = t('title.' + PAGE) + ' | ' + t('site.name');
    $$('#langToggle span').forEach(function (s) { s.classList.toggle('on', s.dataset.l === lang); });
  }

  function setLang(l) {
    lang = l;
    try { localStorage.setItem('mm_lang', l); } catch (e) {}
    applyI18n();
    document.dispatchEvent(new CustomEvent('mm:lang'));
  }

  function initChrome() {
    var burger = $('#burger'), nav = $('#nav');
    if (burger) burger.addEventListener('click', function () {
      var o = nav.classList.toggle('open'); burger.setAttribute('aria-expanded', o);
      burger.firstElementChild.className = 'bi ' + (o ? 'bi-x-lg' : 'bi-list');
    });
    $$('#nav a').forEach(function (a) { a.addEventListener('click', function () { nav.classList.remove('open'); }); });
    var lt = $('#langToggle');
    if (lt) lt.addEventListener('click', function () { setLang(lang === 'kn' ? 'en' : 'kn'); });
    var hdr = $('#siteHeader'), top = $('#toTop');
    function onScroll() {
      var y = window.scrollY;
      if (hdr) hdr.classList.toggle('scrolled', y > 8);
      if (top) top.classList.toggle('show', y > 500);
    }
    window.addEventListener('scroll', onScroll, { passive: true }); onScroll();
    if (top) top.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: 'smooth' }); });
  }

  /* ---------- Reveal + counters ---------- */
  var io = ('IntersectionObserver' in window) ? new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); if (e.target.dataset.count) countUp(e.target); } });
  }, { threshold: 0.12 }) : null;
  function observe(root) {
    $$('.reveal,[data-count]', root || document).forEach(function (el) {
      if (io) io.observe(el); else { el.classList.add('in'); if (el.dataset.count) el.textContent = el.dataset.count; }
    });
  }
  function countUp(el) {
    var end = parseInt(el.dataset.count, 10), start = performance.now(), dur = 1400;
    (function step(n) { var p = Math.min((n - start) / dur, 1); el.textContent = Math.round(end * (1 - Math.pow(1 - p, 3))); if (p < 1) requestAnimationFrame(step); })(start);
  }

  /* ---------- Slider ---------- */
  function initSlider() {
    var root = $('#heroSlider'); if (!root) return;
    var slides = $$('.slide', root), dotsBox = $('.dots', root), i = 0, timer, sx = 0;
    slides.forEach(function (_, n) { var b = document.createElement('button'); b.setAttribute('aria-label', 'Slide ' + (n + 1)); b.addEventListener('click', function () { go(n, true); }); dotsBox.appendChild(b); });
    var dots = $$('button', dotsBox);
    function go(n, user) { i = (n + slides.length) % slides.length; slides.forEach(function (s, k) { s.classList.toggle('on', k === i); dots[k].classList.toggle('on', k === i); }); if (user) restart(); }
    function restart() { clearInterval(timer); timer = setInterval(function () { go(i + 1); }, 6500); }
    $('.s-prev', root).addEventListener('click', function () { go(i - 1, true); });
    $('.s-next', root).addEventListener('click', function () { go(i + 1, true); });
    root.addEventListener('pointerdown', function (e) { sx = e.clientX; });
    root.addEventListener('pointerup', function (e) { var d = e.clientX - sx; if (Math.abs(d) > 50) go(i + (d < 0 ? 1 : -1), true); });
    root.addEventListener('mouseenter', function () { clearInterval(timer); });
    root.addEventListener('mouseleave', restart);
    document.addEventListener('visibilitychange', function () { document.hidden ? clearInterval(timer) : restart(); });
    go(0); restart();
  }

  /* ---------- About rendering ---------- */
  function imgBlock(file, alt, cls, cap) {
    return '<figure class="img-frame ' + (cls || '') + '"><img src="images/' + file + '" alt="' + esc(alt) + '" loading="lazy" decoding="async" onerror="this.remove()">' + (cap ? '<figcaption>' + esc(cap) + '</figcaption>' : '') + '</figure>';
  }
  function paras(a) { return '<div class="prose">' + a.map(function (p) { return '<p>' + esc(p) + '</p>'; }).join('') + '</div>'; }
  function body(s) {
    var d = s[lang];
    switch (s.type) {
      case 'text': return paras(d.paras);
      case 'ideals':
        return '<div class="split rev"><div class="ideals">' + d.items.map(function (x) {
          return '<div class="ideal"><i class="bi ' + x[0] + '"></i><div><h3>' + esc(x[1]) + '</h3><p>' + esc(x[2]) + '</p></div></div>';
        }).join('') + '</div>' + imgBlock(s.img, d.imgAlt, 'tall') + '</div>';
      case 'quote':
        return '<div class="split">' + imgBlock(s.img, d.imgAlt, 'tall') + '<div><p class="prose" style="margin-bottom:14px">' + esc(d.intro) + '</p><blockquote class="quote">' + esc(d.quote) + '</blockquote></div></div>';
      case 'wedding':
        return '<div class="gallery2">' + s.imgs.map(function (m, k) { return imgBlock(m[0], d.caps[k], 'wide', d.caps[k]); }).join('') + '</div>' + paras(d.paras);
      case 'soon':
        return '<div class="placeholder-box"><i class="bi bi-hourglass-split"></i><b>' + esc(t('soon')) + '</b><br>' + esc(t('soon.detail')) + '</div>';
    }
    return '';
  }
  function renderAbout(box, accordion) {
    box.innerHTML = window.MM_ABOUT.map(function (s, n) {
      var d = s[lang];
      if (accordion) {
        return '<article class="acc reveal" id="acc-' + s.id + '"><button class="acc-head" aria-expanded="false" aria-controls="p-' + s.id + '"><span class="acc-ic"><i class="bi ' + s.icon + '"></i></span><span class="acc-title">' + esc(d.title) + '</span><i class="bi bi-chevron-down chev"></i></button><div class="acc-panel" id="p-' + s.id + '" role="region"><div class="acc-inner"><div class="acc-body">' + body(s) + '</div></div></div></article>';
      }
      return '<section class="about-sec reveal" id="' + s.id + '"><h2><span class="acc-ic"><i class="bi ' + s.icon + '"></i></span>' + esc(d.title) + '</h2>' + body(s) + '</section>';
    }).join('');
    if (accordion) $$('.acc', box).forEach(function (a) { $('.acc-head', a).addEventListener('click', function () { toggle(a); }); });
    observe(box);
  }
  function toggle(a, force) {
    var open = force == null ? !a.classList.contains('open') : force;
    a.classList.toggle('open', open); $('.acc-head', a).setAttribute('aria-expanded', open);
  }
  function initAbout() {
    var box = $('#aboutBox'); if (!box) return;
    var accordion = box.dataset.mode === 'accordion', openIds = [];
    function draw() {
      $$('.acc.open', box).forEach(function (a) { openIds.push(a.id); });
      renderAbout(box, accordion);
      openIds.forEach(function (id) { var a = document.getElementById(id); if (a) toggle(a, true); }); openIds = [];
      $$('.acc', box).forEach(function (a) { a.classList.add('in'); });
    }
    draw(); document.addEventListener('mm:lang', draw);
    var all = $('#expandAll');
    if (all) {
      var expanded = false;
      all.addEventListener('click', function () {
        expanded = !expanded; $$('.acc', box).forEach(function (a) { toggle(a, expanded); });
        var s = $('span', all); s.dataset.i18n = expanded ? 'btn.collapse' : 'btn.expand'; s.textContent = t(s.dataset.i18n);
        $('i', all).className = 'bi ' + (expanded ? 'bi-arrows-collapse' : 'bi-arrows-expand');
      });
    }
    if (accordion && location.hash) { var a = $(location.hash); if (a && a.classList.contains('acc')) toggle(a, true); }
  }

  /* ---------- FAQ (guidance) ---------- */
  function initFaq() {
    var box = $('#faqBox'); if (!box) return;
    box.innerHTML = [1, 2, 3, 4, 5].map(function (n) {
      return '<article class="acc reveal"><button class="acc-head" aria-expanded="false"><span class="acc-ic"><i class="bi bi-patch-question"></i></span><span class="acc-title" data-i18n="faq.' + n + '.q"></span><i class="bi bi-chevron-down chev"></i></button><div class="acc-panel"><div class="acc-inner"><div class="acc-body prose"><p data-i18n="faq.' + n + '.a"></p></div></div></div></article>';
    }).join('');
    $$('.acc', box).forEach(function (a) { $('.acc-head', a).addEventListener('click', function () { toggle(a); }); });
    applyI18n(box); observe(box);
  }

  /* ---------- API helpers ---------- */
  function apiGet(action) {
    if (!apiReady()) return Promise.reject(new Error('not-configured'));
    var key = 'mm_cache_' + action;
    return fetch(C.API_URL + '?action=' + encodeURIComponent(action), { redirect: 'follow' })
      .then(function (r) { if (!r.ok) throw new Error('http'); return r.json(); })
      .then(function (j) { if (!j || j.ok === false) throw new Error('api'); try { sessionStorage.setItem(key, JSON.stringify(j)); } catch (e) {} return j; });
  }
  function cached(action) { try { return JSON.parse(sessionStorage.getItem('mm_cache_' + action)); } catch (e) { return null; } }

  /* ---------- Downloads ---------- */
  function fileIcon(f) {
    var m = f.mimeType || '';
    if (m.indexOf('pdf') > -1) return 'bi-file-earmark-pdf';
    if (m.indexOf('image') === 0) return 'bi-file-earmark-image';
    if (m.indexOf('word') > -1 || m.indexOf('document') > -1) return 'bi-file-earmark-word';
    return 'bi-file-earmark-text';
  }
  function kind(f) { var m = f.mimeType || ''; return m.indexOf('pdf') > -1 ? 'pdf' : m.indexOf('image') === 0 ? 'images' : 'docs'; }
  function fmtSize(b) { if (!b) return ''; return b > 1048576 ? (b / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(b / 1024)) + ' KB'; }

  function initDownloads() {
    var grid = $('#dlGrid'); if (!grid) return;
    var files = null, filter = 'all', q = '', status = 'loading';
    grid.innerHTML = '<div class="skeleton"></div><div class="skeleton"></div><div class="skeleton"></div>';
    function draw() {
      if (status === 'loading') return;
      if (status !== 'ok') { grid.innerHTML = '<div class="card empty-state" style="grid-column:1/-1"><i class="bi bi-cloud-slash" style="font-size:2rem;color:var(--saffron)"></i><p>' + esc(t(status === 'nc' ? 'dl.notconf' : 'dl.error')) + '</p></div>'; return; }
      var list = files.filter(function (f) { return (filter === 'all' || kind(f) === filter) && (!q || (f.name || '').toLowerCase().indexOf(q) > -1); });
      if (!list.length) { grid.innerHTML = '<div class="card empty-state" style="grid-column:1/-1"><i class="bi bi-folder2-open" style="font-size:2rem;color:var(--saffron)"></i><p>' + esc(t(files.length ? 'dl.nomatch' : 'dl.empty')) + '</p></div>'; return; }
      grid.innerHTML = list.map(function (f) {
        return '<article class="card file hover reveal in"><div class="thumb">' + (f.thumbnail ? '<img src="' + esc(f.thumbnail) + '" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.remove()">' : '') + '<i class="bi ' + fileIcon(f) + '"></i></div><h3>' + esc(f.name) + '</h3><div class="meta">' + esc(fmtSize(f.size)) + '</div><div class="row"><a class="btn btn-light" href="' + esc(f.viewUrl) + '" target="_blank" rel="noopener"><i class="bi bi-eye"></i>' + esc(t('dl.view')) + '</a><a class="btn btn-primary" href="' + esc(f.downloadUrl) + '" rel="noopener"><i class="bi bi-download"></i>' + esc(t('dl.download')) + '</a></div></article>';
      }).join('');
    }
    function load(data) { files = data.files || []; status = 'ok'; draw(); }
    var c = cached('downloads'); if (c) load(c);
    apiGet('downloads').then(load).catch(function (e) { if (!files) { status = e.message === 'not-configured' ? 'nc' : 'err'; draw(); } });
    $('#dlSearch').addEventListener('input', function (e) { q = e.target.value.trim().toLowerCase(); draw(); });
    $$('#dlChips .chip').forEach(function (b) { b.addEventListener('click', function () { filter = b.dataset.f; $$('#dlChips .chip').forEach(function (x) { x.classList.toggle('on', x === b); }); draw(); }); });
    document.addEventListener('mm:lang', draw);
  }

  /* ---------- Community gallery ---------- */
  function initCommunity() {
    var g = $('#photoGrid'); if (!g) return;
    var lb = $('#lightbox'), lbi = $('img', lb), st = 'loading', photos = [];
    function draw() {
      if (st === 'loading') { g.innerHTML = '<div class="skeleton" style="min-height:140px"></div>'; g.className = 'cards'; return; }
      if (st !== 'ok' || !photos.length) { g.className = 'cards'; g.innerHTML = '<div class="placeholder-box" style="grid-column:1/-1"><i class="bi bi-images"></i>' + esc(t('com.nophotos')) + '</div>'; return; }
      g.className = 'masonry';
      g.innerHTML = photos.map(function (p, n) { return '<button data-n="' + n + '" aria-label="' + esc(p.name) + '"><img src="' + esc(p.thumbnail) + '" alt="' + esc(p.name) + '" loading="lazy" referrerpolicy="no-referrer"></button>'; }).join('');
    }
    function load(d) { photos = d.photos || []; st = 'ok'; draw(); }
    var c = cached('photos'); if (c) load(c); else draw();
    apiGet('photos').then(load).catch(function () { if (st === 'loading') { st = 'err'; draw(); } });
    g.addEventListener('click', function (e) { var b = e.target.closest('button[data-n]'); if (!b) return; var p = photos[+b.dataset.n]; lbi.src = p.fullUrl || p.thumbnail; lbi.alt = p.name; lb.classList.add('open'); });
    lb.addEventListener('click', function () { lb.classList.remove('open'); lbi.src = ''; });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') lb.click(); });
    document.addEventListener('mm:lang', draw);
  }

  /* ---------- Contact form ---------- */
  function initContact() {
    var f = $('#queryForm'); if (!f) return;
    var sel = $('#f-topic');
    function fillTopics() { var cur = sel.value || TOPICS[0]; sel.innerHTML = TOPICS.map(function (v) { return '<option value="' + esc(v) + '">' + esc(t('topic.' + v)) + '</option>'; }).join(''); sel.value = cur; }
    fillTopics();
    var V = {
      name: function (v) { v = v.trim(); return !v ? 'err.name.req' : (v.length < 3 || v.length > 30) ? 'err.name.len' : ''; },
      phone: function (v) { v = v.trim(); return !v ? 'err.phone.req' : !/^[6-9]\d{9}$/.test(v) ? 'err.phone.fmt' : ''; },
      email: function (v) { v = v.trim(); return !v ? 'err.email.req' : !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) ? 'err.email.fmt' : ''; },
      place: function (v) { return v.length > 200 ? 'err.place.len' : ''; },
      topic: function (v) { return !v ? 'err.topic.req' : ''; },
      message: function (v) { return !v.trim() ? 'err.message.req' : ''; }
    };
    function check(k) {
      var el = $('#f-' + k), wrap = el.closest('.field'), key = V[k](el.value), msg = $('.err', wrap);
      wrap.classList.toggle('invalid', !!key); el.setAttribute('aria-invalid', !!key);
      msg.dataset.key = key; msg.textContent = key ? t(key) : ''; return !key;
    }
    Object.keys(V).forEach(function (k) {
      var el = $('#f-' + k);
      el.addEventListener('blur', function () { check(k); });
      el.addEventListener('input', function () { if (el.closest('.field').classList.contains('invalid')) check(k); if (k === 'phone') el.value = el.value.replace(/\D/g, '').slice(0, 10); });
    });
    document.addEventListener('mm:lang', function () { fillTopics(); $$('.err', f).forEach(function (m) { if (m.dataset.key) m.textContent = t(m.dataset.key); }); });
    var ok = $('#alertOk'), bad = $('#alertBad'), btn = $('#submitBtn'), busy = false;
    function setBusy(b) { busy = b; btn.disabled = b; btn.innerHTML = b ? '<span class="spin"></span><span>' + esc(t('form.sending')) + '</span>' : '<i class="bi bi-send-fill"></i><span data-i18n="form.submit">' + esc(t('form.submit')) + '</span>'; }
    f.addEventListener('submit', function (e) {
      e.preventDefault(); if (busy) return;
      ok.classList.remove('show'); bad.classList.remove('show');
      var valid = Object.keys(V).map(check).every(Boolean);
      if (!valid) { var first = $('.field.invalid input,.field.invalid select,.field.invalid textarea', f); if (first) first.focus(); return; }
      if ($('#f-website').value) return; // honeypot
      if (!apiReady()) { $('span', bad).textContent = t('form.notconf'); bad.classList.add('show'); return; }
      var payload = {
        'Name': $('#f-name').value.trim(), 'Contact Number': $('#f-phone').value.trim(), 'Email': $('#f-email').value.trim(),
        'Place': $('#f-place').value.trim(), 'Topic': sel.value, 'Message': $('#f-message').value.trim(),
        'Language': lang === 'kn' ? 'Kannada' : 'English', 'lang': lang
      };
      setBusy(true);
      fetch(C.API_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(payload), redirect: 'follow' })
        .then(function (r) { return r.json(); })
        .then(function (j) {
          if (!j || !j.ok) throw new Error('api');
          $('span', ok).textContent = t('form.ok'); ok.classList.add('show'); f.reset(); sel.value = TOPICS[0];
          $$('.field', f).forEach(function (w) { w.classList.remove('invalid'); });
          ok.scrollIntoView({ behavior: 'smooth', block: 'center' });
        })
        .catch(function () { $('span', bad).textContent = t('form.fail'); bad.classList.add('show'); })
        .then(function () { setBusy(false); });
    });
    var mc = $('#f-message'), pc = $('#f-place');
    function counter() { $('#cnt-place').textContent = pc.value.length + '/200'; }
    pc.addEventListener('input', counter); counter();
    void mc;
  }

  /* ---------- Boot ---------- */
  function boot() {
    buildLayout(); initChrome(); applyI18n();
    initSlider(); initAbout(); initFaq(); initDownloads(); initCommunity(); initContact();
    observe();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();

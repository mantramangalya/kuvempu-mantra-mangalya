(function () {
  'use strict';
  var C = window.MM_CONFIG || {}, T = window.MM_I18N, D = window.MM_CONTENT;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  var lang = 'kn';
  try { lang = localStorage.getItem('mm_lang') || 'kn'; } catch (e) {}
  if (lang !== 'kn' && lang !== 'en') lang = 'kn';

  var t = function (k) { return (T[lang] && T[lang][k]) || k; };
  var pick = function (o) { return o ? (o[lang] || o.en || '') : ''; };
  var esc = function (s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  };

  var state = { downloads: null, members: null, downloadsFallback: false };

  /* ---------- Scroll reveal ---------- */
  var io = ('IntersectionObserver' in window) ? new IntersectionObserver(function (entries) {
    entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 }) : null;

  function observe() {
    $$('.reveal:not(.in)').forEach(function (el) { io ? io.observe(el) : el.classList.add('in'); });
  }

  /* ---------- Static i18n ---------- */
  function applyStatic() {
    document.documentElement.lang = lang;
    $$('[data-i18n]').forEach(function (el) { el.textContent = t(el.getAttribute('data-i18n')); });
    $('#langBtn').textContent = t('lang_btn');
    $('#menuBtn').setAttribute('aria-label', t('menu'));
    document.title = lang === 'kn' ? 'ಮಂತ್ರ ಮಾಂಗಲ್ಯ | Kuvempu Mantra Mangalya' : 'Kuvempu Mantra Mangalya | ಮಂತ್ರ ಮಾಂಗಲ್ಯ';
  }

  /* ---------- Long content (all bundled in the browser) ---------- */
  function renderContent() {
    $('#aboutTitle').textContent = pick(D.about.title);
    $('#aboutBody').innerHTML = D.about.paras.map(function (p) { return '<p>' + esc(pick(p)) + '</p>'; }).join('');

    $('#principlesTitle').textContent = pick(D.principlesTitle);
    $('#principles').innerHTML = D.principles.map(function (p) {
      return '<div class="card reveal"><div class="ico" aria-hidden="true">' + p.icon + '</div><h4>' + esc(pick(p.title)) + '</h4><p>' + esc(pick(p.text)) + '</p></div>';
    }).join('');

    $('#historyTitle').textContent = pick(D.historyTitle);
    $('#history').innerHTML = D.history.map(function (h) {
      return '<li class="reveal"><span class="yr">' + esc(pick(h.year)) + '</span><p>' + esc(pick(h.text)) + '</p></li>';
    }).join('');

    $('#procedureTitle').textContent = pick(D.procedureTitle);
    $('#procedureNote').textContent = pick(D.procedureNote);
    $('#steps').innerHTML = D.steps.map(function (s) {
      return '<li class="reveal"><h4>' + esc(pick(s.title)) + '</h4><p>' + esc(pick(s.text)) + '</p></li>';
    }).join('');

    $('#guidanceTitle').textContent = pick(D.guidanceTitle);
    $('#guidanceNote').textContent = pick(D.guidanceNote);
    var saved = {};
    try { saved = JSON.parse(localStorage.getItem('mm_checks') || '{}'); } catch (e) {}
    $('#guidanceGrid').innerHTML = D.guidance.map(function (g) {
      return '<div class="card reveal"><h4>' + esc(pick(g.title)) + '</h4><ul class="check-list">' +
        g.items.map(function (it, i) {
          var id = g.id + '-' + i;
          return '<li><label><input type="checkbox" data-id="' + id + '"' + (saved[id] ? ' checked' : '') + '><span>' + esc(pick(it)) + '</span></label></li>';
        }).join('') + '</ul></div>';
    }).join('');

    $('#faqTitle').textContent = pick(D.faqTitle);
    $('#faq').innerHTML = D.faq.map(function (f) {
      return '<details class="reveal"><summary>' + esc(pick(f.q)) + '</summary><p>' + esc(pick(f.a)) + '</p></details>';
    }).join('');
    observe();
  }

  document.addEventListener('change', function (e) {
    var cb = e.target;
    if (cb && cb.matches && cb.matches('.check-list input')) {
      var s = {};
      try { s = JSON.parse(localStorage.getItem('mm_checks') || '{}'); } catch (x) {}
      s[cb.getAttribute('data-id')] = cb.checked;
      try { localStorage.setItem('mm_checks', JSON.stringify(s)); } catch (x) {}
    }
  });

  /* ---------- Backend data: stale-while-revalidate ---------- */
  function swr(action, ttlMin, cb) {
    var key = 'mm_cache_' + action, cached = null;
    try { cached = JSON.parse(localStorage.getItem(key) || 'null'); } catch (e) {}
    if (cached) {
      cb(cached.data, false);
      if (Date.now() - cached.ts < ttlMin * 60000) return;
    }
    if (!C.API_URL) { if (!cached) cb(null, true); return; }
    fetch(C.API_URL + '?action=' + encodeURIComponent(action))
      .then(function (r) { return r.json(); })
      .then(function (j) {
        if (j && j.ok) {
          try { localStorage.setItem(key, JSON.stringify({ ts: Date.now(), data: j.data })); } catch (e) {}
          cb(j.data, false);
        } else if (!cached) cb(null, true);
      })
      .catch(function () { if (!cached) cb(null, true); });
  }

  function skeleton(n) { var h = ''; for (var i = 0; i < n; i++) h += '<div class="skel"></div>'; return h; }

  /* ---------- Downloads ---------- */
  function fileUrl(id) { return 'https://drive.google.com/uc?export=download&id=' + encodeURIComponent(id); }
  function thumbUrl(id) { return 'https://drive.google.com/thumbnail?id=' + encodeURIComponent(id) + '&sz=w480'; }

  function renderDownloads() {
    var box = $('#downloadsBox');
    var list = state.downloads;
    if (!list) { box.innerHTML = '<div class="dl-grid">' + skeleton(4) + '</div>'; return; }
    var groups = [['template', 'dl_templates'], ['invitation', 'dl_invitations']];
    var html = '';
    groups.forEach(function (g) {
      var items = list.filter(function (d) { return d.category === g[0]; });
      if (!items.length) return;
      html += '<div class="dl-group"><h3 class="reveal">' + esc(t(g[1])) + '</h3><div class="dl-grid">' +
        items.map(function (d) {
          var has = !!d.fileId;
          var thumb = (has && g[0] === 'invitation')
            ? '<img loading="lazy" decoding="async" alt="" src="' + thumbUrl(d.fileId) + '" onerror="this.parentNode.textContent=\'' + esc(d.type || '') + '\'">'
            : esc(d.type || '');
          return '<div class="dl-card reveal"><div class="dl-thumb">' + thumb + '</div><div class="dl-body"><strong>' +
            esc(pick(d.title)) + (d.type ? '<span class="tag">' + esc(d.type) + '</span>' : '') + '</strong>' +
            (has
              ? '<a class="btn btn-primary btn-sm" href="' + fileUrl(d.fileId) + '" rel="noopener" download>⬇ ' + esc(t('dl_button')) + '</a>'
              : '<span class="btn btn-ghost btn-sm disabled">' + esc(t('dl_soon')) + '</span>') +
            '</div></div>';
        }).join('') + '</div></div>';
    });
    box.innerHTML = html || '<div class="empty">' + esc(t('dl_empty')) + '</div>';
    observe();
  }

  function loadDownloads() {
    renderDownloads();
    swr('downloads', C.CACHE_MINUTES || 30, function (data, failed) {
      state.downloads = failed ? D.sampleDownloads : (data || []);
      renderDownloads();
    });
  }

  /* ---------- Members ---------- */
  function renderMembers() {
    var box = $('#members'), list = state.members;
    if (!list) { box.innerHTML = skeleton(3); return; }
    if (!list.length) { box.innerHTML = '<div class="empty">' + esc(t('com_empty')) + '</div>'; return; }
    box.innerHTML = list.map(function (m) {
      return '<article class="member reveal"><h4>' + esc(m.name) + '</h4><div class="meta">' +
        esc(m.place || '') + (m.year ? ' · ' + esc(t('year_label')) + ' ' + esc(m.year) : '') + '</div>' +
        (m.story ? '<p>' + esc(m.story) + '</p>' : '') + '</article>';
    }).join('');
    observe();
  }

  function loadMembers() {
    renderMembers();
    swr('members', 10, function (data, failed) {
      state.members = failed ? [] : (data || []);
      renderMembers();
    });
  }

  /* ---------- Forms ---------- */
  function setStatus(el, type, msg) { el.className = 'form-status ' + type; el.textContent = msg; }

  function bindForm(form, action) {
    var status = $('.form-status', form), btn = $('button[type=submit]', form);
    var born = Date.now();
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!form.checkValidity()) { form.reportValidity(); setStatus(status, 'err', t('err_invalid')); return; }
      if (!C.API_URL) { setStatus(status, 'err', t('err_config')); return; }
      var data = {};
      new FormData(form).forEach(function (v, k) { data[k] = v; });
      $$('input[type=checkbox]', form).forEach(function (cb) { data[cb.name] = cb.checked; });
      data.action = action; data.lang = lang; data.elapsed = Date.now() - born;
      btn.disabled = true; setStatus(status, 'info', t('sending'));
      // text/plain avoids a CORS preflight, which Apps Script cannot answer.
      fetch(C.API_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(data) })
        .then(function (r) { return r.json(); })
        .then(function (j) {
          if (j && j.ok) {
            form.reset(); born = Date.now();
            setStatus(status, 'ok', t(action === 'contact' ? 'ok_contact' : 'ok_join'));
          } else {
            setStatus(status, 'err', t(j && j.error === 'rate' ? 'err_rate' : (j && j.error === 'invalid' ? 'err_invalid' : 'err_generic')));
          }
        })
        .catch(function () { setStatus(status, 'err', t('err_generic')); })
        .then(function () { btn.disabled = false; });
    });
  }

  /* ---------- Language + navigation ---------- */
  function setLang(l) {
    lang = l;
    try { localStorage.setItem('mm_lang', l); } catch (e) {}
    applyStatic(); renderContent(); renderDownloads(); renderMembers();
    $$('.form-status').forEach(function (s) { s.textContent = ''; s.className = 'form-status'; });
  }

  $('#langBtn').addEventListener('click', function () { setLang(lang === 'kn' ? 'en' : 'kn'); });

  var menuBtn = $('#menuBtn');
  menuBtn.addEventListener('click', function () {
    var open = document.body.classList.toggle('nav-open');
    menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
  $('#nav').addEventListener('click', function (e) {
    if (e.target.tagName === 'A') { document.body.classList.remove('nav-open'); menuBtn.setAttribute('aria-expanded', 'false'); }
  });

  /* ---------- Init ---------- */
  applyStatic();
  renderContent();
  bindForm($('#joinForm'), 'register');
  bindForm($('#contactForm'), 'contact');
  $('#yr').textContent = new Date().getFullYear();
  observe();
  loadDownloads();
  loadMembers();

  // Warm up the Apps Script backend so the first form submit is fast.
  if (C.API_URL) { setTimeout(function () { fetch(C.API_URL + '?action=ping').catch(function () {}); }, 1500); }

  if ('serviceWorker' in navigator && location.protocol === 'https:') {
    window.addEventListener('load', function () { navigator.serviceWorker.register('sw.js').catch(function () {}); });
  }
})();

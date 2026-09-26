/* Sijil prototype — behaviour. Vanilla JS, no dependencies.
   1 menu · 2 mega menu · 3 filter sheet · 4 escape · 5 toggles · 6 maps · 7 copy · 8 forms · 9 contents · 10 toast */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var root = document.documentElement;
  var CHECK = '<svg class="ic ic--sm" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';

  function lock(on) { root.classList.toggle('is-locked', on); }

  /* 1. Mobile menu -------------------------------------------------------- */
  var menu = $('#menu'), menuReturn = null;
  function openMenu() {
    if (!menu) return;
    menuReturn = document.activeElement;
    menu.hidden = false; lock(true);
    $$('[data-menu-open]').forEach(function (b) { b.setAttribute('aria-expanded', 'true'); });
    var c = $('[data-menu-close]', menu); if (c) c.focus();
  }
  function closeMenu() {
    if (!menu || menu.hidden) return;
    menu.hidden = true; lock(false);
    $$('[data-menu-open]').forEach(function (b) { b.setAttribute('aria-expanded', 'false'); });
    if (menuReturn) menuReturn.focus();
  }
  $$('[data-menu-open]').forEach(function (b) { b.addEventListener('click', openMenu); });
  $$('[data-menu-close]').forEach(function (b) { b.addEventListener('click', closeMenu); });
  // the "الإصدارات" group in the menu opens in place
  $$('.drawer__nav li > button[aria-expanded]').forEach(function (b) {
    var rest = Array.prototype.slice.call(b.parentElement.children).filter(function (x) { return x !== b; });
    function set(open) {
      b.setAttribute('aria-expanded', String(open));
      rest.forEach(function (x) { x.hidden = !open; });
      var ic = $('svg', b); if (ic) ic.style.transform = open ? 'rotate(180deg)' : '';
    }
    set(false);
    b.addEventListener('click', function () { set(b.getAttribute('aria-expanded') !== 'true'); });
  });

  /* 2. Mega menu ("الإصدارات" on desktop) ------------------------------ */
  var megaBtn = $('[data-mega]'), mega = $('#mega'), megaTimer = null;
  function setMega(open) {
    if (!mega) return;
    mega.hidden = !open; megaBtn.setAttribute('aria-expanded', String(open));
  }
  if (megaBtn && mega) {
    megaBtn.addEventListener('click', function (e) { e.preventDefault(); setMega(mega.hidden); });
    var hoverable = window.matchMedia('(hover: hover)').matches;
    if (hoverable) {
      [megaBtn, mega].forEach(function (el) {
        el.addEventListener('mouseenter', function () { clearTimeout(megaTimer); megaTimer = setTimeout(function () { setMega(true); }, 120); });
        el.addEventListener('mouseleave', function () { clearTimeout(megaTimer); megaTimer = setTimeout(function () { setMega(false); }, 220); });
      });
    }
    document.addEventListener('click', function (e) {
      if (!mega.hidden && !mega.contains(e.target) && !megaBtn.contains(e.target)) setMega(false);
    });
  }

  /* 3. Filter sheet (archive, phones and tablets) ----------------------- */
  var sheet = $('#filters'), backdrop = $('.sheet-backdrop'), sheetReturn = null;
  function openSheet() {
    if (!sheet) return;
    sheetReturn = document.activeElement;
    sheet.hidden = false; if (backdrop) backdrop.hidden = false; lock(true);
    var c = $('[data-sheet-close]', sheet); if (c) c.focus();
  }
  function closeSheet() {
    if (!sheet || sheet.hidden) return;
    sheet.hidden = true; if (backdrop) backdrop.hidden = true; lock(false);
    if (sheetReturn) sheetReturn.focus();
  }
  $$('[data-sheet-open]').forEach(function (b) { b.addEventListener('click', openSheet); });
  $$('[data-sheet-close]').forEach(function (b) { b.addEventListener('click', closeSheet); });

  /* 4. Escape closes whatever is open ---------------------------------- */
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    closeMenu(); closeSheet(); if (mega && !mega.hidden) { setMega(false); megaBtn.focus(); }
  });

  /* 5. Toggles: the controls work, the data stays the sample ----------- */
  document.addEventListener('click', function (e) {
    var t = e.target;
    var chip = t.closest('button.chip');
    if (chip) { chip.classList.toggle('is-on'); chip.setAttribute('aria-pressed', chip.classList.contains('is-on')); return; }
    var chk = t.closest('label.check');
    if (chk) {
      e.preventDefault();
      chk.classList.remove('is-mixed');
      var on = chk.classList.toggle('is-on');
      var box = $('.check__box', chk); if (box) box.innerHTML = on ? CHECK : '';
      return;
    }
    var seg = t.closest('.seg button');
    if (seg) { $$('button', seg.parentElement).forEach(function (b) { b.classList.toggle('is-on', b === seg); b.setAttribute('aria-pressed', b === seg); }); return; }
    var tab = t.closest('.tabs button');
    if (tab) { $$('button', tab.parentElement).forEach(function (b) { b.classList.toggle('is-on', b === tab); b.setAttribute('aria-selected', b === tab); }); return; }
    var acc = t.closest('.acc__head');
    if (acc) {
      var open = acc.getAttribute('aria-expanded') !== 'true';
      acc.setAttribute('aria-expanded', String(open));
      var body = acc.nextElementSibling;
      if (body && body.classList.contains('acc__body')) body.hidden = !open;
      var ic = $('svg', acc); if (ic) ic.style.transform = open ? 'rotate(45deg)' : '';
      return;
    }
    var pager = t.closest('.pager a');
    if (pager && pager.getAttribute('href') === '#') { e.preventDefault(); }
  });

  /* 6. Fixed-size map widgets scale to their column ------------------- */
  function fitMaps() {
    $$('.fit').forEach(function (f) {
      var w = +f.getAttribute('data-w'), h = +f.getAttribute('data-h');
      var avail = f.clientWidth; if (!avail) return;
      var s = f.hasAttribute('data-grow') ? avail / w : Math.min(1, avail / w);
      f.firstElementChild.style.transform = 'scale(' + s + ')';
      f.style.height = (h * s) + 'px';
    });
  }
  fitMaps();
  window.addEventListener('resize', fitMaps);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitMaps);

  /* 7. Copy: citation text and page link ------------------------------ */
  function copy(text, msg) {
    var done = function () { toast(msg); };
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(text).then(done, function () { toast('تعذّر النسخ'); });
    else {
      var ta = document.createElement('textarea'); ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); done(); } catch (err) { toast('تعذّر النسخ'); }
      ta.remove();
    }
  }
  $$('.cite button').forEach(function (b) {
    b.addEventListener('click', function () { var p = $('p', b.closest('.cite')); copy(p ? p.innerText.trim() : location.href, 'نُسخ نص الاستشهاد'); });
  });
  $$('.share__copy').forEach(function (b) { b.addEventListener('click', function () { copy(location.href, 'نُسخ رابط المادة'); }); });

  /* 8. Forms: search goes to the results page; the rest confirm in place */
  $$('form').forEach(function (f) {
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      if (f.getAttribute('role') === 'search' || f.closest('[role="search"]')) {
        var q = $('input', f); location.href = 'search.html' + (q && q.value ? '?q=' + encodeURIComponent(q.value) : '');
        return;
      }
      var mail = $('input[type="email"]', f);
      if (mail && !mail.value.trim()) { mail.focus(); toast('اكتب بريدك الإلكتروني أولاً'); return; }
      if (f.closest('.newsletter')) {
        var ok = document.createElement('p'); ok.className = 'nl-done'; ok.setAttribute('role', 'status');
        ok.textContent = 'تمّ الاشتراك. تصلك النشرة صباح كل أحد.';
        f.replaceWith(ok); return;
      }
      toast('وصلت رسالتك. نردّ خلال يومي عمل.');
      f.reset();
    });
  });
  // the header's search link opens the results page; the page's own field shows the query
  var q = new URLSearchParams(location.search).get('q');
  if (q) $$('input[type="search"], main input.input').slice(0, 1).forEach(function (i) { i.value = q; });

  /* 9. Article contents follow the reader ----------------------------- */
  var tocLinks = $$('.toc a[href^="#"]');
  if (tocLinks.length && 'IntersectionObserver' in window) {
    var heads = tocLinks.map(function (a) { return document.getElementById(a.getAttribute('href').slice(1)); }).filter(Boolean);
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        tocLinks.forEach(function (a) { a.classList.toggle('is-on', a.getAttribute('href') === '#' + en.target.id); });
      });
    }, { rootMargin: '-20% 0px -70% 0px' });
    heads.forEach(function (h) { io.observe(h); });
  }

  /* 10. Toast --------------------------------------------------------- */
  function toast(msg) {
    var host = $('.toast-host'); if (!host) return;
    var t = document.createElement('div'); t.className = 'toast'; t.textContent = msg;
    host.appendChild(t);
    setTimeout(function () { t.classList.add('is-out'); }, 2400);
    setTimeout(function () { t.remove(); }, 2800);
  }
})();

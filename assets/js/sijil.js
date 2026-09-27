/* Sijil prototype، behaviour. Vanilla JS, no dependencies, no build step.
   Motion follows the tokens in sijil.css (--ease-out, --ease-in-out, --ease-drawer, --dur-*).
   Rules: transform and opacity only; transitions (not keyframes) for anything a reader can trigger twice;
   reduced motion keeps fades and drops movement.

    0 utilities       1 menu            2 mega menu        3 filter sheet     4 escape
    5 controls        6 monitor         7 map explorer     8 chart series     9 report builder
   10 list filters   11 map scaling    12 copy            13 forms           14 contents
   15 reading bar    16 images         17 first view      18 toast           19 issues shelf
   20 sticky sidebars 21 page actions  22 archive          23 periodic reports 24 search
   25 field report and contact */
(function () {
  'use strict';

  /* 0. Utilities -------------------------------------------------------- */
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var html = document.documentElement;
  var mqReduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var reduced = function () { return mqReduce.matches; };
  var EASE_OUT = 'cubic-bezier(0.23, 1, 0.32, 1)';
  var EASE_IN_OUT = 'cubic-bezier(0.77, 0, 0.175, 1)';
  var CHECK = '<svg class="ic ic--sm" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
  var canAnimate = typeof Element !== 'undefined' && 'animate' in Element.prototype;

  function lock(on) { html.classList.toggle('is-locked', on); }

  // Swap the text of a figure or label with a short fade instead of a jump.
  function swap(el, text) {
    if (!el) return;
    text = String(text);
    if (el.textContent === text) return;
    if (!canAnimate) { el.textContent = text; return; }
    el.getAnimations().forEach(function (a) { a.cancel(); });
    el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 90, easing: EASE_OUT }).onfinish = function () {
      el.textContent = text;
      el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 200, easing: EASE_OUT });
    };
  }

  // FLIP: record positions, apply a change that moves things, then slide them from where they were.
  function flip(items, change, duration) {
    if (reduced() || !canAnimate) { change(); return; }
    var before = items.map(function (el) { return el.getBoundingClientRect().top; });
    change();
    items.forEach(function (el, i) {
      var dy = before[i] - el.getBoundingClientRect().top;
      if (Math.abs(dy) < 1) return;
      el.animate([{ transform: 'translateY(' + dy + 'px)' }, { transform: 'none' }], { duration: duration || 320, easing: EASE_IN_OUT });
    });
  }

  function plural(n, one, two, few, many) {  // Arabic counted noun, tamyeez forms
    if (n === 1) return one;
    if (n === 2) return two;
    if (n >= 3 && n <= 10) return n + ' ' + few;
    return n + ' ' + many;
  }

  var monData = (function () { var s = $('[data-mon-data]'); try { return s ? JSON.parse(s.textContent) : null; } catch (e) { return null; } })();

  /* 1. Mobile menu ------------------------------------------------------- */
  var menu = $('#menu'), menuReturn = null;
  function openMenu() {
    if (!menu) return;
    menuReturn = document.activeElement;
    menu.hidden = false; lock(true);
    $$('[data-menu-open]').forEach(function (b) { b.setAttribute('aria-expanded', 'true'); });
    var c = $('[data-menu-close]', menu); if (c) c.focus({ preventScroll: true });
  }
  function closeMenu() {
    if (!menu || menu.hidden) return;
    menu.hidden = true; lock(false);
    $$('[data-menu-open]').forEach(function (b) { b.setAttribute('aria-expanded', 'false'); });
    if (menuReturn) menuReturn.focus({ preventScroll: true });
  }
  $$('[data-menu-open]').forEach(function (b) { b.addEventListener('click', openMenu); });
  $$('[data-menu-close]').forEach(function (b) { b.addEventListener('click', closeMenu); });

  /* 2. Mega menu ("الإصدارات" on desktop) ------------------------------- */
  var megaBtn = $('[data-mega]'), mega = $('#mega'), megaTimer = null, megaPinned = false;
  function setMega(open, pin) {
    if (!mega) return;
    mega.hidden = !open; megaBtn.setAttribute('aria-expanded', String(open));
    megaPinned = open && !!pin;
  }
  if (megaBtn && mega) {
    // hovering opens it for a look; a click keeps it open, and only a second click closes it
    // (a toggle on click would shut the menu the hover had just opened)
    megaBtn.addEventListener('click', function (e) {
      e.preventDefault(); clearTimeout(megaTimer);
      if (mega.hidden) setMega(true, true);
      else if (!megaPinned) megaPinned = true;
      else setMega(false);
    });
    if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
      [megaBtn, mega].forEach(function (el) {
        el.addEventListener('mouseenter', function () {
          clearTimeout(megaTimer);
          if (mega.hidden) megaTimer = setTimeout(function () { setMega(true); }, 120);
        });
        el.addEventListener('mouseleave', function () {
          clearTimeout(megaTimer);
          if (!megaPinned) megaTimer = setTimeout(function () { setMega(false); }, 220);
        });
      });
    }
    document.addEventListener('click', function (e) {
      if (!mega.hidden && !mega.contains(e.target) && !megaBtn.contains(e.target)) setMega(false);
    });
  }

  /* 3. Filter sheet (archive, phones and tablets) ------------------------ */
  var sheet = $('#filters'), backdrop = $('.sheet-backdrop'), sheetReturn = null;
  function openSheet() {
    if (!sheet) return;
    sheetReturn = document.activeElement;
    sheet.hidden = false; if (backdrop) backdrop.hidden = false; lock(true);
    var c = $('[data-sheet-close]', sheet); if (c) c.focus({ preventScroll: true });
  }
  function closeSheet() {
    if (!sheet || sheet.hidden) return;
    sheet.hidden = true; if (backdrop) backdrop.hidden = true; lock(false);
    if (sheetReturn) sheetReturn.focus({ preventScroll: true });
  }
  $$('[data-sheet-open]').forEach(function (b) { b.addEventListener('click', openSheet); });
  $$('[data-sheet-close]').forEach(function (b) { b.addEventListener('click', closeSheet); });

  /* 4. Escape closes whatever is open ------------------------------------ */
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    closeMenu(); closeSheet();
    if (mega && !mega.hidden) { setMega(false); megaBtn.focus(); }
    explorers.forEach(function (x) { x.release(); });
  });

  /* 5. Controls ------------------------------------------------------------ */
  // Segmented controls: an active copy of the control is clipped to the chosen option, and the clip moves.
  function segSync(seg, animate) {
    var copy = seg.__copy; if (!copy) return;
    var on = $(':scope > button.is-on', seg); if (!on) return;
    var w = seg.clientWidth; if (!w) return;
    var l = on.offsetLeft, r = w - l - on.offsetWidth;
    copy.style.transition = animate && !reduced() ? '' : 'none';
    copy.style.clipPath = 'inset(0 ' + Math.max(0, r) + 'px 0 ' + Math.max(0, l) + 'px)';
    if (!animate) { copy.getBoundingClientRect(); copy.style.transition = ''; }
  }
  $$('.seg').forEach(function (seg) {
    var copy = seg.cloneNode(true);
    copy.className = 'seg__copy';
    ['role', 'aria-label', 'data-period-switch', 'data-series-switch', 'style'].forEach(function (a) { copy.removeAttribute(a); });
    copy.setAttribute('aria-hidden', 'true');
    $$('button', copy).forEach(function (b) {
      b.className = 'is-on'; b.tabIndex = -1;
      ['aria-pressed', 'data-p', 'data-s', 'id'].forEach(function (a) { b.removeAttribute(a); });
    });
    seg.appendChild(copy); seg.__copy = copy; seg.classList.add('seg--thumb');
    segSync(seg, false);
    if ('ResizeObserver' in window) new ResizeObserver(function () { segSync(seg, false); }).observe(seg);
  });
  function segPick(btn) {
    var seg = btn.parentElement;
    $$(':scope > button', seg).forEach(function (b) { var on = b === btn; b.classList.toggle('is-on', on); b.setAttribute('aria-pressed', String(on)); });
    segSync(seg, true);
  }

  // Tabs: one indicator slides to the chosen tab.
  function tabsSync(tabs, animate) {
    var ind = tabs.__ind; if (!ind) return;
    var on = $(':scope > .is-on', tabs); if (!on) { ind.style.opacity = '0'; return; }
    var w = on.offsetWidth - 28; if (w <= 0) return;
    ind.style.transition = animate && !reduced() ? '' : 'none';
    ind.style.opacity = '1';
    ind.style.transform = 'translateX(' + (on.offsetLeft + 14) + 'px) scaleX(' + (w / 100) + ')';
    if (!animate) { ind.getBoundingClientRect(); ind.style.transition = ''; }
  }
  $$('.tabs').forEach(function (tabs) {
    var ind = document.createElement('span'); ind.className = 'tabs__ind'; ind.setAttribute('aria-hidden', 'true');
    tabs.appendChild(ind); tabs.__ind = ind; tabs.classList.add('tabs--ind');
    tabsSync(tabs, false);
    if ('ResizeObserver' in window) new ResizeObserver(function () { tabsSync(tabs, false); }).observe(tabs);
  });

  // Collapsible groups: the button owns the region; closed regions are inert.
  function setCollapse(btn, open) {
    var box = document.getElementById(btn.getAttribute('aria-controls')); if (!box) return;
    btn.setAttribute('aria-expanded', String(open));
    box.setAttribute('data-open', String(open));
    if (open) box.removeAttribute('inert'); else box.setAttribute('inert', '');
  }
  $$('[data-collapse-toggle]').forEach(function (b) {
    // the menu group starts closed on the site; the canvas shows it open
    if (b.closest('#menu')) setCollapse(b, false);
    b.addEventListener('click', function () { setCollapse(b, b.getAttribute('aria-expanded') !== 'true'); });
  });

  document.addEventListener('click', function (e) {
    var t = e.target;
    var segBtn = t.closest('.seg > button');
    if (segBtn) { segPick(segBtn); return; }
    var chip = t.closest('button.chip');
    if (chip && !chip.hasAttribute('data-f-remove')) {
      var radio = chip.closest('[data-chip-radio]');
      if (radio) {
        // one choice; an "optional" group can also be left with none
        var was = chip.classList.contains('is-on');
        $$('button.chip', radio).forEach(function (c) { c.classList.remove('is-on'); c.setAttribute('aria-pressed', 'false'); });
        var now = !(was && radio.getAttribute('data-chip-radio') === 'optional');
        chip.classList.toggle('is-on', now); chip.setAttribute('aria-pressed', String(now));
      } else {
        chip.classList.toggle('is-on'); chip.setAttribute('aria-pressed', chip.classList.contains('is-on'));
      }
      chip.dispatchEvent(new CustomEvent('sj:chip', { bubbles: true }));
      return;
    }
    var chk = t.closest('label.check');
    if (chk) {
      e.preventDefault();
      chk.classList.remove('is-mixed');
      var on;
      if (chk.classList.contains('radio')) {
        // a radio row: choosing one clears the others in its group
        $$('label.check.radio', chk.parentElement).forEach(function (r) { r.classList.remove('is-on'); });
        chk.classList.add('is-on'); on = true;
      } else {
        on = chk.classList.toggle('is-on');
        var box = $('.check__box', chk); if (box) box.innerHTML = on ? CHECK : '';
      }
      chk.dispatchEvent(new CustomEvent('sj:check', { bubbles: true, detail: { on: on } }));
      return;
    }
    var tab = t.closest('.tabs > button, .tabs > a:not([target])');
    if (tab) {
      $$(':scope > button, :scope > a', tab.parentElement).forEach(function (b) { b.classList.toggle('is-on', b === tab); if (b.tagName === 'BUTTON') b.setAttribute('aria-selected', String(b === tab)); });
      tabsSync(tab.parentElement, true);
      tab.dispatchEvent(new CustomEvent('sj:tab', { bubbles: true }));
      return;
    }
    var acc = t.closest('.acc__head:not([data-collapse-toggle])');
    if (acc) {
      var open = acc.getAttribute('aria-expanded') !== 'true';
      acc.setAttribute('aria-expanded', String(open));
      return;
    }
    var pager = t.closest('.pager a');
    if (pager && pager.getAttribute('href') === '#') { e.preventDefault(); }
  });

  /* 6. Monitor: one view, many periods ------------------------------------ */
  var monitors = [];
  $$('[data-monitor]').forEach(function (mon) {
    if (!monData) return;
    var state = { p: 'week', sel: null };
    var k = function (name) { return $('[data-k="' + name + '"]', mon); };
    var order = {};  // stable tie-break: the canonical order of each period's list
    Object.keys(monData.periods).forEach(function (pk) { monData.periods[pk].types.forEach(function (t, i) { order[t[0]] = order[t[0]] === undefined ? i : Math.min(order[t[0]], i); }); });

    function setTypes(types) {
      var box = k('types'); if (!box) return;
      var mx = Math.max.apply(null, types.map(function (t) { return t[1]; })) || 1;
      var val = {}; types.forEach(function (t) { val[t[0]] = t[1]; });
      var rows = $$('.mbar', box);
      rows.forEach(function (row) {
        var n = val[row.getAttribute('data-type')] || 0;
        $('.mbar__f', row).style.transform = 'scaleX(' + (n / mx) + ')';
        swap($('.mbar__v', row), n);
      });
      var sorted = rows.slice().sort(function (a, b) {
        var d = (val[b.getAttribute('data-type')] || 0) - (val[a.getAttribute('data-type')] || 0);
        return d || order[a.getAttribute('data-type')] - order[b.getAttribute('data-type')];
      });
      var same = sorted.every(function (r, i) { return r === rows[i]; });
      if (!same) flip(rows, function () { sorted.forEach(function (r) { box.appendChild(r); }); });
    }

    function diameter(n, mx, kk) { return n ? (14 + 30 * Math.sqrt(n / mx)) * (0.8 + 0.2 * kk) : 0; }
    function setPins(p) {
      var map = $('.mon-map', mon); if (!map) return;
      var kk = parseFloat(map.style.width) / 866;
      var mx = Math.max(p.govs.q, p.govs.d, p.govs.r);
      $$('.mpin', map).forEach(function (pin) {
        var g = pin.getAttribute('data-gov'), n = p.govs[g] || 0;
        var c = $('.mpin__c', pin), l = $('.mpin__l', pin);
        var d = diameter(n, mx, kk), dmax = parseFloat(c.getAttribute('data-dmax'));
        c.style.transform = 'scale(' + (d / dmax) + ')';
        var off = d / 2 + 8;
        l.style.transform = l.getAttribute('data-side') === 'start' ? 'translate(' + off + 'px,-50%)' : 'translate(' + (-off) + 'px,-50%)';
        swap($('b', l), n);
        pin.toggleAttribute('data-empty', !n);
        pin.setAttribute('aria-label', monData.govs[g] + ': ' + n + ' انتهاكا، ' + (p.total ? Math.round(n / p.total * 100) : 0) + '% من المجموع');
      });
    }

    function barsHTML(c, h, gap) {
      var mx = Math.max.apply(null, c.values);
      var cols = '', xs = '';
      c.values.forEach(function (v, i) {
        var pct = Math.max(2, Math.round(v / mx * 100 * (h - 22) / h * 10) / 10);
        cols += '<div class="bars__col' + (i === c.hi ? ' is-hi' : '') + '"><span class="bars__v">' + v + '</span><span class="bars__b" style="height:' + pct + '%"></span></div>';
        xs += '<span class="' + (i === c.hi ? 'is-hi' : '') + '">' + c.labels[i] + '</span>';
      });
      var label = c.labels.map(function (l, i) { return l + ': ' + c.values[i]; }).join('، ');
      return '<div role="img" aria-label="' + label + '"><div class="bars" style="--bh:' + h + 'px;gap:' + gap + 'px">' + cols + '</div><div class="bars__x" style="gap:' + gap + 'px">' + xs + '</div></div>';
    }
    function setChart(c) {
      var box = k('chart'); if (!box) return;
      var h = +box.getAttribute('data-h'), gap = +box.getAttribute('data-gap');
      var next = barsHTML(c, h, gap);
      if (!canAnimate || reduced()) { box.innerHTML = next; return; }
      box.getAnimations().forEach(function (a) { a.cancel(); });
      box.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 120, easing: EASE_OUT }).onfinish = function () {
        box.innerHTML = next;
        box.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 220, easing: EASE_OUT });
      };
    }

    function render() {
      var p = monData.periods[state.p];
      swap(k('lede'), p.lede); swap(k('title'), p.title); swap(k('total'), p.total);
      var dl = k('delta'); swap(dl, p.delta); dl.classList.toggle('delta--down', p.dcls === 'delta--down');
      swap(k('src-l'), 'المصدر: ' + p.src[0] + '، قيد'); swap(k('src-n'), p.src[1]);
      swap(k('strip'), p.strip); swap(k('strip2'), p.strip); swap(k('csv'), p.csv); swap(k('chart-t'), 'الانتهاكات ' + p.chart.t);
      var gmx = Math.max(p.govs.q, p.govs.d, p.govs.r, p.govs.o) || 1;
      $$('.mon-govrow', mon).forEach(function (row) {
        var g = row.getAttribute('data-gov'), n = p.govs[g] || 0;
        $('.mon-govrow__bar i', row).style.transform = 'scaleX(' + (n / gmx) + ')';
        swap($('[data-k="n"]', row), n); swap($('[data-k="pct"]', row), (p.total ? Math.round(n / p.total * 100) : 0) + '%');
      });
      if (state.sel && !p.cross) state.sel = null;
      setTypes(state.sel ? p.cross[state.sel] : p.types);
      var chip = k('sel'), hint = k('hint');
      chip.hidden = !state.sel; if (state.sel) $('[data-k="sel-name"]', chip).textContent = monData.govs[state.sel];
      hint.textContent = p.cross ? (state.sel ? 'توزيع ' + monData.govs[state.sel] + ' بحسب النوع. اضغط على المحافظة مرة أخرى للعودة إلى المجموع.' : 'اختر محافظة على الخريطة لترى توزيعها بحسب النوع.') : 'التوزيع بحسب النوع لكل محافظة متاح في الموجزات الأسبوعية.';
      mon.toggleAttribute('data-sel', !!state.sel);
      if (state.sel) mon.setAttribute('data-focus', state.sel); else if (!mon.__hover) mon.removeAttribute('data-focus');
      $$('.mon-gov', mon).forEach(function (path) { path.setAttribute('data-lvl', p.lvl[path.getAttribute('data-gov')] || 0); });
      setPins(p);
      var out = k('out');
      if (out) {
        if (p.out) { swap(k('out-n'), p.out.n); swap(k('out-note'), p.out.note); out.hidden = false; }
        else out.hidden = true;
      }
    }

    var sw = $('[data-period-switch]', mon);
    if (sw) sw.addEventListener('click', function (e) {
      var b = e.target.closest('button[data-p]'); if (!b || b.getAttribute('data-p') === state.p) return;
      state.p = b.getAttribute('data-p');
      if (state.p !== 'week') state.sel = null;
      render(); setChart(monData.periods[state.p].chart);
    });
    var selChip = k('sel');
    if (selChip) selChip.addEventListener('click', function () { state.sel = null; render(); });

    // linked rows: hovering a governorate row lights it on the map
    $$('.mon-govrow', mon).forEach(function (row) {
      var g = row.getAttribute('data-gov'); if (g === 'o') return;
      row.addEventListener('mouseenter', function () { if (!state.sel) { mon.__hover = true; mon.setAttribute('data-focus', g); } });
      row.addEventListener('mouseleave', function () { mon.__hover = false; if (!state.sel) mon.removeAttribute('data-focus'); });
      row.addEventListener('click', function () { select(g); });
    });

    function select(g) {
      var p = monData.periods[state.p];
      if (!p.cross) return false;
      state.sel = state.sel === g ? null : g;
      render();
      return true;
    }

    monitors.push({ el: mon, state: state, select: select, period: function () { return monData.periods[state.p]; } });
  });

  /* 7. Map explorer: hover, focus or tap a governorate ------------------- */
  var explorers = [];
  $$('[data-explore-map]').forEach(function (map) {
    var fit = map.closest('.fit') || map.parentElement;
    var scope = map.closest('[data-monitor]') || fit;
    var mon = monitors.filter(function (m) { return m.el === scope; })[0];
    var tip = document.createElement('div');
    tip.className = 'mtip'; tip.setAttribute('role', 'tooltip'); tip.setAttribute('data-state', 'closed');
    tip.id = 'mtip-' + explorers.length;
    fit.appendChild(tip);
    var current = null, pinned = false;

    function period() { return mon ? mon.period() : (monData && monData.periods.week); }
    function content(g) {
      var p = period(); if (!p) return '';
      var n = p.govs[g] || 0, share = p.total ? Math.round(n / p.total * 100) : 0;
      var pinIc = '<svg class="ic ic--sm" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z"/><path d="M12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z"/></svg>';
      var h = '<div class="mtip__h"><span class="mtip__g">' + pinIc + monData.govs[g] + '</span><b>' + n + '</b></div><div class="mtip__s">' + share + '% من انتهاكات ' + p.strip + '</div>';
      if (p.cross && p.cross[g]) {
        var top = p.cross[g].filter(function (t) { return t[1]; }).sort(function (a, b) { return b[1] - a[1]; }).slice(0, 3);
        h += '<ul>' + top.map(function (t) { return '<li><span>' + t[0] + '</span><b>' + t[1] + '</b></li>'; }).join('') + '</ul>';
        if (mon) h += '<div class="mtip__n">' + (mon.state.sel === g ? 'اضغط لإلغاء التحديد.' : 'اضغط لعرض توزيعها بحسب النوع.') + '</div>';
      }
      return h;
    }
    function show(pin) {
      var g = pin.getAttribute('data-gov'); current = pin;
      tip.innerHTML = content(g);
      var fr = fit.getBoundingClientRect(), cr = $('.mpin__c', pin).getBoundingClientRect();
      var tw = tip.offsetWidth, th = tip.offsetHeight;
      var x = cr.left + cr.width / 2 - fr.left - tw / 2;
      x = Math.max(6, Math.min(fr.width - tw - 6, x));
      var y = cr.top - fr.top - th - 10;
      if (y < 6) y = cr.bottom - fr.top + 10;
      tip.style.left = x + 'px'; tip.style.top = y + 'px';
      tip.setAttribute('data-state', 'open');
      pin.setAttribute('aria-describedby', tip.id);
      if (!(mon && mon.state.sel)) scope.setAttribute('data-focus', g);
    }
    function hide() {
      if (pinned) return;
      tip.setAttribute('data-state', 'closed');
      if (current) current.removeAttribute('aria-describedby');
      current = null;
      if (!(mon && mon.state.sel)) scope.removeAttribute('data-focus');
    }
    var hoverable = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    $$('.mpin', map).forEach(function (pin) {
      if (hoverable) {
        pin.addEventListener('mouseenter', function () { if (!pinned) show(pin); });
        pin.addEventListener('mouseleave', function () { if (!pinned) hide(); });
      }
      pin.addEventListener('focus', function () { if (!pinned) show(pin); });
      pin.addEventListener('blur', function () { if (!pinned) hide(); });
      pin.addEventListener('click', function (e) {
        e.stopPropagation();
        var g = pin.getAttribute('data-gov');
        if (mon && mon.select(g)) { show(pin); return; }       // the monitor answers with the governorate's split
        if (!hoverable) { if (pinned && current === pin) { pinned = false; hide(); } else { pinned = false; show(pin); pinned = true; } }
      });
    });
    document.addEventListener('click', function (e) { if (pinned && !e.target.closest('.mpin')) { pinned = false; hide(); } });
    window.addEventListener('resize', function () { pinned = false; hide(); });
    explorers.push({ release: function () { pinned = false; hide(); } });
  });

  /* 8. Chart series: weekly ↔ monthly, same number of bars, so they morph --- */
  $$('[data-series-switch]').forEach(function (sw) {
    var box = sw.parentElement && sw.parentElement.nextElementSibling;
    if (!box || !box.hasAttribute('data-series')) box = $('[data-series]');
    if (!box) return;
    var series; try { series = JSON.parse(box.getAttribute('data-series')); } catch (e) { return; }
    sw.addEventListener('click', function (e) {
      var b = e.target.closest('button[data-s]'); if (!b) return;
      var s = series[b.getAttribute('data-s')]; if (!s) return;
      var cols = $$('.bars__col', box), xs = $$('.bars__x span', box);
      var bars = $$('.bars__b', box), vals = $$('.bars__v', box);
      var mx = Math.max.apply(null, s.values);
      var beforeH = bars.map(function (b) { return b.getBoundingClientRect().height; });
      var beforeT = vals.map(function (v) { return v.getBoundingClientRect().top; });
      cols.forEach(function (c, i) {
        var v = s.values[i]; if (v === undefined) return;
        var hh = +getComputedStyle($('.bars', box)).getPropertyValue('--bh').replace('px', '') || 96;
        bars[i].style.height = Math.max(2, Math.round(v / mx * 100 * (hh - 22) / hh * 10) / 10) + '%';
        c.classList.toggle('is-hi', i === s.hi); c.classList.toggle('is-partial', i === s.partial);
        vals[i].textContent = v;
        if (xs[i]) { swap(xs[i], s.labels[i]); xs[i].classList.toggle('is-hi', i === s.hi); }
      });
      if (!reduced() && canAnimate) {
        bars.forEach(function (b, i) {
          var nh = b.getBoundingClientRect().height; if (!nh) return;
          b.animate([{ transform: 'scaleY(' + (beforeH[i] / nh) + ')' }, { transform: 'none' }], { duration: 320, easing: EASE_IN_OUT });
        });
        vals.forEach(function (v, i) {
          var dy = beforeT[i] - v.getBoundingClientRect().top; if (Math.abs(dy) < 1) return;
          v.animate([{ transform: 'translateY(' + dy + 'px)' }, { transform: 'none' }], { duration: 320, easing: EASE_IN_OUT });
        });
      }
      var img = $('[role="img"]', box); if (img) img.setAttribute('aria-label', s.labels.map(function (l, i) { return l + ': ' + s.values[i]; }).join('، '));
    });
  });

  /* 9. Report builder: the summary answers every change ------------------ */
  $$('[data-b-summary]').forEach(function (sum) {
    var panel = sum.closest('.builder-panel') || document;
    if (!monData) return;
    var cross = monData.periods.week.cross;
    function update() {
      var govs = $$('[data-b-gov].is-on', panel).map(function (l) { return l.getAttribute('data-b-gov'); });
      var types = $$('[data-b-type].is-on', panel).map(function (l) { return l.getAttribute('data-b-type'); });
      var n = 0, withData = 0;
      ['q', 'd', 'r'].forEach(function (g) {
        if (govs.indexOf(g) < 0) return;
        var s = 0; (cross[g] || []).forEach(function (t) { if (types.indexOf(t[0]) >= 0) s += t[1]; });
        n += s; if (s) withData += 1;
      });
      var nEl = $('[data-b-n]', sum), gEl = $('[data-b-g]', sum);
      swap(nEl, n ? plural(n, 'انتهاكا واحدا', 'انتهاكين', 'انتهاكات', 'انتهاكا') : 'صفر انتهاكات');
      swap(gEl, withData ? plural(withData, 'محافظة واحدة', 'محافظتين', 'محافظات', 'محافظة') : 'أي محافظة');
    }
    panel.addEventListener('sj:check', update);
  });

  /* 10. Lists filter in place --------------------------------------------- */
  function typeOf(entry) {
    var t = $('.entry__type .tag, .tag', entry); if (!t) return '';
    var m = t.className.match(/tag--([a-z]+)/); return m ? m[1] : '';
  }
  function filterList(list, keep) {
    var items = $$('.entry', list), shown = 0;
    items.forEach(function (it) {
      var on = keep(typeOf(it));
      if (on) shown += 1;
      if (on && it.hidden) {
        it.hidden = false;
        if (canAnimate && !reduced()) it.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 200, easing: EASE_OUT });
      } else if (!on && !it.hidden) {
        it.hidden = true;
      }
    });
    var empty = $('.list-empty', list);
    if (!shown && !empty) { empty = document.createElement('p'); empty.className = 'list-empty'; empty.textContent = 'لا مواد من هذا النوع هنا بعد.'; list.appendChild(empty); }
    if (empty) empty.hidden = !!shown;
  }
  document.addEventListener('sj:tab', function (e) {
    var b = e.target; var f = b.getAttribute && b.getAttribute('data-filter'); if (!f) return;
    var list = $('main .register'); if (!list) return;
    filterList(list, function (t) { return f === 'all' || t === f; });
  });
  document.addEventListener('sj:check', function (e) {
    var l = e.target; if (!l.hasAttribute || !l.hasAttribute('data-filter-type')) return;
    var on = $$('[data-filter-type].is-on').map(function (x) { return x.getAttribute('data-filter-type'); });
    var list = $('main .register'); if (!list) return;
    filterList(list, function (t) { return !on.length || on.indexOf(t) >= 0; });
  });

  /* 11. Fixed-size map widgets scale to their column --------------------- */
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

  /* 12. Copy: citation text and page link -------------------------------- */
  function copy(text, msg, btn, label) {
    var ok = function () { toast(msg); if (btn) confirmOn(btn, label || 'تم النسخ'); };
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(text).then(ok, function () { toast('تعذر النسخ'); });
    else {
      var ta = document.createElement('textarea'); ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); ok(); } catch (err) { toast('تعذر النسخ'); }
      ta.remove();
    }
  }
  // A button that did its job says so for a moment: its icon becomes a check, its label the result.
  function confirmOn(btn, label) {
    if (btn.__confirm) return;
    var span = $(':scope > span', btn), icon = $(':scope > svg', btn);
    var oldLabel = span ? span.innerHTML : '', oldIcon = icon ? icon.cloneNode(true) : null;
    var check = null;
    if (icon) {
      var wrap = document.createElement('span'); wrap.innerHTML = CHECK;
      check = wrap.firstChild; check.setAttribute('class', icon.getAttribute('class'));
      icon.replaceWith(check);
    }
    if (span && label) span.textContent = label;
    btn.classList.add('is-done');
    if (canAnimate && !reduced()) {
      if (check) check.animate([{ opacity: 0, transform: 'scale(.6)' }, { opacity: 1, transform: 'none' }], { duration: 200, easing: EASE_OUT });
      if (span) span.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 160, easing: EASE_OUT });
    }
    btn.__confirm = setTimeout(function () {
      if (check && oldIcon) check.replaceWith(oldIcon);
      if (span) span.innerHTML = oldLabel;
      btn.classList.remove('is-done'); btn.__confirm = null;
    }, 1800);
  }
  $$('.share__copy').forEach(function (b) { b.addEventListener('click', function () { copy(location.href, 'تم نسخ رابط المادة', b, 'تم نسخ الرابط'); }); });

  /* 13. Forms: search goes to the results page; the rest confirm in place */
  $$('form').forEach(function (f) {
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      if (f.getAttribute('role') === 'search' || f.closest('[role="search"]')) {
        if (f.hasAttribute('data-live-search')) return;  // it answers as you type (modules 22 and 24)
        var q = $('input', f); location.href = 'search.html' + (q && q.value ? '?q=' + encodeURIComponent(q.value) : '');
        return;
      }
      if (f.hasAttribute('data-validate')) {
        var first = null;
        $$('[data-req]', f).forEach(function (fld) {
          var inp = $('input, textarea', fld), ok = fieldOk(inp), err = $('.field__error', fld);
          inp.classList.toggle('is-error', !ok); inp.setAttribute('aria-invalid', String(!ok));
          if (err) err.hidden = ok;
          if (!ok && !first) first = inp;
        });
        if (first) { first.focus(); return; }
        var doneBox = f.parentElement && $('[data-form-done]', f.parentElement);
        if (doneBox) { formDone(f, doneBox); return; }
        toast('وصلت رسالتك. نرد خلال يومي عمل.');
        f.reset();
        return;
      }
      var mail = $('input[type="email"]', f);
      if (mail && !mail.value.trim()) { mail.focus(); toast('اكتب بريدك الإلكتروني أولا'); return; }
      if (f.closest('.newsletter, .footer__nl')) {
        var ok = document.createElement('p'); ok.className = 'nl-done'; ok.setAttribute('role', 'status');
        ok.textContent = 'تم الاشتراك. تصلك النشرة صباح كل أحد.';
        f.replaceWith(ok); return;
      }
      toast('وصلت رسالتك. نرد خلال يومي عمل.');
      f.reset();
    });
  });
  function fieldOk(inp) {
    var v = inp.value.trim();
    return v.length > 0 && (inp.type !== 'email' || /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v));
  }
  // an error clears as soon as the field is right; it is not re-judged while the reader is still typing
  $$('form[data-validate]').forEach(function (f) {
    f.addEventListener('input', function (e) {
      var inp = e.target, fld = inp.closest && inp.closest('[data-req]');
      if (!fld || !inp.classList.contains('is-error') || !fieldOk(inp)) return;
      inp.classList.remove('is-error'); inp.setAttribute('aria-invalid', 'false');
      var err = $('.field__error', fld); if (err) err.hidden = true;
    });
  });
  var q = new URLSearchParams(location.search).get('q');
  if (q) $$('input[type="search"], main input.input').slice(0, 1).forEach(function (i) { i.value = q; });

  /* 14. Article contents follow the reader ------------------------------- */
  var tocLinks = $$('.toc a[href^="#"]');
  if (tocLinks.length && 'IntersectionObserver' in window) {
    var heads = tocLinks.map(function (a) { return document.getElementById(a.getAttribute('href').slice(1)); }).filter(Boolean);
    var tio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        tocLinks.forEach(function (a) { a.classList.toggle('is-on', a.getAttribute('href') === '#' + en.target.id); });
      });
    }, { rootMargin: '-20% 0px -70% 0px' });
    heads.forEach(function (h) { tio.observe(h); });
  }

  /* 15. Reading bar: CSS scroll timelines where supported, a frame loop elsewhere */
  var readbars = $$('.readbar');
  if (readbars.length && !(window.CSS && CSS.supports && CSS.supports('animation-timeline: scroll()'))) {
    var ticking = false;
    var paint = function () {
      ticking = false;
      var max = document.documentElement.scrollHeight - innerHeight;
      var p = max > 0 ? Math.min(1, scrollY / max) : 0;
      readbars.forEach(function (b) { b.style.transform = 'scaleX(' + p + ')'; });
    };
    addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(paint); } }, { passive: true });
    paint();
  }

  /* 16. Images arrive with a fade, never a pop ----------------------------- */
  $$('.sj img').forEach(function (img) {
    if (img.complete && img.naturalWidth) return;
    img.classList.add('is-pending');
    var done = function () { img.classList.remove('is-pending'); };
    img.addEventListener('load', done, { once: true });
    img.addEventListener('error', done, { once: true });
  });

  /* 17. First view of a landing page: the ledger rule draws, السين rises, the monitor lays its data down */
  window.__sjReady = true;
  if (html.classList.contains('first-view') && !html.classList.contains('first-done')) {
    var heads2 = $$('.sec-head');
    if ('IntersectionObserver' in window) {
      var hio = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('is-in'); hio.unobserve(en.target); } });
      }, { rootMargin: '0px 0px -12% 0px', threshold: 0.2 });
      heads2.forEach(function (h) { hio.observe(h); });
    } else heads2.forEach(function (h) { h.classList.add('is-in'); });

    $$('[data-monitor]').forEach(function (mon) {
      if (!mon.offsetParent) { mon.classList.add('mon-in'); return; }
      var pins = $$('.mpin', mon), fills = $$('.mon-govrow__bar i, .mbar__f', mon), paths = $$('.mon-gov', mon);
      var lv = paths.map(function (p) { return p.getAttribute('data-lvl'); });
      paths.forEach(function (p) { p.setAttribute('data-lvl', '0'); });
      mon.classList.add('mon-in');
      requestAnimationFrame(function () { setTimeout(function () { paths.forEach(function (p, i) { p.setAttribute('data-lvl', lv[i]); }); }, 60); });
      if (!canAnimate) return;
      pins.forEach(function (pin, i) {
        var c = $('.mpin__c', pin), l = $('.mpin__l', pin), end = c.style.transform;
        var s = parseFloat((end.match(/scale\(([\d.]+)\)/) || [0, 1])[1]);
        c.animate([{ transform: 'scale(' + (s * 0.6) + ')', opacity: 0 }, { transform: end, opacity: 1 }], { duration: 420, delay: 120 + i * 70, easing: EASE_OUT, fill: 'backwards' });
        l.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 260, delay: 260 + i * 70, easing: EASE_OUT, fill: 'backwards' });
      });
      fills.forEach(function (f, i) {
        var end = f.style.transform;
        var s = parseFloat((end.match(/scaleX\(([\d.]+)\)/) || [0, 1])[1]);
        f.animate([{ transform: 'scaleX(' + (s * 0.04) + ')' }, { transform: end }], { duration: 480, delay: 80 + i * 35, easing: EASE_OUT, fill: 'backwards' });
      });
    });
  } else {
    $$('[data-monitor]').forEach(function (mon) { mon.classList.add('mon-in'); });
  }

  /* 19. Periodic issues: the shelf of monthly bars is a tablist; the chosen issue opens underneath */
  $$('[data-issues]').forEach(function (box) {
    var tabs = $$('[role="tab"]', box);
    function select(tab, focus) {
      tabs.forEach(function (t) {
        var on = t === tab, panel = document.getElementById(t.getAttribute('aria-controls'));
        t.setAttribute('aria-selected', on ? 'true' : 'false');
        t.tabIndex = on ? 0 : -1;
        if (panel) panel.hidden = !on;
      });
      if (focus) tab.focus();
    }
    box.addEventListener('pointerdown', function () { box.classList.add('is-used'); }, { once: true });
    box.addEventListener('keydown', function () { box.classList.add('is-used'); }, { once: true });
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { select(t); });
      t.addEventListener('keydown', function (e) {
        var rtl = getComputedStyle(box).direction === 'rtl', n = null;
        if (e.key === 'ArrowLeft') n = rtl ? i + 1 : i - 1;
        else if (e.key === 'ArrowRight') n = rtl ? i - 1 : i + 1;
        else if (e.key === 'Home') n = 0;
        else if (e.key === 'End') n = tabs.length - 1;
        if (n === null) return;
        e.preventDefault();
        select(tabs[(n + tabs.length) % tabs.length], true);
      });
    });
  });

  /* 20. Sidebars follow the reader beside a longer column (desktop). A sidebar taller than the window
     scrolls with the page until its end is in view, then holds, so nothing in it is ever out of reach. */
  var stickies = $$('.side-sticky');
  if (stickies.length) {
    var siteHead = $('.site-head.bp-d');
    var placeSticky = function () {
      var top = (siteHead ? siteHead.getBoundingClientRect().height : 0) + 24;
      stickies.forEach(function (el) {
        el.style.setProperty('--stick-top', Math.round(Math.min(top, window.innerHeight - el.offsetHeight - 24)) + 'px');
      });
    };
    placeSticky();
    window.addEventListener('resize', placeSticky);
    window.addEventListener('load', placeSticky);
    if ('ResizeObserver' in window) { var stickRO = new ResizeObserver(placeSticky); stickies.forEach(function (el) { stickRO.observe(el); }); }
  }


  /* 21. Page actions: share, cite, print, copy a link, CSV, PDF, follow ---- */
  var TODAY = '2026-09-24';  // the day the prototype's content stops
  var TYPE_NAMES = { monitor: 'رصد', monthly: 'تقرير شهري', briefing: 'إحاطة', thematic: 'تقرير موضوعي', analysis: 'مقال تحليلي', translation: 'ترجمة' };
  var pageTitle = (document.title || '').replace(/\s*\|\s*سجل\s*$/, '');
  var SHARE = {
    x: function (u, t) { return 'https://twitter.com/intent/tweet?text=' + encodeURIComponent(t) + '&url=' + encodeURIComponent(u); },
    facebook: function (u) { return 'https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(u); },
    telegram: function (u, t) { return 'https://t.me/share/url?url=' + encodeURIComponent(u) + '&text=' + encodeURIComponent(t); },
    whatsapp: function (u, t) { return 'https://wa.me/?text=' + encodeURIComponent(t + ' ' + u); },
    mail: function (u, t) { return 'mailto:?subject=' + encodeURIComponent(t) + '&body=' + encodeURIComponent(u); }
  };
  $$('[data-share]').forEach(function (a) {
    var k = a.getAttribute('data-share'); if (!SHARE[k]) return;
    a.href = SHARE[k](location.href, pageTitle);
    if (k !== 'mail') { a.target = '_blank'; a.rel = 'noopener'; }
  });

  function csvCell(c) { c = String(c == null ? '' : c); return /[",\r\n]/.test(c) ? '"' + c.replace(/"/g, '""') + '"' : c; }
  function saveCsv(name, rows) {
    // a byte-order mark so spreadsheet apps read the Arabic as UTF-8
    var text = '﻿' + rows.map(function (r) { return r.map(csvCell).join(','); }).join('\r\n');
    var url = URL.createObjectURL(new Blob([text], { type: 'text/csv;charset=utf-8' }));
    var a = document.createElement('a'); a.href = url; a.download = name; a.hidden = true;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
  }
  function tableRows(table) {
    return $$('tr', table).map(function (tr) { return $$('th, td', tr).map(function (c) { return c.textContent.trim(); }); });
  }
  function periodRows(k) {
    var p = monData && monData.periods[k]; if (!p) return null;
    var rows = [['الفترة', p.title], ['المجموع', p.total], [], ['المحافظة', 'عدد الانتهاكات']];
    Object.keys(monData.govs).forEach(function (g) { if (p.govs[g] != null) rows.push([monData.govs[g], p.govs[g]]); });
    rows.push([], ['نوع الانتهاك', 'عدد الانتهاكات']);
    p.types.forEach(function (t) { rows.push([t[0], t[1]]); });
    rows.push([], ['المصدر', 'مركز سجل للدراسات والتوثيق، sijil-sy.org']);
    return rows;
  }
  function citeText(from) {
    var box = (from && from.closest('.cite')) || $('main .cite');
    var p = box && $('p', box);
    return p ? p.innerText.trim() : location.href;
  }
  var PDF_NOTE = 'ملفات PDF تربط عند نشر الموقع، هذا نموذج أولي للواجهة.';

  document.addEventListener('click', function (e) {
    var el = e.target.closest('[data-act]'); if (!el) return;
    var act = el.getAttribute('data-act');
    if (act === 'cite') { e.preventDefault(); copy(citeText(el), 'تم نسخ نص الاستشهاد', el); }
    else if (act === 'print') { e.preventDefault(); window.print(); }
    else if (act === 'share') {
      e.preventDefault();
      if (navigator.share) navigator.share({ title: pageTitle, url: location.href }).catch(function () {});
      else copy(location.href, 'تم نسخ رابط المادة', el, 'تم نسخ الرابط');
    }
    else if (act === 'copy-link') { e.preventDefault(); copy(el.getAttribute('data-url') || location.href, 'تم نسخ رابط التقرير', el); }
    else if (act === 'pdf') { e.preventDefault(); toast(PDF_NOTE); }
    else if (act === 'csv-table') {
      e.preventDefault();
      var t = $('table', el.closest('main') || document); if (!t) return;
      saveCsv(el.getAttribute('data-file') || 'sijil.csv', tableRows(t));
      confirmOn(el, 'تم التنزيل');
    }
    else if (act === 'csv-period') {
      e.preventDefault();
      var seg = $('[data-period-switch] > button.is-on'), k = seg ? seg.getAttribute('data-p') : 'week';
      var rows = periodRows(k); if (!rows) return;
      saveCsv('sijil-' + k + '.csv', rows);
      confirmOn(el, 'تم التنزيل');
    }
    else if (act === 'follow') {
      var on = el.getAttribute('aria-pressed') !== 'true';
      el.setAttribute('aria-pressed', String(on));
      var h1 = $('main h1'), name = h1 ? h1.textContent.trim() : '';
      var span = $(':scope > span', el), icon = $(':scope > svg', el);
      if (!el.__off) el.__off = { label: span ? span.textContent : '', icon: icon ? icon.outerHTML : '' };
      if (span) span.textContent = on ? 'تتابع هذا الوسم' : el.__off.label;
      if (icon) { var w = document.createElement('span'); w.innerHTML = on ? CHECK : el.__off.icon; var n = w.firstChild; n.setAttribute('class', icon.getAttribute('class')); icon.replaceWith(n); icon = n; }
      if (icon && canAnimate && !reduced()) icon.animate([{ opacity: 0, transform: 'scale(.6)' }, { opacity: 1, transform: 'none' }], { duration: 200, easing: EASE_OUT });
      toast(on ? 'ستصلك المواد الجديدة بوسم «' + name + '» في النشرة الأسبوعية.' : 'تم إلغاء متابعة الوسم.');
    }
  });

  // Links that still point nowhere: stay on the page and say why, instead of jumping to the top.
  document.addEventListener('click', function (e) {
    if (e.defaultPrevented) return;
    var a = e.target.closest('a[href="#"]'); if (!a) return;
    e.preventDefault();
    if (/PDF/.test(a.textContent)) toast(PDF_NOTE);
    else if (a.closest('.footer, .share, .footer__social')) toast('يفعل هذا الرابط عند نشر الموقع.');
  });

  // "More" buttons open the region under them in place.
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-more]'); if (!b) return;
    var box = document.getElementById(b.getAttribute('data-more')); if (!box) return;
    var open = box.getAttribute('data-open') !== 'true';
    box.setAttribute('data-open', String(open));
    if (open) box.removeAttribute('inert'); else box.setAttribute('inert', '');
    b.setAttribute('aria-expanded', String(open));
    var span = $(':scope > span', b);
    if (span) { if (!b.__label) b.__label = span.textContent; span.textContent = open && b.getAttribute('data-label-open') ? b.getAttribute('data-label-open') : b.__label; }
    if (open && b.hasAttribute('data-once')) {
      b.hidden = true;
      var note = $('[data-more-note="' + box.id + '"]'); if (note) note.textContent = 'عرض كل مواد هذه الصفحة';
      var first = $('a[href]', box); if (first) first.focus({ preventScroll: true });
    }
    box.dispatchEvent(new CustomEvent('sj:more', { bubbles: true }));
  });

  /* 22. Archive: filters, the chips they leave, sort, view, jump ---------- */
  var normAr = function (s) { return String(s).replace(/[-]/g, '').replace(/[أإآ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه').toLowerCase(); };
  var TYPE_GROUP = {
    daily: function (it) { return it.t === 'monitor' && /يومي/.test(it.sub); },
    weekly: function (it) { return it.t === 'monitor' && /أسبوعي/.test(it.sub); },
    monitor: function (it) { return it.t === 'monitor'; },
    periodic: function (it) { return it.t === 'monthly' || it.t === 'briefing'; },
    pubs: function (it) { return it.t === 'thematic' || it.t === 'analysis' || it.t === 'translation'; }
  };
  function daysBefore(iso, n) { var d = new Date(iso + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() - n + 1); return d.toISOString().slice(0, 10); }
  var DATE_TEST = {
    '7': function (d) { return d >= daysBefore(TODAY, 7) && d <= TODAY; },
    '30': function (d) { return d >= daysBefore(TODAY, 30) && d <= TODAY; },
    '2026': function (d) { return d.slice(0, 4) === '2026'; },
    '2025': function (d) { return d.slice(0, 4) === '2025'; }
  };
  var DATE_LABEL = { '7': 'آخر 7 أيام', '30': 'آخر 30 يوما', '2026': 'سنة 2026', '2025': 'سنة 2025' };

  $$('[data-archive]').forEach(function (root) {
    var id = root.getAttribute('data-archive');
    var ctl = $('[data-f-controls="' + id + '"]');
    var list = $('[data-f-list]', root);
    if (!ctl || !list) return;
    var qIn = $('[data-live-search="' + id + '"] [data-f-q]');
    var chipsBox = $('[data-f-active]', root);
    var badge = $('[data-sheet-open] span:last-child');
    var applyBtn = $('[data-f-apply]');
    var items = $$('.entry', list).map(function (el) {
      return { el: el, t: el.getAttribute('data-type') || '', sub: el.getAttribute('data-sub') || '', d: el.getAttribute('data-date') || '', text: normAr(el.textContent) };
    });
    var heads = $$('.register__month', list);
    var order0 = $$(':scope > .register__month, :scope > .entry', list);

    function state() {
      return {
        types: $$('[data-f-type].is-on', ctl).map(function (x) { return x.getAttribute('data-f-type'); }),
        date: ($('[data-f-date].is-on', ctl) || { getAttribute: function () { return null; } }).getAttribute('data-f-date'),
        tags: $$('[data-f-tag].is-on', ctl).map(function (x) { return x.getAttribute('data-f-tag'); }),
        q: qIn ? qIn.value.trim() : ''
      };
    }
    function match(it, st) {
      if (st.types.length && !st.types.some(function (k) { return TYPE_GROUP[k] && TYPE_GROUP[k](it); })) return false;
      if (st.date && DATE_TEST[st.date] && !DATE_TEST[st.date](it.d)) return false;
      if (st.tags.length && !st.tags.some(function (tg) { return it.text.indexOf(normAr(tg)) >= 0; })) return false;
      if (st.q) { var words = normAr(st.q).split(/\s+/).filter(Boolean); if (!words.every(function (w) { return it.text.indexOf(w) >= 0; })) return false; }
      return true;
    }
    function syncParent() {
      $$('[data-f-parent]', ctl).forEach(function (p) {
        var kids = $$('[data-f-of="' + p.getAttribute('data-f-parent') + '"]', ctl), on = kids.filter(function (k) { return k.classList.contains('is-on'); }).length;
        p.classList.toggle('is-on', on === kids.length);
        p.classList.toggle('is-mixed', on > 0 && on < kids.length);
        var box = $('.check__box', p); if (box) box.innerHTML = on === kids.length ? CHECK : '';
      });
    }
    function setCheck(label, on) {
      label.classList.toggle('is-on', on);
      var box = $('.check__box', label); if (box) box.innerHTML = on ? CHECK : '';
    }
    function chips(st) {
      if (!chipsBox) return;
      var out = [];
      st.types.forEach(function (k) { var l = $('[data-f-type="' + k + '"]', ctl); if (l) out.push(['type:' + k, l.textContent.trim()]); });
      if (st.date) out.push(['date:' + st.date, DATE_LABEL[st.date] || st.date]);
      st.tags.forEach(function (t) { out.push(['tag:' + t, t]); });
      if (st.q) out.push(['q', '«' + st.q + '»']);
      chipsBox.innerHTML = out.map(function (c) {
        return '<button class="chip is-on" type="button" data-f-remove="' + c[0] + '" aria-label="أزل مرشح ' + c[1] + '">' + c[1] + '<svg class="ic ic--sm" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></button>';
      }).join('');
      if (badge) badge.textContent = String(out.length);
    }
    function unfold() {
      $$('.collapse[data-open="false"]', list).forEach(function (c) {
        c.setAttribute('data-open', 'true'); c.removeAttribute('inert');
        var mb = $('[data-more="' + c.id + '"]'); if (mb) { mb.setAttribute('aria-expanded', 'true'); if (mb.hasAttribute('data-once')) mb.hidden = true; }
        var note = $('[data-more-note="' + c.id + '"]'); if (note) note.textContent = 'عرض كل مواد هذه الصفحة';
      });
    }
    function apply(user) {
      if (user === true) unfold();
      var st = state(), shown = 0;
      items.forEach(function (it) {
        var on = match(it, st);
        if (on) shown += 1;
        if (on && it.el.hidden) { it.el.hidden = false; if (canAnimate && !reduced()) it.el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 200, easing: EASE_OUT }); }
        else if (!on) it.el.hidden = true;
      });
      // each month says how many of its entries are showing, and steps aside when none are
      heads.forEach(function (h) {
        var n = 0;
        for (var el = h.nextElementSibling; el && !el.classList.contains('register__month'); el = el.nextElementSibling) {
          if (el.classList.contains('entry') && !el.hidden) n += 1;
          if (el.classList.contains('collapse')) n += $$('.entry', el).filter(function (x) { return !x.hidden; }).length;
        }
        h.hidden = n === 0;
        var sp = $('span', h); if (sp) sp.textContent = plural(n, 'مادة واحدة معروضة', 'مادتان معروضتان', 'مواد معروضة', 'مادة معروضة');
      });
      var empty = $('.list-empty', list);
      if (!shown && !empty) {
        empty = document.createElement('div'); empty.className = 'list-empty';
        empty.innerHTML = '<p>لا مواد تطابق هذه المرشحات في هذه الصفحة.</p><button class="btn btn--secondary btn--sm" type="button" data-f-clear>امسح المرشحات</button>';
        list.appendChild(empty);
      }
      if (empty) empty.hidden = !!shown;
      chips(st);
      if (applyBtn) { var sp2 = $(':scope > span', applyBtn) || applyBtn; sp2.textContent = shown ? 'اعرض ' + plural(shown, 'نتيجة واحدة', 'نتيجتين', 'نتائج', 'نتيجة') : 'لا نتائج'; }
    }
    function clearAll() {
      $$('[data-f-type], [data-f-tag]', ctl).forEach(function (l) { setCheck(l, false); });
      $$('[data-f-date]', ctl).forEach(function (c) { c.classList.remove('is-on'); c.setAttribute('aria-pressed', 'false'); });
      if (qIn) qIn.value = '';
      syncParent(); apply(true);
    }

    ctl.addEventListener('sj:check', function (e) {
      var l = e.target;
      if (l.hasAttribute('data-f-parent')) {
        var on = l.classList.contains('is-on');
        $$('[data-f-of="' + l.getAttribute('data-f-parent') + '"]', ctl).forEach(function (k) { setCheck(k, on); });
      }
      syncParent(); apply(true);
    });
    ctl.addEventListener('sj:chip', function () { apply(true); });
    if (qIn) qIn.addEventListener('input', function () { apply(true); });
    document.addEventListener('click', function (e) {
      var clr = e.target.closest('[data-f-clear]'), sheetOf = clr && clr.closest('.sheet');
      if (clr && (ctl.contains(clr) || root.contains(clr) || (sheetOf && sheetOf.contains(ctl)))) { clearAll(); return; }
      var rm = e.target.closest('[data-f-remove]'); if (!rm || !chipsBox || !chipsBox.contains(rm)) return;
      var key = rm.getAttribute('data-f-remove'), kind = key.split(':')[0], val = key.slice(kind.length + 1);
      if (kind === 'type') { var l = $('[data-f-type="' + val + '"]', ctl); if (l) setCheck(l, false); }
      else if (kind === 'tag') { var tg = $('[data-f-tag="' + val + '"]', ctl); if (tg) setCheck(tg, false); }
      else if (kind === 'date') { var c = $('[data-f-date="' + val + '"]', ctl); if (c) { c.classList.remove('is-on'); c.setAttribute('aria-pressed', 'false'); } }
      else if (kind === 'q' && qIn) qIn.value = '';
      syncParent(); apply(true);
      if (chipsBox.firstElementChild) chipsBox.firstElementChild.focus({ preventScroll: true });
    });
    list.addEventListener('sj:more', apply);

    // sort: the same entries, in the other direction, sliding to their new places
    var sortSel = $('[data-f-sort]', root);
    if (sortSel) sortSel.addEventListener('change', function () {
      var groups = [], cur = null;
      order0.forEach(function (el) { if (el.classList.contains('register__month')) { cur = { head: el, rows: [] }; groups.push(cur); } else if (cur) cur.rows.push(el); });
      if (sortSel.value === 'old') { groups.reverse(); groups.forEach(function (g) { g.rows.reverse(); }); }
      var moving = order0.filter(function (el) { return !el.hidden; });
      flip(moving, function () {
        var tail = $('.list-empty', list);
        groups.forEach(function (g) { list.insertBefore(g.head, tail); g.rows.forEach(function (r) { list.insertBefore(r, tail); }); });
      }, 320);
    });

    // view: the register as rows, or as a grid of cards
    var viewSeg = $('[data-f-view]', root);
    if (viewSeg) viewSeg.addEventListener('click', function (e) {
      var b = e.target.closest('button[data-v]'); if (!b) return;
      var grid = b.getAttribute('data-v') === 'grid';
      if (list.classList.contains('register--grid') === grid) return;
      list.classList.toggle('register--grid', grid);
      if (canAnimate && !reduced()) list.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 200, easing: EASE_OUT });
    });

    // jump to a month
    var jump = $('[data-f-jump]');
    if (jump && id === 'archive-d') jump.addEventListener('change', function () {
      var h = $('[data-month="' + jump.value + '"]', list);
      if (h && !h.hidden) h.scrollIntoView({ block: 'start' });
      else toast('هذا الشهر في صفحة أخرى من الأرشيف.');
    });

    syncParent(); apply();
  });

  /* 23. Periodic reports: by subtype, and as one chronological list ------- */
  var subBox = $('[data-sub-filter]');
  var issuesView = $('[data-issues-view]'), issuesList = $('[data-issues-list]');
  var DAY_MONTH = ['', 'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
  function subNow() { var c = subBox && $('button.chip.is-on', subBox); return c ? c.getAttribute('data-sub') : 'all'; }
  function renderIssuesList() {
    if (!issuesList) return;
    var k = subNow();
    var parts = [];
    $$('[data-issue]').forEach(function (card) {
      $$('li[data-sub]', card).forEach(function (li) {
        if (k !== 'all' && li.getAttribute('data-sub') !== k) return;
        var a = $('a', li), tg = $('.tag', a);
        parts.push({ d: li.getAttribute('data-date'), t: li.getAttribute('data-t'), sub: tg ? tg.textContent.trim() : '', title: a.textContent.replace(tg ? tg.textContent : '', '').trim(), href: a.getAttribute('href'), issue: card.getAttribute('data-issue') });
      });
    });
    parts.sort(function (a, b) { return a.d < b.d ? 1 : -1; });
    var html = '', month = '';
    parts.forEach(function (p) {
      var m = p.d.slice(0, 7);
      if (m !== month) {
        month = m;
        var n = parts.filter(function (x) { return x.d.slice(0, 7) === m; }).length;
        html += '<div class="register__month">' + DAY_MONTH[+m.slice(5)] + ' ' + m.slice(0, 4) + ' <span>' + plural(n, 'مادة واحدة', 'مادتان', 'مواد', 'مادة') + '</span></div>';
      }
      var day = +p.d.slice(8) + ' ' + DAY_MONTH[+p.d.slice(5, 7)] + ' ' + p.d.slice(0, 4);
      html += '<article class="entry entry--compact"><div class="entry__date">' + day + '</div><div class="entry__type"><span class="tag tag--' + p.t + '">' + (TYPE_NAMES[p.t] || '') + '</span><span class="tag__sub">' + p.sub + '</span></div>' +
        '<div><a class="entry__title" href="' + p.href + '">' + p.title + '</a><div class="entry__by"><div class="meta"><div class="meta__row"><span>عدد ' + p.issue + '</span></div></div></div></div></article>';
    });
    issuesList.innerHTML = html || '<p class="list-empty">لا مواد من هذا النوع في أعداد هذه السنة.</p>';
  }
  if (subBox) document.addEventListener('sj:chip', function (e) {
    if (!subBox.contains(e.target)) return;
    var k = subNow();
    $$('[data-issue]').forEach(function (card) {
      var shown = 0;
      $$('li[data-sub]', card).forEach(function (li) {
        var on = k === 'all' || li.getAttribute('data-sub') === k;
        if (on && li.hidden && canAnimate && !reduced()) li.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 200, easing: EASE_OUT });
        li.hidden = !on; if (on) shown += 1;
      });
      var note = $('.issue-empty', card), ul = $('ul', card);
      if (!shown && !note && ul) { note = document.createElement('p'); note.className = 'issue-empty'; note.textContent = 'لا مواد من هذا النوع في هذا العدد.'; ul.after(note); }
      if (note) note.hidden = !!shown;
    });
    renderIssuesList();
  });
  var viewSwitch = $('[data-view-switch]');
  if (viewSwitch && issuesView && issuesList) viewSwitch.addEventListener('click', function (e) {
    var b = e.target.closest('button[data-v]'); if (!b) return;
    var list = b.getAttribute('data-v') === 'list';
    if (list) renderIssuesList();
    var show = list ? issuesList : issuesView, hide = list ? issuesView : issuesList;
    if (!show.hidden) return;
    hide.hidden = true; show.hidden = false;
    if (canAnimate && !reduced()) show.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 200, easing: EASE_OUT });
  });

  /* 24. Search answers as you type ------------------------------------------ */
  var sIndex = (function () { var s = $('[data-search-index]'); try { return s ? JSON.parse(s.textContent) : null; } catch (e) { return null; } })();
  var sForm = $('form[data-live-search="site"]');
  if (sIndex && sForm) (function () {
    var input = $('input', sForm), list = $('[data-s-list]'), countEl = $('[data-s-count]'), facetsBox = $('[data-s-facets]');
    var dossier = $('[data-s-dossier]'), tabs = $$('[data-s-tab]');
    var h1 = $('main h1.sr');
    var briefsBox = document.createElement('div'); briefsBox.className = 'register'; briefsBox.hidden = true; briefsBox.style.marginTop = '20px';
    var tagsBox = document.createElement('div'); tagsBox.className = 'chips s-tags'; tagsBox.hidden = true;
    list.after(briefsBox, tagsBox);
    var items = sIndex.items.map(function (it) { it.nt = normAr(it.title); it.nx = normAr(it.ex + ' ' + it.sub + ' ' + it.tn); return it; });
    var esc = function (s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); };
    function mark(text, words) {
      if (!words.length) return esc(text);
      var n = normAr(text), hits = [];
      words.forEach(function (w) { var i = 0; while ((i = n.indexOf(w, i)) >= 0) { hits.push([i, i + w.length]); i += w.length; } });
      if (!hits.length) return esc(text);
      hits.sort(function (a, b) { return a[0] - b[0]; });
      var out = '', at = 0;
      hits.forEach(function (h) { if (h[0] < at) return; out += esc(text.slice(at, h[0])) + '<mark>' + esc(text.slice(h[0], h[1])) + '</mark>'; at = h[1]; });
      return out + esc(text.slice(at));
    }
    function sortMode() { var r = $('[data-s-sort].is-on'); return r ? r.getAttribute('data-s-sort') : 'rel'; }
    function row(it, words) {
      return '<article class="entry" data-type="' + it.t + '" style="grid-template-columns:150px minmax(0,1fr)"><div class="entry__type" style="gap:8px"><span class="tag tag--' + it.t + ' ">' + it.tn + '</span><span class="entry__date" style="padding:0">' + it.date + '</span><span class="recno"><span>قيد</span><b>' + it.id + '</b></span></div>' +
        '<div><a class="entry__title" href="' + it.href + '">' + mark(it.title, words) + '</a>' + (it.ex ? '<p class="entry__ex" style="-webkit-line-clamp:3">' + mark(it.ex, words) + '</p>' : '') +
        '<div class="entry__by"><div class="meta "><div class="meta__row"><span>' + esc(it.by) + '</span><span>' + esc(it.sub || it.tn) + '</span></div></div></div></div></article>';
    }
    function render() {
      var q = input.value.trim(), words = normAr(q).split(/\s+/).filter(Boolean);
      var hits = [];
      if (words.length) items.forEach(function (it) {
        var score = 0, all = true;
        words.forEach(function (w) {
          var inT = it.nt.indexOf(w) >= 0, inX = it.nx.indexOf(w) >= 0, inId = String(it.id).indexOf(w) >= 0;
          if (!inT && !inX && !inId) all = false;
          score += (inT ? 3 : 0) + (inX ? 1 : 0) + (inId ? 5 : 0);
        });
        if (all) hits.push({ it: it, score: score });
      });
      if (sortMode() === 'new') hits.sort(function (a, b) { return a.it.iso < b.it.iso ? 1 : -1; });
      else hits.sort(function (a, b) { return b.score - a.score || (a.it.iso < b.it.iso ? 1 : -1); });
      var pubs = hits.filter(function (h) { return h.it.t !== 'monitor'; }), briefs = hits.filter(function (h) { return h.it.t === 'monitor'; });
      var tags = words.length ? sIndex.tags.filter(function (t) { var n = normAr(t.n); return words.every(function (w) { return n.indexOf(w) >= 0; }); }) : [];
      // facets follow the results; what was ticked stays ticked
      var ticked = $$('[data-filter-type].is-on', facetsBox).map(function (l) { return l.getAttribute('data-filter-type'); });
      var byType = {}; pubs.forEach(function (h) { byType[h.it.t] = (byType[h.it.t] || 0) + 1; });
      facetsBox.innerHTML = Object.keys(byType).map(function (k) {
        var on = ticked.indexOf(k) >= 0;
        return '<label class="check ' + (on ? 'is-on' : '') + '" data-filter-type="' + k + '"><span class="check__box">' + (on ? CHECK : '') + '</span><span class="sq" style="--c:var(--type-' + k + ')"></span>' + TYPE_NAMES[k] + '<small>' + byType[k] + '</small></label>';
      }).join('') || '<p class="t-caption">لا أنواع لعرضها.</p>';
      ticked = ticked.filter(function (k) { return byType[k]; });
      list.innerHTML = pubs.map(function (h) { return row(h.it, words); }).join('');
      $$('.entry', list).forEach(function (el) { if (ticked.length && ticked.indexOf(el.getAttribute('data-type')) < 0) el.hidden = true; });
      if (words.length && !pubs.length) list.innerHTML = '<div class="list-empty"><p>لا نتائج لـ«' + esc(q) + '» في المواد المنشورة. جرب كلمة أقصر، أو ابحث في الموجزات من مركز البيانات.</p></div>';
      briefsBox.innerHTML = briefs.map(function (h) { return row(h.it, words); }).join('') || '<div class="list-empty"><p>لا موجزات تطابق «' + esc(q) + '». الموجزات تبحث بالتاريخ والمحافظة في <a href="data.html#briefs">مركز البيانات</a>.</p></div>';
      tagsBox.innerHTML = tags.map(function (t) { return '<a class="chip' + (t.k === 'geo' ? ' chip--geo' : '') + '" href="tag.html">' + (t.k === 'dossier' ? 'ملف: ' : '') + esc(t.n) + '</a>'; }).join('') || '<p class="t-caption">لا وسوم تطابق «' + esc(q) + '».</p>';
      var counts = { pubs: pubs.length, briefs: briefs.length, tags: tags.length };
      tabs.forEach(function (b) { var sm = $('small', b); if (sm) sm.textContent = counts[b.getAttribute('data-s-tab')]; });
      if (dossier) { var dn = normAr(dossier.getAttribute('data-s-dossier')); dossier.hidden = !words.length || !words.every(function (w) { return dn.indexOf(w) >= 0; }); }
      var mode = sortMode() === 'new' ? 'الأحدث أولا' : 'مرتبة بحسب الصلة';
      countEl.innerHTML = !words.length ? 'اكتب كلمة أو رقم قيد للبحث في سجل.' :
        (pubs.length ? '<b style="color:var(--ink-900)">' + plural(pubs.length, 'نتيجة واحدة', 'نتيجتان', 'نتائج', 'نتيجة') + '</b> لـ«' + esc(q) + '» في المواد المنشورة، ' + mode : 'لا نتائج لـ«' + esc(q) + '» في المواد المنشورة.');
      if (h1) h1.textContent = words.length ? 'نتائج البحث عن «' + q + '»' : 'البحث في سجل';
      document.title = (words.length ? 'نتائج البحث: ' + q : 'البحث') + ' | سجل';
      try { history.replaceState(null, '', words.length ? '?q=' + encodeURIComponent(q) : location.pathname); } catch (err) {}
    }
    function showTab(k) {
      list.hidden = k !== 'pubs'; if (dossier && k !== 'pubs') dossier.hidden = true;
      briefsBox.hidden = k !== 'briefs'; tagsBox.hidden = k !== 'tags';
      if (k === 'pubs') render();
      var box = k === 'pubs' ? list : k === 'briefs' ? briefsBox : tagsBox;
      if (canAnimate && !reduced()) box.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 180, easing: EASE_OUT });
    }
    input.addEventListener('input', render);
    sForm.addEventListener('submit', function (e) { e.preventDefault(); render(); });
    document.addEventListener('click', function (e) {
      var sug = e.target.closest('[data-q]');
      if (sug) { e.preventDefault(); input.value = sug.getAttribute('data-q'); render(); input.focus(); return; }
      if (e.target.closest('[data-act="clear-q"]')) { input.value = ''; render(); input.focus(); }
    });
    document.addEventListener('sj:tab', function (e) { var k = e.target.getAttribute && e.target.getAttribute('data-s-tab'); if (k) showTab(k); });
    document.addEventListener('sj:check', function (e) { if (e.target.hasAttribute && e.target.hasAttribute('data-s-sort')) render(); });
    render();
  })();

  /* 25. Field report bars explain themselves; the contact form ends on its own state */
  $$('[data-bartips]').forEach(function (box) {
    var tip = document.createElement('div');
    tip.className = 'mtip bartip'; tip.setAttribute('role', 'tooltip'); tip.id = 'bartip-' + Math.random().toString(36).slice(2, 7);
    tip.setAttribute('data-state', 'closed'); box.appendChild(tip);
    var cur = null;
    function show(r) {
      var d; try { d = JSON.parse(r.getAttribute('data-tip')); } catch (e) { return; }
      tip.innerHTML = '<div class="mtip__h"><span>' + d.t + '</span><b>' + d.n + '</b></div><ul>' +
        d.v.map(function (x) { return '<li><span>' + x[0] + '</span><b>' + x[1] + '</b></li>'; }).join('') + '</ul>';
      var above = r.offsetTop - tip.offsetHeight - 8;
      tip.style.top = (above >= 0 ? above : r.offsetTop + r.offsetHeight + 8) + 'px';
      tip.style.transformOrigin = above >= 0 ? '50% 100%' : '50% 0';
      tip.setAttribute('data-state', 'open'); r.setAttribute('aria-describedby', tip.id); cur = r;
    }
    function hide() { tip.setAttribute('data-state', 'closed'); if (cur) cur.removeAttribute('aria-describedby'); cur = null; }
    $$('.bar-row', box).forEach(function (r) {
      if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
        r.addEventListener('pointerenter', function () { show(r); });
        r.addEventListener('pointerleave', hide);
      }
      r.addEventListener('focus', function () { show(r); });
      r.addEventListener('blur', hide);
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && cur) hide(); });
  });

  // the message's length, as it is written
  $$('[data-count]').forEach(function (c) {
    var max = +c.getAttribute('data-count'), ta = $('textarea', c.closest('.field'));
    if (!ta) return;
    ta.addEventListener('input', function () { c.textContent = ta.value.length + ' / ' + max; });
  });
  // the help under "message type" answers the chosen type
  $$('[data-help-for]').forEach(function (sel) {
    var help = document.getElementById(sel.getAttribute('data-help-for')); if (!help) return;
    sel.addEventListener('change', function () { var o = sel.options[sel.selectedIndex]; if (o && o.getAttribute('data-help')) swap(help, o.getAttribute('data-help')); });
  });
  function formDone(f, box) {
    var mail = $('input[type="email"]', f), d = new Date();
    var idEl = $('[data-done-id]', box), mEl = $('[data-done-mail]', box);
    if (idEl) idEl.textContent = 'MSG-' + ('0' + (d.getMonth() + 1)).slice(-2) + ('0' + d.getDate()).slice(-2) + '-' + ('0' + Math.floor(Math.random() * 100)).slice(-2);
    if (mEl) mEl.textContent = mail ? mail.value.trim() : '';
    // the answer replaces the form at once; the panel eases in (CSS @starting-style), nothing waits on a fade-out
    f.hidden = true; box.hidden = false; box.focus({ preventScroll: true });
  }
  document.addEventListener('click', function (e) {
    var again = e.target.closest('[data-act="form-again"]'); if (!again) return;
    var box = again.closest('[data-form-done]'), f = box && $('form[data-validate]', box.parentElement); if (!f) return;
    f.reset();
    $$('[data-count]', f).forEach(function (c) { c.textContent = '0 / ' + c.getAttribute('data-count'); });
    box.hidden = true; f.hidden = false;
    var first = $('input, textarea', f); if (first) first.focus();
  });

  /* 18. Toast: enters and leaves by the same edge ------------------------ */
  function toast(msg) {
    var host = $('.toast-host'); if (!host) return;
    var t = document.createElement('div'); t.className = 'toast'; t.setAttribute('role', 'status'); t.textContent = msg;
    host.appendChild(t);
    setTimeout(function () { t.classList.add('is-out'); }, 2600);
    setTimeout(function () { t.remove(); }, 3100);
  }
})();

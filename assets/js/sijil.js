/* Sijil prototype، behaviour. Vanilla JS, no dependencies, no build step.
   Motion follows the tokens in sijil.css (--ease-out, --ease-in-out, --ease-drawer, --dur-*).
   Rules: transform and opacity only; transitions (not keyframes) for anything a reader can trigger twice;
   reduced motion keeps fades and drops movement.

    0 utilities       1 menu            2 mega menu        3 filter sheet     4 escape
    5 controls        6 monitor         7 map explorer     8 chart series     9 report builder
   10 list filters   11 map scaling    12 copy            13 forms           14 contents
   15 reading bar    16 images         17 first view      18 toast */
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
  var megaBtn = $('[data-mega]'), mega = $('#mega'), megaTimer = null;
  function setMega(open) {
    if (!mega) return;
    mega.hidden = !open; megaBtn.setAttribute('aria-expanded', String(open));
  }
  if (megaBtn && mega) {
    megaBtn.addEventListener('click', function (e) { e.preventDefault(); setMega(mega.hidden); });
    if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
      [megaBtn, mega].forEach(function (el) {
        el.addEventListener('mouseenter', function () { clearTimeout(megaTimer); megaTimer = setTimeout(function () { setMega(true); }, 120); });
        el.addEventListener('mouseleave', function () { clearTimeout(megaTimer); megaTimer = setTimeout(function () { setMega(false); }, 220); });
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
    if (chip) { chip.classList.toggle('is-on'); chip.setAttribute('aria-pressed', chip.classList.contains('is-on')); return; }
    var chk = t.closest('label.check');
    if (chk) {
      e.preventDefault();
      chk.classList.remove('is-mixed');
      var on = chk.classList.toggle('is-on');
      var box = $('.check__box', chk); if (box) box.innerHTML = on ? CHECK : '';
      chk.dispatchEvent(new CustomEvent('sj:check', { bubbles: true, detail: { on: on } }));
      return;
    }
    var tab = t.closest('.tabs > button, .tabs > a');
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
  function copy(text, msg) {
    var done = function () { toast(msg); };
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(text).then(done, function () { toast('تعذر النسخ'); });
    else {
      var ta = document.createElement('textarea'); ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); done(); } catch (err) { toast('تعذر النسخ'); }
      ta.remove();
    }
  }
  $$('.cite button').forEach(function (b) {
    b.addEventListener('click', function () { var p = $('p', b.closest('.cite')); copy(p ? p.innerText.trim() : location.href, 'نسخ نص الاستشهاد'); });
  });
  $$('.share__copy').forEach(function (b) { b.addEventListener('click', function () { copy(location.href, 'نسخ رابط المادة'); }); });

  /* 13. Forms: search goes to the results page; the rest confirm in place */
  $$('form').forEach(function (f) {
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      if (f.getAttribute('role') === 'search' || f.closest('[role="search"]')) {
        var q = $('input', f); location.href = 'search.html' + (q && q.value ? '?q=' + encodeURIComponent(q.value) : '');
        return;
      }
      var mail = $('input[type="email"]', f);
      if (mail && !mail.value.trim()) { mail.focus(); toast('اكتب بريدك الإلكتروني أولا'); return; }
      if (f.closest('.newsletter')) {
        var ok = document.createElement('p'); ok.className = 'nl-done'; ok.setAttribute('role', 'status');
        ok.textContent = 'تم الاشتراك. تصلك النشرة صباح كل أحد.';
        f.replaceWith(ok); return;
      }
      toast('وصلت رسالتك. نرد خلال يومي عمل.');
      f.reset();
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

  /* 18. Toast: enters and leaves by the same edge ------------------------ */
  function toast(msg) {
    var host = $('.toast-host'); if (!host) return;
    var t = document.createElement('div'); t.className = 'toast'; t.setAttribute('role', 'status'); t.textContent = msg;
    host.appendChild(t);
    setTimeout(function () { t.classList.add('is-out'); }, 2600);
    setTimeout(function () { t.remove(); }, 3100);
  }
})();

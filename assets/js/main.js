/* Heidt Studio — interactions. Plain JS, no build step. */
(() => {
  'use strict';

  // ---------------------------------------------------------------------------
  // Before launch: paste a free Web3Forms access key (https://web3forms.com, the
  // key is emailed to the address you sign up with) so project requests arrive
  // by email. Without a key, requests open the visitor's email app addressed to
  // CONTACT_EMAIL. With neither set, the form explains it isn't connected yet.
  const WEB3FORMS_KEY = '';
  const CONTACT_EMAIL = 'cohen.heidt13@gmail.com';
  // ---------------------------------------------------------------------------

  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const easeOut = t => 1 - Math.pow(1 - t, 3);
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const isPreview = location.protocol === 'file:' || /^(localhost|127\.0\.0\.1|\[::1\])$|\.github\.io$/.test(location.hostname);
  const keep = (area) => ({
    get(k, d) { try { const v = window[area].getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set(k, v) { try { window[area].setItem(k, JSON.stringify(v)); } catch (e) { /* storage blocked: fine */ } },
  });
  const local = keep('localStorage');
  const session = keep('sessionStorage');
  const IMG = k => `assets/img/work/${k}.jpg`;
  const BP = k => `assets/img/work/${k}-bp.jpg`;
  const loaded = new Map();
  const preload = (src) => {
    if (!loaded.has(src)) loaded.set(src, new Promise(res => { const i = new Image(); i.onload = i.onerror = () => res(); i.src = src; }));
    return loaded.get(src);
  };
  const onVisible = (el, fn, opts = { threshold: 0.25 }) => {
    if (!el) return;
    const io = new IntersectionObserver((ents) => ents.forEach(e => { if (e.isIntersecting) { fn(e.target); io.unobserve(e.target); } }), opts);
    io.observe(el);
  };
  const watch = (el, fn, opts = {}) => {
    if (!el) return;
    new IntersectionObserver((ents) => ents.forEach(e => fn(e.isIntersecting, e)), opts).observe(el);
  };

  document.documentElement.classList.add('js');

  // ===== Intro: the mark is drafted, then rendered ==========================
  const intro = $('#intro');
  const ready = () => { document.body.classList.remove('is-loading'); document.body.classList.add('is-ready'); };
  if (!intro || reduced || session.get('hs-intro', false)) {
    if (intro) intro.classList.add('is-gone');
    requestAnimationFrame(ready);
  } else {
    session.set('hs-intro', true);
    const count = $('#introCount');
    const t0 = performance.now();
    const DUR = 1750;
    const tick = (t) => {
      const p = clamp((t - t0) / DUR, 0, 1);
      count.textContent = String(Math.round(easeOut(p) * 100)).padStart(3, '0');
      if (p < 1) return requestAnimationFrame(tick);
      intro.classList.add('is-done');
      ready();
      setTimeout(() => intro.classList.add('is-gone'), 1100);
    };
    requestAnimationFrame(tick);
  }

  // ===== Nav, progress, mobile sheet, current section ========================
  const nav = $('#nav');
  const progress = $('#progress');
  const menuBtn = $('#menuBtn');
  const sheet = $('#sheet');
  const setMenu = (open) => {
    menuBtn.setAttribute('aria-expanded', String(open));
    sheet.hidden = !open;
    document.body.style.overflow = open ? 'hidden' : '';
  };
  menuBtn.addEventListener('click', () => setMenu(sheet.hidden));
  $$('a', sheet).forEach(a => a.addEventListener('click', () => setMenu(false)));
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && !sheet.hidden) setMenu(false); });

  const navLinks = $$('.nav__links a');
  ['work', 'lab', 'process', 'contact'].forEach(id => watch(document.getElementById(id), (on) => {
    if (on) navLinks.forEach(a => a.classList.toggle('is-current', a.getAttribute('href') === `#${id}`));
  }, { rootMargin: '-45% 0px -50% 0px' }));

  // ===== Reveal on scroll ====================================================
  const revealIO = new IntersectionObserver((ents) => ents.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('is-in'); revealIO.unobserve(e.target); }
  }), { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
  $$('.reveal, .band').forEach(el => revealIO.observe(el));

  // ===== Hero: render lens ====================================================
  const SITES = {
    nichols: { url: 'nicholsland.net', view: 'nichols-hero' },
    goose: { url: 'goosesgroomroom.com', view: 'goose-hero' },
    mill: { url: 'millwooddecking.com', view: 'mill-hero' },
    afi: { url: 'afineinstall.com', view: 'afi-hero' },
  };
  const ORDER = Object.keys(SITES);
  const lensView = $('#lensView');
  const lensBp = $('#lensBp');
  const lensLive = $('#lensLive');
  const lensUrl = $('#lensUrl');
  const readout = $('#lensReadout');
  const slab = $('#slab');
  const tabs = $$('.lens__switch button');
  const CYCLE = 6500;
  let site = 'nichols';
  let heroOn = true;
  let hovering = false;
  let pressing = false;
  let lastTouch = 0;
  let cycleTimer = 0;
  const L = { x: .5, y: .5, r: 0, tx: .5, ty: .5, tr: 0 };

  const baseR = () => clamp(lensView.clientWidth * .17, 64, 150);
  const fullR = () => Math.hypot(lensView.clientWidth, lensView.clientHeight);

  function lensFrame(t) {
    if (heroOn) {
      const idle = !hovering && performance.now() - lastTouch > 2500;
      if (idle && !reduced) {
        const s = t / 1000;
        L.tx = .5 + .3 * Math.sin(s * .55);
        L.ty = .48 + .26 * Math.sin(s * .8 + 1.3);
        L.tr = baseR() * .85;
      }
      const k = reduced ? 1 : .14;
      L.x = lerp(L.x, L.tx, k); L.y = lerp(L.y, L.ty, k); L.r = lerp(L.r, L.tr, pressing ? .1 : k);
      lensView.style.setProperty('--x', `${(L.x * 100).toFixed(2)}%`);
      lensView.style.setProperty('--y', `${(L.y * 100).toFixed(2)}%`);
      lensView.style.setProperty('--r', `${L.r.toFixed(1)}px`);
      const full = L.r > fullR() * .8;
      lensView.classList.toggle('is-full', full);
      readout.textContent = full ? 'RENDER 100%' : `RENDER · X ${L.x.toFixed(2)} Y ${L.y.toFixed(2)}`;
    }
    requestAnimationFrame(lensFrame);
  }
  if (lensView) {
    L.tr = baseR() * .85;
    requestAnimationFrame(lensFrame);
    watch($('#top'), (on) => { heroOn = on; on ? startCycle() : stopCycle(); }, { threshold: 0.05 });

    const setFromEvent = (e) => {
      const r = lensView.getBoundingClientRect();
      L.tx = clamp((e.clientX - r.left) / r.width, 0, 1);
      L.ty = clamp((e.clientY - r.top) / r.height, 0, 1);
    };
    lensView.addEventListener('pointerenter', (e) => { hovering = e.pointerType === 'mouse'; stopCycle(); setFromEvent(e); L.tr = pressing ? fullR() : baseR(); });
    lensView.addEventListener('pointermove', (e) => { setFromEvent(e); lastTouch = performance.now(); if (!pressing) L.tr = baseR(); });
    lensView.addEventListener('pointerleave', () => { hovering = false; pressing = false; lastTouch = performance.now(); startCycle(); });
    lensView.addEventListener('pointerdown', (e) => { pressing = true; setFromEvent(e); L.tr = fullR(); lastTouch = performance.now(); });
    addEventListener('pointerup', () => { if (pressing) { pressing = false; L.tr = baseR(); lastTouch = performance.now(); } });

    // gentle 3D tilt toward the pointer
    if (fine && !reduced) {
      const lens = $('#lens');
      lens.addEventListener('pointermove', (e) => {
        const r = lens.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - .5;
        const py = (e.clientY - r.top) / r.height - .5;
        slab.style.setProperty('--ry', `${(px * 7).toFixed(2)}deg`);
        slab.style.setProperty('--rx', `${(-py * 5).toFixed(2)}deg`);
      });
      lens.addEventListener('pointerleave', () => { slab.style.setProperty('--ry', '0deg'); slab.style.setProperty('--rx', '0deg'); });
    }

    tabs.forEach(b => b.addEventListener('click', () => { setSite(b.dataset.site); lastTouch = performance.now(); }));
    $('.lens__switch').addEventListener('keydown', (e) => {
      if (!['ArrowLeft', 'ArrowRight'].includes(e.key)) return;
      const i = ORDER.indexOf(site);
      const next = ORDER[(i + (e.key === 'ArrowRight' ? 1 : ORDER.length - 1)) % ORDER.length];
      setSite(next); tabs[ORDER.indexOf(next)].focus();
    });
    addEventListener('load', () => ORDER.forEach(k => { preload(IMG(SITES[k].view)); preload(BP(SITES[k].view)); }));
    document.addEventListener('visibilitychange', () => { document.hidden ? stopCycle() : startCycle(); });
  }

  let switching = 0;
  async function setSite(key) {
    if (key === site || !SITES[key]) return;
    site = key;
    const token = ++switching;
    tabs.forEach(b => { const on = b.dataset.site === key; b.setAttribute('aria-selected', String(on)); b.classList.remove('is-timing'); });
    const v = SITES[key].view;
    await Promise.all([preload(IMG(v)), preload(BP(v))]);
    if (token !== switching) return;
    lensUrl.textContent = SITES[key].url;
    lensLive.alt = `Homepage of ${SITES[key].url}, a site built by Heidt Studio`;
    if (reduced) { lensBp.src = BP(v); lensLive.src = IMG(v); startCycle(); return; }
    // redraw: a scan line sweeps down, drafting the new blueprint behind it
    const ghost = lensBp.cloneNode();
    ghost.removeAttribute('id');
    ghost.src = BP(v);
    ghost.alt = '';
    lensView.insertBefore(ghost, lensLive.nextSibling);
    lensView.classList.add('is-switching');
    const D = 760;
    const scan = $('.slab__scan', lensView);
    const a1 = ghost.animate([{ clipPath: 'inset(0 0 100% 0)' }, { clipPath: 'inset(0 0 0% 0)' }], { duration: D, easing: 'cubic-bezier(.7,0,.2,1)', fill: 'forwards' });
    scan.animate([{ top: '-2%' }, { top: '101%' }], { duration: D, easing: 'cubic-bezier(.7,0,.2,1)' });
    await a1.finished.catch(() => {});
    lensBp.src = BP(v);
    lensLive.src = IMG(v);
    try { await lensLive.decode(); } catch (e) { /* decode not critical */ }
    ghost.remove();
    lensView.classList.remove('is-switching');
    if (token === switching) startCycle();
  }
  function startCycle() {
    stopCycle();
    if (reduced || hovering || !heroOn || document.hidden) return;
    const t = tabs.find(b => b.dataset.site === site);
    if (t) { t.style.setProperty('--cycle', `${CYCLE}ms`); void t.offsetWidth; t.classList.add('is-timing'); }
    cycleTimer = setTimeout(() => setSite(ORDER[(ORDER.indexOf(site) + 1) % ORDER.length]), CYCLE);
  }
  function stopCycle() {
    clearTimeout(cycleTimer);
    tabs.forEach(b => b.classList.remove('is-timing'));
  }

  // ===== Work: case explorers ================================================
  const cases = $$('.case');
  cases.forEach(initCase);

  function initCase(c) {
    const screen = $('.screen', c);
    const view = $('.screen__view', c);
    const live = $('.screen__live', c);
    const bp = $('.screen__bp', c);
    const spot = $('.spot', c);
    const label = $('.spot__label', c);
    const full = $('.screen__full', c);
    const tools = $$('.tool', c);
    const picks = $$('.feat__pick', c);
    let current = picks[0] && picks[0].dataset.view;
    let token = 0;
    let frame = null;

    const setMode = (mode) => {
      screen.classList.toggle('is-blueprint', mode === 'blueprint');
      screen.classList.toggle('is-full', mode === 'full');
      screen.classList.toggle('is-live', mode === 'live');
      tools.forEach(t => t.setAttribute('aria-pressed', String(t.dataset.tool === mode)));
      full.hidden = mode !== 'full';
      if (frame) frame.hidden = mode !== 'live';
      const note = $('.screen__note', view);
      if (note) note.hidden = mode !== 'live';
      if (mode === 'full') {
        const img = $('img', full);
        if (!img.src) img.src = img.dataset.src;
        full.scrollTop = 0;
        autoScroll(full);
      }
    };

    tools.forEach(t => t.addEventListener('click', () => {
      const mode = t.dataset.tool;
      const on = t.getAttribute('aria-pressed') === 'true';
      if (mode === 'live' && c.dataset.frame !== '1') { window.open(c.dataset.site, '_blank', 'noopener'); return; }
      if (mode === 'live' && !frame) {
        frame = document.createElement('iframe');
        frame.className = 'screen__frame';
        frame.title = `Live preview of ${c.dataset.site.replace('https://', '')}`;
        frame.loading = 'lazy';
        frame.src = c.dataset.site;
        view.appendChild(frame);
        const note = document.createElement('span');
        note.className = 'screen__note mono';
        note.textContent = 'Live site — scroll and click inside';
        view.appendChild(note);
        const fit = () => frame.style.setProperty('--s', (view.clientWidth / 1440).toFixed(4));
        fit();
        new ResizeObserver(fit).observe(view);
      }
      setMode(on ? 'none' : mode);
    }));

    picks.forEach(btn => btn.addEventListener('click', () => select(btn)));
    $('.feats', c).addEventListener('keydown', (e) => {
      if (!['ArrowDown', 'ArrowUp'].includes(e.key) || !e.target.classList.contains('feat__pick')) return;
      e.preventDefault();
      const i = picks.indexOf(e.target);
      const n = picks[(i + (e.key === 'ArrowDown' ? 1 : picks.length - 1)) % picks.length];
      n.focus(); select(n);
    });

    // the label sits beside the hotspot where it fits, otherwise underneath it
    const placeLabel = () => {
      const active = picks.find(p => p.getAttribute('aria-selected') === 'true') || picks[0];
      const vw = view.clientWidth;
      const sx = parseFloat(active.dataset.x) / 100 * vw;
      const lw = label.offsetWidth;
      const gap = spot.offsetWidth / 2 + 14;
      const right = sx + gap + lw < vw - 6;
      const left = !right && sx - gap - lw > 6;
      const under = !right && !left;
      const up = under && parseFloat(active.dataset.y) > 62;
      spot.classList.toggle('is-left', left);
      spot.classList.toggle('is-below', under && !up);
      spot.classList.toggle('is-above', up);
      const half = lw / 2;
      spot.style.setProperty('--shift', `${Math.round(clamp(sx, half + 6, vw - half - 6) - sx)}px`);
    };
    new ResizeObserver(placeLabel).observe(view);

    async function select(btn) {
      picks.forEach(p => { const on = p === btn; p.setAttribute('aria-selected', String(on)); p.closest('.feat').classList.toggle('is-active', on); });
      setMode('none');
      const x = parseFloat(btn.dataset.x);
      spot.style.setProperty('--x', `${x}%`);
      spot.style.setProperty('--y', `${btn.dataset.y}%`);
      label.textContent = btn.dataset.label;
      placeLabel();
      const v = btn.dataset.view;
      if (v === current) return;
      current = v;
      const my = ++token;
      await Promise.all([preload(IMG(v)), preload(BP(v))]);
      if (my !== token) return;
      live.alt = `${btn.querySelector('.feat__name').textContent} on ${c.dataset.site.replace('https://', '')}`;
      if (reduced) { bp.src = BP(v); live.src = IMG(v); return; }
      bp.getAnimations().forEach(a => a.cancel());
      bp.src = BP(v);
      // draft the blueprint down over the old view, then render it away
      await bp.animate([{ clipPath: 'inset(0 0 100% 0)' }, { clipPath: 'inset(0 0 0% 0)' }], { duration: 520, easing: 'cubic-bezier(.7,0,.2,1)', fill: 'forwards' }).finished.catch(() => {});
      if (my !== token) return;
      live.src = IMG(v);
      try { await live.decode(); } catch (e) { /* fine */ }
      await bp.animate([{ clipPath: 'inset(0 0 0 0)' }, { clipPath: 'inset(100% 0 0 0)' }], { duration: 760, delay: 140, easing: 'cubic-bezier(.7,0,.2,1)', fill: 'forwards' }).finished.catch(() => {});
      if (my === token) bp.getAnimations().forEach(a => a.cancel());
    }

    // warm the views for this case once it is close to the viewport
    onVisible(c, () => picks.forEach(p => { preload(IMG(p.dataset.view)); preload(BP(p.dataset.view)); }), { rootMargin: '400px 0px' });
  }

  function autoScroll(box) {
    if (!fine || reduced) return;
    let paused = false;
    let pauseT = 0;
    const stop = () => { paused = true; clearTimeout(pauseT); pauseT = setTimeout(() => { paused = false; }, 2500); };
    box.addEventListener('wheel', stop, { passive: true });
    box.addEventListener('pointerdown', stop);
    const step = () => {
      if (box.hidden) return;
      if (!paused && box.matches(':hover')) box.scrollTop += 1.4;
      if (box.scrollTop + box.clientHeight < box.scrollHeight - 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  // stacked case cards: the one underneath eases back as the next slides over
  const stackMQ = matchMedia('(min-width: 1100px) and (min-height: 860px)');
  function updateStack() {
    if (!stackMQ.matches || reduced) { cases.forEach(c => c.style.setProperty('--stack', 0)); return; }
    const top = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--nav-h')) + 18;
    cases.forEach((c, i) => {
      const next = cases[i + 1];
      if (!next) return;
      const h = c.offsetHeight;
      const d = next.getBoundingClientRect().top - top;
      c.style.setProperty('--stack', clamp(1 - d / h, 0, 1).toFixed(3));
    });
  }

  // ===== Lab: scroll-driven film =============================================
  const film = $('#filmVideo');
  const filmTile = $('#lab-film');
  const filmPct = $('#filmPct');
  const filmBar = $('#filmBar');
  const F = { on: false, target: 0, cur: 0 };
  if (film) {
    watch(filmTile, (on) => { F.on = on; if (on) requestAnimationFrame(filmFrame); }, { rootMargin: '100px 0px' });
    const prime = () => { const p = film.play(); if (p) p.then(() => film.pause()).catch(() => {}); };
    film.addEventListener('loadedmetadata', prime, { once: true });
  }
  function filmTarget() {
    const r = filmTile.getBoundingClientRect();
    const vh = innerHeight;
    const p = clamp((vh - r.top) / (vh + r.height), 0, 1);
    F.target = clamp((p - .18) / .58, 0, 1);
  }
  function filmFrame() {
    if (!F.on) return;
    filmTarget();
    F.cur = reduced ? F.target : lerp(F.cur, F.target, .12);
    const d = film.duration;
    if (d && isFinite(d)) {
      const t = F.cur * (d - .05);
      if (Math.abs(film.currentTime - t) > .03 && !film.seeking) film.currentTime = t;
    }
    filmPct.textContent = `${String(Math.round(F.cur * 100)).padStart(3, '0')}%`;
    filmBar.style.transform = `scaleX(${F.cur.toFixed(3)})`;
    requestAnimationFrame(filmFrame);
  }

  // ===== Lab: before / after =================================================
  const ba = $('#ba');
  if (ba) {
    const range = $('input', ba);
    const set = v => ba.style.setProperty('--pos', `${v}%`);
    range.addEventListener('input', () => set(range.value));
    onVisible(ba, () => {
      if (reduced) return;
      const keys = [50, 76, 28, 50];
      const t0 = performance.now();
      const D = 2600;
      const step = (t) => {
        const p = clamp((t - t0) / D, 0, 1);
        const seg = Math.min(keys.length - 2, Math.floor(p * (keys.length - 1)));
        const lp = p * (keys.length - 1) - seg;
        const v = lerp(keys[seg], keys[seg + 1], .5 - Math.cos(lp * Math.PI) / 2);
        set(v.toFixed(1)); range.value = v;
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }, { threshold: .6 });
  }

  // ===== Lab: dot-matrix map with pins, filters and a drive radius ===========
  const GA = [[-83.109,35.001],[-83.323,34.788],[-83.339,34.684],[-83.005,34.47],[-82.901,34.486],[-82.748,34.267],[-82.715,34.152],[-82.556,33.944],[-82.326,33.818],[-82.195,33.632],[-81.926,33.462],[-81.937,33.347],[-81.762,33.161],[-81.493,33.008],[-81.428,32.843],[-81.417,32.63],[-81.28,32.558],[-81.121,32.29],[-81.116,32.12],[-80.886,32.033],[-81.132,31.693],[-81.176,31.518],[-81.28,31.364],[-81.291,31.206],[-81.4,31.134],[-81.444,30.707],[-81.718,30.746],[-81.948,30.828],[-82.041,30.751],[-82.003,30.565],[-82.047,30.362],[-82.167,30.357],[-82.216,30.57],[-83.498,30.647],[-84.867,30.713],[-85.004,31.003],[-85.114,31.277],[-85.043,31.54],[-85.141,31.841],[-85.054,32.011],[-85.059,32.137],[-84.889,32.263],[-85.004,32.323],[-84.96,32.422],[-85.07,32.58],[-85.185,32.86],[-85.431,34.125],[-85.607,34.985],[-84.32,34.99],[-83.619,34.985],[-83.109,35.001]];
  const PLACES = [
    { id: 'gainesville', name: 'GAINESVILLE', lon: -83.824, lat: 34.298, radius: true, sites: [
      { key: 'mill', cat: 'build', name: 'Millwood Decking & Remodeling', img: 'mill-hero', href: '#case-mill' },
      { key: 'afi', cat: 'tech', name: 'A Fine Install', img: 'afi-coverage', href: '#case-afi' } ] },
    { id: 'athens', name: 'ATHENS', lon: -83.377, lat: 33.951, sites: [
      { key: 'nichols', cat: 'land', name: 'Nichols Land & Investment', img: 'nichols-map', href: '#case-nichols' } ] },
    { id: 'savannah', name: 'SAVANNAH', lon: -81.0998, lat: 32.0809, sites: [
      { key: 'goose', cat: 'pets', name: 'Goose’s Groom Room', img: 'goose-hero', href: '#case-goose' } ] },
  ];
  const mapSvg = $('#mapSvg');
  if (mapSvg) buildMap();

  function buildMap() {
    const NS = 'http://www.w3.org/2000/svg';
    const W = 400, H = 320, PAD = 22;
    const lons = GA.map(p => p[0]), lats = GA.map(p => p[1]);
    const minLon = Math.min(...lons), maxLon = Math.max(...lons), minLat = Math.min(...lats), maxLat = Math.max(...lats);
    const cosL = Math.cos((minLat + maxLat) / 2 * Math.PI / 180);
    const ky = Math.min((H - PAD * 2) / (maxLat - minLat), (W - PAD * 2) / ((maxLon - minLon) * cosL));
    const kx = ky * cosL;
    const offX = (W - (maxLon - minLon) * kx) / 2;
    const offY = (H - (maxLat - minLat) * ky) / 2;
    const proj = (lon, lat) => [offX + (lon - minLon) * kx, offY + (maxLat - lat) * ky];
    const poly = GA.map(p => proj(p[0], p[1]));
    const inside = (x, y) => {
      let c = false;
      for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
        const [xi, yi] = poly[i], [xj, yj] = poly[j];
        if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c;
      }
      return c;
    };
    const el = (tag, attrs, parent = mapSvg) => { const n = document.createElementNS(NS, tag); for (const k in attrs) n.setAttribute(k, attrs[k]); parent.appendChild(n); return n; };

    const defs = el('defs', {});
    const g = el('linearGradient', { id: 'sweepGrad', x1: '0', y1: '0', x2: '1', y2: '0' }, defs);
    el('stop', { offset: '0', 'stop-color': '#89CFF0', 'stop-opacity': '0' }, g);
    el('stop', { offset: '1', 'stop-color': '#4BA9E0', 'stop-opacity': '.45' }, g);

    const pins = PLACES.map(p => ({ ...p, xy: proj(p.lon, p.lat) }));
    const gv = pins[0];
    const radiusPx = (84 / 69) * ky; // ~90 minutes of driving, 84 miles
    el('circle', { class: 'radius', cx: gv.xy[0], cy: gv.xy[1], r: radiusPx.toFixed(1) });
    const lab = el('text', { class: 'radius-label', x: (gv.xy[0] + radiusPx * .62).toFixed(1), y: (gv.xy[1] - radiusPx * .74).toFixed(1) });
    lab.textContent = '90 MIN';
    if (!reduced) {
      const a = 34 * Math.PI / 180;
      const sw = el('path', { class: 'sweep', d: `M${gv.xy[0]},${gv.xy[1]} L${gv.xy[0] + radiusPx},${gv.xy[1]} A${radiusPx},${radiusPx} 0 0 0 ${gv.xy[0] + radiusPx * Math.cos(a)},${gv.xy[1] - radiusPx * Math.sin(a)} Z` });
      sw.style.transformOrigin = `${gv.xy[0]}px ${gv.xy[1]}px`;
    }

    const dots = el('g', {});
    const STEP = 9;
    for (let y = STEP / 2; y < H; y += STEP) {
      for (let x = STEP / 2; x < W; x += STEP) {
        if (!inside(x, y)) continue;
        const near = Math.min(...pins.map(p => Math.hypot(p.xy[0] - x, p.xy[1] - y)));
        const d = el('circle', { class: `dot${near < 16 ? ' is-hot' : ''}`, cx: x, cy: y, r: near < 16 ? 2.1 : 1.7 }, dots);
        d.style.opacity = '0';
        d.style.transition = `opacity .6s ease ${(Math.hypot(gv.xy[0] - x, gv.xy[1] - y) * 3).toFixed(0)}ms`;
      }
    }
    onVisible(mapSvg, () => $$('.dot', mapSvg).forEach(d => { d.style.opacity = d.classList.contains('is-hot') ? '1' : '.6'; }), { threshold: .3 });

    const card = $('#mapCard');
    const pinEls = pins.map(p => {
      const pg = el('g', { class: 'pin', tabindex: '0', role: 'button', 'data-id': p.id, 'aria-label': `${p.name.charAt(0)}${p.name.slice(1).toLowerCase()}: ${p.sites.map(s => s.name).join(' and ')}` });
      el('circle', { class: 'halo', cx: p.xy[0], cy: p.xy[1], r: 7 }, pg);
      el('circle', { class: 'core', cx: p.xy[0], cy: p.xy[1], r: 5.5 }, pg);
      const t = el('text', { x: p.xy[0] + 10, y: p.xy[1] + 3 }, pg);
      t.textContent = p.sites.length > 1 ? `${p.name} · ${p.sites.length}` : p.name;
      const open = () => showCard(p);
      pg.addEventListener('click', open);
      pg.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } });
      return pg;
    });

    let filter = 'all';
    function showCard(p) {
      const list = p.sites.filter(s => filter === 'all' || s.cat === filter);
      if (!list.length) return;
      card.innerHTML = list.map(s => `<div><img src="${IMG(s.img)}" alt="" loading="lazy"><b>${s.name}</b><a href="${s.href}">View the case →</a></div>`).join('<hr style="border:0;border-top:1px solid #D6EAF6;margin:10px 0">') + '<button type="button" aria-label="Close">×</button>';
      const box = mapSvg.getBoundingClientRect();
      const sx = box.width / W;
      const left = clamp(p.xy[0] * sx - 105, 8, box.width - 218);
      const top = p.xy[1] * sx > box.height / 2 ? Math.max(8, p.xy[1] * sx - (list.length > 1 ? 330 : 190)) : p.xy[1] * sx + 16;
      card.style.left = `${left}px`;
      card.style.top = `${top}px`;
      card.hidden = false;
      $('button', card).addEventListener('click', () => { card.hidden = true; });
    }
    $$('#lab-map .chip').forEach(ch => ch.addEventListener('click', () => {
      filter = ch.dataset.filter;
      $$('#lab-map .chip').forEach(x => x.classList.toggle('is-on', x === ch));
      card.hidden = true;
      pinEls.forEach((pg, i) => pg.classList.toggle('is-dim', filter !== 'all' && !pins[i].sites.some(s => s.cat === filter)));
      const hit = pins.find(p => p.sites.some(s => s.cat === filter));
      if (filter !== 'all' && hit) showCard(hit);
    }));
  }

  // ===== Lab: tabbed pricing (Goose's real starting prices) ==================
  const PRICES = {
    standard: { note: 'Full-body haircut, premium shampoo, blow dry, brush out, nail trim, ear cleaning and a bandana or bow.', sizes: [79, 98, 118, 137] },
    complex: { note: 'For doodles, curly-haired and double-coated breeds — extra care for thicker, more demanding coats.', sizes: [89, 108, 128, 147] },
    bath: { note: 'Bath, premium shampoo, blow dry, brush out, nail trim, ear cleaning and a bandana or bow — no haircut.', sizes: [59, 78, 97, 117] },
    addons: { note: 'Add any of these to the appointment.', list: [['Paw Balm', 8], ['Teeth Brushing', 8], ['Blueberry Facial', 10], ['Anal Glands', 10], ['Matt Removal', 18], ['De-Shed Treatment', 20], ['Extra Time / Senior Care', 25], ['Flea Treatment', 30]] },
  };
  const SIZES = [['Small', '0–25 lbs'], ['Medium', '26–50 lbs'], ['Large', '51–90 lbs'], ['X-Large', '91+ lbs']];
  const price = $('#price');
  if (price) {
    const grid = $('#priceGrid');
    const note = $('#priceNote');
    const pill = $('.price__pill', price);
    const ptabs = $$('[role="tab"]', price);
    let shown = PRICES.standard.sizes.slice();
    const movePill = (b) => { price.style.setProperty('--pl', `${b.offsetLeft}px`); price.style.setProperty('--pw', `${b.offsetWidth}px`); pill.style.left = `${b.offsetLeft}px`; pill.style.width = `${b.offsetWidth}px`; };
    const render = (key) => {
      const d = PRICES[key];
      note.textContent = d.note;
      if (d.list) {
        grid.classList.add('is-list');
        grid.innerHTML = d.list.map(([n, v]) => `<div class="prow"><span>${n}</span><b>$${v}</b></div>`).join('');
        return;
      }
      const from = grid.classList.contains('is-list') ? d.sizes.map(() => 0) : shown;
      grid.classList.remove('is-list');
      grid.innerHTML = SIZES.map(([s, w], i) => `<div class="pcard"><span class="mono">${s}</span><small>${w}</small><b data-i="${i}">$${from[i]}</b><small>starting at</small></div>`).join('');
      const nums = $$('b', grid);
      const t0 = performance.now();
      const step = (t) => {
        const p = reduced ? 1 : clamp((t - t0) / 520, 0, 1);
        nums.forEach((b, i) => { b.textContent = `$${Math.round(lerp(from[i], d.sizes[i], easeOut(p)))}`; });
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
      shown = d.sizes.slice();
    };
    const choose = (b) => {
      ptabs.forEach(t => t.setAttribute('aria-selected', String(t === b)));
      movePill(b);
      render(b.dataset.tab);
    };
    ptabs.forEach(b => b.addEventListener('click', () => choose(b)));
    $('.price__tabs', price).addEventListener('keydown', (e) => {
      if (!['ArrowLeft', 'ArrowRight'].includes(e.key)) return;
      const i = ptabs.findIndex(t => t.getAttribute('aria-selected') === 'true');
      const n = ptabs[(i + (e.key === 'ArrowRight' ? 1 : ptabs.length - 1)) % ptabs.length];
      n.focus(); choose(n);
    });
    render('standard');
    requestAnimationFrame(() => movePill(ptabs[0]));
    new ResizeObserver(() => movePill(ptabs.find(t => t.getAttribute('aria-selected') === 'true'))).observe(price);
  }

  // ===== Lab: speed readout ===================================================
  const speed = $('#speed');
  if (speed) {
    const arc = $('#speedArc');
    const nums = $$('b[data-to]', speed);
    const run = () => {
      const t0 = performance.now();
      const D = reduced ? 1 : 1700;
      const step = (t) => {
        const p = clamp((t - t0) / D, 0, 1);
        const e = easeOut(p);
        nums.forEach(b => { b.textContent = Math.round(+b.dataset.to * e); });
        arc.style.strokeDashoffset = (1 - .77 * e).toFixed(4);
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };
    onVisible(speed, run, { threshold: .5 });
    $('#speedRun').addEventListener('click', run);
  }

  // ===== Lab: film reel ========================================================
  const reel = $('#reel');
  if (reel) {
    const vids = $$('video', reel);
    const chips = $$('[data-reel]', reel);
    let idx = 0;
    let on = false;
    let picked = false;
    let timer = 0;
    const show = (i) => {
      idx = i;
      vids.forEach((v, j) => {
        v.classList.toggle('is-on', j === i);
        if (j === i && on) { if (v.preload === 'none') v.preload = 'auto'; v.play().catch(() => {}); } else { v.pause(); }
      });
      chips.forEach((c, j) => c.classList.toggle('is-on', j === i));
      clearTimeout(timer);
      if (on && !picked && !reduced) timer = setTimeout(() => show((idx + 1) % vids.length), 7000);
    };
    chips.forEach((c, j) => c.addEventListener('click', () => { picked = true; show(j); }));
    watch(reel, (vis) => { on = vis; show(idx); }, { threshold: .35 });
  }

  // ===== Lab: counters =========================================================
  $$('[data-count]').forEach(b => onVisible(b, () => {
    const to = +b.dataset.count;
    const suf = b.dataset.suffix || '';
    const t0 = performance.now();
    const step = (t) => {
      const p = reduced ? 1 : clamp((t - t0) / 1400, 0, 1);
      b.textContent = `${Math.round(to * easeOut(p))}${suf}`;
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, { threshold: .6 }));

  // ===== Process stage =========================================================
  const stage = $('#stage');
  const stageLabel = $('#stageLabel');
  const steps = $$('.step');
  const STEP_NAMES = ['Discover', 'Blueprint', 'Build', 'Launch'];
  const setStep = (n) => {
    stage.dataset.step = n;
    stageLabel.textContent = `0${n} · ${STEP_NAMES[n - 1]}`;
    steps.forEach(s => s.classList.toggle('is-on', +s.dataset.step === n));
  };
  if (stage) {
    const narrow = matchMedia('(max-width: 1100px)');
    steps.forEach(s => watch(s, (on) => { if (on && !narrow.matches) setStep(+s.dataset.step); }, { rootMargin: '-42% 0px -42% 0px' }));
    let auto = 0;
    watch(stage, (on) => {
      clearInterval(auto);
      if (on && narrow.matches && !reduced) {
        let n = 1; setStep(1);
        auto = setInterval(() => { n = n % 4 + 1; setStep(n); }, 2200);
      }
    }, { threshold: .4 });
    setStep(1);
  }

  // ===== Build list, floating pill, form =====================================
  const FEATURES = ['Cinematic hero film', 'Scroll-driven film', 'Before / after slider', 'Interactive map', 'Coverage radar', 'Tabbed pricing', 'Online booking', 'Listings & status badges', 'Photo gallery & lightbox', 'Animated counters & readouts', 'Smart quote form', 'Tap to call & text', 'Animated canvas hero', 'Multi-page site', 'Logo & branding', 'Not sure yet'];
  const state = local.get('hs-build', { items: [], inspired: '' });
  if (!Array.isArray(state.items)) state.items = [];
  state.items = state.items.filter(i => i && FEATURES.includes(i.name));

  const specList = $('#specList');
  const specEmpty = $('#specEmpty');
  const specInspired = $('#specInspired');
  const formChips = $('#formChips');
  const formSummary = $('#formSummary');
  const formInspired = $('#formInspired');
  const pill = $('#pill');
  const pillCount = $('#pillCount');
  const pillText = $('#pillText');
  const addBtns = $$('.add[data-add]');
  addBtns.forEach(b => { b.dataset.label = b.textContent.trim(); });

  formChips.innerHTML = FEATURES.map((f, i) => `<label class="chip"><input type="checkbox" name="features" value="${f.replace(/&/g, '&amp;')}" id="feat-${i}">${f.replace(/&/g, '&amp;')}</label>`).join('');

  const has = (name) => state.items.some(i => i.name === name);
  function toggle(name, src, el) {
    if (has(name)) state.items = state.items.filter(i => i.name !== name);
    else {
      state.items.push({ name, src });
      if (pill) { pill.classList.remove('bump'); void pill.offsetWidth; pill.classList.add('bump'); }
    }
    if (el) { el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump'); }
    render();
  }
  function render() {
    addBtns.forEach(b => {
      const on = has(b.dataset.add);
      b.classList.toggle('is-added', on);
      b.textContent = on ? '✓ Added' : b.dataset.label;
      b.setAttribute('aria-pressed', String(on));
    });
    specList.innerHTML = '';
    state.items.forEach(item => {
      const li = document.createElement('li');
      const name = document.createElement('b'); name.textContent = item.name;
      const src = document.createElement('span'); src.className = 'mono'; src.textContent = item.src && item.src !== 'Form' ? `from ${item.src}` : 'picked';
      const x = document.createElement('button'); x.type = 'button'; x.textContent = '×'; x.setAttribute('aria-label', `Remove ${item.name}`);
      x.addEventListener('click', () => toggle(item.name));
      li.append(name, src, x);
      specList.appendChild(li);
    });
    specEmpty.hidden = state.items.length > 0;
    specInspired.hidden = !state.inspired;
    specInspired.textContent = state.inspired ? `Inspired by ${state.inspired}` : '';
    formInspired.value = state.inspired || '';
    $$('input', formChips).forEach(inp => { inp.checked = has(inp.value); inp.parentElement.classList.toggle('is-on', inp.checked); });
    const n = state.items.length;
    formSummary.textContent = n ? `${n} picked: ${state.items.map(i => i.name).join(', ')}` : 'Nothing picked yet';
    pillCount.textContent = n;
    pill.classList.toggle('is-empty', n === 0);
    pillText.textContent = n ? (n === 1 ? 'feature in your build · Send it' : 'features in your build · Send it') : 'Start a project';
    local.set('hs-build', state);
  }
  addBtns.forEach(b => b.addEventListener('click', () => toggle(b.dataset.add, b.dataset.src, b)));
  formChips.addEventListener('change', (e) => { if (e.target.name === 'features') toggle(e.target.value, 'Form'); });
  $$('[data-inspired]').forEach(a => a.addEventListener('click', () => { state.inspired = a.dataset.inspired; render(); }));
  render();

  // pill shows once past the hero and steps aside at the contact section
  let contactOn = false;
  watch($('#contact'), (on) => { contactOn = on; }, { threshold: .15 });
  function updatePill() { pill.classList.toggle('is-on', scrollY > innerHeight * .7 && !contactOn); }

  // form
  const form = $('#form');
  const status = $('#formStatus');
  const say = (msg, kind) => { status.textContent = msg; status.className = `form__status is-${kind}`; };
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(form));
    const nameEl = form.elements.name;
    const emailEl = form.elements.email;
    [nameEl, emailEl].forEach(i => i.removeAttribute('aria-invalid'));
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test((d.email || '').trim());
    if (!d.name.trim() || !emailOk) {
      const bad = !d.name.trim() ? nameEl : emailEl;
      bad.setAttribute('aria-invalid', 'true');
      bad.focus();
      say(!d.name.trim() ? 'Add your name so we know who to reply to.' : 'Add an email address we can reply to, like you@yourbusiness.com.', 'err');
      return;
    }
    if (form.elements.botcheck.checked) { say('Thanks — your request was sent.', 'ok'); return; }
    const feats = state.items.map(i => `${i.name}${i.src && i.src !== 'Form' ? ` (from ${i.src})` : ''}`);
    const subject = `Project request: ${d.business || d.name}`;
    const body = [
      `Name: ${d.name}`, `Email: ${d.email}`, `Phone: ${d.phone || '-'}`, `Business: ${d.business || '-'}`,
      `Current website: ${d.website || '-'}`, `Inspired by: ${d.inspired || '-'}`, '',
      'Features wanted:', ...(feats.length ? feats.map(f => `  - ${f}`) : ['  (none picked)']), '', d.message || '',
    ].join('\n');

    if (!WEB3FORMS_KEY) {
      if (CONTACT_EMAIL) {
        location.href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        say('Your email app should open with the request filled in. Press send to finish. Nothing opened? Call or text (912) 677-0764.', 'ok');
      } else {
        say(isPreview ? 'Preview: the form isn’t connected yet. Add a Web3Forms key or email in assets/js/main.js before launch.' : 'This form isn’t connected yet. Please check back soon.', 'err');
      }
      return;
    }
    const btn = $('button[type="submit"]', form);
    btn.disabled = true;
    say('Sending…', 'ok');
    try {
      const res = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ access_key: WEB3FORMS_KEY, subject, from_name: 'Heidt Studio website', replyto: d.email, message: body }),
      });
      const out = await res.json();
      if (!res.ok || !out.success) throw new Error(out.message || res.status);
      form.reset();
      state.items = []; state.inspired = ''; render();
      say(`Thanks, ${d.name.trim().split(' ')[0]}. Your project request is in — expect a reply with next steps soon.`, 'ok');
    } catch (err) {
      say('Your request didn’t go through. Press send again, or call or text (912) 677-0764.', 'err');
    } finally {
      btn.disabled = false;
    }
  });

  // ===== Custom cursor =========================================================
  if (fine && !reduced) {
    const cur = $('#cursor');
    const lab = $('#cursorLabel');
    let mx = -100, my = -100, cx = -100, cy = -100;
    addEventListener('pointermove', (e) => {
      mx = e.clientX; my = e.clientY;
      const host = e.target.closest && e.target.closest('[data-cursor]');
      const overLens = e.target.closest && e.target.closest('.slab__view');
      cur.classList.toggle('is-off', !!overLens);
      cur.classList.toggle('is-big', !!host && !overLens);
      if (host) lab.textContent = host.dataset.cursor;
    }, { passive: true });
    document.addEventListener('pointerleave', () => cur.classList.add('is-off'));
    const loop = () => {
      cx = lerp(cx, mx, .22); cy = lerp(cy, my, .22);
      cur.style.transform = `translate(${cx.toFixed(1)}px, ${cy.toFixed(1)}px)`;
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  // ===== One scroll handler ===================================================
  let ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const y = scrollY;
      nav.classList.toggle('is-scrolled', y > 8);
      const h = document.documentElement.scrollHeight - innerHeight;
      progress.style.setProperty('--p', h > 0 ? (y / h).toFixed(4) : 0);
      updateStack();
      updatePill();
      ticking = false;
    });
  }
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll);
  onScroll();

  const year = $('#year');
  if (year) year.textContent = new Date().getFullYear();
})();

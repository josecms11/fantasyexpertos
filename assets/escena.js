/* Escena FX. Movimiento con sentido, no adorno:
   - Cada sección lleva un chip con su dato real (en vivo, notas de hoy, semana y formato…) y un balón que gira junto al título.
   - Al entrar en pantalla: el chip se enciende como marcador, el título avanza y las tarjetas suben en orden.
   - Cambio de página: un balón con el logo FX corre por la línea superior (carga).
   - Web: riel de yardas con el balón que avanza con el scroll. Móvil: marcador inferior con la sección y el avance.
   Todo se apaga con prefers-reduced-motion. */
(function () {
  const quieto = matchMedia('(prefers-reduced-motion: reduce)').matches, movil = () => innerWidth <= 820;
  const EN = () => document.documentElement.lang === 'en';
  const BALON = '<svg viewBox="0 0 24 14" aria-hidden="true"><ellipse cx="12" cy="7" rx="11" ry="6.2" fill="#8B4A2B" stroke="#5E2F1A" stroke-width="1.2"/><path d="M7 7h10" stroke="#fff" stroke-width="1.3"/><path d="M9 5.6v2.8M11 5.6v2.8M13 5.6v2.8M15 5.6v2.8" stroke="#fff" stroke-width="1"/></svg>';
  let io = null, secs = [], riel = null, hud = null, barra = null;

  const nombre = s => { const h = s.querySelector('.head h2, .head h3, h2'); return h ? h.textContent.replace(/[›▲▼★⚔]/g, '').replace(/\s+/g, ' ').trim().slice(0, 34) : ''; };

  function arma(re) {
    const app = document.getElementById('app'); if (!app) return;
    secs = [...app.querySelectorAll('section.block, section.front')].filter(s => s.offsetHeight > 60);
    if (io) io.disconnect();
    io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('vis'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -10% 0px', threshold: .06 });
    secs.forEach(s => {
      if (!s.dataset.fx) {
        s.dataset.fx = s.classList.contains('front') ? 'front' : 'sec';
        const h = s.querySelector(':scope > .head h2, :scope > .head > div > h2, :scope .card > .head h3');
        if (h && s.dataset.chip && !s.querySelector('.fx-chip')) h.insertAdjacentHTML('beforebegin', `<span class="fx-chip${s.dataset.vivo ? ' vivo' : ''}" aria-hidden="true">${s.dataset.vivo ? '<i></i>' : ''}${s.dataset.chip}</span>`);
        // El balón que gira solo acompaña a las secciones marcadas como protagonistas (data-balon)
        if (h && s.dataset.balon && !h.querySelector('.fx-spin')) h.insertAdjacentHTML('beforeend', `<span class="fx-spin" aria-hidden="true">${BALON}</span>`);
        [...s.querySelectorAll(':scope .card, :scope .story, :scope .match, :scope .hub, :scope .plist > *, :scope .news > *')].slice(0, 14).forEach((c, n) => c.style.setProperty('--d', (movil() ? n * 35 : n * 60) + 'ms'));
      }
      if (quieto || re) s.classList.add('vis', 'ya');
    });
    if (!movil()) pintaRiel(); else pintaHud();
    onScroll();
  }

  // Riel como cancha real: G · 10 · 20 · 30 · 40 · 50 · 40 · 30 · 20 · 10 · TD. El balón avanza con el scroll.
  const YARDAS = ['G', 10, 20, 30, 40, 50, 40, 30, 20, 10, 'TD'];
  const seccionEn = f => { const y = f * (document.documentElement.scrollHeight - innerHeight) + innerHeight * .5; let k = 0; secs.forEach((s, n) => { if (s.getBoundingClientRect().top + scrollY <= y) k = n; }); return secs[k]; };
  // Cancha de avance: tira delgada pegada bajo el menú; el balón recorre las yardas conforme haces scroll
  function pintaRiel() {
    if (hud) hud.hidden = true;
    const hdr = document.querySelector('header'); if (!hdr) return;
    if (secs.length < 4 || document.documentElement.scrollHeight < innerHeight * 1.8) { if (riel) riel.hidden = true; return; }
    if (!riel) { riel = document.createElement('nav'); riel.className = 'fx-yard'; riel.setAttribute('aria-label', 'Avance en la página'); hdr.appendChild(riel); }
    riel.hidden = false;
    riel.innerHTML = `<i class="fx-yard-l"></i><b class="fx-yard-b" aria-hidden="true">${BALON}</b>` + YARDAS.map((y, n) => { const s = seccionEn(n / 10); return `<button type="button" data-f="${n / 10}" style="left:${n * 10}%" class="${typeof y === 'string' ? 'gl' : ''}" title="${((s && nombre(s)) || '').replace(/"/g, '')}">${y}</button>`; }).join('');
    riel.onclick = e => { const b = e.target.closest('button'); if (b) scrollTo({ top: +b.dataset.f * (document.documentElement.scrollHeight - innerHeight), behavior: quieto ? 'auto' : 'smooth' }); };
  }
  function pintaHud() {
    if (riel) riel.hidden = true;
    if (!hud) { hud = document.createElement('div'); hud.className = 'fx-hud'; hud.setAttribute('aria-hidden', 'true'); hud.innerHTML = `<span class="fx-hud-b">${BALON}</span><span class="fx-hud-n"></span><span class="fx-hud-c"></span><i class="fx-hud-p"></i>`; document.body.appendChild(hud); }
    hud.hidden = secs.length < 4;
  }

  let ultimo = -1, tick = false;
  // Revela por posición (no depende de IntersectionObserver, que falla con contenedores recortados)
  const revela = () => { const lim = innerHeight * .95; secs.forEach(s => { if (!s.classList.contains('vis') && s.getBoundingClientRect().top < lim) s.classList.add('vis'); }); };
  function onScroll() {
    tick = false; if (!secs.length) return; revela();
    const y = scrollY + innerHeight * .5, max = document.documentElement.scrollHeight - innerHeight;
    let i = 0; secs.forEach((s, n) => { if (s.getBoundingClientRect().top + scrollY <= y) i = n; });
    const p = max > 0 ? Math.min(1, scrollY / max) : 0;
    if (riel && !riel.hidden) { riel.style.setProperty('--p', p); const k = Math.round(p * 10); riel.querySelectorAll('button').forEach((b, n) => { b.classList.toggle('on', n === k); b.classList.toggle('pasado', n < k); }); }
    if (hud && !hud.hidden) {
      hud.style.setProperty('--p', p); hud.classList.toggle('ver', scrollY > 260);
      if (i !== ultimo) { const s = secs[i], c = s.querySelector('.fx-chip'); hud.querySelector('.fx-hud-n').textContent = nombre(s) || (EN() ? 'Top stories' : 'Portada'); hud.querySelector('.fx-hud-c').textContent = c ? c.textContent : `${i + 1}/${secs.length}`; if (!quieto) { hud.classList.remove('cambia'); void hud.offsetWidth; hud.classList.add('cambia'); } }
    }
    ultimo = i;
  }
  addEventListener('scroll', () => { if (!tick) { tick = true; requestAnimationFrame(onScroll); } }, { passive: true });
  addEventListener('resize', () => { clearTimeout(arma._t); arma._t = setTimeout(() => arma(true), 200); });

  function carga() {
    if (quieto) return;
    if (!barra) { barra = document.createElement('div'); barra.className = 'fx-carga'; barra.setAttribute('aria-hidden', 'true'); barra.innerHTML = `<i></i><b>${BALON}<em>FX</em></b>`; document.body.appendChild(barra); }
    barra.classList.remove('corre'); void barra.offsetWidth; barra.classList.add('corre');
  }

  let rutaPrev = null;
  const mo = new MutationObserver(() => { clearTimeout(mo._t); mo._t = setTimeout(() => { const r = location.hash.split('?')[0], re = r === rutaPrev; if (!re) { if (rutaPrev !== null) carga(); rutaPrev = r; ultimo = -1; } arma(re); }, 40); });
  const iniciar = () => { const app = document.getElementById('app'); if (!app) return; mo.observe(app, { childList: true }); rutaPrev = location.hash.split('?')[0]; arma(); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar); else iniciar();
})();

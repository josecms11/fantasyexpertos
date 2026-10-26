/* Escena FX: el sitio se recorre como un drive.
   - Cada sección entra con su propia jugada (yardas, scan CRT, pixeles, marcador) al aparecer en pantalla.
   - Cambio de página: barrido de campo con el logo (web) o cadena de primera y diez (móvil).
   - Web: riel de yardas a la derecha con el balón que avanza con el scroll; clic para saltar.
   - Móvil: marcador de down & distance arriba que cambia con la sección en la que vas.
   Todo se apaga con prefers-reduced-motion. */
(function () {
  const quieto = matchMedia('(prefers-reduced-motion: reduce)').matches, movil = () => innerWidth <= 820;
  const EN = () => document.documentElement.lang === 'en';
  const DOWNS = ['1ST & 10', '2ND & 7', '3RD & 3', '1ST & 10', '2ND & 4', '1ST & GOAL', '2ND & 6', '3RD & 1'];
  const JUGADAS = ['yardas', 'scan', 'pixel', 'marcador'];
  let io = null, secs = [], riel = null, hud = null, primera = true;

  const nombre = s => { const h = s.querySelector('.head h2, .head h3, h2'); return h ? h.textContent.replace(/[›▲▼★⚔]/g, '').replace(/\s+/g, ' ').trim().slice(0, 34) : ''; };

  function arma(re) {
    const app = document.getElementById('app'); if (!app) return;
    secs = [...app.querySelectorAll('section.block, section.front, .ticker')].filter(s => s.offsetHeight > 60);
    if (io) io.disconnect();
    io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('vis'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -12% 0px', threshold: .08 });
    let k = 0;
    secs.forEach((s, i) => {
      if (s.dataset.fx) return;
      const j = s.classList.contains('front') || s.classList.contains('ticker') ? 'none' : JUGADAS[k++ % JUGADAS.length];
      s.dataset.fx = j; s.dataset.down = DOWNS[i % DOWNS.length];
      const h = s.querySelector(':scope > .head h2, :scope > .head > div > h2, :scope > .head h3');
      if (h && !h.previousElementSibling?.classList?.contains('fx-down')) h.insertAdjacentHTML('beforebegin', `<span class="fx-down" aria-hidden="true">${s.dataset.down}</span>`);
      if (j === 'yardas' && !s.querySelector(':scope > .fx-yl')) s.insertAdjacentHTML('afterbegin', '<i class="fx-yl" aria-hidden="true"></i><i class="fx-ball" aria-hidden="true"></i>');
      [...s.querySelectorAll(':scope .card, :scope .story, :scope .match, :scope .hub, :scope .plist > *, :scope .news > *')].slice(0, 14).forEach((c, n) => c.style.setProperty('--d', (movil() ? n * 40 : n * 70) + 'ms'));
      if (quieto || re) s.classList.add('vis', 'ya'); else io.observe(s);
    });
    if (!movil()) pintaRiel(); else pintaHud();
    onScroll();
  }

  function pintaRiel() {
    if (hud) hud.hidden = true;
    const marcas = secs.filter(s => !s.classList.contains('ticker'));
    if (marcas.length < 3) { if (riel) riel.hidden = true; return; }
    if (!riel) { riel = document.createElement('nav'); riel.className = 'fx-riel'; riel.setAttribute('aria-label', 'Secciones de la página'); document.body.appendChild(riel); }
    riel.hidden = false;
    const yd = n => { const y = Math.round(n / Math.max(1, marcas.length - 1) * 100); return y === 0 ? 'G' : y >= 100 ? 'TD' : y > 50 ? 100 - y : y; };
    riel.innerHTML = `<i class="fx-riel-l"></i><b class="fx-riel-b" aria-hidden="true"></b>` + marcas.map((s, n) => `<button type="button" data-i="${secs.indexOf(s)}" title="${nombre(s).replace(/"/g, '')}"><span>${yd(n)}</span><em>${nombre(s) || (EN() ? 'Top' : 'Portada')}</em></button>`).join('');
    riel.onclick = e => { const b = e.target.closest('button'); if (b) secs[+b.dataset.i].scrollIntoView({ behavior: quieto ? 'auto' : 'smooth', block: 'start' }); };
  }
  function pintaHud() {
    if (riel) riel.hidden = true;
    if (!hud) { hud = document.createElement('div'); hud.className = 'fx-hud'; hud.setAttribute('aria-hidden', 'true'); hud.innerHTML = '<span class="fx-hud-d"></span><span class="fx-hud-n"></span><i class="fx-hud-p"></i>'; document.body.appendChild(hud); }
    hud.hidden = secs.length < 3;
  }

  let ultimo = -1, tick = false;
  function onScroll() {
    tick = false; if (!secs.length) return;
    const y = scrollY + innerHeight * .5, max = document.documentElement.scrollHeight - innerHeight;
    let i = 0; secs.forEach((s, n) => { if (s.getBoundingClientRect().top + scrollY <= y) i = n; });
    const p = max > 0 ? Math.min(1, scrollY / max) : 0;
    if (riel && !riel.hidden) { riel.style.setProperty('--p', p); riel.querySelectorAll('button').forEach(b => b.classList.toggle('on', +b.dataset.i === i)); }
    if (hud && !hud.hidden) {
      hud.style.setProperty('--p', p); hud.classList.toggle('ver', scrollY > 260);
      if (i !== ultimo) { const s = secs[i]; hud.querySelector('.fx-hud-d').textContent = s.dataset.down || '1ST & 10'; hud.querySelector('.fx-hud-n').textContent = nombre(s) || (EN() ? 'Top stories' : 'Portada'); if (!quieto) { hud.classList.remove('cambia'); void hud.offsetWidth; hud.classList.add('cambia'); } }
    }
    ultimo = i;
  }
  addEventListener('scroll', () => { if (!tick) { tick = true; requestAnimationFrame(onScroll); } }, { passive: true });
  addEventListener('resize', () => { clearTimeout(arma._t); arma._t = setTimeout(() => arma(true), 200); });

  function barrido() {
    if (quieto || primera) { primera = false; return; }
    const w = document.createElement('div'); w.className = 'fx-wipe ' + (movil() ? 'm' : 'd'); w.setAttribute('aria-hidden', 'true');
    w.innerHTML = movil() ? '<i class="fx-chain"></i>' : '<i class="fx-wipe-yl"></i><b class="fx-wipe-logo">FX</b>';
    document.body.appendChild(w); setTimeout(() => w.remove(), movil() ? 520 : 760);
  }

  let rutaPrev = null;
  const mo = new MutationObserver(() => { clearTimeout(mo._t); mo._t = setTimeout(() => { const r = location.hash.split('?')[0]; const re = r === rutaPrev; if (!re) { if (rutaPrev !== null) barrido(); rutaPrev = r; ultimo = -1; } arma(re); }, 60); });
  const iniciar = () => { const app = document.getElementById('app'); if (!app) return; mo.observe(app, { childList: true }); rutaPrev = location.hash.split('?')[0]; primera = false; arma(); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar); else iniciar();
})();

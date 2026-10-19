/* FANTASY EXPERTOS – app de navegación (todo se arma desde data/hoy.json y data/jugadores.json) */
(() => {
const $ = (s, el = document) => el.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const app = $('#app');

const EQUIPOS = { ARI: 'Arizona Cardinals', ATL: 'Atlanta Falcons', BAL: 'Baltimore Ravens', BUF: 'Buffalo Bills', CAR: 'Carolina Panthers', CHI: 'Chicago Bears', CIN: 'Cincinnati Bengals', CLE: 'Cleveland Browns', DAL: 'Dallas Cowboys', DEN: 'Denver Broncos', DET: 'Detroit Lions', GB: 'Green Bay Packers', HOU: 'Houston Texans', IND: 'Indianapolis Colts', JAX: 'Jacksonville Jaguars', KC: 'Kansas City Chiefs', LV: 'Las Vegas Raiders', LAC: 'Los Angeles Chargers', LAR: 'Los Angeles Rams', MIA: 'Miami Dolphins', MIN: 'Minnesota Vikings', NE: 'New England Patriots', NO: 'New Orleans Saints', NYG: 'New York Giants', NYJ: 'New York Jets', PHI: 'Philadelphia Eagles', PIT: 'Pittsburgh Steelers', SF: 'San Francisco 49ers', SEA: 'Seattle Seahawks', TB: 'Tampa Bay Buccaneers', TEN: 'Tennessee Titans', WAS: 'Washington Commanders' };
const POSICIONES = { QB: 'Quarterbacks', RB: 'Running backs', WR: 'Receptores', TE: 'Alas cerradas', K: 'Pateadores' };
const ESTATUS = { Questionable: 'Duda', Doubtful: 'Duda', Out: 'Fuera', IR: 'Fuera', PUP: 'Fuera', Sus: 'Fuera' };
const ETIQUETAS = ['LESIÓN', 'WAIVER', 'ARRANCA', 'BANCA', 'TENDENCIA'];

let D = null, P = [], J = {}, RANKPOS = {};

/* ---------- utilidades ---------- */
const estatus = j => ESTATUS[j.inj] || 'Sano';
const altura = a => { const h = parseInt(a, 10); return h ? Math.floor(h / 12) + "'" + (h % 12) + '"' : '–'; };
const n1 = v => v == null ? '–' : (Math.round(v * 10) / 10).toFixed(1);
const ultima = j => { const h = (j.hist || []).filter(x => x != null); return h.length ? h[h.length - 1] : null; };
const rp = j => RANKPOS[j.id] ? j.pos + RANKPOS[j.id] : j.pos;
const nf = new Intl.NumberFormat('es-MX');

function helmet(num, size = 44) {
  const t = String(num ?? '').slice(0, 2);
  return `<svg class="helmet" width="${size}" height="${size}" viewBox="0 0 12 12" aria-hidden="true" shape-rendering="crispEdges">
    <rect x="3" y="1" width="6" height="1" fill="#4A9A68"/><rect x="2" y="2" width="8" height="1" fill="#4A9A68"/>
    <rect x="1" y="3" width="9" height="5" fill="#4A9A68"/><rect x="2" y="8" width="6" height="1" fill="#4A9A68"/>
    <rect x="5" y="3" width="1" height="5" fill="#E8E8E8"/><rect x="8" y="5" width="3" height="1" fill="#E8E8E8"/>
    <rect x="10" y="5" width="1" height="4" fill="#E8E8E8"/><rect x="8" y="8" width="3" height="1" fill="#E8E8E8"/>
    <rect x="2" y="4" width="2" height="2" fill="#0A1A10"/>
    <text x="7.6" y="4.6" font-size="2.6" font-family="Press Start 2P, monospace" fill="#0A1A10" text-anchor="middle">${esc(t)}</text></svg>`;
}
function prow(j, right = '', rk = '') {
  if (!j) return '';
  const st = estatus(j);
  return `<a class="prow" href="#/jugador/${j.id}">${rk ? `<span class="rk">${rk}</span>` : ''}${helmet(j.num, 36)}
    <span class="meta"><span class="pname">${esc(j.n)}</span><small>${esc(rp(j))} · ${esc(j.team)}${st !== 'Sano' ? ' · ' + st : ''}</small></span>
    <span class="right">${right}<span class="arrow">›</span></span></a>`;
}
const pillSt = j => { const s = estatus(j); return `<span class="pill ${s}">${s.toUpperCase()}</span>`; };
const spark = h => `<span class="spark" aria-hidden="true">${(h || []).map(v => `<i class="${v ? '' : 'z'}" style="height:${v ? Math.max(3, Math.min(22, v)) : 3}px"></i>`).join('')}</span>`;
const crumbs = items => `<div class="crumbs wrap">${[['#/', 'Inicio'], ...items].map((c, i, a) => i < a.length - 1 ? `<a href="${c[0]}">${esc(c[1])}</a><span>›</span>` : `<b>${esc(c[1])}</b>`).join('')}</div>`;
const newsCard = (n, big) => `<a class="nc ${big ? 'big' : ''}" href="#/reportaje/${n.id}">
  <span><span class="lbl ${esc(n.etiqueta)}">${esc(n.etiqueta)}</span></span><h3>${esc(n.titulo)}</h3><p>${esc(n.cuerpo)}</p>
  <span class="tags">${(n.jugadores || []).slice(0, 3).map(id => J[id] ? `<span>${esc(J[id].n)}</span>` : '').join('')}</span>
  <span class="more">LEER REPORTAJE ›</span></a>`;
const noticiasDe = id => D.noticias.filter(n => (n.jugadores || []).includes(id));
const titulo = t => { document.title = t ? t + ' · Fantasy Expertos' : 'Fantasy Expertos'; };

/* ---------- PÁGINAS ---------- */
function inicio() {
  titulo('');
  const top = D.noticias[0];
  const hubs = Object.keys(POSICIONES).map(p => {
    const lider = P.filter(j => j.pos === p).sort((a, b) => (a.rank || 1e9) - (b.rank || 1e9))[0];
    return `<a class="hub" href="#/posicion/${p}"><b>${p}</b><span>${POSICIONES[p]}</span>${lider ? `<small>Nº1 · </small><span class="top">${esc(lider.n)}</span>` : ''}</a>`;
  }).join('');
  return `<div class="page">
  <div class="wrap hero">
    <div>
      <div class="eyebrow px"><i class="blink"></i>GAME DAY · SEMANA ${esc(D.semana)}</div>
      <h1 class="px">GANA TU<br><span>LIGA.</span></h1>
      <p class="lead">Reportajes, lesionados, tendencias y rankings que se actualizan cada hora. Toca cualquier jugador, equipo o posición y llega hasta el fondo.</p>
      <div class="stats">
        <a class="stat" href="#/reportajes"><b>${D.noticias.length}</b><span>REPORTAJES</span></a>
        <a class="stat" href="#/lesionados"><b>${D.lesionados.length}</b><span>LESIONADOS</span></a>
        <a class="stat" href="#/tendencias"><b>${D.agregados.length}</b><span>EN TENDENCIA</span></a>
        <a class="stat" href="#/equipos"><b>${P.length}</b><span>JUGADORES</span></a>
      </div>
    </div>
    <div><div class="crt">
      <div class="hud px"><span>EN VIVO</span><span id="crt-n"></span></div>
      <a class="screen" id="crt-link" href="#/reportajes">
        <svg class="float" width="140" height="80" viewBox="0 0 14 8" aria-hidden="true" shape-rendering="crispEdges"><rect x="4" y="0" width="6" height="1" fill="#8B4A2B"/><rect x="2" y="1" width="10" height="1" fill="#8B4A2B"/><rect x="1" y="2" width="12" height="1" fill="#8B4A2B"/><rect x="0" y="3" width="14" height="2" fill="#8B4A2B"/><rect x="1" y="5" width="12" height="1" fill="#8B4A2B"/><rect x="2" y="6" width="10" height="1" fill="#8B4A2B"/><rect x="4" y="7" width="6" height="1" fill="#8B4A2B"/><rect x="4" y="3" width="6" height="1" fill="#fff"/><rect x="5" y="2" width="1" height="3" fill="#fff"/><rect x="7" y="2" width="1" height="3" fill="#fff"/><rect x="9" y="2" width="1" height="3" fill="#fff"/></svg>
        <div id="crt-titulo">CARGANDO JUGADAS…</div>
        <div class="crt-dots" id="crt-dots"></div>
      </a>
      <div class="hud px"><span>TOCA PARA LEER</span><span>KICKOFF</span></div>
    </div></div>
  </div>
  <div class="ticker"><div class="tag px">ÚLTIMA HORA</div><div class="view"><div class="ticker-track">${tickerItems()}${tickerItems()}</div></div></div>
  <div class="wrap">
    <section class="block"><div class="head"><h2 class="px">REPORTAJES <span>FX</span></h2><a class="all" href="#/reportajes">VER LOS ${D.noticias.length} ›</a></div>
      <div class="news stagger">${top ? newsCard(top, true) : '<div class="empty">Los reportajes llegan en el próximo ciclo.</div>'}${D.noticias.slice(1, 4).map(n => newsCard(n)).join('')}</div></section>
    <section class="block"><div class="head"><h2 class="px">EXPLORA POR <span>POSICIÓN</span></h2></div><div class="grid g5 stagger">${hubs}</div></section>
    <section class="block grid g2">
      <div class="card"><div class="head"><h3 class="px" style="color:var(--accent)">SUBIENDO ▲</h3><a class="all" href="#/tendencias">TODO ›</a></div>
        <div class="plist">${D.agregados.slice(0, 6).map(id => J[id] && prow(J[id], `<span class="bar"><i style="width:${pct(J[id].add, 'add')}%"></i></span>`)).join('')}</div></div>
      <div class="card"><div class="head"><h3 class="px" style="color:var(--bad)">LESIONADOS</h3><a class="all" href="#/lesionados">TODO ›</a></div>
        <div class="plist">${D.lesionados.slice(0, 6).map(x => J[x.id] && prow(J[x.id], pillSt(J[x.id]))).join('')}</div></div>
    </section>
    ${duelo()}
    <section class="block"><div class="head"><h2 class="px">EQUIPOS</h2><a class="all" href="#/equipos">VER LOS 32 ›</a></div>${teamGrid()}</section>
  </div></div>`;
}
const tickerItems = () => D.noticias.map(n => `<a href="#/reportaje/${n.id}">${esc(n.titulo)}</a><span style="color:var(--accent)">■</span>`).join('');
const maxT = {};
function pct(v, k) { maxT[k] = maxT[k] || Math.max(1, ...P.map(j => j[k] || 0)); return Math.max(4, Math.round((v || 0) / maxT[k] * 100)); }

function duelo() {
  const d = D.duelo || {};
  if (!d.a || d.a === '—') return '';
  const find = name => P.find(j => j.n && j.n.toLowerCase() === String(name).toLowerCase());
  const a = find(d.a), b = find(d.b);
  return `<section class="block" id="startsit"><div class="head"><h2 class="px">START / <span>SIT</span></h2><small class="px">ELIGE Y VE EL VEREDICTO</small></div>
    <div class="card" style="border-color:var(--accent)">
      <div class="duel"><button class="pick" type="button" data-l="a">${esc(d.a)}<small></small></button><span class="px vs" style="color:var(--gray)">VS</span><button class="pick" type="button" data-l="b">${esc(d.b)}<small></small></button></div>
      <div class="verdict" id="verdict"><b>VEREDICTO DEL EXPERTO</b><p>${esc(d.veredicto)}</p>
        <span style="display:flex;flex-wrap:wrap;gap:10px">${a ? `<a class="btn ghost" href="#/jugador/${a.id}">FICHA ${esc(a.n.split(' ').pop().toUpperCase())}</a>` : ''}${b ? `<a class="btn ghost" href="#/jugador/${b.id}">FICHA ${esc(b.n.split(' ').pop().toUpperCase())}</a>` : ''}${a && b ? `<a class="btn" href="#/comparar/${a.id}/${b.id}">COMPARAR A FONDO</a>` : ''}</span></div>
    </div></section>`;
}
function teamGrid() {
  const conteo = {};
  P.forEach(j => { if (EQUIPOS[j.team]) { conteo[j.team] = conteo[j.team] || { n: 0, les: 0 }; conteo[j.team].n++; if (estatus(j) !== 'Sano') conteo[j.team].les++; } });
  return `<div class="teamgrid stagger">${Object.keys(EQUIPOS).sort().map(t => `<a class="teamtile" href="#/equipo/${t}"><b>${t}</b><span>${EQUIPOS[t]}</span><small>${conteo[t] ? conteo[t].n + ' jugadores' + (conteo[t].les ? ' · ' + conteo[t].les + ' lesionados' : '') : '—'}</small></a>`).join('')}</div>`;
}

function reportajes(q) {
  titulo('Reportajes');
  const f = q.get('tipo') || 'TODO';
  const lista = D.noticias.filter(n => f === 'TODO' || n.etiqueta === f);
  return `<div class="page">${crumbs([['', 'Reportajes']])}<div class="wrap"><section class="block">
    <div class="head"><h2 class="px">REPORTAJES <span>FX</span></h2><small class="px">${esc(actualizado())}</small></div>
    <div class="chips">${['TODO', ...ETIQUETAS].map(t => `<a class="chip ${t === f ? 'on' : ''}" href="#/reportajes${t === 'TODO' ? '' : '?tipo=' + encodeURIComponent(t)}">${t}</a>`).join('')}</div>
    <div class="news stagger">${lista.map((n, i) => newsCard(n, i === 0 && f === 'TODO')).join('') || '<div class="empty">No hay reportajes de este tipo hoy.</div>'}</div>
  </section></div></div>`;
}

function reportaje(id) {
  const n = D.noticias.find(x => x.id === id);
  if (!n) return noEncontrado();
  titulo(n.titulo);
  const jug = (n.jugadores || []).map(x => J[x]).filter(Boolean);
  const rel = D.noticias.filter(x => x.id !== id && (x.etiqueta === n.etiqueta || (x.jugadores || []).some(p => (n.jugadores || []).includes(p)))).slice(0, 3);
  const i = D.noticias.indexOf(n), sig = D.noticias[i + 1], ant = D.noticias[i - 1];
  return `<div class="page">${crumbs([['#/reportajes', 'Reportajes'], ['', n.etiqueta]])}<div class="wrap"><div class="article">
    <article>
      <a class="lbl ${esc(n.etiqueta)}" href="#/reportajes?tipo=${encodeURIComponent(n.etiqueta)}" style="text-decoration:none">${esc(n.etiqueta)}</a>
      <h1>${esc(n.titulo)}</h1>
      <div class="byline"><span class="px" style="font-size:8px;color:var(--accent)">FX · EXPERTOS</span><span>${esc(actualizado())}</span></div>
      <div class="body"><p>${esc(n.cuerpo)}</p></div>
      <div style="display:flex;flex-wrap:wrap;gap:10px;margin-top:12px">
        ${ant ? `<a class="btn ghost" href="#/reportaje/${ant.id}">‹ ANTERIOR</a>` : ''}${sig ? `<a class="btn" href="#/reportaje/${sig.id}">SIGUIENTE ›</a>` : ''}
      </div>
    </article>
    <aside class="grid" style="align-content:start">
      <div class="card"><h3 class="px" style="color:var(--accent)">JUGADORES EN ESTA NOTA</h3><p class="sub">Toca para ver su ficha completa.</p>
        <div class="plist">${jug.map(j => prow(j, `<span class="num">${n1(j.prom)}</span>`)).join('') || '<p class="sub">Sin jugadores ligados.</p>'}</div>
        ${jug.length >= 2 ? `<p style="margin:14px 0 0"><a class="btn" href="#/comparar/${jug[0].id}/${jug[1].id}">COMPARAR ${esc(jug[0].n.split(' ').pop().toUpperCase())} VS ${esc(jug[1].n.split(' ').pop().toUpperCase())}</a></p>` : ''}
      </div>
      ${jug[0] && EQUIPOS[jug[0].team] ? `<a class="teamtile" href="#/equipo/${jug[0].team}"><small>EQUIPO RELACIONADO</small><b>${jug[0].team}</b><span>${EQUIPOS[jug[0].team]} ›</span></a>` : ''}
    </aside>
  </div>
  ${rel.length ? `<section class="block"><div class="head"><h2 class="px">SIGUE <span>LEYENDO</span></h2></div><div class="news stagger">${rel.map(x => newsCard(x)).join('')}</div></section>` : ''}
  </div></div>`;
}

function jugador(id) {
  const j = J[id];
  if (!j) return noEncontrado();
  titulo(j.n);
  const st = estatus(j);
  const notas = noticiasDe(id);
  const comp = P.filter(x => x.team === j.team && x.id !== id).sort((a, b) => (a.rank || 1e9) - (b.rank || 1e9)).slice(0, 6);
  const mismos = P.filter(x => x.pos === j.pos).sort((a, b) => (a.rank || 1e9) - (b.rank || 1e9));
  const k = mismos.indexOf(j);
  const vecinos = mismos.slice(Math.max(0, k - 3), k + 4).filter(x => x.id !== id).slice(0, 6);
  const hist = j.hist || [], semanas = D.semanas || hist.map((_, i) => i + 1);
  const max = Math.max(10, ...hist.filter(v => v != null));
  const kpiSt = st === 'Sano' ? '' : st === 'Duda' ? 'warn' : 'bad';
  return `<div class="page">${crumbs([['#/posicion/' + j.pos, POSICIONES[j.pos] || j.pos], ['', j.n]])}<div class="wrap">
    <div class="phead">${helmet(j.num, 96)}
      <div><div class="tags"><a class="pos" href="#/posicion/${j.pos}">${esc(j.pos)}</a>${EQUIPOS[j.team] ? `<a class="team" href="#/equipo/${j.team}">${esc(EQUIPOS[j.team])} ›</a>` : '<span class="team">Agente libre</span>'}</div>
        <h1>${esc(j.n)}</h1><div class="tags">${pillSt(j)}${j.num ? `<span class="team">#${esc(j.num)}</span>` : ''}</div></div>
      <div class="actions">${vecinos[0] ? `<a class="btn" href="#/comparar/${id}/${vecinos[0].id}">COMPARAR</a>` : ''}<a class="btn ghost" href="#/posicion/${j.pos}">RANKING ${esc(j.pos)}</a></div>
    </div>
    ${st !== 'Sano' ? `<div class="alert ${st}"><b>${st === 'Duda' ? 'EN DUDA' : 'FUERA'}${j.injParte ? ' · ' + esc(j.injParte).toUpperCase() : ''}</b><p>${esc(j.injNota || 'Sin detalle adicional del reporte de lesiones.')}</p></div>` : ''}
    <div class="kpis stagger">
      <div class="kpi"><b>${esc(rp(j))}</b><span>RANKING EN SU POSICIÓN</span></div>
      <div class="kpi"><b>${n1(j.prom)}</b><span>PROMEDIO PPR · ${hist.filter(v => v != null).length} SEM</span></div>
      <div class="kpi"><b>${n1(ultima(j))}</b><span>ÚLTIMO PARTIDO</span></div>
      <div class="kpi ${j.add ? '' : j.drop ? 'bad' : ''}"><b>${j.add ? '▲ ' + nf.format(j.add) : j.drop ? '▼ ' + nf.format(j.drop) : '–'}</b><span>${j.add ? 'AGREGADO EN 24 H' : j.drop ? 'SOLTADO EN 24 H' : 'SIN MOVIMIENTO HOY'}</span></div>
      <div class="kpi ${kpiSt}"><b>${st.toUpperCase()}</b><span>ESTATUS</span></div>
    </div>
    <div class="grid g2">
      <div class="card"><h3 class="px">PUNTOS POR SEMANA</h3><p class="sub">Formato PPR. Barra gris = no jugó o sin puntos.</p>
        <div class="chart">${hist.map(v => `<div class="col"><em>${v == null ? '–' : n1(v)}</em><i class="${v ? '' : 'zero'}" style="${v ? 'height:' + Math.round(v / max * 150) + 'px' : ''}"></i></div>`).join('')}</div>
        <div class="chart-x">${semanas.map(w => `<span>S${w}</span>`).join('')}</div></div>
      <div class="card"><h3 class="px">FICHA</h3><p class="sub">Datos del jugador.</p>
        <div class="bio"><div><small>EDAD</small><b>${esc(j.edad ?? '–')}</b></div><div><small>EXPERIENCIA</small><b>${j.exp != null ? (j.exp === 0 ? 'Novato' : esc(j.exp) + ' años') : '–'}</b></div>
        <div><small>ESTATURA</small><b>${altura(j.alt)}</b></div><div><small>PESO</small><b>${j.peso ? esc(j.peso) + ' lb' : '–'}</b></div>
        <div style="grid-column:1/-1"><small>UNIVERSIDAD</small><b>${esc(j.col || '–')}</b></div></div></div>
    </div>
    <section class="block"><div class="head"><h2 class="px">REPORTAJES <span>SOBRE ÉL</span></h2></div>
      <div class="news stagger">${notas.map(n => newsCard(n)).join('') || '<div class="empty">Hoy no hay reportajes sobre este jugador.</div>'}</div></section>
    <section class="block grid g2">
      <div class="card"><h3 class="px" style="color:var(--accent)">${esc(j.pos)} CERCA EN EL RANKING</h3><p class="sub">Alternativas parecidas. Toca para comparar.</p>
        <div class="plist">${vecinos.map(v => prow(v, `<a class="chip" href="#/comparar/${id}/${v.id}" onclick="event.stopPropagation()">VS</a>`)).join('')}</div></div>
      <div class="card"><h3 class="px">COMPAÑEROS EN ${esc(j.team)}</h3><p class="sub">Su ofensiva en fantasy.</p>
        <div class="plist">${comp.map(c => prow(c, pillSt(c))).join('') || '<p class="sub">Sin compañeros registrados.</p>'}</div></div>
    </section>
  </div></div>`;
}

function comparar(a, b) {
  const x = J[a], y = J[b];
  if (!x || !y) return noEncontrado();
  titulo(x.n + ' vs ' + y.n);
  const filas = [
    ['RANKING', (x.rank || 1e9), (y.rank || 1e9), rp(x), rp(y), 'bajo'],
    ['PROMEDIO PPR', x.prom ?? -1, y.prom ?? -1, n1(x.prom), n1(y.prom), 'alto'],
    ['ÚLTIMO PARTIDO', ultima(x) ?? -1, ultima(y) ?? -1, n1(ultima(x)), n1(ultima(y)), 'alto'],
    ['AGREGADO 24 H', x.add, y.add, nf.format(x.add || 0), nf.format(y.add || 0), 'alto'],
    ['ESTATUS', estatus(x) === 'Sano' ? 1 : 0, estatus(y) === 'Sano' ? 1 : 0, estatus(x), estatus(y), 'alto'],
    ['EDAD', 0, 0, x.edad ?? '–', y.edad ?? '–', ''],
    ['EXPERIENCIA', 0, 0, (x.exp ?? '–') + ' años', (y.exp ?? '–') + ' años', '']
  ];
  let px = 0, py = 0;
  const rows = filas.map(([l, vx, vy, tx, ty, m]) => {
    let wx = false, wy = false;
    if (m && vx !== vy) { const xGana = m === 'alto' ? vx > vy : vx < vy; wx = xGana; wy = !xGana; if (xGana) px++; else py++; }
    return `<div class="cmp-row"><span class="${wx ? 'w' : ''}">${esc(tx)}</span><span>${l}</span><span class="${wy ? 'w' : ''}">${esc(ty)}</span></div>`;
  }).join('');
  const ganador = px === py ? null : px > py ? x : y;
  const hx = x.hist || [], hy = y.hist || [], max = Math.max(10, ...hx.concat(hy).filter(v => v != null));
  const barras = (h, c) => h.map(v => `<div class="col"><em>${v == null ? '–' : n1(v)}</em><i class="${v ? '' : 'zero'}" style="${v ? 'height:' + Math.round(v / max * 120) + 'px;background:' + c : ''}"></i></div>`).join('');
  return `<div class="page">${crumbs([['#/jugador/' + x.id, x.n], ['', 'Comparar']])}<div class="wrap">
    <section class="block"><div class="head"><h2 class="px">CARA A <span>CARA</span></h2></div>
      <div class="vsgrid">
        <div class="card side">${prow(x, pillSt(x))}</div><span class="px" style="align-self:center;color:var(--gray)">VS</span><div class="card side">${prow(y, pillSt(y))}</div>
      </div>
      <div class="card" style="margin-top:18px">${rows}
        <div class="verdict show" style="margin-top:20px"><b>${ganador ? 'VENTAJA: ' + esc(ganador.n).toUpperCase() : 'EMPATE TÉCNICO'}</b>
        <p>${ganador ? `Gana ${Math.max(px, py)} de ${px + py} categorías medibles. Revisa su reporte de lesión y los reportajes del día antes de decidir.` : 'Están parejos en los números. Decide por el rival de la semana y los reportajes del día.'}</p></div>
      </div>
      <div class="grid g2" style="margin-top:18px">
        <div class="card"><h3 class="px">${esc(x.n.split(' ').pop().toUpperCase())} · PUNTOS</h3><div class="chart" style="height:170px">${barras(hx, 'var(--accent)')}</div></div>
        <div class="card"><h3 class="px">${esc(y.n.split(' ').pop().toUpperCase())} · PUNTOS</h3><div class="chart" style="height:170px">${barras(hy, 'var(--gray)')}</div></div>
      </div>
    </section></div></div>`;
}

function posicion(p, q) {
  if (!POSICIONES[p]) return noEncontrado();
  titulo(POSICIONES[p]);
  return `<div class="page">${crumbs([['', POSICIONES[p]]])}<div class="wrap"><section class="block">
    <div class="head"><h2 class="px">RANKING <span>${p}</span></h2><small class="px">${esc(actualizado())}</small></div>
    <div class="chips">${Object.keys(POSICIONES).map(x => `<a class="chip ${x === p ? 'on' : ''}" href="#/posicion/${x}">${x}</a>`).join('')}</div>
    <div class="tools"><input id="filtro" type="search" placeholder="Filtrar por nombre o equipo…" aria-label="Filtrar jugadores">
      <span class="chips" style="margin:0" id="fst">${['TODOS', 'Sano', 'Duda', 'Fuera'].map((s, i) => `<button type="button" class="chip ${i ? '' : 'on'}" data-s="${s}">${s.toUpperCase()}</button>`).join('')}</span></div>
    <div class="card scroll"><table class="tbl"><thead><tr>
      <th><button data-k="rank" class="on">#</button></th><th>JUGADOR</th><th><button data-k="team">EQUIPO</button></th><th>ESTATUS</th>
      <th><button data-k="prom">PROM</button></th><th><button data-k="ult">ÚLTIMO</button></th><th>TENDENCIA</th><th><button data-k="add">AGREGADO</button></th>
    </tr></thead><tbody id="tb"></tbody></table></div>
  </section></div></div>`;
}
function montaTabla(p) {
  let orden = 'rank', est = 'TODOS';
  const base = P.filter(j => j.pos === p);
  const pinta = () => {
    const f = ($('#filtro').value || '').toLowerCase();
    const val = (j, k) => k === 'ult' ? (ultima(j) ?? -1) : k === 'rank' ? -(j.rank || 1e9) : k === 'team' ? j.team : (j[k] ?? -1);
    const lista = base.filter(j => (est === 'TODOS' || estatus(j) === est) && (!f || j.n.toLowerCase().includes(f) || j.team.toLowerCase().includes(f) || (EQUIPOS[j.team] || '').toLowerCase().includes(f)))
      .sort((a, b) => { const va = val(a, orden), vb = val(b, orden); return orden === 'team' ? String(va).localeCompare(vb) : vb - va; });
    $('#tb').innerHTML = lista.map(j => `<tr data-id="${j.id}"><td class="n">${RANKPOS[j.id] || '–'}</td>
      <td><span style="display:flex;align-items:center;gap:10px">${helmet(j.num, 30)}<span class="pname">${esc(j.n)}</span></span></td>
      <td><a class="team" href="#/equipo/${j.team}" onclick="event.stopPropagation()">${esc(j.team)}</a></td><td>${pillSt(j)}</td>
      <td class="n">${n1(j.prom)}</td><td class="n">${n1(ultima(j))}</td><td>${spark(j.hist)}</td>
      <td class="n" style="color:${j.add ? 'var(--accent)' : j.drop ? 'var(--bad)' : 'var(--mute)'}">${j.add ? '▲' + nf.format(j.add) : j.drop ? '▼' + nf.format(j.drop) : '–'}</td></tr>`).join('')
      || '<tr><td colspan="8"><div class="empty">Ningún jugador coincide.</div></td></tr>';
    $('#tb').querySelectorAll('tr[data-id]').forEach(tr => tr.onclick = () => { location.hash = '#/jugador/' + tr.dataset.id; });
  };
  $('#filtro').oninput = pinta;
  document.querySelectorAll('.tbl th button').forEach(b => b.onclick = () => { orden = b.dataset.k; document.querySelectorAll('.tbl th button').forEach(x => x.classList.toggle('on', x === b)); pinta(); });
  document.querySelectorAll('#fst button').forEach(b => b.onclick = () => { est = b.dataset.s; document.querySelectorAll('#fst button').forEach(x => x.classList.toggle('on', x === b)); pinta(); });
  pinta();
}

function equipos() {
  titulo('Equipos');
  return `<div class="page">${crumbs([['', 'Equipos']])}<div class="wrap"><section class="block"><div class="head"><h2 class="px">LOS <span>32</span></h2><small class="px">TOCA UN EQUIPO</small></div>${teamGrid()}</section></div></div>`;
}
function equipo(t) {
  if (!EQUIPOS[t]) return noEncontrado();
  titulo(EQUIPOS[t]);
  const roster = P.filter(j => j.team === t).sort((a, b) => (a.rank || 1e9) - (b.rank || 1e9));
  const ids = new Set(roster.map(j => j.id));
  const notas = D.noticias.filter(n => (n.jugadores || []).some(id => ids.has(id)));
  const les = roster.filter(j => estatus(j) !== 'Sano');
  const grupos = Object.keys(POSICIONES).map(p => {
    const g = roster.filter(j => j.pos === p);
    return g.length ? `<div class="card"><h3 class="px" style="color:var(--accent)">${p}</h3><p class="sub">${POSICIONES[p]}</p><div class="plist">${g.map(j => prow(j, `<span class="num">${n1(j.prom)}</span>`)).join('')}</div></div>` : '';
  }).join('');
  return `<div class="page">${crumbs([['#/equipos', 'Equipos'], ['', t]])}<div class="wrap">
    <div class="phead"><div><div class="tags"><span class="pos">${t}</span></div><h1>${esc(EQUIPOS[t])}</h1><div class="tags"><span class="team">${roster.length} jugadores de fantasy · ${les.length} con reporte de lesión</span></div></div></div>
    ${les.length ? `<div class="alert"><b>REPORTE DE LESIONES</b><p>${les.map(j => `<a href="#/jugador/${j.id}">${esc(j.n)}</a> (${estatus(j)})`).join(' · ')}</p></div>` : ''}
    <section class="block"><div class="head"><h2 class="px">PLANTEL <span>FANTASY</span></h2><small class="px">PROMEDIO PPR</small></div><div class="grid g3 stagger">${grupos || '<div class="empty">Sin jugadores registrados.</div>'}</div></section>
    <section class="block"><div class="head"><h2 class="px">REPORTAJES <span>DEL EQUIPO</span></h2></div><div class="news stagger">${notas.map(n => newsCard(n)).join('') || '<div class="empty">Hoy no hay reportajes de este equipo.</div>'}</div></section>
  </div></div>`;
}
function tendencias() {
  titulo('Tendencias');
  return `<div class="page">${crumbs([['', 'Tendencias']])}<div class="wrap"><section class="block grid g2">
    <div class="card"><h3 class="px" style="color:var(--accent)">MÁS AGREGADOS ▲</h3><p class="sub">Últimas 24 horas en ligas de Sleeper.</p>
      <div class="plist">${D.agregados.map((id, i) => J[id] && prow(J[id], `<span class="bar"><i style="width:${pct(J[id].add, 'add')}%"></i></span><span class="num">${nf.format(J[id].add)}</span>`, i + 1)).join('')}</div></div>
    <div class="card"><h3 class="px" style="color:var(--bad)">MÁS SOLTADOS ▼</h3><p class="sub">A quién están dejando ir.</p>
      <div class="plist">${D.soltados.map((id, i) => J[id] && prow(J[id], `<span class="bar down"><i style="width:${pct(J[id].drop, 'drop')}%"></i></span><span class="num" style="color:var(--bad)">${nf.format(J[id].drop)}</span>`, i + 1)).join('') || '<p class="sub">Sin datos hoy.</p>'}</div></div>
  </section></div></div>`;
}
function lesionados(q) {
  titulo('Lesionados');
  const f = q.get('estatus') || 'TODOS';
  const lista = P.filter(j => estatus(j) !== 'Sano' && (f === 'TODOS' || estatus(j) === f)).sort((a, b) => (a.rank || 1e9) - (b.rank || 1e9));
  return `<div class="page">${crumbs([['', 'Lesionados']])}<div class="wrap"><section class="block">
    <div class="head"><h2 class="px">REPORTE DE <span>LESIONES</span></h2><small class="px">${lista.length} JUGADORES</small></div>
    <div class="chips">${['TODOS', 'Duda', 'Fuera'].map(s => `<a class="chip ${s === f ? 'on' : ''}" href="#/lesionados${s === 'TODOS' ? '' : '?estatus=' + s}">${s.toUpperCase()}</a>`).join('')}</div>
    <div class="card"><div class="plist">${lista.map(j => prow(j, `${j.injParte ? `<span class="team">${esc(j.injParte)}</span>` : ''}${pillSt(j)}`)).join('') || '<div class="empty">Sin lesionados con este estatus.</div>'}</div></div>
  </section></div></div>`;
}
const noEncontrado = () => { titulo('No encontrado'); return `<div class="page wrap loading"><p class="px" style="color:var(--accent)">FUMBLE</p><p>Esta página no existe o el dato aún no llega.</p><a class="btn" href="#/">VOLVER AL INICIO</a></div>`; };
const actualizado = () => { const f = new Date(D.actualizado); return 'ACTUALIZADO ' + f.toLocaleString('es-MX', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).toUpperCase(); };

/* ---------- ROUTER ---------- */
let crtTimer;
function router() {
  const [ruta, qs] = (location.hash.slice(1) || '/').split('?');
  const q = new URLSearchParams(qs || '');
  const [, seccion, a, b] = ruta.split('/');
  clearInterval(crtTimer);
  let html;
  switch (seccion || '') {
    case '': html = inicio(); break;
    case 'reportajes': html = reportajes(q); break;
    case 'reportaje': html = reportaje(a); break;
    case 'jugador': html = jugador(a); break;
    case 'comparar': html = comparar(a, b); break;
    case 'posicion': html = posicion(a, q); break;
    case 'equipos': html = equipos(); break;
    case 'equipo': html = equipo(a); break;
    case 'tendencias': html = tendencias(); break;
    case 'lesionados': html = lesionados(q); break;
    default: html = noEncontrado();
  }
  app.innerHTML = html;
  scrollTo({ top: 0 });
  document.querySelectorAll('.links a').forEach(l => l.classList.toggle('act', l.dataset.s === (seccion || '') || (seccion === 'reportaje' && l.dataset.s === 'reportajes')));
  if (seccion === 'posicion') montaTabla(a);
  if (!seccion) arrancaCRT();
  document.querySelectorAll('.pick').forEach(btn => btn.onclick = () => {
    document.querySelectorAll('.pick').forEach(x => { x.classList.toggle('win', x === btn); $('small', x).textContent = x === btn ? 'TU ELECCIÓN' : ''; });
    $('#verdict').classList.add('show');
    try { localStorage.setItem('fx-duelo', D.actualizado.slice(0, 10) + btn.dataset.l); } catch (e) {}
  });
}
function arrancaCRT() {
  const L = D.noticias; if (!L.length) return;
  let i = 0;
  const pasa = () => {
    const n = L[i % L.length];
    $('#crt-titulo').textContent = n.titulo; $('#crt-link').href = '#/reportaje/' + n.id;
    $('#crt-n').textContent = String(i % L.length + 1).padStart(2, '0') + '/' + String(L.length).padStart(2, '0');
    $('#crt-dots').innerHTML = L.map((_, k) => `<i class="${k === i % L.length ? 'on' : ''}"></i>`).join('');
    i++;
  };
  pasa(); crtTimer = setInterval(pasa, 4500);
}

/* ---------- BUSCADOR ---------- */
function buscador() {
  const inp = $('#q'), box = $('#sugg');
  let sel = -1, res = [];
  const pinta = () => {
    box.innerHTML = res.map((j, i) => `<a href="#/jugador/${j.id}" class="${i === sel ? 'sel' : ''}">${helmet(j.num, 28)}<span>${esc(j.n)}</span><span class="pos">${esc(j.pos)}</span><span class="team">${esc(j.team)}</span></a>`).join('')
      + Object.keys(EQUIPOS).filter(t => inp.value.length > 1 && (t.toLowerCase() === inp.value.toLowerCase() || EQUIPOS[t].toLowerCase().includes(inp.value.toLowerCase()))).slice(0, 3)
        .map(t => `<a href="#/equipo/${t}"><span class="pos">${t}</span><span>${EQUIPOS[t]}</span><span class="team">EQUIPO</span></a>`).join('');
    box.classList.toggle('on', !!box.innerHTML);
  };
  inp.oninput = () => {
    const v = inp.value.trim().toLowerCase(); sel = -1;
    res = v.length < 2 ? [] : P.filter(j => j.n.toLowerCase().includes(v)).sort((a, b) => (a.rank || 1e9) - (b.rank || 1e9)).slice(0, 8);
    pinta();
  };
  inp.onkeydown = e => {
    const links = box.querySelectorAll('a');
    if (e.key === 'ArrowDown') { sel = Math.min(links.length - 1, sel + 1); e.preventDefault(); pinta(); }
    else if (e.key === 'ArrowUp') { sel = Math.max(0, sel - 1); e.preventDefault(); pinta(); }
    else if (e.key === 'Enter' && links[Math.max(0, sel)]) { location.hash = links[Math.max(0, sel)].getAttribute('href'); cierra(); }
    else if (e.key === 'Escape') cierra();
  };
  const cierra = () => { box.classList.remove('on'); inp.value = ''; inp.blur(); };
  box.onclick = cierra;
  document.addEventListener('click', e => { if (!e.target.closest('.search')) box.classList.remove('on'); });
}

/* ---------- ARRANQUE ---------- */
Promise.all([
  fetch('data/hoy.json?v=' + Date.now()).then(r => r.json()),
  fetch('data/jugadores.json?v=' + Date.now()).then(r => r.ok ? r.json() : []).catch(() => [])
]).then(([hoy, jugadores]) => {
  P = Array.isArray(jugadores) ? jugadores : [];
  P.forEach(j => J[j.id] = j);
  Object.keys(POSICIONES).forEach(p => P.filter(j => j.pos === p && j.rank).sort((a, b) => a.rank - b.rank).forEach((j, i) => RANKPOS[j.id] = i + 1));
  // Acepta el formato anterior mientras el motor publica el nuevo
  hoy.noticias = (hoy.noticias || []).map((n, i) => typeof n === 'string' ? { id: 'r' + (i + 1), titulo: n, cuerpo: n, etiqueta: 'TENDENCIA', jugadores: [] } : { id: n.id || 'r' + (i + 1), ...n, jugadores: n.jugadores || [] });
  hoy.lesionados = (hoy.lesionados || []).filter(x => x.id);
  hoy.agregados = hoy.agregados || []; hoy.soltados = hoy.soltados || [];
  D = hoy;
  buscador();
  addEventListener('hashchange', router);
  router();
}).catch(e => { app.innerHTML = '<div class="wrap loading"><p class="px">SIN SEÑAL</p><p>No pudimos cargar los datos. Intenta de nuevo en un momento.</p></div>'; console.error(e); });
})();

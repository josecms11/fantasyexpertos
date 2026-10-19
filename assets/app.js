/* FANTASY EXPERTOS – app de navegación (todo se arma desde data/hoy.json y data/jugadores.json) */
(() => {
const $ = (s, el = document) => el.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const app = $('#app');

const EQUIPOS = { ARI: 'Arizona Cardinals', ATL: 'Atlanta Falcons', BAL: 'Baltimore Ravens', BUF: 'Buffalo Bills', CAR: 'Carolina Panthers', CHI: 'Chicago Bears', CIN: 'Cincinnati Bengals', CLE: 'Cleveland Browns', DAL: 'Dallas Cowboys', DEN: 'Denver Broncos', DET: 'Detroit Lions', GB: 'Green Bay Packers', HOU: 'Houston Texans', IND: 'Indianapolis Colts', JAX: 'Jacksonville Jaguars', KC: 'Kansas City Chiefs', LV: 'Las Vegas Raiders', LAC: 'Los Angeles Chargers', LAR: 'Los Angeles Rams', MIA: 'Miami Dolphins', MIN: 'Minnesota Vikings', NE: 'New England Patriots', NO: 'New Orleans Saints', NYG: 'New York Giants', NYJ: 'New York Jets', PHI: 'Philadelphia Eagles', PIT: 'Pittsburgh Steelers', SF: 'San Francisco 49ers', SEA: 'Seattle Seahawks', TB: 'Tampa Bay Buccaneers', TEN: 'Tennessee Titans', WAS: 'Washington Commanders' };
const COL = { ARI: ['#97233F', '#FFB612'], ATL: ['#A71930', '#101820'], BAL: ['#241773', '#9E7C0C'], BUF: ['#00338D', '#C60C30'], CAR: ['#0085CA', '#101820'], CHI: ['#0B162A', '#C83803'], CIN: ['#FB4F14', '#101820'], CLE: ['#311D00', '#FF3C00'], DAL: ['#003594', '#869397'], DEN: ['#FB4F14', '#002244'], DET: ['#0076B6', '#B0B7BC'], GB: ['#203731', '#FFB612'], HOU: ['#03202F', '#A71930'], IND: ['#002C5F', '#A2AAAD'], JAX: ['#006778', '#D7A22A'], KC: ['#E31837', '#FFB81C'], LV: ['#101820', '#A5ACAF'], LAC: ['#0080C6', '#FFC20E'], LAR: ['#003594', '#FFA300'], MIA: ['#008E97', '#FC4C02'], MIN: ['#4F2683', '#FFC62F'], NE: ['#002244', '#C60C30'], NO: ['#D3BC8D', '#101820'], NYG: ['#0B2265', '#A71930'], NYJ: ['#125740', '#FFFFFF'], PHI: ['#004C54', '#A5ACAF'], PIT: ['#FFB612', '#101820'], SF: ['#AA0000', '#B3995D'], SEA: ['#002244', '#69BE28'], TB: ['#D50A0A', '#FF7900'], TEN: ['#0C2340', '#4B92DB'], WAS: ['#5A1414', '#FFB612'] };
const col = t => COL[t] || ['#4A9A68', '#E8E8E8'];
const vars = t => `--c1:${col(t)[0]};--c2:${col(t)[1]}`;
const POSICIONES = { QB: 'Quarterbacks', RB: 'Running backs', WR: 'Receptores', TE: 'Alas cerradas', K: 'Pateadores' };
const ESTATUS = { Questionable: 'Duda', Doubtful: 'Duda', Out: 'Fuera', IR: 'Fuera', PUP: 'Fuera', Sus: 'Fuera' };
const ETIQUETAS = ['LESIÓN', 'WAIVER', 'ARRANCA', 'BANCA', 'TENDENCIA'];

let D = null, D0 = {}, P = [], J = {}, RANKPOS = {}, SEMIDX = -1, SEMNUM = null;

/* ---------- utilidades ---------- */
const estatus = j => ESTATUS[j.inj] || 'Sano';
const altura = a => { const h = parseInt(a, 10); return h ? Math.floor(h / 12) + "'" + (h % 12) + '"' : '–'; };
const n1 = v => v == null ? '–' : (Math.round(v * 10) / 10).toFixed(1);
const ultima = j => { const h = (j.hist || []).filter(x => x != null); return h.length ? h[h.length - 1] : null; };
const rp = j => RANKPOS[j.id] ? j.pos + RANKPOS[j.id] : j.pos;
const nf = new Intl.NumberFormat('es-MX');

function helmet(team, num, size = 44, flip = false, cls = '') {
  const [c1, c2] = col(team), t = String(num ?? '').slice(0, 2);
  const shell = [[4,1,6],[3,2,9],[2,3,11],[1,4,12],[1,5,12],[1,6,11],[1,7,11],[2,8,9],[3,9,6]]
    .map(([x, y, w]) => `<rect x="${x}" y="${y}" width="${w}" height="1" fill="${c1}"/>`).join('');
  const out = [[4,0,6],[3,1,1],[10,1,1],[2,2,1],[12,2,1],[1,3,1],[13,3,1],[0,4,1],[0,5,1],[0,6,1],[0,7,1],[1,8,1],[2,9,1],[3,10,6],[9,9,1]]
    .map(([x, y, w]) => `<rect x="${x}" y="${y}" width="${w}" height="1" fill="#0A1A10"/>`).join('');
  return `<svg class="hel ${cls}" width="${size}" height="${Math.round(size * 12 / 16)}" viewBox="0 0 16 12" aria-hidden="true" shape-rendering="crispEdges"${flip ? ' style="transform:scaleX(-1)"' : ''}>
    ${out}${shell}
    <rect x="4" y="1" width="6" height="1" fill="${c2}"/><rect x="10" y="2" width="2" height="1" fill="${c2}"/><rect x="12" y="3" width="1" height="1" fill="${c2}"/>
    <rect x="3" y="3" width="2" height="1" fill="#fff" opacity=".45"/><rect x="2" y="4" width="1" height="2" fill="#fff" opacity=".3"/>
    <rect x="4" y="5" width="2" height="2" fill="#0A1A10"/>
    <rect x="12" y="6" width="4" height="1" fill="#C9CDD1"/><rect x="11" y="9" width="5" height="1" fill="#C9CDD1"/>
    <rect x="15" y="6" width="1" height="4" fill="#C9CDD1"/><rect x="13" y="6" width="1" height="4" fill="#C9CDD1"/>
    ${t ? `<text x="8.6" y="7.7" font-size="2.9" font-family="'Press Start 2P', monospace" fill="${c2}" text-anchor="middle"${flip ? ' transform="scale(-1,1) translate(-17.2,0)"' : ''}>${esc(t)}</text>` : ''}</svg>`;
}
const impSprite = (imp, s = 22) => imp === 'SUBE'
  ? `<svg width="${s}" height="${s}" viewBox="0 0 7 7" shape-rendering="crispEdges" aria-hidden="true"><rect x="3" y="0" width="1" height="1" fill="#5BC489"/><rect x="2" y="1" width="3" height="1" fill="#5BC489"/><rect x="1" y="2" width="5" height="1" fill="#5BC489"/><rect x="0" y="3" width="7" height="1" fill="#5BC489"/><rect x="2" y="4" width="3" height="3" fill="#5BC489"/></svg>`
  : imp === 'BAJA'
  ? `<svg width="${s}" height="${s}" viewBox="0 0 7 7" shape-rendering="crispEdges" aria-hidden="true"><rect x="2" y="0" width="3" height="3" fill="#F08A7A"/><rect x="0" y="3" width="7" height="1" fill="#F08A7A"/><rect x="1" y="4" width="5" height="1" fill="#F08A7A"/><rect x="2" y="5" width="3" height="1" fill="#F08A7A"/><rect x="3" y="6" width="1" height="1" fill="#F08A7A"/></svg>`
  : `<svg width="${s}" height="${s}" viewBox="0 0 7 7" shape-rendering="crispEdges" aria-hidden="true"><rect x="0" y="3" width="7" height="1" fill="#E8E8E8"/></svg>`;

/* ---------- ESCENAS ANIMADAS (pixel art en colores del equipo) ---------- */
const SPR = {
  runA: ['..HHHH..', '.HHHHHM.', '.HHHHS..', '.JJJJJJ.', 'SJJNNJJB', '.JJJJJJB', '.JJJJJJ.', '..PPPP..', '..P..P..', '.L....L.', 'K......K'],
  runB: ['..HHHH..', '.HHHHHM.', '.HHHHS..', '.JJJJJJ.', 'SJJNNJJB', '.JJJJJJB', '.JJJJJJ.', '..PPPP..', '...PP...', '...LL...', '...KK...'],
  sit:  ['..HHHH..', '.HHHHHM.', '.HHHHS..', '.JJJJJJ.', 'SJJNNJJS', '.JJJJJJ.', '.PPPPPPP', '......LL', '......KK'],
  cart: ['....WWWW....', '...W....W...', 'WWWWWWWWWWWW', 'WWWWRRWWWWWW', 'WWWRRRRWWWWW', 'WWWWRRWWWWWW', 'WWWWWWWWWWWW', '.KK......KK.']
};
function sprite(grid, x, y, c1, c2) {
  const m = { H: c1, M: '#C9CDD1', S: '#C68B59', J: c1, N: c2, B: '#8B4A2B', P: '#E8E8E8', L: c1, K: '#101820', W: '#F5F3EA', R: '#E2463A' };
  let out = '';
  grid.forEach((row, j) => { [...row].forEach((ch, i) => { if (m[ch]) out += `<rect x="${x + i}" y="${y + j}" width="1" height="1" fill="${m[ch]}"/>`; }); });
  return out;
}
const corre = (x, y, c1, c2) => `<g>${sprite(SPR.runA, x, y, c1, c2)}<animate attributeName="opacity" values="1;0" dur=".36s" calcMode="discrete" repeatCount="indefinite"/></g><g opacity="0">${sprite(SPR.runB, x, y, c1, c2)}<animate attributeName="opacity" values="0;1" dur=".36s" calcMode="discrete" repeatCount="indefinite"/></g>`;
const cancha = (c1) => {
  let r = `<rect width="80" height="32" fill="#12441F"/>`;
  for (let i = 0; i < 80; i += 8) r += `<rect x="${i}" y="0" width="4" height="32" fill="#0F3A1E"/><rect x="${i}" y="0" width="1" height="32" fill="#ffffff" opacity=".22"/>`;
  return r;
};
function escena(tipo, team, num) {
  const [c1, c2] = col(team);
  const nombre = (EQUIPOS[team] || 'FANTASY EXPERTOS').toUpperCase();
  const id = 'e' + Math.random().toString(36).slice(2, 7);
  let z = '';
  if (tipo === 'ARRANCA') {
    z = cancha(c1) + `<rect x="66" y="0" width="14" height="32" fill="${c1}"/><rect x="66" y="0" width="1" height="32" fill="#fff"/>
      <text x="73" y="19" font-size="4" font-family="'Press Start 2P',monospace" fill="${c2}" text-anchor="middle" transform="rotate(-90 73 17)">${esc(team || 'FX')}</text>
      <g>${corre(0, 14, c1, c2)}<animateTransform attributeName="transform" type="translate" values="-10 0;60 0;60 0" keyTimes="0;.75;1" dur="3.2s" repeatCount="indefinite"/></g>
      <g opacity="0"><text x="40" y="10" font-size="6" font-family="'Press Start 2P',monospace" fill="${c2}" stroke="#101820" stroke-width=".6" text-anchor="middle" paint-order="stroke">TD!</text>
      <animate attributeName="opacity" values="0;0;1;1" keyTimes="0;.74;.76;1" dur="3.2s" calcMode="discrete" repeatCount="indefinite"/></g>`;
  } else if (tipo === 'LESIÓN') {
    z = cancha(c1) + `<g transform="translate(42 30) rotate(-90)">${sprite(SPR.runA, 0, 0, c1, c2)}</g>
      <g><rect x="49" y="10" width="2" height="6" fill="#E2463A"/><rect x="47" y="12" width="6" height="2" fill="#E2463A"/><animate attributeName="opacity" values="1;0" dur=".8s" calcMode="discrete" repeatCount="indefinite"/></g>
      <g><rect x="44" y="18" width="1" height="1" fill="#FFE27A"/><rect x="56" y="17" width="1" height="1" fill="#FFE27A"/>
        <animateTransform attributeName="transform" type="translate" values="0 0;2 -1;0 -2;-2 -1;0 0" dur="1s" calcMode="discrete" repeatCount="indefinite"/></g>
      <g>${sprite(SPR.cart, 0, 20, c1, c2)}<animateTransform attributeName="transform" type="translate" values="-14 0;22 0;22 0" keyTimes="0;.6;1" dur="4s" repeatCount="indefinite"/></g>`;
  } else if (tipo === 'BANCA') {
    z = `<rect width="80" height="32" fill="#0D2014"/><rect y="22" width="80" height="10" fill="#12441F"/>
      <rect x="18" y="20" width="44" height="2" fill="#8B4A2B"/><rect x="20" y="22" width="2" height="4" fill="#5A3019"/><rect x="58" y="22" width="2" height="4" fill="#5A3019"/>
      <rect x="10" y="4" width="60" height="8" fill="${c1}"/><text x="40" y="10" font-size="4" font-family="'Press Start 2P',monospace" fill="${c2}" text-anchor="middle">BANCA</text>
      ${sprite(SPR.sit, 26, 12, c1, c2)}${sprite(SPR.sit, 44, 12, c1, c2)}
      <g><text x="38" y="17" font-size="4" font-family="'Press Start 2P',monospace" fill="#E8E8E8">z</text><animateTransform attributeName="transform" type="translate" values="0 0;2 -4;4 -8" dur="1.6s" calcMode="discrete" repeatCount="indefinite"/><animate attributeName="opacity" values="1;.6;0" dur="1.6s" repeatCount="indefinite"/></g>`;
  } else if (tipo === 'WAIVER') {
    z = cancha(c1) + `<rect x="36" y="0" width="8" height="32" fill="${c2}" opacity=".25"><animate attributeName="opacity" values=".05;.45;.05" dur="1.4s" repeatCount="indefinite"/></rect>
      <g>${sprite(SPR.runA, 36, 14, c1, c2)}<animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.3;.85;1" dur="2.8s" repeatCount="indefinite"/></g>
      <g><text x="56" y="14" font-size="5" font-family="'Press Start 2P',monospace" fill="#5BC489" stroke="#101820" stroke-width=".5" paint-order="stroke">+ADD</text>
      <animateTransform attributeName="transform" type="translate" values="0 4;0 0;0 -2" dur="1.4s" repeatCount="indefinite"/></g>
      <g fill="#FFE27A"><rect x="32" y="12" width="1" height="1"/><rect x="47" y="18" width="1" height="1"/><rect x="34" y="24" width="1" height="1"/><animate attributeName="opacity" values="1;0" dur=".5s" calcMode="discrete" repeatCount="indefinite"/></g>`;
  } else {
    let gente = '';
    for (let y = 9; y < 22; y += 3) for (let x = 1; x < 80; x += 3) gente += `<rect x="${x}" y="${y + ((x + y) % 2)}" width="2" height="2" fill="${(x + y) % 3 ? c1 : c2}"/>`;
    z = `<defs><clipPath id="${id}"><rect x="12" y="1" width="56" height="6"/></clipPath></defs>
      <rect width="80" height="32" fill="#08140D"/>
      <g>${gente}<animateTransform attributeName="transform" type="translate" values="0 0;0 -1;0 0" dur=".5s" calcMode="discrete" repeatCount="indefinite"/></g>
      <rect y="24" width="80" height="8" fill="#12441F"/><rect y="24" width="80" height="1" fill="#E8E8E8" opacity=".5"/>
      <rect x="12" y="1" width="56" height="6" fill="#101820"/>
      <g clip-path="url(#${id})"><text y="6" font-size="4" font-family="'Press Start 2P',monospace" fill="#FFE27A">${esc(nombre)} · ${esc(nombre)}<animateTransform attributeName="transform" type="translate" values="68 0;-120 0" dur="6s" repeatCount="indefinite"/></text></g>
      <g fill="#FFF7C2"><rect x="2" y="1" width="3" height="2"/><rect x="75" y="1" width="3" height="2"/><animate attributeName="opacity" values="1;.4;1" dur=".9s" calcMode="discrete" repeatCount="indefinite"/></g>`;
  }
  return `<svg class="scene" viewBox="0 0 80 32" preserveAspectRatio="xMidYMid slice" shape-rendering="crispEdges" aria-hidden="true">${z}</svg>`;
}

const impBadge = imp => `<span class="imp ${imp}">${impSprite(imp)}${imp === 'SUBE' ? 'SUBE' : imp === 'BAJA' ? 'BAJA' : 'ESTABLE'}</span>`;
function prow(j, right = '', rk = '') {
  if (!j) return '';
  const st = estatus(j);
  return `<a class="prow" href="#/jugador/${j.id}">${rk ? `<span class="rk">${rk}</span>` : ''}${helmet(j.team, j.num, 36)}
    <span class="meta"><span class="pname">${esc(j.n)}</span><small>${esc(rp(j))} · ${esc(j.team)}${st !== 'Sano' ? ' · ' + st : ''}</small></span>
    <span class="right">${right}<span class="arrow">›</span></span></a>`;
}
const pillSt = j => { const s = estatus(j); return `<span class="pill ${s}">${s.toUpperCase()}</span>`; };
const spark = h => `<span class="spark" aria-hidden="true">${(h || []).map(v => `<i class="${v ? '' : 'z'}" style="height:${v ? Math.max(3, Math.min(22, v)) : 3}px"></i>`).join('')}</span>`;
const crumbs = items => `<div class="crumbs wrap">${[['#/', 'Inicio'], ...items].map((c, i, a) => i < a.length - 1 ? `<a href="${c[0]}">${esc(c[1])}</a><span>›</span>` : `<b>${esc(c[1])}</b>`).join('')}</div>`;
const newsCard = (n, big) => {
  const ps = (n.jugadores || []).map(id => J[id]).filter(Boolean);
  const t1 = n.equipo || (ps[0] && ps[0].team), p2 = ps.find(p => p.team !== t1);
  return `<a class="cart ${esc(n.etiqueta)} ${big ? 'big' : ''} ${n.exclusivo ? 'exclusivo' : ''}" href="#/noticia/${n.id}" style="${vars(t1)}">
    <span class="band">${escena(n.etiqueta, t1, ps[0] && ps[0].num)}${EQUIPOS[t1] ? `<span class="tm">${n.exclusivo ? '★ EXCLUSIVO · ' : ''}${esc(t1)}</span>` : n.exclusivo ? '<span class="tm">★ EXCLUSIVO</span>' : ''}
      <span class="hels">${helmet(t1, ps[0] && ps[0].num, big ? 110 : 54)}${p2 ? helmet(p2.team, p2.num, big ? 84 : 42, true, 'vs') : ''}</span>
      ${impBadge(n.impacto)}</span>
    <span class="in"><span class="tagx">${esc(n.etiqueta)}</span><h3>${esc(n.titulo)}</h3>
      <ul class="claves">${(n.claves || []).slice(0, 3).map(c => `<li>${esc(c)}</li>`).join('')}</ul>
      <span class="foot"><span class="who">${ps.slice(0, 4).map(p => helmet(p.team, p.num, 30)).join('')}</span><span class="go">VER JUGADA ›</span></span></span></a>`;
};
const noticiasDe = id => D.noticias.filter(n => (n.jugadores || []).includes(id));
const titulo = t => { document.title = t ? t + ' · Fantasy Expertos' : 'Fantasy Expertos'; };

/* ---------- PÁGINAS ---------- */
function bienvenida() {
  let visto = false; try { visto = localStorage.getItem('fx-bienvenida') === '1'; } catch (e) {}
  if (visto) return '';
  return `<section class="welcome" id="welcome">${escena('TENDENCIA', '', '')}
    <div class="w-in">
      <svg class="w-logo" width="120" height="80" viewBox="20 55 150 100" aria-hidden="true"><polygon points="69,58.5 166.5,58.5 153.5,82.2 83.5,82.2 49,151.7 23.7,151.7" fill="#E8E8E8"/><polygon points="90.5,94.5 146.2,94.5 133,118 79.2,118" fill="#4A9A68"/></svg>
      <div><p class="eyebrow px"><i class="blink"></i>BIENVENIDO AL VESTIDOR</p>
        <h1>El rincón del fan de fantasy football en español.</h1>
        <p class="lead">Marcadores en vivo, puntos de fantasy, noticias que se convierten en decisiones y herramientas para ganar tu liga. Todo se actualiza solo.</p>
        <div class="w-cta"><a class="btn" href="#/partidos">VER EN VIVO</a>${redBtn('tiktok', 'tt', 'TIKTOK')}${redBtn('youtube', 'yt', 'YOUTUBE')}${redBtn('instagramFX', 'ig', 'INSTAGRAM')}</div></div>
      <button class="w-close" type="button" aria-label="Cerrar bienvenida" onclick="try{localStorage.setItem('fx-bienvenida','1')}catch(e){};document.getElementById('welcome').remove()">✕</button>
    </div></section>`;
}
function liderSemana() {
  if (!SEMNUM) return '';
  return `<div class="wleaders">${Object.keys(POSICIONES).map(p => {
    const j = P.filter(x => x.pos === p && ptsSemana(x) != null).sort((a, b) => ptsSemana(b) - ptsSemana(a))[0];
    return j ? `<a class="wl" href="#/jugador/${j.id}" style="${vars(j.team)}"><span class="wl-pos px">${p}</span>${helmet(j.team, j.num, 52)}<span class="wl-n">${esc(j.n)}</span><span class="wl-t">${esc(j.team)}</span><b class="n">${n1(ptsSemana(j))}<small>PTS</small></b></a>` : '';
  }).join('')}</div>`;
}
function inicio() {
  titulo('');
  const top = D.noticias[0];
  const hubs = Object.keys(POSICIONES).map(p => {
    const lider = P.filter(j => j.pos === p).sort((a, b) => (b.total || 0) - (a.total || 0))[0];
    return `<a class="hub" href="#/posicion/${p}"><b>${p}</b><span>${POSICIONES[p]}</span>${lider ? `<small>LÍDER</small><span class="top">${esc(lider.n)}</span>` : ''}</a>`;
  }).join('');
  return `<div class="page">
  <div class="wrap">${bienvenida()}</div>
  <div class="ticker"><div class="tag px">ÚLTIMA HORA</div><div class="view"><div class="ticker-track">${tickerItems()}${tickerItems()}</div></div></div>
  <div class="wrap">
    <section class="block"><div class="head"><div><h2 class="px">EN VIVO <span>· SEMANA ${esc(G[0] ? G[0].semana : D.semana)}</span></h2><p class="hsub">Marcadores, posesión y puntos de fantasy al momento.</p></div><a class="all" href="#/partidos">TODOS LOS PARTIDOS ›</a></div>
      <div id="home-matches">${homeMatches()}</div></section>

    ${SEMNUM ? `<section class="block"><div class="head"><div><h2 class="px">LOS MEJORES <span>DE LA SEMANA ${esc(SEMNUM)}</span></h2><p class="hsub">El Nº1 en puntos ${FMTS[FMT]} de cada posición.</p></div><a class="all" href="#/lideres">TODOS LOS LÍDERES ›</a></div>${liderSemana()}</section>` : ''}

    <section class="block"><div class="head"><div><h2 class="px">LAS JUGADAS <span>DEL DÍA</span></h2><p class="hsub">Cada noticia aterrizada a tu alineación.</p></div><a class="all" href="#/noticias">VER LAS ${D.noticias.length} ›</a></div>
      <div class="news stagger">${top ? newsCard(top, true) : '<div class="empty">Las noticias llegan en el próximo ciclo.</div>'}${D.noticias.slice(1, 4).map(n => newsCard(n)).join('')}</div></section>

    <section class="block grid g2">
      <div class="card"><div class="head"><h3 class="px" style="color:var(--accent)">SUBIENDO ▲</h3><a class="all" href="#/tendencias">TODO ›</a></div><p class="sub">Los más agregados en las últimas 24 horas.</p>
        <div class="plist">${D.agregados.slice(0, 6).map(id => J[id] && prow(J[id], `<span class="bar"><i style="width:${pct(J[id].add, 'add')}%"></i></span>`)).join('')}</div></div>
      <div class="card"><div class="head"><h3 class="px" style="color:var(--bad)">LESIONADOS</h3><a class="all" href="#/lesionados">TODO ›</a></div><p class="sub">Los que más impactan tu fantasy, por puntos de temporada.</p>
        <div class="plist">${D.lesionados.map(x => J[x.id]).filter(Boolean).sort((a, b) => (b.total || 0) - (a.total || 0)).slice(0, 6).map(j => prow(j, pillSt(j))).join('')}</div></div>
    </section>
    ${duelo()}
    ${fxtv()}
    <section class="block"><div class="head"><div><h2 class="px">PROFUNDIZA <span>POR POSICIÓN</span></h2><p class="hsub">Rankings por puntos reales de la temporada.</p></div><a class="all" href="#/temporada">TEMPORADA COMPLETA ›</a></div><div class="grid g5 stagger">${hubs}</div></section>
    <section class="block"><div class="head"><div><h2 class="px">LOS <span>32 EQUIPOS</span></h2><p class="hsub">Plantel de fantasy, lesiones y noticias de cada uno.</p></div><a class="all" href="#/equipos">VER TODOS ›</a></div>${teamGrid()}</section>
  </div></div>`;
}
function marcha() {
  const vistos = new Set(), items = [];
  D.noticias.forEach(n => { const ps = (n.jugadores || []).map(x => J[x]).filter(Boolean); const t = n.equipo || (ps[0] && ps[0].team);
    if (t && EQUIPOS[t] && !vistos.has(t)) { vistos.add(t); items.push([t, n, ps[0]]); } });
  return items.map(([t, n, p], k) => `<a class="runner" href="#/noticia/${n.id}" style="animation-delay:${-k * (22 / Math.max(1, items.length))}s" title="${esc(n.titulo)}">${helmet(t, p && p.num, 64)}<span>${t}</span></a>`).join('');
}
const tickerItems = () => D.noticias.map(n => `<a href="#/noticia/${n.id}">${esc(n.titulo)}</a><span style="color:var(--accent)">■</span>`).join('');
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
function noticias(q) {
  titulo('Noticias');
  const f = q.get('tipo') || 'TODO';
  const lista = D.noticias.filter(n => f === 'TODO' || n.etiqueta === f);
  return `<div class="page">${crumbs([['', 'Noticias']])}<div class="wrap"><section class="block">
    <div class="head"><h2 class="px">NOTICIAS <span>FX</span></h2><small class="px">${esc(actualizado())}</small></div>
    <div class="chips">${['TODO', ...ETIQUETAS].map(t => `<a class="chip ${t === f ? 'on' : ''}" href="#/noticias${t === 'TODO' ? '' : '?tipo=' + encodeURIComponent(t)}">${t}</a>`).join('')}</div>
    <div class="news lista stagger">${lista.map((n, i) => newsCard(n, i === 0 && f === 'TODO')).join('') || '<div class="empty">No hay noticias de este tipo hoy.</div>'}</div>
  </section></div></div>`;
}

function noticia(id) {
  const n = D.noticias.find(x => x.id === id) || (D.archivo || []).find(x => x.id === id);
  if (!n) return noEncontrado();
  titulo(n.titulo);
  const jug = (n.jugadores || []).map(x => J[x]).filter(Boolean);
  const t1 = n.equipo || (jug[0] && jug[0].team);
  const otros = [...new Set(jug.map(j => j.team).filter(t => t && t !== t1))].slice(0, 2);
  const rel = D.noticias.filter(x => x.id !== id && (x.etiqueta === n.etiqueta || (x.jugadores || []).some(p => (n.jugadores || []).includes(p)))).slice(0, 3);
  const L = D.noticias.includes(n) ? D.noticias : D.archivo, i = L.indexOf(n), sig = L[i + 1], ant = L[i - 1];
  return `<div class="page">${crumbs([['#/noticias', 'Noticias'], ['', n.etiqueta]])}<div class="wrap">
    <div class="nhero scn" style="${vars(t1)}">${escena(n.etiqueta, t1, jug[0] && jug[0].num)}<div class="grid-in">
      <div class="hels">${helmet(t1, jug[0] && jug[0].num, 150, false, 'bob')}${otros.map(t => helmet(t, '', 120, true)).join('')}</div>
      <div class="txt"><span class="tagx" style="display:inline-block">${esc(n.etiqueta)}</span>${EQUIPOS[t1] ? ` <a class="px" href="#/equipo/${t1}" style="font-size:9px;color:#fff;background:rgba(0,0,0,.55);padding:6px 8px;text-decoration:none">${esc(EQUIPOS[t1])} ›</a>` : ''}
        <h1>${esc(n.titulo)}</h1></div>
      ${impBadge(n.impacto)}
    </div></div>
    <div class="kcards stagger">${(n.claves || []).map((c, k) => `<div class="kcard"><b>${k + 1}</b>${esc(c)}</div>`).join('')}</div>
    ${jug.length ? `<section class="block" style="padding-top:8px"><div class="head"><h2 class="px">JUGADORES EN <span>LA JUGADA</span></h2><small class="px">TOCA PARA VER SU CARTA</small></div>
      <div class="pchips stagger">${jug.map(j => `<a class="pchip" href="#/jugador/${j.id}" style="${vars(j.team)}">${helmet(j.team, j.num, 44)}<span>${esc(j.n)}<small>${esc(rp(j))} · ${esc(j.team)} · ${n1(j.prom)} pts</small></span></a>`).join('')}
      ${jug.length >= 2 ? `<a class="btn" href="#/comparar/${jug[0].id}/${jug[1].id}">⚔ CARA A CARA</a>` : ''}</div></section>` : ''}
    <section class="block" style="padding-top:8px"><details class="desglose"><summary><span>LEER EL DESGLOSE COMPLETO</span><span>›</span></summary><p>${esc(n.cuerpo)}</p></details>
      <div style="display:flex;flex-wrap:wrap;gap:10px;margin-top:14px">${ant ? `<a class="btn ghost" href="#/noticia/${ant.id}">‹ ANTERIOR</a>` : ''}${sig ? `<a class="btn" href="#/noticia/${sig.id}">SIGUIENTE JUGADA ›</a>` : ''}</div></section>
    <section class="block" style="padding-top:12px">${ctaRedes()}</section>
    ${rel.length ? `<section class="block"><div class="head"><h2 class="px">SIGUE LA <span>JUGADA</span></h2></div><div class="news stagger">${rel.map(x => newsCard(x)).join('')}</div></section>` : ''}
  </div></div>`;
}

/* ---------- FORMATOS, CALENDARIO, RIVALES Y START/SIT FX ---------- */
const FMTS = ['PPR', 'HALF PPR', 'STANDARD'];
let FMT = 0; try { FMT = +(localStorage.getItem('fx-fmt') || 0) || 0; } catch (e) {}
const DIVS = { AFC: { ESTE: ['BUF', 'MIA', 'NE', 'NYJ'], NORTE: ['BAL', 'CIN', 'CLE', 'PIT'], SUR: ['HOU', 'IND', 'JAX', 'TEN'], OESTE: ['DEN', 'KC', 'LV', 'LAC'] },
  NFC: { ESTE: ['DAL', 'NYG', 'PHI', 'WAS'], NORTE: ['CHI', 'DET', 'GB', 'MIN'], SUR: ['ATL', 'CAR', 'NO', 'TB'], OESTE: ['ARI', 'LAR', 'SF', 'SEA'] } };
const fxLogo = (s = 22) => `<svg width="${s}" height="${Math.round(s * .67)}" viewBox="20 55 150 100" aria-hidden="true"><polygon points="69,58.5 166.5,58.5 153.5,82.2 83.5,82.2 49,151.7 23.7,151.7" fill="#E8E8E8"/><polygon points="90.5,94.5 146.2,94.5 133,118 79.2,118" fill="#4A9A68"/></svg>`;
function aplicaFormato() {
  P.forEach(j => {
    if (!j.log) return;
    j.temp = j.log.map(l => l.f ? l.f[FMT] : null);
    const jug = j.temp.filter(v => v != null);
    j.total = jug.length ? Math.round(jug.reduce((a, b) => a + b, 0) * 10) / 10 : null;
    j.prom = jug.length ? Math.round(j.total / jug.length * 10) / 10 : null;
    const sem = D0.semanas || [];
    j.hist = sem.map(w => { const l = j.log.find(x => x.w === w); return l && l.f ? l.f[FMT] : null; });
  });
  RANKPOS = {};
  Object.keys(POSICIONES).forEach(p => P.filter(j => j.pos === p && j.total).sort((a, b) => b.total - a.total).forEach((j, i) => RANKPOS[j.id] = i + 1));
  document.querySelectorAll('.fmt button').forEach((b, i) => b.classList.toggle('on', i === FMT));
}
let _semObj = null;
const semActual = () => {
  if (_semObj) return _semObj;
  const c = D.cal && D.cal.cal; if (!c) return D.semana;
  // la semana a analizar es la primera donde la mayoría de los juegos aún no termina
  for (let w = 1; w <= 18; w++) { let tot = 0, pend = 0; Object.values(c).forEach(t => { if (t[w]) { tot++; if (!t[w].fin) pend++; } }); if (tot && pend / tot > .5) return (_semObj = w); }
  return (_semObj = 18);
};
const rivalDe = (team, w = semActual()) => D.cal && D.cal.cal && D.cal.cal[team] ? D.cal.cal[team][w] || null : null;
function estrellas(opp, pos) {
  const d = D.cal && D.cal.dvp && D.cal.dvp[opp] && D.cal.dvp[opp][pos];
  if (!d) return null;
  return { n: Math.max(1, Math.min(5, Math.ceil((33 - d.rank) / 6.4))), rank: d.rank, prom: d.prom };
}
const pintaEstrellas = e => e ? `<span class="stars s${e.n}" title="Defensa Nº${e.rank} en puntos permitidos (${n1(e.prom)} por juego)">${'★'.repeat(e.n)}<i>${'★'.repeat(5 - e.n)}</i></span>` : '<span class="stars">–</span>';
const rivalTxt = (team, w) => { const r = rivalDe(team, w); return r ? `${r.home ? 'vs' : '@'} ${r.opp}` : 'BYE'; };
const UMBRAL = { QB: [12, 18], RB: [24, 36], WR: [30, 42], TE: [12, 18], K: [12, 16] };
function veredicto(j) {
  const razones = []; const st = estatus(j);
  const r = rivalDe(j.team);
  if (!r) return { v: 'SIT', razones: ['Semana de descanso (BYE): no juega.'], e: null };
  if (st === 'Fuera') return { v: 'SIT', razones: ['Está fuera por lesión' + (j.injParte ? ' (' + j.injParte + ')' : '') + '.'], e: null };
  const mismos = P.filter(x => x.pos === j.pos && x.prom != null).sort((a, b) => b.prom - a.prom);
  let base = mismos.indexOf(j) + 1; if (!base) base = 99;
  let m = 1;
  const e = estrellas(r.opp, j.pos);
  if (e) { m *= [1.25, 1.1, 1, .9, .8][e.n - 1]; razones.push(`Rival ${r.home ? 'en casa' : 'de visita'} ${r.opp}: ${e.n >= 4 ? 'defensa que regala puntos' : e.n <= 2 ? 'defensa dura' : 'matchup neutral'} a ${j.pos} (Nº${e.rank} en puntos permitidos).`); }
  const h = (j.temp || []).filter(v => v != null), u3 = h.slice(-3);
  if (u3.length >= 2 && j.prom) { const f = u3.reduce((a, b) => a + b, 0) / u3.length / j.prom; if (f > 1.2) { m *= .9; razones.push('Viene en racha: sus últimas semanas superan su promedio.'); } else if (f < .8) { m *= 1.1; razones.push('Viene a la baja en sus últimas semanas.'); } }
  const nota = D.noticias.find(n => (n.jugadores || [])[0] === j.id);
  if (nota && nota.impacto === 'SUBE') { m *= .9; razones.push('Las noticias del día lo favorecen: «' + nota.titulo + '».'); }
  if (nota && nota.impacto === 'BAJA') { m *= 1.12; razones.push('Las noticias del día le pegan: «' + nota.titulo + '».'); }
  if (j.add && D.agregados.indexOf(j.id) > -1 && D.agregados.indexOf(j.id) < 8) { m *= .95; razones.push('La comunidad lo está agregando fuerte en las últimas 24 h.'); }
  if (j.drop) { m *= 1.05; razones.push('Lo están soltando en muchas ligas.'); }
  if (st === 'Duda') { m *= 1.2; razones.push('Está en duda: confirma su estatus antes del kickoff.'); }
  const adj = base * m, [t1, t2] = UMBRAL[j.pos] || [12, 18];
  razones.unshift(`Es el ${j.pos}${base} por promedio de puntos ${FMTS[FMT]} esta temporada.`);
  return { v: adj <= t1 ? 'START' : adj <= t2 ? 'FLEX' : 'SIT', razones, e, adj };
}
const fxPill = j => { const v = veredicto(j); return `<span class="fxv ${v.v}">${fxLogo(16)}${v.v === 'FLEX' ? 'FLEX' : v.v}</span>`; };
function recordDe(t) {
  const c = D.cal && D.cal.cal && D.cal.cal[t]; if (!c) return '';
  let g = 0, p = 0, e = 0; Object.values(c).forEach(x => { if (x.fin) { if (x.pf > x.pc) g++; else if (x.pf < x.pc) p++; else e++; } });
  return g + '-' + p + (e ? '-' + e : '');
}

function teamGrid() {
  const conteo = {};
  P.forEach(j => { if (EQUIPOS[j.team]) { conteo[j.team] = conteo[j.team] || { les: 0 }; if (estatus(j) !== 'Sano') conteo[j.team].les++; } });
  return `<div class="confs">${Object.entries(DIVS).map(([conf, divs]) => `<div class="conf"><h3 class="px conf-t">${conf}</h3>
    <div class="divs">${Object.entries(divs).map(([d, ts]) => `<div class="div"><h4 class="px">${conf} ${d}</h4>
      ${ts.slice().sort((a, b) => { const w = x => +(recordDe(x).split('-')[0] || 0); return w(b) - w(a); }).map(t => {
        const r = rivalDe(t);
        return `<a class="trow" href="#/equipo/${t}" style="${vars(t)}">${helmet(t, '', 40)}<span class="tt"><b>${EQUIPOS[t]}</b><small>${r ? 'S' + semActual() + ' ' + (r.home ? 'vs ' : '@ ') + r.opp : 'BYE'}${conteo[t] && conteo[t].les ? ' · ' + conteo[t].les + ' lesionados' : ''}</small></span><span class="rec n">${recordDe(t) || '–'}</span></a>`;
      }).join('')}</div>`).join('')}</div></div>`).join('')}</div>`;
}

function jugador(id) {
  const j = J[id];
  if (!j) return noEncontrado();
  titulo(j.n);
  const st = estatus(j), v = veredicto(j);
  const notas = noticiasDe(id);
  const comp = P.filter(x => x.team === j.team && x.id !== id).sort((a, b) => (b.total || 0) - (a.total || 0)).slice(0, 6);
  const mismos = P.filter(x => x.pos === j.pos).sort((a, b) => (b.total || 0) - (a.total || 0));
  const k = mismos.indexOf(j);
  const vecinos = mismos.slice(Math.max(0, k - 3), k + 4).filter(x => x.id !== id).slice(0, 6);
  const log = (j.log || []).slice().reverse();
  const hist = j.hist || [], semanas = D.semanas || [];
  const max = Math.max(10, ...hist.filter(x => x != null));
  const r = rivalDe(j.team);
  const prox = []; for (let w = semActual(); w < semActual() + 5 && w <= 18; w++) prox.push(w);
  const cols = j.pos === 'QB' ? [['py', 'YDS PASE'], ['ptd', 'TD P'], ['int', 'INT'], ['ry', 'YDS CAR'], ['rtd', 'TD C']]
    : j.pos === 'K' ? [['fgm', 'FG'], ['xpm', 'PAT']]
    : j.pos === 'RB' ? [['ra', 'ACAR'], ['ry', 'YDS CAR'], ['rtd', 'TD C'], ['rec', 'REC'], ['recy', 'YDS REC'], ['rectd', 'TD R']]
    : [['tg', 'TGT'], ['rec', 'REC'], ['recy', 'YDS REC'], ['rectd', 'TD R'], ['ry', 'YDS CAR']];
  const res = (w) => { const c = rivalDe(j.team, w); return c && c.fin ? `<span class="${c.pf > c.pc ? 'g' : c.pf < c.pc ? 'p' : ''}">${c.pf > c.pc ? 'G' : c.pf < c.pc ? 'P' : 'E'} ${c.pf}-${c.pc}</span>` : ''; };
  return `<div class="page">${crumbs([['#/posicion/' + j.pos, POSICIONES[j.pos] || j.pos], ['', j.n]])}<div class="wrap">
    <div class="pcard" style="${vars(j.team)}">
      <div class="art"><span class="bignum">${esc(j.num ?? '')}</span>${helmet(j.team, j.num, 220, false, 'bob')}</div>
      <div class="info">
        <div class="tags"><a class="pos" href="#/posicion/${j.pos}">${esc(rp(j))}</a>${EQUIPOS[j.team] ? `<a class="team" href="#/equipo/${j.team}">${esc(EQUIPOS[j.team])} ›</a>` : '<span class="team">Agente libre</span>'}${pillSt(j)}</div>
        <h1>${esc(j.n)}</h1>
        <div class="meters">${medidores(j, mismos)}</div>
        <div class="actions" style="margin:0">${vecinos[0] ? `<a class="btn" href="#/comparar/${id}/${vecinos[0].id}">⚔ COMPARAR</a>` : ''}<a class="btn ghost" href="#/posicion/${j.pos}">RANKING ${esc(j.pos)}</a></div>
      </div>
    </div>
    ${st !== 'Sano' ? `<div class="alert ${st}"><b>${st === 'Duda' ? 'EN DUDA' : 'FUERA'}${j.injParte ? ' · ' + esc(j.injParte).toUpperCase() : ''}</b><p>${esc(j.injNota || 'Sin detalle adicional del reporte de lesiones.')}</p></div>` : ''}

    <section class="block"><div class="ssfx ${v.v}">
      <div class="ss-head">${fxLogo(54)}<div><small class="px">START / SIT FX · SEMANA ${esc(semActual())}</small><b class="px">${v.v === 'START' ? 'ARRÁNCALO' : v.v === 'FLEX' ? 'OPCIÓN FLEX' : 'A LA BANCA'}</b></div>
        <div class="ss-riv">${r ? `${helmet(r.opp, '', 56, true)}<span><small>RIVAL</small><b>${r.home ? 'vs' : '@'} ${esc(r.opp)}</b>${pintaEstrellas(v.e)}</span>` : '<span><b>BYE</b></span>'}</div></div>
      <ul class="ss-why">${v.razones.map(x => `<li>${esc(x)}</li>`).join('')}</ul>
      <p class="ss-note">Veredicto calculado con puntos reales, dificultad del rival, racha, noticias del día y movimiento de la comunidad.</p>
    </div></section>

    <div class="kpis stagger">
      <div class="kpi"><b>${esc(rp(j))}</b><span>RANKING · ${FMTS[FMT]}</span></div>
      <div class="kpi"><b>${n1(j.total)}</b><span>PUNTOS EN LA TEMPORADA</span></div>
      <div class="kpi"><b>${n1(j.prom)}</b><span>PROMEDIO POR PARTIDO</span></div>
      <div class="kpi"><b>${n1(ultima(j))}</b><span>ÚLTIMO PARTIDO</span></div>
      <div class="kpi"><b>${(j.log || []).filter(l => l.f).length}</b><span>PARTIDOS JUGADOS</span></div>
    </div>

    <section class="block" style="padding-top:20px"><div class="head"><div><h2 class="px">PARTIDO POR <span>PARTIDO</span></h2><p class="hsub">Rival, resultado, puntos en los 3 formatos y estadísticas clave.</p></div></div>
      <div class="card scroll"><table class="tbl glog"><thead><tr><th>SEM</th><th>RIVAL</th><th>RES</th><th class="${FMT === 0 ? 'hl' : ''}">PPR</th><th class="${FMT === 1 ? 'hl' : ''}">HALF</th><th class="${FMT === 2 ? 'hl' : ''}">STD</th>${cols.map(c => `<th>${c[1]}</th>`).join('')}</tr></thead>
      <tbody>${log.map(l => { const c = rivalDe(j.team, l.w); return `<tr class="nolink"><td class="n">${l.w}</td><td>${c ? `<a class="team" href="#/equipo/${c.opp}">${c.home ? 'vs' : '@'} ${c.opp}</a>` : '<span class="team">BYE</span>'}</td><td class="n res">${res(l.w)}</td>
        ${[0, 1, 2].map(i => `<td class="n ${FMT === i ? 'hl' : ''}">${l.f ? n1(l.f[i]) : '–'}</td>`).join('')}${cols.map(cc => `<td class="n">${l.st && l.st[cc[0]] != null ? l.st[cc[0]] : l.f ? 0 : '–'}</td>`).join('')}</tr>`; }).join('')}</tbody></table></div></section>

    <div class="grid g2" style="margin-top:20px">
      <div class="card"><h3 class="px">PUNTOS POR SEMANA</h3><p class="sub">Formato ${FMTS[FMT]}. Gris = no jugó.</p>
        <div class="chart">${hist.map(x => `<div class="col"><em>${x == null ? '–' : n1(x)}</em><i class="${x ? '' : 'zero'}" style="${x ? 'height:' + Math.round(x / max * 150) + 'px' : ''}"></i></div>`).join('')}</div>
        <div class="chart-x">${semanas.map(w => `<span>S${w}</span>`).join('')}</div></div>
      <div class="card"><h3 class="px">PRÓXIMOS RIVALES</h3><p class="sub">Dificultad para un ${j.pos}: más estrellas = más fácil.</p>
        <div class="plist">${prox.map(w => { const c = rivalDe(j.team, w); return `<div class="prow nolink"><span class="rk">S${w}</span>${c ? helmet(c.opp, '', 34) : ''}<span class="meta"><span class="pname">${c ? (c.home ? 'vs ' : '@ ') + esc(EQUIPOS[c.opp] || c.opp) : 'BYE'}</span><small>${c ? new Date(c.fecha).toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short' }) : 'Descanso'}</small></span><span class="right">${c ? pintaEstrellas(estrellas(c.opp, j.pos)) : ''}</span></div>`; }).join('')}</div></div>
    </div>
    <div class="grid g2" style="margin-top:20px">
      <div class="card"><h3 class="px">FICHA</h3>
        <div class="bio"><div><small>EDAD</small><b>${esc(j.edad ?? '–')}</b></div><div><small>EXPERIENCIA</small><b>${j.exp != null ? (j.exp === 0 ? 'Novato' : esc(j.exp) + ' años') : '–'}</b></div>
        <div><small>ESTATURA</small><b>${altura(j.alt)}</b></div><div><small>PESO</small><b>${j.peso ? esc(j.peso) + ' lb' : '–'}</b></div>
        <div style="grid-column:1/-1"><small>UNIVERSIDAD</small><b>${esc(j.col || '–')}</b></div></div></div>
      <div class="card"><h3 class="px">MOVIMIENTO EN LIGAS</h3><p class="sub">Últimas 24 horas en Sleeper.</p>
        <div class="kpis" style="margin:0"><div class="kpi"><b style="color:var(--accent)">${j.add ? '▲ ' + nf.format(j.add) : '–'}</b><span>AGREGADO</span></div><div class="kpi"><b style="color:var(--bad)">${j.drop ? '▼ ' + nf.format(j.drop) : '–'}</b><span>SOLTADO</span></div></div></div>
    </div>
    <section class="block"><div class="head"><h2 class="px">NOTICIAS <span>SOBRE ÉL</span></h2></div>
      <div class="news stagger">${notas.map(n => newsCard(n)).join('') || '<div class="empty">Hoy no hay noticias sobre este jugador.</div>'}</div></section>
    <section class="block grid g2">
      <div class="card"><h3 class="px" style="color:var(--accent)">${esc(j.pos)} CERCA EN EL RANKING</h3><p class="sub">Alternativas parecidas. Toca para comparar.</p>
        <div class="plist">${vecinos.map(x => prow(x, `<a class="chip" href="#/comparar/${id}/${x.id}" onclick="event.stopPropagation()">VS</a>`)).join('')}</div></div>
      <div class="card"><h3 class="px">COMPAÑEROS EN ${esc(j.team)}</h3><p class="sub">Su ofensiva en fantasy.</p>
        <div class="plist">${comp.map(c => prow(c, fxPill(c))).join('') || '<p class="sub">Sin compañeros registrados.</p>'}</div></div>
    </section>
  </div></div>`;
}

function medidores(j, mismos) {
  const proms = mismos.map(x => x.prom).filter(v => v != null).sort((a, b) => a - b);
  const pctl = v => v == null || !proms.length ? 0 : Math.round(proms.filter(x => x <= v).length / proms.length * 99);
  const prod = pctl(j.prom);
  const u = ultima(j), forma = u == null || !j.prom ? 0 : Math.min(99, Math.round(u / j.prom * 50));
  const maxAdd = Math.max(1, ...P.map(x => x.add || 0));
  const dem = j.add ? Math.max(8, Math.round(j.add / maxAdd * 99)) : j.drop ? 5 : 20;
  const st = estatus(j), salud = st === 'Sano' ? 99 : st === 'Duda' ? 50 : 10;
  const m = (l, v, c = '') => `<div class="meter ${c}"><span>${l}</span><span class="track">${Array.from({ length: 20 }, (_, k) => `<i class="${k < Math.round(v / 5) ? 'on' : ''}" style="animation-delay:${k * 25}ms"></i>`).join('')}</span><b>${v}</b></div>`;
  return m('PRODUCCIÓN', prod) + m('FORMA', forma, forma < 35 ? 'warn' : '') + m('DEMANDA', dem, j.drop && !j.add ? 'bad' : '') + m('SALUD', salud, st === 'Duda' ? 'warn' : st === 'Fuera' ? 'bad' : '');
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
        <p>${ganador ? `Gana ${Math.max(px, py)} de ${px + py} categorías medibles. Revisa su reporte de lesión y las noticias del día antes de decidir.` : 'Están parejos en los números. Decide por el rival de la semana y las noticias del día.'}</p></div>
      </div>
      <div class="grid g2" style="margin-top:18px">
        <div class="card"><h3 class="px">${esc(x.n.split(' ').pop().toUpperCase())} · PUNTOS</h3><div class="chart" style="height:170px">${barras(hx, 'var(--accent)')}</div></div>
        <div class="card"><h3 class="px">${esc(y.n.split(' ').pop().toUpperCase())} · PUNTOS</h3><div class="chart" style="height:170px">${barras(hy, 'var(--gray)')}</div></div>
      </div>
    </section></div></div>`;
}

function posicion(p, q) {
  if (!POSICIONES[p]) return noEncontrado();
  titulo('Ranking ' + p);
  const w = semActual(), ult = (D.semanas || []).slice(-3);
  return `<div class="page">${crumbs([['', 'Rankings ' + p]])}<div class="wrap"><section class="block">
    <div class="head"><div><h2 class="px">RANKING <span>${p} · SEMANA ${esc(w)}</span></h2><p class="hsub">Ordenado por puntos ${FMTS[FMT]} de la temporada, con rival, dificultad y el veredicto Start/Sit FX.</p></div><small class="px">${esc(actualizado())}</small></div>
    <div class="chips">${Object.keys(POSICIONES).map(x => `<a class="chip ${x === p ? 'on' : ''}" href="#/posicion/${x}">${x}</a>`).join('')}</div>
    <div class="tools"><input id="filtro" type="search" placeholder="Filtrar por nombre, equipo o rival…" aria-label="Filtrar jugadores">
      <span class="chips" style="margin:0" id="fst">${['TODOS', 'START', 'FLEX', 'SIT'].map((s, i) => `<button type="button" class="chip ${i ? '' : 'on'}" data-s="${s}">${s}</button>`).join('')}</span></div>
    <div class="card scroll"><table class="tbl rank"><thead><tr>
      <th><button data-k="rank" class="on">#</button></th><th>JUGADOR</th><th><button data-k="team">EQUIPO</button></th>
      <th>RIVAL S${esc(w)}</th><th><button data-k="mu">DIFICULTAD</button></th>
      ${ult.map(x => `<th>S${x}</th>`).join('')}<th><button data-k="prom">PROM</button></th><th><button data-k="total">TOTAL</button></th><th>TENDENCIA</th>
      <th class="fxh"><button data-k="fx">${fxLogo(18)} START/SIT</button></th>
    </tr></thead><tbody id="tb"></tbody></table></div>
    <p class="ss-note">Dificultad = puntos que la defensa rival permite a la posición (★★★★★ = matchup ideal). Start/Sit FX combina puntos reales, rival, racha, noticias y la comunidad.</p>
  </section></div></div>`;
}
function montaTabla(p) {
  let orden = 'rank', filtroV = 'TODOS';
  const ult = (D.semanas || []).slice(-3);
  const base = P.filter(j => j.pos === p).map(j => ({ j, v: veredicto(j), r: rivalDe(j.team) }));
  const pesoV = { START: 3, FLEX: 2, SIT: 1 };
  const pinta = () => {
    const f = ($('#filtro').value || '').toLowerCase();
    const val = (x, k) => k === 'rank' ? (x.j.total || 0) : k === 'team' ? x.j.team : k === 'mu' ? (x.v.e ? x.v.e.n : 0) : k === 'fx' ? pesoV[x.v.v] * 1000 - (x.v.adj || 999) : (x.j[k] ?? -1);
    const lista = base.filter(x => (filtroV === 'TODOS' || x.v.v === filtroV) && (!f || x.j.n.toLowerCase().includes(f) || x.j.team.toLowerCase().includes(f) || (x.r && x.r.opp.toLowerCase().includes(f)) || (EQUIPOS[x.j.team] || '').toLowerCase().includes(f)))
      .sort((a, b) => { const va = val(a, orden), vb = val(b, orden); return orden === 'team' ? String(va).localeCompare(vb) : vb - va; });
    $('#tb').innerHTML = lista.map(({ j, v, r }) => {
      const pts = ult.map(w => { const l = (j.log || []).find(x => x.w === w); const c = rivalDe(j.team, w); return `<td class="n wk">${l && l.f ? n1(l.f[FMT]) : c ? '–' : '<small>BYE</small>'}</td>`; }).join('');
      return `<tr data-id="${j.id}"><td class="n">${RANKPOS[j.id] || '–'}</td>
      <td><span class="tpl">${helmet(j.team, j.num, 30)}<span><span class="pname">${esc(j.n)}</span>${estatus(j) !== 'Sano' ? ` <span class="pill ${estatus(j)}">${estatus(j).toUpperCase()}</span>` : ''}</span></span></td>
      <td><a class="team" href="#/equipo/${j.team}" onclick="event.stopPropagation()">${esc(j.team)}</a></td>
      <td>${r ? `<a class="team riv" href="#/equipo/${r.opp}" onclick="event.stopPropagation()">${helmet(r.opp, '', 22)}${r.home ? 'vs' : '@'} ${r.opp}</a>` : '<span class="team">BYE</span>'}</td>
      <td>${pintaEstrellas(v.e)}</td>${pts}
      <td class="n">${n1(j.prom)}</td><td class="n">${n1(j.total)}</td><td>${spark(j.hist)}</td><td>${fxPill(j)}</td></tr>`;
    }).join('') || '<tr><td colspan="12"><div class="empty">Ningún jugador coincide.</div></td></tr>';
    $('#tb').querySelectorAll('tr[data-id]').forEach(tr => tr.onclick = () => { location.hash = '#/jugador/' + tr.dataset.id; });
  };
  $('#filtro').oninput = pinta;
  document.querySelectorAll('.tbl th button').forEach(b => b.onclick = () => { orden = b.dataset.k; document.querySelectorAll('.tbl th button').forEach(x => x.classList.toggle('on', x === b)); pinta(); });
  document.querySelectorAll('#fst button').forEach(b => b.onclick = () => { filtroV = b.dataset.s; document.querySelectorAll('#fst button').forEach(x => x.classList.toggle('on', x === b)); pinta(); });
  pinta();
}

function equipos() {
  titulo('Equipos');
  return `<div class="page">${crumbs([['', 'Equipos']])}<div class="wrap"><section class="block"><div class="head"><div><h2 class="px">LOS <span>32 EQUIPOS</span></h2><p class="hsub">Por conferencia y división, con récord, rival de la semana y lesionados.</p></div></div>${teamGrid()}</section></div></div>`;
}
function equipo(t) {
  if (!EQUIPOS[t]) return noEncontrado();
  titulo(EQUIPOS[t]);
  const roster = P.filter(j => j.team === t).sort((a, b) => (b.total || 0) - (a.total || 0));
  const ids = new Set(roster.map(j => j.id));
  const notas = D.noticias.filter(n => (n.jugadores || []).some(id => ids.has(id)));
  const les = roster.filter(j => estatus(j) !== 'Sano');
  const div = Object.entries(DIVS).flatMap(([c, ds]) => Object.entries(ds).map(([d, ts]) => [c + ' ' + d, ts])).find(x => x[1].includes(t));
  const cal = (D.cal && D.cal.cal && D.cal.cal[t]) || {};
  const grupos = Object.keys(POSICIONES).map(p => {
    const g = roster.filter(j => j.pos === p);
    return g.length ? `<div class="card"><h3 class="px" style="color:var(--accent)">${p}</h3><p class="sub">${POSICIONES[p]} · promedio ${FMTS[FMT]}</p><div class="plist">${g.map(j => prow(j, `<span class="num">${n1(j.prom)}</span>${fxPill(j)}`)).join('')}</div></div>` : '';
  }).join('');
  const r = rivalDe(t);
  return `<div class="page">${crumbs([['#/equipos', 'Equipos'], ['', t]])}<div class="wrap">
    <div class="nhero" style="${vars(t)}"><div class="grid-in"><div class="hels">${helmet(t, '', 160, false, 'bob')}</div><div class="txt"><span class="tagx" style="display:inline-block">${div ? div[0] : t}</span><h1>${esc(EQUIPOS[t])}</h1>
      <p style="color:#fff;margin:12px 0 0;font-weight:600;font-size:18px">Récord <span class="n">${recordDe(t) || '–'}</span> · ${r ? `Semana ${semActual()}: ${r.home ? 'vs' : '@'} ${EQUIPOS[r.opp] || r.opp}` : 'Semana de descanso'}</p></div></div></div>
    ${les.length ? `<div class="alert"><b>REPORTE DE LESIONES</b><p>${les.map(j => `<a href="#/jugador/${j.id}">${esc(j.n)}</a> (${estatus(j)})`).join(' · ')}</p></div>` : ''}
    <section class="block"><div class="head"><div><h2 class="px">CALENDARIO <span>${esc(D.cal ? D.cal.temporada : '')}</span></h2><p class="hsub">Resultados y lo que viene, semana por semana.</p></div></div>
      <div class="sched">${Array.from({ length: 18 }, (_, i) => i + 1).map(w => { const c = cal[w]; return `<a class="sw ${c && c.fin ? (c.pf > c.pc ? 'g' : 'p') : ''} ${w === semActual() ? 'now' : ''}" href="${c ? '#/equipo/' + c.opp : '#/equipos'}"><small class="px">S${w}</small>${c ? helmet(c.opp, '', 36, !c.home) : '<b class="px bye">BYE</b>'}<span>${c ? (c.home ? 'vs ' : '@ ') + c.opp : 'Descanso'}</span><em class="n">${c && c.fin ? (c.pf > c.pc ? 'G ' : c.pf < c.pc ? 'P ' : 'E ') + c.pf + '-' + c.pc : c ? new Date(c.fecha).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' }) : ''}</em></a>`; }).join('')}</div></section>
    <section class="block"><div class="head"><div><h2 class="px">PLANTEL <span>FANTASY</span></h2><p class="hsub">Con su veredicto Start/Sit FX de esta semana.</p></div></div><div class="grid g3 stagger">${grupos || '<div class="empty">Sin jugadores registrados.</div>'}</div></section>
    <section class="block"><div class="head"><h2 class="px">NOTICIAS <span>DEL EQUIPO</span></h2></div><div class="news stagger">${notas.map(n => newsCard(n)).join('') || '<div class="empty">Hoy no hay noticias de este equipo.</div>'}</div></section>
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
  const lista = P.filter(j => estatus(j) !== 'Sano' && (f === 'TODOS' || estatus(j) === f)).sort((a, b) => (b.total || 0) - (a.total || 0));
  return `<div class="page">${crumbs([['', 'Lesionados']])}<div class="wrap"><section class="block">
    <div class="head"><h2 class="px">REPORTE DE <span>LESIONES</span></h2><small class="px">${lista.length} JUGADORES</small></div>
    <div class="chips">${['TODOS', 'Duda', 'Fuera'].map(s => `<a class="chip ${s === f ? 'on' : ''}" href="#/lesionados${s === 'TODOS' ? '' : '?estatus=' + s}">${s.toUpperCase()}</a>`).join('')}</div>
    <div class="card"><div class="plist">${lista.map(j => prow(j, `${j.injParte ? `<span class="team">${esc(j.injParte)}</span>` : ''}${pillSt(j)}`)).join('') || '<div class="empty">Sin lesionados con este estatus.</div>'}</div></div>
  </section></div></div>`;
}

function exclusivo() {
  titulo('Exclusivo FX');
  const L = (D.archivo || []).concat(D.noticias).filter((n, i, a) => n.exclusivo && a.findIndex(x => x.id === n.id) === i);
  return `<div class="page">${crumbs([['', 'Exclusivo FX']])}<div class="wrap">
    <div class="nhero scn" style="--c1:#3A2A05;--c2:#FFD45C">${escena('TENDENCIA', '', '')}<div class="grid-in"><div class="txt">
      <span class="tagx" style="display:inline-block;background:#FFD45C">★ PREMIUM · GRATIS POR AHORA</span>
      <h1>EXCLUSIVO FX</h1><p style="color:#fff;font-weight:600;font-size:18px;margin:12px 0 0;max-width:560px">Información que no vas a encontrar en otro lado, de nuestra red de reporteros, desarrollada por los expertos.</p></div></div></div>
    <section class="block"><div class="news lista stagger">${L.map((n, i) => newsCard(n, i === 0)).join('') || '<div class="empty">La primera nota exclusiva llega muy pronto. Mientras, revisa las <a href="#/noticias">noticias del día</a>.</div>'}</div></section>
  </div></div>`;
}
function temporada() {
  titulo('Temporada');
  const S = Object.values(D.resumenes || {}).sort((a, b) => b.semana - a.semana);
  return `<div class="page">${crumbs([['', 'Temporada ' + (D.temporada || '')]])}<div class="wrap"><section class="block">
    <div class="head"><h2 class="px">TEMPORADA <span>${esc(D.temporada || '')}</span></h2><small class="px">SEMANA POR SEMANA</small></div>
    <div class="grid g3 stagger">${S.map(w => {
      const mvp = Object.values(w.top || {}).flat().sort((a, b) => b.pts - a.pts)[0];
      return `<a class="cart TENDENCIA" href="#/semana/${w.semana}" style="${vars(mvp && mvp.team)}"><span class="band">${escena('ARRANCA', mvp && mvp.team, '')}<span class="tm">SEMANA ${w.semana}${w.cerrada ? '' : ' · EN CURSO'}</span></span>
        <span class="in"><h3>${esc(w.titulo)}</h3><ul class="claves">${(w.claves || []).slice(0, 2).map(c => `<li>${esc(c)}</li>`).join('')}</ul>
        <span class="foot">${mvp ? `<span class="team">MVP: ${esc(mvp.n)} · ${n1(mvp.pts)}</span>` : '<span></span>'}<span class="go">VER SEMANA ›</span></span></span></a>`;
    }).join('') || '<div class="empty">Generando el resumen de la temporada…</div>'}</div></section></div></div>`;
}
function semana(w) {
  const R = (D.resumenes || {})[w];
  if (!R) return noEncontrado();
  titulo('Semana ' + w);
  const mvp = Object.values(R.top || {}).flat().sort((a, b) => b.pts - a.pts)[0];
  return `<div class="page">${crumbs([['#/temporada', 'Temporada'], ['', 'Semana ' + w]])}<div class="wrap">
    <div class="nhero scn" style="${vars(mvp && mvp.team)}">${escena('ARRANCA', mvp && mvp.team, '')}<div class="grid-in"><div class="txt"><span class="tagx" style="display:inline-block">SEMANA ${w}</span><h1>${esc(R.titulo)}</h1></div></div></div>
    <div class="kcards stagger">${(R.claves || []).map((c, k) => `<div class="kcard"><b>${k + 1}</b>${esc(c)}</div>`).join('')}</div>
    ${R.cuerpo ? `<details class="desglose"><summary><span>LEER EL RESUMEN COMPLETO</span><span>›</span></summary><p>${esc(R.cuerpo)}</p></details>` : ''}
    <section class="block"><div class="head"><h2 class="px">LOS MEJORES <span>DE LA SEMANA</span></h2><small class="px">PUNTOS ${FMTS[FMT]}</small></div>
      <div class="grid g3 stagger">${Object.entries(R.top || {}).map(([p, l]) => `<div class="card"><h3 class="px" style="color:var(--accent)">${p}</h3><div class="plist">${l.slice(0, 5).map((x, i) => J[x.id] ? prow(J[x.id], `<span class="num">${n1(x.pts)}</span>`, i + 1) : `<div class="prow"><span class="rk">${i + 1}</span>${helmet(x.team, '', 36)}<span class="meta"><span class="pname">${esc(x.n)}</span><small>${esc(x.team || '')}</small></span><span class="right"><span class="num">${n1(x.pts)}</span></span></div>`).join('')}</div></div>`).join('')}</div></section>
    <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:18px">${D.resumenes[w - 1] ? `<a class="btn ghost" href="#/semana/${w - 1}">‹ SEMANA ${w - 1}</a>` : ''}${D.resumenes[+w + 1] ? `<a class="btn" href="#/semana/${+w + 1}">SEMANA ${+w + 1} ›</a>` : ''}</div>
  </div></div>`;
}


/* ---------- FX MEDIA: YouTube, podcast y redes ---------- */
const ICO = {
  yt: '<svg width="20" height="20" viewBox="0 0 8 8" shape-rendering="crispEdges" aria-hidden="true"><rect x="0" y="1" width="8" height="6" fill="#FF3B30"/><rect x="3" y="2" width="1" height="4" fill="#fff"/><rect x="4" y="3" width="1" height="2" fill="#fff"/></svg>',
  tt: '<svg width="20" height="20" viewBox="0 0 8 8" shape-rendering="crispEdges" aria-hidden="true"><rect x="4" y="0" width="1" height="6" fill="#fff"/><rect x="5" y="1" width="2" height="1" fill="#25F4EE"/><rect x="2" y="4" width="2" height="1" fill="#fff"/><rect x="1" y="5" width="1" height="2" fill="#FE2C55"/><rect x="2" y="7" width="2" height="1" fill="#fff"/><rect x="4" y="6" width="1" height="1" fill="#fff"/></svg>',
  ig: '<svg width="20" height="20" viewBox="0 0 8 8" shape-rendering="crispEdges" aria-hidden="true"><rect x="0" y="0" width="8" height="8" fill="#C13584"/><rect x="1" y="1" width="6" height="6" fill="#0A1A10"/><rect x="3" y="3" width="2" height="2" fill="#FCAF45"/><rect x="5" y="2" width="1" height="1" fill="#FCAF45"/></svg>',
  sp: '<svg width="20" height="20" viewBox="0 0 8 8" shape-rendering="crispEdges" aria-hidden="true"><rect x="1" y="0" width="6" height="8" fill="#1DB954"/><rect x="0" y="1" width="8" height="6" fill="#1DB954"/><rect x="2" y="2" width="4" height="1" fill="#0A1A10"/><rect x="2" y="4" width="3" height="1" fill="#0A1A10"/><rect x="3" y="6" width="2" height="1" fill="#0A1A10"/></svg>'
};
const redBtn = (k, ico, txt) => D.redes[k] ? `<a class="social" href="${esc(D.redes[k].url)}" target="_blank" rel="noopener">${ICO[ico]}<span>${txt}<small>${esc(D.redes[k].usuario || '')}</small></span></a>` : '';
const redesRow = () => grupoRedes(); const _redesRowOld = () => `<div class="socials">${redBtn('tiktok', 'tt', 'TIKTOK')}${redBtn('youtube', 'yt', 'YOUTUBE')}${redBtn('instagram', 'ig', 'INSTAGRAM')}${redBtn('instagramFX', 'ig', 'INSTAGRAM FX')}${redBtn('spotify', 'sp', 'PODCAST')}</div>`;
const vidCard = (v, big) => `<button class="vid ${big ? 'big' : ''}" type="button" data-v="${esc(v.id)}" aria-label="Reproducir ${esc(v.titulo)}">
  <span class="thumb"><img loading="lazy" src="https://i.ytimg.com/vi/${esc(v.id)}/${big ? 'maxresdefault' : 'hqdefault'}.jpg" onerror="this.onerror=null;this.src='https://i.ytimg.com/vi/${esc(v.id)}/hqdefault.jpg'" alt=""><span class="play">${ICO.yt}</span>${v.corto ? '<span class="tm">SHORT</span>' : ''}</span>
  <span class="vinfo"><span class="vt">${esc(v.titulo)}</span><small>${v.fecha ? new Date(v.fecha).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}${v.vistas ? ' · ' + nf.format(v.vistas) + ' vistas' : ''}</small></span></button>`;
const videosOrdenados = () => (D.videos.videos || []).slice().sort((a, b) => Date.parse(b.fecha || 0) - Date.parse(a.fecha || 0));
const podcast = () => D.redes.spotify ? `<div class="pod"><iframe title="Podcast Fantasy Expertos en Spotify" src="https://open.spotify.com/embed/show/${esc(D.redes.spotify.show)}?theme=0" width="100%" height="152" frameborder="0" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe></div>` : '';
const grupoRedes = () => `<div class="redgroups">
  <div class="redgroup"><h4 class="px">FANTASY EXPERTOS</h4><div class="socials">${redBtn('youtube', 'yt', 'YOUTUBE')}${redBtn('spotify', 'sp', 'PODCAST')}${redBtn('instagramFX', 'ig', 'INSTAGRAM')}</div></div>
  <div class="redgroup"><h4 class="px">JOE NFL</h4><div class="socials">${redBtn('tiktok', 'tt', 'TIKTOK')}${redBtn('instagram', 'ig', 'INSTAGRAM')}</div></div></div>`;
function fxtv() {
  const V = videosOrdenados();
  if (!V.length) return '';
  return `<section class="block"><div class="head"><div><h2 class="px">FX <span>TV</span></h2><p class="hsub">Lo más reciente del canal y el podcast. Se reproduce aquí mismo.</p></div><a class="all" href="#/media">TODO EL CONTENIDO ›</a></div>
    <div class="tv">${vidCard(V[0], true)}<div class="tv-side">${V.slice(1, 4).map(v => vidCard(v)).join('')}</div></div>
    <div class="tv-foot">${podcast()}${grupoRedes()}</div></section>`;
}
function media() {
  titulo('FX Media');
  const V = videosOrdenados();
  return `<div class="page">${crumbs([['', 'FX Media']])}<div class="wrap">
    <section class="block"><div class="head"><div><h2 class="px">FX <span>MEDIA</span></h2><p class="hsub">Videos, podcast y redes de Fantasy Expertos y Joe NFL.</p></div>${D.redes.youtube ? `<a class="all" href="${esc(D.redes.youtube.url)}?sub_confirmation=1" target="_blank" rel="noopener">SUSCRÍBETE ›</a>` : ''}</div>
      ${V.length ? `<div class="tv">${vidCard(V[0], true)}<div class="tv-side">${V.slice(1, 4).map(v => vidCard(v)).join('')}</div></div>` : ''}</section>
    <section class="block"><div class="head"><div><h2 class="px">EL <span>PODCAST</span></h2><p class="hsub">Fantasy Expertos en Spotify.</p></div>${D.redes.spotify ? `<a class="all" href="${esc(D.redes.spotify.url)}" target="_blank" rel="noopener">ABRIR EN SPOTIFY ›</a>` : ''}</div>${podcast()}</section>
    ${V.length > 4 ? `<section class="block"><div class="head"><div><h2 class="px">MÁS <span>VIDEOS</span></h2></div></div><div class="vids">${V.slice(4).map(v => vidCard(v)).join('')}</div></section>` : ''}
    <section class="block"><div class="head"><div><h2 class="px">SÍGUENOS</h2><p class="hsub">Primero Fantasy Expertos, luego los tips rápidos de Joe NFL.</p></div></div>${grupoRedes()}</section>
  </div></div>`;
}
const ctaRedes = () => `<div class="tcta"><div><span class="px" style="font-size:9px;color:#25F4EE">¿LO QUIERES EN VIDEO?</span><h3>Esta y más jugadas, explicadas en 60 segundos</h3><p>Síguenos para no perderte nada antes del kickoff.</p></div><div class="socials">${redBtn('tiktok', 'tt', 'TIKTOK')}${redBtn('youtube', 'yt', 'YOUTUBE')}${redBtn('spotify', 'sp', 'PODCAST')}</div></div>`;


/* ---------- EN VIVO: marcadores, matchups y jugadas (ESPN, gratis, se refresca solo) ---------- */
const AB = { WSH: 'WAS', JAC: 'JAX', LA: 'LAR' };
let G = [], gPrev = {}, gTimer;
async function cargaPartidos() {
  try {
    const r = await fetch('https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard');
    const j = await r.json();
    G = (j.events || []).map(e => {
      const c = e.competitions[0], st = e.status || c.status, sit = c.situation || {};
      const eq = c.competitors.map(t => ({
        ab: AB[t.team.abbreviation] || t.team.abbreviation, nombre: t.team.displayName, local: t.homeAway === 'home', id: t.team.id,
        pts: +t.score || 0, rec: (t.records && t.records[0] && t.records[0].summary) || '',
        lideres: (t.leaders || []).map(l => ({ cat: l.shortDisplayName || l.name, val: l.leaders && l.leaders[0] && l.leaders[0].displayValue, quien: l.leaders && l.leaders[0] && l.leaders[0].athlete && l.leaders[0].athlete.displayName })).filter(x => x.quien)
      })).sort((a, b) => a.local - b.local);
      return { id: e.id, fecha: e.date, estado: st.type.state, detalle: st.type.shortDetail, reloj: st.displayClock, cuarto: st.period,
        sede: c.venue && c.venue.fullName, tv: (c.broadcasts && c.broadcasts[0] && c.broadcasts[0].names || []).join(', '),
        visita: eq[0], local: eq[1], posesion: sit.possession, yarda: sit.yardLine, downs: sit.downDistanceText, ultima: sit.lastPlay && sit.lastPlay.text, zonaRoja: sit.isRedZone,
        semana: j.week && j.week.number };
    });
    // detectar anotaciones para animarlas
    const anot = [];
    G.forEach(g => { const p = gPrev[g.id]; if (p) [g.visita, g.local].forEach((t, k) => { const d = t.pts - (k ? p.l : p.v); if (d >= 6) anot.push({ g, t, d }); else if (d === 3) anot.push({ g, t, d }); }); gPrev[g.id] = { v: g.visita.pts, l: g.local.pts }; });
    pintaMarcadores(); anot.forEach(celebra);
    if (/^#\/(partidos|partido)/.test(location.hash) || !location.hash || location.hash === '#/') refrescaVista();
  } catch (e) { console.log('Marcadores no disponibles', e); }
  clearTimeout(gTimer);
  gTimer = setTimeout(cargaPartidos, G.some(g => g.estado === 'in') ? 20000 : 120000);
}
const enVivo = () => { const n = G.filter(g => g.estado === 'in').length; const d = document.querySelector('.tb-live'); if (d) d.classList.toggle('on', n > 0); return n; };
function pintaMarcadores() {
  const bar = document.getElementById('scorebar'); if (!bar || !G.length) return;
  const orden = [...G].sort((a, b) => ({ in: 0, pre: 1, post: 2 }[a.estado] - { in: 0, pre: 1, post: 2 }[b.estado]) || Date.parse(a.fecha) - Date.parse(b.fecha));
  bar.innerHTML = `<span class="sb-tag px">${enVivo() ? '<i class="blink"></i>EN VIVO' : 'SEMANA ' + (G[0].semana || '')}</span><div class="sb-list">${orden.map(g => `<a class="sb ${g.estado}" href="#/partido/${g.id}">
    <span class="sb-t ${ganando(g, 0)}">${helmet(g.visita.ab, '', 22)}${esc(g.visita.ab)}<b>${g.estado === 'pre' ? '' : g.visita.pts}</b></span>
    <span class="sb-t ${ganando(g, 1)}">${helmet(g.local.ab, '', 22)}${esc(g.local.ab)}<b>${g.estado === 'pre' ? '' : g.local.pts}</b></span>
    <small>${esc(g.estado === 'pre' ? horaJuego(g) : g.detalle)}</small></a>`).join('')}</div>`;
}
const ganando = (g, k) => g.estado === 'pre' ? '' : (k ? g.local.pts > g.visita.pts : g.visita.pts > g.local.pts) ? 'gana' : '';
const horaJuego = g => new Date(g.fecha).toLocaleString('es-MX', { weekday: 'short', hour: 'numeric', minute: '2-digit' }).toUpperCase();
function celebra({ g, t, d }) {
  const el = document.createElement('div');
  el.className = 'celebra'; el.style.cssText = vars(t.ab);
  el.innerHTML = `${escena('ARRANCA', t.ab, '')}<div class="ce-in">${helmet(t.ab, '', 90, false, 'bob')}<b class="px">${d >= 6 ? 'TOUCHDOWN!' : 'FIELD GOAL!'}</b><span>${esc(t.nombre)} · ${g.visita.ab} ${g.visita.pts} – ${g.local.pts} ${g.local.ab}</span></div>`;
  el.onclick = () => { location.hash = '#/partido/' + g.id; el.remove(); };
  document.body.appendChild(el); setTimeout(() => el.remove(), 5200);
}
const fantasyDe = ab => P.filter(j => j.team === ab).sort((a, b) => (b.total || 0) - (a.total || 0)).slice(0, 4);
const ptsSemana = j => SEMIDX >= 0 && j.hist ? j.hist[SEMIDX] : null;
function matchCard(g) {
  const v = g.visita, l = g.local, pos = g.posesion;
  return `<a class="match ${g.estado} ${g.zonaRoja ? 'rz' : ''}" href="#/partido/${g.id}" style="--cv:${col(v.ab)[0]};--cl:${col(l.ab)[0]}">
    <span class="m-top px"><span>${g.estado === 'in' ? '<i class="blink"></i>EN VIVO · ' + esc(g.detalle) : g.estado === 'post' ? 'FINAL' : esc(horaJuego(g))}</span><span>${esc(g.tv || '')}</span></span>
    <span class="m-face">
      <span class="m-team ${ganando(g, 0)}">${helmet(v.ab, '', 84)}<b>${esc(v.ab)}</b><small>${esc(v.rec)}</small>${pos === v.id ? '<i class="ball"></i>' : ''}</span>
      <span class="m-score px">${g.estado === 'pre' ? 'VS' : `${v.pts}<em>–</em>${l.pts}`}</span>
      <span class="m-team ${ganando(g, 1)}">${helmet(l.ab, '', 84, true)}<b>${esc(l.ab)}</b><small>${esc(l.rec)}</small>${pos === l.id ? '<i class="ball"></i>' : ''}</span>
    </span>
    ${g.estado === 'in' ? `<span class="m-field">${campo(g)}</span><span class="m-play">${esc(g.downs || '')}${g.ultima ? ' · ' + esc(g.ultima) : ''}</span>` : ''}
    <span class="m-fx"><span>${fantasyDe(v.ab).slice(0, 2).map(j => `${esc(j.n.split(' ').pop())} <b>${n1(g.estado === 'pre' ? j.prom : ptsSemana(j))}</b>`).join(' · ')}</span><span>${fantasyDe(l.ab).slice(0, 2).map(j => `${esc(j.n.split(' ').pop())} <b>${n1(g.estado === 'pre' ? j.prom : ptsSemana(j))}</b>`).join(' · ')}</span></span>
  </a>`;
}
function campo(g) {
  // yardLine de ESPN: 0–100 desde la zona de anotación del local
  const y = Math.max(0, Math.min(100, +g.yarda || 50));
  const x = 8 + y * 0.64;
  const dueño = g.posesion === g.local.id ? g.local.ab : g.visita.ab;
  return `<svg viewBox="0 0 80 14" preserveAspectRatio="none" shape-rendering="crispEdges" aria-label="Posición del balón">
    <rect width="80" height="14" fill="#12441F"/><rect width="8" height="14" fill="${col(g.visita.ab)[0]}"/><rect x="72" width="8" height="14" fill="${col(g.local.ab)[0]}"/>
    ${Array.from({ length: 11 }, (_, i) => `<rect x="${8 + i * 6.4}" width=".4" height="14" fill="#fff" opacity=".35"/>`).join('')}
    <rect x="${x - 1.5}" y="5" width="3" height="4" fill="#8B4A2B"><animate attributeName="y" values="5;4;5" dur=".6s" repeatCount="indefinite" calcMode="discrete"/></rect>
    <rect x="${x}" y="0" width=".5" height="14" fill="${col(dueño)[1]}"/></svg>`;
}
function partidos() {
  titulo('Partidos');
  const grupos = [['in', 'EN VIVO'], ['pre', 'PRÓXIMOS'], ['post', 'FINALES']];
  return `<div class="page">${crumbs([['', 'Partidos']])}<div class="wrap"><section class="block">
    <div class="head"><h2 class="px">MATCHUPS <span>SEMANA ${esc(G[0] ? G[0].semana : D.semana)}</span></h2><small class="px">${enVivo() ? 'SE ACTUALIZA CADA 20 SEG' : 'MARCADORES EN VIVO'}</small></div>
    ${G.length ? grupos.map(([k, t]) => { const L = G.filter(g => g.estado === k); return L.length ? `<h3 class="px grp">${t} · ${L.length}</h3><div class="matches">${L.map(matchCard).join('')}</div>` : ''; }).join('') : '<div class="empty">Cargando marcadores…</div>'}
  </section></div></div>`;
}
function partido(id) {
  const g = G.find(x => x.id === id);
  if (!g) return G.length ? noEncontrado() : '<div class="wrap loading"><p class="px blink">CARGANDO PARTIDO…</p></div>';
  titulo(`${g.visita.ab} vs ${g.local.ab}`);
  const lado = t => `<div class="card" style="${vars(t.ab)};border-color:var(--c1)"><div class="head"><h3 class="px" style="color:var(--c2)">${esc(t.nombre).toUpperCase()}</h3><a class="all" href="#/equipo/${t.ab}">EQUIPO ›</a></div>
    ${t.lideres.length ? `<div class="leaders">${t.lideres.map(l => `<div><small>${esc(l.cat)}</small><b>${esc(l.quien)}</b><span>${esc(l.val || '')}</span></div>`).join('')}</div>` : ''}
    <p class="sub" style="margin-top:14px">Fantasy: ${g.estado === 'pre' ? 'promedio de la temporada' : 'puntos PPR de esta semana'}</p>
    <div class="plist">${fantasyDe(t.ab).map(j => prow(j, `<span class="num">${n1(g.estado === 'pre' ? j.prom : ptsSemana(j))}</span>`)).join('')}</div></div>`;
  return `<div class="page">${crumbs([['#/partidos', 'Partidos'], ['', g.visita.ab + ' vs ' + g.local.ab]])}<div class="wrap">
    <div class="jumbo game" style="--cv:${col(g.visita.ab)[0]};--cl:${col(g.local.ab)[0]}">
      <div class="jumbo-top px"><span>${g.estado === 'in' ? '<i class="blink" style="display:inline-block;width:8px;height:8px;background:var(--bad);margin-right:8px"></i>EN VIVO' : g.estado === 'post' ? 'FINAL' : esc(horaJuego(g))}</span><span>${esc(g.sede || '')}</span></div>
      <div class="g-face">
        <a class="g-team" href="#/equipo/${g.visita.ab}">${helmet(g.visita.ab, '', 150, false, g.posesion === g.visita.id ? 'bob' : '')}<b>${esc(g.visita.nombre)}</b><small>${esc(g.visita.rec)} · VISITA</small></a>
        <div class="g-score px"><span class="${ganando(g, 0)}">${g.estado === 'pre' ? '–' : g.visita.pts}</span><em>${g.estado === 'in' ? esc(g.detalle) : g.estado === 'post' ? 'FINAL' : 'VS'}</em><span class="${ganando(g, 1)}">${g.estado === 'pre' ? '–' : g.local.pts}</span></div>
        <a class="g-team" href="#/equipo/${g.local.ab}">${helmet(g.local.ab, '', 150, true, g.posesion === g.local.id ? 'bob' : '')}<b>${esc(g.local.nombre)}</b><small>${esc(g.local.rec)} · LOCAL</small></a>
      </div>
      ${g.estado === 'in' ? `<div class="g-field">${campo(g)}</div><div class="led" style="min-height:auto;font-size:13px"><small>${esc(g.downs || '')}${g.zonaRoja ? ' · ZONA ROJA' : ''}</small>${esc(g.ultima || 'Esperando la siguiente jugada…')}</div>` : ''}
    </div>
    <section class="block grid g2">${lado(g.visita)}${lado(g.local)}</section>
  </div></div>`;
}
function lideres(q) {
  titulo('Líderes');
  const modo = q.get('ver') || (SEMNUM ? 'semana' : 'temporada');
  const val = j => modo === 'semana' ? ptsSemana(j) : j.total;
  return `<div class="page">${crumbs([['', 'Líderes fantasy']])}<div class="wrap"><section class="block">
    <div class="head"><h2 class="px">LÍDERES <span>FANTASY</span></h2><small class="px">PUNTOS ${FMTS[FMT]}</small></div>
    <div class="chips"><a class="chip ${modo === 'semana' ? 'on' : ''}" href="#/lideres?ver=semana">SEMANA ${esc(SEMNUM || '')}</a><a class="chip ${modo === 'temporada' ? 'on' : ''}" href="#/lideres?ver=temporada">TEMPORADA</a></div>
    <div class="grid g3 stagger">${Object.keys(POSICIONES).map(p => {
      const L = P.filter(j => j.pos === p && val(j) != null).sort((a, b) => val(b) - val(a)).slice(0, 8);
      return `<div class="card"><div class="head"><h3 class="px" style="color:var(--accent)">${p}</h3><a class="all" href="#/posicion/${p}">RANKING ›</a></div>
        ${L[0] ? `<a class="lead1" href="#/jugador/${L[0].id}" style="${vars(L[0].team)}">${helmet(L[0].team, L[0].num, 64, false, 'bob')}<span><small class="px">Nº1</small><b>${esc(L[0].n)}</b><em class="px">${n1(val(L[0]))} PTS</em></span></a>` : ''}
        <div class="plist">${L.slice(1).map((j, i) => prow(j, `<span class="num">${n1(val(j))}</span>`, i + 2)).join('')}</div></div>`;
    }).join('')}</div></section></div></div>`;
}
function refrescaVista() {
  const h = location.hash;
  if (/^#\/partidos/.test(h)) { app.innerHTML = partidos(); }
  else if (/^#\/partido\//.test(h)) { app.innerHTML = partido(h.split('/')[2]); }
  else { const box = document.getElementById('home-matches'); if (box) box.innerHTML = homeMatches(); }
}
function homeMatches() {
  if (!G.length) return '<div class="empty">Cargando marcadores…</div>';
  const L = [...G].sort((a, b) => ({ in: 0, pre: 1, post: 2 }[a.estado] - { in: 0, pre: 1, post: 2 }[b.estado]) || Date.parse(a.fecha) - Date.parse(b.fecha)).slice(0, 4);
  return `<div class="matches">${L.map(matchCard).join('')}</div>`;
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
    case 'noticias': case 'reportajes': html = noticias(q); break;
    case 'noticia': case 'reportaje': html = noticia(a); break;
    case 'jugador': html = jugador(a); break;
    case 'comparar': html = comparar(a, b); break;
    case 'posicion': html = posicion(a, q); break;
    case 'equipos': html = equipos(); break;
    case 'equipo': html = equipo(a); break;
    case 'partidos': html = partidos(); break;
    case 'partido': html = partido(a); break;
    case 'lideres': html = lideres(q); break;
    case 'media': html = media(); break;
    case 'exclusivo': html = exclusivo(); break;
    case 'temporada': html = temporada(); break;
    case 'semana': html = semana(a); break;
    case 'tendencias': html = tendencias(); break;
    case 'lesionados': html = lesionados(q); break;
    default: html = noEncontrado();
  }
  app.innerHTML = html;
  scrollTo({ top: 0 });
  document.querySelectorAll('.tabbar a').forEach(l => l.classList.toggle('act', l.dataset.s === (seccion || '') || (seccion === 'noticia' && l.dataset.s === 'noticias') || (seccion === 'partido' && l.dataset.s === 'partidos')));
  document.querySelector('.links').classList.remove('open');
  document.querySelectorAll('.links a').forEach(l => l.classList.toggle('act', l.dataset.s === (seccion || '') || (seccion === 'noticia' && l.dataset.s === 'noticias')));
  if (seccion === 'posicion') montaTabla(a);
  if (!seccion) arrancaCRT();
  document.querySelectorAll('.vid').forEach(b => b.onclick = () => {
    const t = b.querySelector('.thumb');
    t.innerHTML = `<iframe src="https://www.youtube.com/embed/${b.dataset.v}?autoplay=1&rel=0" title="Video de Fantasy Expertos" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe>`;
    b.onclick = null;
  });
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
    const n = L[i % L.length], el = $('#crt-titulo'); if (!el) return;
    $('#crt-link').href = '#/noticia/' + n.id;
    $('#crt-tag').innerHTML = impSprite(n.impacto, 14) + ' ' + esc(n.etiqueta);
    $('#crt-n').textContent = String(i % L.length + 1).padStart(2, '0') + '/' + String(L.length).padStart(2, '0');
    let k = 0; const txt = n.titulo.toUpperCase(); el.textContent = '';
    clearInterval(el._t); el._t = setInterval(() => { el.textContent = txt.slice(0, ++k); if (k >= txt.length) clearInterval(el._t); }, 28);
    i++;
  };
  pasa(); crtTimer = setInterval(pasa, 5200);
}

/* ---------- BUSCADOR ---------- */
function buscador() {
  const inp = $('#q'), box = $('#sugg');
  let sel = -1, res = [];
  const pinta = () => {
    box.innerHTML = res.map((j, i) => `<a href="#/jugador/${j.id}" class="${i === sel ? 'sel' : ''}">${helmet(j.team, j.num, 28)}<span>${esc(j.n)}</span><span class="pos">${esc(j.pos)}</span><span class="team">${esc(j.team)}</span></a>`).join('')
      + Object.keys(EQUIPOS).filter(t => inp.value.length > 1 && (t.toLowerCase() === inp.value.toLowerCase() || EQUIPOS[t].toLowerCase().includes(inp.value.toLowerCase()))).slice(0, 3)
        .map(t => `<a href="#/equipo/${t}"><span class="pos">${t}</span><span>${EQUIPOS[t]}</span><span class="team">EQUIPO</span></a>`).join('');
    box.classList.toggle('on', !!box.innerHTML);
  };
  inp.oninput = () => {
    const v = inp.value.trim().toLowerCase(); sel = -1;
    res = v.length < 2 ? [] : P.filter(j => j.n.toLowerCase().includes(v)).sort((a, b) => (b.total || 0) - (a.total || 0)).slice(0, 8);
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
  fetch('data/jugadores.json?v=' + Date.now()).then(r => r.ok ? r.json() : []).catch(() => []),
  fetch('data/archivo.json?v=' + Date.now()).then(r => r.ok ? r.json() : []).catch(() => []),
  fetch('data/semanas.json?v=' + Date.now()).then(r => r.ok ? r.json() : {}).catch(() => ({})),
  fetch('data/redes.json?v=' + Date.now()).then(r => r.ok ? r.json() : {}).catch(() => ({})),
  fetch('data/videos.json?v=' + Date.now()).then(r => r.ok ? r.json() : {}).catch(() => ({})),
  fetch('data/calendario.json?v=' + Date.now()).then(r => r.ok ? r.json() : null).catch(() => null)
]).then(([hoy, jugadores, archivo, resumenes, redes, videos, calendario]) => {
  D0 = hoy;
  P = Array.isArray(jugadores) ? jugadores : [];
  P.forEach(j => J[j.id] = j);
  Object.keys(POSICIONES).forEach(p => P.filter(j => j.pos === p && j.total).sort((a, b) => b.total - a.total).forEach((j, i) => RANKPOS[j.id] = i + 1));
  SEMIDX = (() => { for (let i = (D0.semanas || []).length - 1; i >= 0; i--) if (P.some(j => j.hist && j.hist[i] != null)) return i; return -1; })();
  SEMNUM = SEMIDX >= 0 ? D0.semanas[SEMIDX] : null;
  // Acepta el formato anterior mientras el motor publica el nuevo
  hoy.noticias = (hoy.noticias || []).map((n, i) => {
    if (typeof n === 'string') n = { titulo: n, cuerpo: n, etiqueta: 'TENDENCIA' };
    const cl = (n.claves && n.claves.length) ? n.claves : String(n.cuerpo || '').split(/(?<=[.!?])\s+/).filter(Boolean).slice(0, 3).map(x => x.split(' ').slice(0, 12).join(' ').replace(/[,;:]$/, '') + (x.split(' ').length > 12 ? '…' : ''));
    const imp = n.impacto || ({ ARRANCA: 'SUBE', WAIVER: 'SUBE', LESIÓN: 'BAJA', BANCA: 'BAJA' })[n.etiqueta] || 'NEUTRO';
    return { ...n, id: n.id || 'r' + (i + 1), claves: cl, impacto: imp, jugadores: n.jugadores || [] };
  });
  hoy.lesionados = (hoy.lesionados || []).filter(x => x.id);
  hoy.agregados = hoy.agregados || []; hoy.soltados = hoy.soltados || [];
  D = hoy; D.archivo = Array.isArray(archivo) ? archivo : []; D.resumenes = resumenes || {}; D.redes = redes || {}; D.videos = videos || {}; D.cal = calendario;
  aplicaFormato();
  document.querySelectorAll('.fmt button').forEach((b, i) => b.onclick = () => { FMT = i; try { localStorage.setItem('fx-fmt', i); } catch (e) {} aplicaFormato(); router(); });
  const pie = document.getElementById('pie-redes'); if (pie) pie.innerHTML = `<div class="follow"><div><h3 class="px">SÍGUENOS</h3><p>Tips diarios, el podcast y los videos de cada semana.</p></div>${grupoRedes()}</div>`;
  const ts = document.getElementById('top-social');
  if (ts) ts.innerHTML = [['tiktok', 'tt'], ['youtube', 'yt'], ['instagramFX', 'ig'], ['spotify', 'sp']].map(([k, i]) => D.redes[k] ? `<a href="${esc(D.redes[k].url)}" target="_blank" rel="noopener" aria-label="${k}">${ICO[i]}</a>` : '').join('');
  buscador();
  cargaPartidos();
  const mas = document.getElementById('tb-mas');
  if (mas) mas.onclick = () => { document.querySelector('.links').classList.toggle('open'); mas.classList.toggle('act'); };
  addEventListener('hashchange', router);
  router();
}).catch(e => { app.innerHTML = '<div class="wrap loading"><p class="px">SIN SEÑAL</p><p>No pudimos cargar los datos. Intenta de nuevo en un momento.</p></div>'; console.error(e); });
})();

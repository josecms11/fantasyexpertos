/* FANTASY EXPERTOS – app v10. Todo se arma desde data/v2/*.json (motor en GitHub Actions) + ESPN en vivo. */
(() => {
const $ = (s, el = document) => el.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const app = $('#app');

const EQUIPOS = { ARI: 'Arizona Cardinals', ATL: 'Atlanta Falcons', BAL: 'Baltimore Ravens', BUF: 'Buffalo Bills', CAR: 'Carolina Panthers', CHI: 'Chicago Bears', CIN: 'Cincinnati Bengals', CLE: 'Cleveland Browns', DAL: 'Dallas Cowboys', DEN: 'Denver Broncos', DET: 'Detroit Lions', GB: 'Green Bay Packers', HOU: 'Houston Texans', IND: 'Indianapolis Colts', JAX: 'Jacksonville Jaguars', KC: 'Kansas City Chiefs', LV: 'Las Vegas Raiders', LAC: 'Los Angeles Chargers', LAR: 'Los Angeles Rams', MIA: 'Miami Dolphins', MIN: 'Minnesota Vikings', NE: 'New England Patriots', NO: 'New Orleans Saints', NYG: 'New York Giants', NYJ: 'New York Jets', PHI: 'Philadelphia Eagles', PIT: 'Pittsburgh Steelers', SF: 'San Francisco 49ers', SEA: 'Seattle Seahawks', TB: 'Tampa Bay Buccaneers', TEN: 'Tennessee Titans', WAS: 'Washington Commanders' };
const COL = { ARI: ['#97233F', '#FFB612'], ATL: ['#A71930', '#101820'], BAL: ['#241773', '#9E7C0C'], BUF: ['#00338D', '#C60C30'], CAR: ['#0085CA', '#101820'], CHI: ['#0B162A', '#C83803'], CIN: ['#FB4F14', '#101820'], CLE: ['#311D00', '#FF3C00'], DAL: ['#003594', '#869397'], DEN: ['#FB4F14', '#002244'], DET: ['#0076B6', '#B0B7BC'], GB: ['#203731', '#FFB612'], HOU: ['#03202F', '#A71930'], IND: ['#002C5F', '#A2AAAD'], JAX: ['#006778', '#D7A22A'], KC: ['#E31837', '#FFB81C'], LV: ['#101820', '#A5ACAF'], LAC: ['#0080C6', '#FFC20E'], LAR: ['#003594', '#FFA300'], MIA: ['#008E97', '#FC4C02'], MIN: ['#4F2683', '#FFC62F'], NE: ['#002244', '#C60C30'], NO: ['#D3BC8D', '#101820'], NYG: ['#0B2265', '#A71930'], NYJ: ['#125740', '#FFFFFF'], PHI: ['#004C54', '#A5ACAF'], PIT: ['#FFB612', '#101820'], SF: ['#AA0000', '#B3995D'], SEA: ['#002244', '#69BE28'], TB: ['#D50A0A', '#FF7900'], TEN: ['#0C2340', '#4B92DB'], WAS: ['#5A1414', '#FFB612'] };
const col = t => COL[t] || ['#2E6B47', '#5BC489'];
const vars = t => `--c1:${col(t)[0]};--c2:${col(t)[1]}`;
const POSICIONES = { QB: 'Quarterbacks', RB: 'Running backs', WR: 'Receptores', TE: 'Alas cerradas', K: 'Pateadores', DEF: 'Defensivas' };
const ESTATUS = { Questionable: 'Duda', Doubtful: 'Duda', Out: 'Fuera', IR: 'Fuera', PUP: 'Fuera', Sus: 'Fuera', NA: 'Fuera' };
const ETIQUETAS = ['START', 'SIT', 'WAIVER', 'LESIÓN', 'TRADE', 'TENDENCIA'];
const ETQ = { START: 'START', SIT: 'SIT', WAIVER: 'WAIVER WIRE', LESIÓN: 'REPORTE MÉDICO', TRADE: 'TRADE', TENDENCIA: 'TENDENCIA' };
const DIVS = { AFC: { ESTE: ['BUF', 'MIA', 'NE', 'NYJ'], NORTE: ['BAL', 'CIN', 'CLE', 'PIT'], SUR: ['HOU', 'IND', 'JAX', 'TEN'], OESTE: ['DEN', 'KC', 'LV', 'LAC'] },
  NFC: { ESTE: ['DAL', 'NYG', 'PHI', 'WAS'], NORTE: ['CHI', 'DET', 'GB', 'MIN'], SUR: ['ATL', 'CAR', 'NO', 'TB'], OESTE: ['ARI', 'LAR', 'SF', 'SEA'] } };
const FMTS = ['PPR', 'HALF PPR', 'STANDARD'];
let FMT = 0; try { FMT = +(localStorage.getItem('fx-fmt') || 0) || 0; } catch (e) {}

let D = null, P = [], J = {}, RANKPOS = {}, RANKW = {}, SEMNUM = null;
/* =============================== IDIOMA (ES / EN) ===============================
   Prioridad: la página (las de /en/ fijan inglés) > lo que eligió el usuario > el idioma de su navegador/región.
   Fase 1: menú, encabezado, pie, blog y avisos en inglés. Las noticias diarias siguen en español. */
let LANG = (() => { try { const g = localStorage.getItem('fx-lang'); if (g === 'es' || g === 'en') return g; } catch (e) {} if (window.FX_LANG === 'en' || window.FX_LANG === 'es') return window.FX_LANG; return /^es\b/i.test(navigator.language || 'es') ? 'es' : 'en'; })();
window.FX_LANG_ACTUAL = LANG; try { document.documentElement.lang = LANG; } catch (e) {}
const tx = (es, en) => LANG === 'en' ? en : es;
const NAV_EN = { '': 'HOME', partidos: 'GAMES', noticias: 'NEWS', lideres: 'LEADERS', posicion: 'RANKINGS', equipos: 'TEAMS', lesionados: 'INJURIES', temporada: 'SEASON', herramientas: 'TOOLS', media: 'FX TV', cuenta: 'MY ACCOUNT' };
const NAV_ES = {};
function aplicaIdioma() {
  document.documentElement.lang = LANG;
  document.querySelectorAll('.links a[data-s]').forEach(a => { const k = a.dataset.s; if (k === 'premium') return; if (!(k in NAV_ES)) NAV_ES[k] = a.textContent; a.textContent = LANG === 'en' ? (NAV_EN[k] || NAV_ES[k]) : NAV_ES[k]; });
  const q = document.getElementById('q'); if (q) q.placeholder = innerWidth < 520 ? tx('Buscar', 'Search') : tx('Buscar jugador o equipo', 'Search player or team');
  const pie = document.getElementById('pie-legal'); if (pie) pie.innerHTML = tx('Sitio independiente. No afiliado a ninguna liga ni equipo profesional. · <a href="#/privacidad" style="color:inherit">Aviso de privacidad</a>', 'Independent site. Not affiliated with any league or professional team. · <a href="#/privacidad" style="color:inherit">Privacy notice</a>');
  const bl = document.getElementById('btn-lang'); if (bl) { bl.innerHTML = `<svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="6.5" fill="none" stroke="currentColor" stroke-width="1.4"/><path d="M1.5 8h13M8 1.5c2 2 2.8 4.2 2.8 6.5S10 12.5 8 14.5M8 1.5C6 3.5 5.2 5.7 5.2 8S6 12.5 8 14.5" fill="none" stroke="currentColor" stroke-width="1.2"/></svg>${LANG.toUpperCase()}<i>▾</i>`; bl.title = tx('Idioma', 'Language'); }
  document.querySelectorAll('[data-lang]').forEach(b => b.setAttribute('aria-checked', b.dataset.lang === LANG ? 'true' : 'false'));
  document.querySelectorAll('[data-lang]').forEach(b => b.classList.toggle('on', b.dataset.lang === LANG));
}
function cambiaIdioma(l) { if (l === LANG) return; LANG = l; try { localStorage.setItem('fx-lang', l); } catch (e) {} location.reload(); }
// Selector de idioma: el botón muestra el idioma actual y abre un menú; se cambia al elegir una opción
const menuIdioma = abre => { const m = document.getElementById('lang-menu'), b = document.getElementById('btn-lang'); if (!m || !b) return; m.hidden = !abre; b.setAttribute('aria-expanded', abre ? 'true' : 'false'); };
document.addEventListener('click', e => { const t = e.target.closest ? e.target : null; if (!t) return;
  if (t.closest('#btn-lang')) { e.preventDefault(); const m = document.getElementById('lang-menu'); menuIdioma(m && m.hidden); return; }
  const op = t.closest('[data-lang]'); if (op) { e.preventDefault(); menuIdioma(false); cambiaIdioma(op.dataset.lang); return; }
  if (!t.closest('#lang-menu')) menuIdioma(false); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') menuIdioma(false); });


/* ---------- utilidades ---------- */
const estatus = j => ESTATUS[j.inj] || 'Sano';
const fuera = j => ['Out', 'IR', 'PUP', 'Sus', 'NA'].includes(j.inj);
const fueraTemp = j => ['IR', 'PUP', 'Sus', 'NA'].includes(j.inj);
const PARTES = { ankle: 'Tobillo', knee: 'Rodilla', hamstring: 'Isquiotibial', achilles: 'Tendón de Aquiles', calf: 'Pantorrilla', quadriceps: 'Cuádriceps', quad: 'Cuádriceps', undisclosed: 'No revelada', shoulder: 'Hombro', ribs: 'Costillas', rib: 'Costillas', foot: 'Pie', neck: 'Cuello', groin: 'Ingle', back: 'Espalda', concussion: 'Conmoción', hip: 'Cadera', wrist: 'Muñeca', hand: 'Mano', elbow: 'Codo', toe: 'Dedo del pie', illness: 'Enfermedad', thumb: 'Pulgar', chest: 'Pecho', abdomen: 'Abdomen', oblique: 'Oblicuo', pectoral: 'Pectoral', shin: 'Espinilla', leg: 'Pierna', finger: 'Dedo', head: 'Cabeza', personal: 'Asunto personal', 'not injury related': 'No relacionada a lesión', surgery: 'Cirugía', left: 'izquierdo', right: 'derecho', fibula: 'Peroné', forearm: 'Antebrazo', heel: 'Talón', biceps: 'Bíceps', triceps: 'Tríceps', knee: 'Rodilla', mcl: 'Ligamento colateral', acl: 'Ligamento cruzado', foot_: 'Pie' };
const tr = t => t ? String(t).split(/(\s*[\/,]\s*)/).map(w => PARTES[w.toLowerCase().trim()] || w).join('') : '';
const parte = j => tr((j.les && j.les.tipo) || j.injParte || '');
const altura = a => { const h = parseInt(a, 10); return h ? Math.floor(h / 12) + "'" + (h % 12) + '"' : '–'; };
const n1 = v => v == null || isNaN(v) ? '–' : (Math.round(v * 10) / 10).toFixed(1);
const nf = new Intl.NumberFormat('es-MX');
const rp = j => RANKPOS[j.id] ? j.pos + RANKPOS[j.id] : j.pos;
const rw = j => RANKW[j.id] ? j.pos + RANKW[j.id] : '–';
const hash = s => { let h = 0; for (const c of String(s)) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h; };
const nombre1 = n => { const p = String(n || '').split(' '); return p.length > 1 ? p[0] : ''; };
const apellido = n => { const p = String(n || '').split(' '); return p.length > 1 ? p.slice(1).join(' ') : p[0]; };
const hace = f => { if (!f) return ''; const m = Math.round((Date.now() - Date.parse(f)) / 60000); return m < 60 ? `hace ${Math.max(1, m)} min` : m < 1440 ? `hace ${Math.round(m / 60)} h` : new Date(f).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' }); };
const fechaC = f => f ? new Date(f).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' }) : '';
const titulo = t => { document.title = t ? t + ' · Fantasy Expertos' : 'Fantasy Expertos · Fantasy football en español'; };
const actualizado = () => 'Actualizado ' + new Date(D.actualizado).toLocaleString('es-MX', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
const esqMatches = (n = 3) => `<div class="matches" aria-busy="true" aria-label="Cargando marcadores">${'<div class="match esq"><i class="e1"></i><span class="e-row"><i class="e-hel"></i><i class="e-sc"></i><i class="e-hel"></i></span><i class="e2"></i><i class="e3"></i></div>'.repeat(n)}</div>`;
const cargador = (txt = 'CARGANDO', c = 'var(--accent)') => `<div class="wrap loading"><div class="fx-load" role="status" style="--lc:${c}">${fxLogo(56)}<span class="fx-bar"><i></i></span><p class="px">${txt}</p></div></div>`;
const fxLogo = (s = 22) => `<svg width="${s}" height="${Math.round(s * .67)}" viewBox="20 55 150 100" aria-hidden="true"><polygon points="69,58.5 166.5,58.5 153.5,82.2 83.5,82.2 49,151.7 23.7,151.7" fill="#E8E8E8"/><polygon points="90.5,94.5 146.2,94.5 133,118 79.2,118" fill="#4A9A68"/></svg>`;

/* ---------- casco pixel (sello de marca) ---------- */
function helmet(team, num, size = 44, flip = false, cls = '') {
  const [c1, c2] = col(team), t = String(num ?? '').slice(0, 2);
  const lum = (h => { const v = parseInt(h.slice(1), 16); return ((v >> 16) * .299 + ((v >> 8) & 255) * .587 + (v & 255) * .114); })(c1);
  const borde = lum < 60 ? '#7C8B83' : '#0A1A10';
  const shell = [[4,1,6],[3,2,9],[2,3,11],[1,4,12],[1,5,12],[1,6,11],[1,7,11],[2,8,9],[3,9,6]].map(([x, y, w]) => `<rect x="${x}" y="${y}" width="${w}" height="1" fill="${c1}"/>`).join('');
  const out = [[4,0,6],[3,1,1],[10,1,1],[2,2,1],[12,2,1],[1,3,1],[13,3,1],[0,4,1],[0,5,1],[0,6,1],[0,7,1],[1,8,1],[2,9,1],[3,10,6],[9,9,1]].map(([x, y, w]) => `<rect x="${x}" y="${y}" width="${w}" height="1" fill="${borde}"/>`).join('');
  return `<svg class="hel ${cls}" width="${size}" height="${Math.round(size * 12 / 16)}" viewBox="0 0 16 12" aria-hidden="true" shape-rendering="crispEdges"${flip ? ' style="transform:scaleX(-1)"' : ''}>${out}${shell}
    <rect x="4" y="1" width="6" height="1" fill="${c2}"/><rect x="10" y="2" width="2" height="1" fill="${c2}"/><rect x="12" y="3" width="1" height="1" fill="${c2}"/>
    <rect x="3" y="3" width="2" height="1" fill="#fff" opacity=".45"/><rect x="2" y="4" width="1" height="2" fill="#fff" opacity=".3"/><rect x="4" y="5" width="2" height="2" fill="#0A1A10"/>
    <rect x="12" y="6" width="4" height="1" fill="#C9CDD1"/><rect x="11" y="9" width="5" height="1" fill="#C9CDD1"/><rect x="15" y="6" width="1" height="4" fill="#C9CDD1"/><rect x="13" y="6" width="1" height="4" fill="#C9CDD1"/>
    ${t ? `<text x="8.6" y="7.7" font-size="2.9" font-family="'Press Start 2P', monospace" fill="${c2}" text-anchor="middle"${flip ? ' transform="scale(-1,1) translate(-17.2,0)"' : ''}>${esc(t)}</text>` : ''}</svg>`;
}
const flecha = (imp, s = 16) => imp === 'SUBE'
  ? `<svg width="${s}" height="${s}" viewBox="0 0 7 7" shape-rendering="crispEdges" aria-hidden="true"><rect x="3" y="0" width="1" height="1" fill="#5BC489"/><rect x="2" y="1" width="3" height="1" fill="#5BC489"/><rect x="1" y="2" width="5" height="1" fill="#5BC489"/><rect x="0" y="3" width="7" height="1" fill="#5BC489"/><rect x="2" y="4" width="3" height="3" fill="#5BC489"/></svg>`
  : imp === 'BAJA' ? `<svg width="${s}" height="${s}" viewBox="0 0 7 7" shape-rendering="crispEdges" aria-hidden="true"><rect x="2" y="0" width="3" height="3" fill="#F2786A"/><rect x="0" y="3" width="7" height="1" fill="#F2786A"/><rect x="1" y="4" width="5" height="1" fill="#F2786A"/><rect x="2" y="5" width="3" height="1" fill="#F2786A"/><rect x="3" y="6" width="1" height="1" fill="#F2786A"/></svg>`
  : `<svg width="${s}" height="${s}" viewBox="0 0 7 7" shape-rendering="crispEdges" aria-hidden="true"><rect x="0" y="3" width="7" height="1" fill="#E8E8E8"/></svg>`;
const impBadge = imp => `<span class="imp ${imp}">${flecha(imp)}${imp === 'SUBE' ? 'SUBE' : imp === 'BAJA' ? 'BAJA' : 'ESTABLE'}</span>`;

/* ---------- escena pixel (celebraciones) ---------- */
const SPR = { runA: ['..HHHH..', '.HHHHHM.', '.HHHHS..', '.JJJJJJ.', 'SJJNNJJB', '.JJJJJJB', '.JJJJJJ.', '..PPPP..', '..P..P..', '.L....L.', 'K......K'], runB: ['..HHHH..', '.HHHHHM.', '.HHHHS..', '.JJJJJJ.', 'SJJNNJJB', '.JJJJJJB', '.JJJJJJ.', '..PPPP..', '...PP...', '...LL...', '...KK...'] };
function sprite(grid, x, y, c1, c2) { const m = { H: c1, M: '#C9CDD1', S: '#C68B59', J: c1, N: c2, B: '#8B4A2B', P: '#E8E8E8', L: c1, K: '#101820' }; let o = ''; grid.forEach((r, j) => [...r].forEach((ch, i) => { if (m[ch]) o += `<rect x="${x + i}" y="${y + j}" width="1" height="1" fill="${m[ch]}"/>`; })); return o; }
function escenaTD(team) {
  const [c1, c2] = col(team);
  let z = `<rect width="80" height="32" fill="#12441F"/>`; for (let i = 0; i < 80; i += 8) z += `<rect x="${i}" width="4" height="32" fill="#0F3A1E"/><rect x="${i}" width="1" height="32" fill="#fff" opacity=".22"/>`;
  z += `<rect x="66" width="14" height="32" fill="${c1}"/><g><g>${sprite(SPR.runA, 0, 14, c1, c2)}<animate attributeName="opacity" values="1;0" dur=".36s" calcMode="discrete" repeatCount="indefinite"/></g><g opacity="0">${sprite(SPR.runB, 0, 14, c1, c2)}<animate attributeName="opacity" values="0;1" dur=".36s" calcMode="discrete" repeatCount="indefinite"/></g><animateTransform attributeName="transform" type="translate" values="-10 0;60 0;60 0" keyTimes="0;.75;1" dur="3.2s" repeatCount="indefinite"/></g>`;
  return `<svg class="scene" viewBox="0 0 80 32" preserveAspectRatio="xMidYMid slice" shape-rendering="crispEdges" aria-hidden="true">${z}</svg>`;
}

/* ---------- formato de puntos, ranking semanal y START / FLEX / SIT ---------- */
const semActual = () => (D.cal && D.cal.semana) || D.semana;
const rivalDe = (team, w = semActual()) => D.cal && D.cal.cal && D.cal.cal[team] ? D.cal.cal[team][w] || null : null;
const rivalTxt = (team, w = semActual()) => { const r = rivalDe(team, w); return r ? `${r.home ? 'vs' : '@'} ${r.opp}` : 'BYE'; };
const juega = j => j.team !== 'FA' && !fuera(j) && !!rivalDe(j.team);
function aplicaFormato() {
  P.forEach(j => {
    const log = j.log || [];
    j.temp = log.map(l => l.f ? l.f[FMT] : null);
    const jug = j.temp.filter(v => v != null);
    j.total = jug.length ? Math.round(jug.reduce((a, b) => a + b, 0) * 10) / 10 : null;
    j.prom = jug.length ? Math.round(j.total / jug.length * 10) / 10 : null;
    j.hist = (D.semanas || []).map(w => { const l = log.find(x => x.w === w); return l && l.f ? l.f[FMT] : null; });
    const ult = [...log].reverse().find(l => l.f);
    j.ult = ult ? ult.f[FMT] : null; j.ultW = ult ? ult.w : null;
    j.p = j.proy && j.proy[FMT] != null ? j.proy[FMT] : null;
    j.pEst = j.p != null ? j.p : j.prom != null ? j.prom * .9 : 0; // estimado si no hay proyección
  });
  RANKPOS = {}; RANKW = {};
  Object.keys(POSICIONES).forEach(pos => {
    P.filter(j => j.pos === pos && j.total).sort((a, b) => b.total - a.total).forEach((j, i) => RANKPOS[j.id] = i + 1);
    P.filter(j => j.pos === pos && juega(j)).sort((a, b) => b.pEst - a.pEst).forEach((j, i) => RANKW[j.id] = i + 1);
  });
  SEMNUM = null; for (const w of [...(D.semanas || [])].reverse()) if (P.some(j => (j.log || []).some(l => l.w === w && l.f))) { SEMNUM = w; break; }
  document.querySelectorAll('.fmt button').forEach((b, i) => b.classList.toggle('on', i === FMT));
}
const ptsSem = (j, w = SEMNUM) => { const l = (j.log || []).find(x => x.w === w); return l && l.f ? l.f[FMT] : null; };
function estrellas(opp, pos) {
  const d = D.cal && D.cal.dvp && D.cal.dvp[opp] && D.cal.dvp[opp][pos];
  return d ? { n: Math.max(1, Math.min(5, Math.ceil((33 - d.rank) / 6.4))), rank: d.rank, prom: d.prom } : null;
}
const pintaEstrellas = e => e ? `<span class="stars s${e.n}" title="Defensa Nº${e.rank} en puntos permitidos">${'★'.repeat(e.n)}<i>${'★'.repeat(5 - e.n)}</i></span>` : '<span class="stars">–</span>';
const CORTE = { QB: [12, 20], RB: [24, 40], WR: [30, 50], TE: [10, 18], K: [12, 18], DEF: [12, 12] };
function veredicto(j) {
  const r = rivalDe(j.team), st = estatus(j), razones = [];
  if (j.team === 'FA') return { v: 'SIT', razones: ['Agente libre: no tiene equipo esta semana.'], e: null };
  if (fuera(j)) return { v: 'OUT', razones: [`${fueraTemp(j) ? 'En reserva de lesionados' : 'Descartado para esta semana'}${parte(j) ? ' (' + parte(j) + ')' : ''}. No lo alinees.`], e: null };
  if (!r) return { v: 'BYE', razones: ['Semana de descanso: su equipo no juega.'], e: null };
  const k = RANKW[j.id] || 99, [c1, c2] = CORTE[j.pos] || [12, 18];
  const e = estrellas(r.opp, j.pos);
  razones.push(j.p != null ? `Proyección ${FMTS[FMT]} de ${n1(j.p)} pts: es el ${j.pos}${k} de la semana ${semActual()}.` : `Sin proyección oficial; por su promedio (${n1(j.prom)}) es el ${j.pos}${k} de la semana.`);
  if (e) razones.push(j.pos === 'DEF' ? `${r.home ? 'En casa' : 'De visita'} ante ${r.opp}: ${e.n >= 4 ? 'ofensiva que le regala puntos a las defensivas' : e.n <= 2 ? 'ofensiva que cuida el balón' : 'matchup neutral'} (Nº${e.rank} en puntos que permite a defensivas).` : `${r.home ? 'En casa' : 'De visita'} ante ${r.opp}: ${e.n >= 4 ? 'defensa que regala puntos' : e.n <= 2 ? 'defensa dura' : 'matchup neutral'} contra ${j.pos} (Nº${e.rank} en puntos permitidos).`);
  const u3 = (j.temp || []).filter(v => v != null).slice(-3);
  if (u3.length >= 2 && j.prom) { const f = u3.reduce((a, b) => a + b, 0) / u3.length / j.prom; if (f > 1.2) razones.push('Viene en racha: sus últimas semanas superan su promedio.'); else if (f < .8) razones.push('Viene a la baja en sus últimas semanas.'); }
  const nota = todasNoticias().find(n => (n.jugadores || [])[0] === j.id);
  if (nota && Date.now() - Date.parse(nota.fecha || 0) < 4 * 864e5) razones.push(`${nota.impacto === 'SUBE' ? 'A favor' : nota.impacto === 'BAJA' ? 'En contra' : 'Ojo'}: «${nota.titulo}».`);
  if (j.add > 1000) razones.push(`La comunidad lo agregó en ${nf.format(j.add)} ligas en 24 h.`);
  if (st === 'Duda') razones.push('Está en duda: confirma su estatus antes del kickoff.');
  let v = k <= c1 ? 'START' : k <= c2 ? 'FLEX' : 'SIT';
  if (st === 'Duda' && v === 'START') v = 'FLEX';
  return { v, razones, e, k };
}
const VTXT = { START: 'START', FLEX: 'FLEX', SIT: 'SIT', OUT: 'OUT', BYE: 'BYE' };
const fxPill = j => { const v = veredicto(j).v; return `<span class="fxv ${v}">${fxLogo(15)}${VTXT[v]}</span>`; };

/* ---------- noticias ---------- */
const normN = (n, i = 0) => {
  if (typeof n === 'string') n = { titulo: n, cuerpo: n, etiqueta: 'TENDENCIA' };
  if (LANG === 'en' && n.en && n.en.titulo) { const e = n.en; n = { ...n, ...Object.fromEntries(Object.entries(e).filter(([, v]) => v && (!Array.isArray(v) || v.length))), _en: 1 }; }
  const et = n.etiqueta === 'ARRANCA' ? 'START' : n.etiqueta === 'BANCA' ? 'SIT' : ETIQUETAS.includes(n.etiqueta) ? n.etiqueta : 'TENDENCIA';
  const cl = (n.claves && n.claves.length) ? n.claves : String(n.cuerpo || '').split(/(?<=[.!?])\s+/).filter(Boolean).slice(0, 3);
  const imp = n.impacto || ({ START: 'SUBE', WAIVER: 'SUBE', LESIÓN: 'BAJA', SIT: 'BAJA' })[et] || 'NEUTRO';
  return { ...n, id: n.id || 'r' + i, etiqueta: et, claves: cl, impacto: imp, jugadores: n.jugadores || [], equipos: n.equipos || [n.equipo].filter(Boolean) };
};
let _todas = null;
let _todasAll = null;
const todasConVencidas = () => { if (_todasAll) return _todasAll; const v = new Set(), arch = Object.fromEntries((D.archivo || []).map(n => [n.id, n])); _todasAll = D.noticias.map(n => arch[n.id] || n).concat(D.archivo || []).filter(n => !v.has(n.id) && v.add(n.id)); return _todasAll; };
// Las notas que ya no aplican (el jugador quedó fuera después de publicarse) no salen en portada ni listas; su página sí abre, con aviso.
const todasNoticias = () => _todas || (_todas = todasConVencidas().filter(n => !n.vencida));
const equiposDe = n => [...new Set([n.equipo, ...(n.equipos || []), ...(n.jugadores || []).map(id => J[id] && J[id].team)].filter(t => t && EQUIPOS[t]))];
const noticiasDe = id => todasNoticias().filter(n => (n.jugadores || []).includes(id));
const noticiasEquipo = t => todasNoticias().filter(n => equiposDe(n).includes(t));

/* ---------- tarjeta de noticia (v3): el diseño cambia según de qué trata la nota ---------- */
const POSN = { QB: 'QUARTERBACKS', RB: 'CORREDORES', WR: 'RECEPTORES', TE: 'ALAS CERRADAS', K: 'PATEADORES', DEF: 'DEFENSIVAS' };
const TEMA_ETQ = { TRADE: 'MERCADO DE CAMBIOS', WAIVER: 'AGENCIA LIBRE', START: 'START / SIT', SIT: 'START / SIT', LESIÓN: 'REPORTE MÉDICO', TENDENCIA: 'TENDENCIAS' };
const sinAc = x => String(x || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
function tipoTarjeta(n) {
  const ps = (n.jugadores || []).map(id => J[id]).filter(Boolean), tit = sinAc(n.titulo);
  const enTit = ps.filter(x => tit.includes(sinAc(apellido(x.n).replace(/ (jr|sr|ii|iii)\.?$/i, ''))));
  if (enTit.length === 1 || (ps.length === 1 && !enTit.length)) return { k: 'jug', p: enTit[0] || ps[0], ps };
  if (ps.length >= 2) return { k: 'grupo', ps: enTit.length >= 2 ? enTit : ps };
  const eqs = equiposDe(n);
  return eqs.length === 1 ? { k: 'equipo', t: eqs[0], ps } : { k: 'general', eqs, ps };
}
const equipoDe = p => p && EQUIPOS[p.team] ? p.team : '';
function chipNota(n, p) {
  const et = n.etiqueta, vende = /vend/i.test((n.accion || '') + ' ' + (n.titulo || ''));
  if (et === 'START') return '<span class="fxv-chip ok">START</span>';
  if (et === 'SIT') return '<span class="fxv-chip no">SIT</span>';
  if (et === 'TRADE') return `<span class="fxv-chip ${vende ? 'no' : 'ok'}">${vende ? 'VENDE' : 'COMPRA'}</span>`;
  if (et === 'WAIVER') return `<span class="fxv-chip sky">+ AGRÉGALO${p && p.add ? `<small>${p.add >= 1000 ? Math.round(p.add / 1000) + 'K' : p.add} ligas</small>` : ''}</span>`;
  if (et === 'LESIÓN') return `<span class="fxv-chip med"><i class="cruz"></i>${p ? esc(estatus(p).toUpperCase()) : 'LESIÓN'}${p && parte(p) ? `<small>${esc(parte(p))}</small>` : ''}</span>`;
  return '';
}
function thumb(n, big) {
  const T = tipoTarjeta(n), et = n.etiqueta, imp = n.impacto || 'NEUTRO', sem = n.semana || semActual();
  const top = `<span class="fxc-top">${n.exclusivo ? `<span class="fxc-pill prem">★ PREMIUM</span>` : ''}<span class="fxc-pill cat ${et}">${esc(ETQ[et] || et || 'NFL')}</span><span class="fxc-imp ${imp}">${flecha(imp, 12)}${imp === 'SUBE' ? 'SUBE' : imp === 'BAJA' ? 'BAJA' : 'ESTABLE'}</span></span>`;
  const celda = (b, i) => `<span><b>${b}</b><i>${i}</i></span>`, marca = `<span class="fxc-marca">${fxLogo(16)}</span>`;
  let cls = '', st = '', mid = '', strip = '', fondo = '';
  if (T.k === 'jug') {
    const p = T.p, t = equipoDe(p) || n.equipo || '', [ap, nom] = [apellido(p.n), nombre1(p.n)];
    cls = 'v-jug'; st = vars(t);
    fondo = `<span class="fxc-num" aria-hidden="true">${esc(p.num != null && p.num !== 0 ? p.num : p.pos)}</span>`;
    let extra = chipNota(n, p);
    if (et === 'TENDENCIA') { const sr = (p.temp || []).filter(v => v != null).slice(-6), mx = Math.max(10, ...sr); if (sr.length > 1) extra = `<svg class="fxc-spark" viewBox="0 0 100 30" preserveAspectRatio="none" aria-hidden="true"><polyline points="${sr.map((v, i) => `${Math.round(i / (sr.length - 1) * 100)},${Math.round(28 - v / mx * 26)}`).join(' ')}" fill="none" stroke="currentColor" stroke-width="3" vector-effect="non-scaling-stroke"/></svg>`; }
    mid = `<span class="fxc-txt"><small>${esc(nom)}</small><b class="${ap.length > 11 ? 'xl' : ap.length > 8 ? 'l' : ''}">${esc(ap)}</b><em>${esc(p.pos)}${t ? ' · ' + esc(EQUIPOS[t]) : ' · Agente libre'}</em>${extra ? `<span class="fxc-ver">${extra}</span>` : ''}</span><span class="fxc-vis">${helmet(t, p.num || '', big ? 170 : 110, true, 'fxc-hel')}</span>`;
    strip = celda(esc(rw(p) !== '–' ? rw(p) : p.pos), 'S' + semActual()) + celda(p.p != null ? n1(p.p) : n1(p.prom), p.p != null ? 'PROY' : 'PROM') + (fuera(p) ? celda(esc(estatus(p).toUpperCase()), 'ESTATUS') : celda(t ? esc(rivalTxt(t)) : '–', 'RIVAL'));
  } else if (T.k === 'grupo') {
    const G = T.ps.slice(0, 3), pos = [...new Set(T.ps.map(x => x.pos))], tema = pos.length === 1 ? POSN[pos[0]] : (TEMA_ETQ[et] || 'FANTASY');
    cls = 'v-grupo'; st = `--c1:${col(equipoDe(G[0]))[0]};--c3:${col(equipoDe(G[1]))[0]}`;
    fondo = `<span class="fxc-num" aria-hidden="true">${pos.length === 1 ? pos[0] : 'FX'}</span>`;
    mid = `<span class="fxc-txt"><small>SEMANA ${sem} · ${esc(T.ps.length)} JUGADORES</small><b class="${tema.length > 12 ? 'xl' : tema.length > 9 ? 'l' : ''}">${esc(tema)}</b>${chipNota(n) ? `<span class="fxc-ver">${chipNota(n)}</span>` : ''}</span><span class="fxc-vis pila">${G.map((x, i) => helmet(equipoDe(x), '', big ? 110 : 76, true, 'fxc-hel h' + i)).join('')}</span>`;
    strip = G.map(x => `<span class="fxc-q">${helmet(equipoDe(x), '', 22)}<span><b>${esc(apellido(x.n))}</b><i>${esc(x.pos)}${equipoDe(x) ? ' · ' + x.team : ''}${x.p != null ? ' · ' + n1(x.p) : ''}</i></span></span>`).join('');
  } else if (T.k === 'equipo') {
    const t = T.t, nm = EQUIPOS[t] || t, ult = nm.split(' ').pop();
    cls = 'v-equipo'; st = vars(t);
    fondo = `<span class="fxc-num" aria-hidden="true">${esc(t)}</span>`;
    mid = `<span class="fxc-txt"><small>${esc(nm.split(' ').slice(0, -1).join(' '))}</small><b class="${ult.length > 9 ? 'l' : ''}">${esc(ult)}</b><em>${esc(recordDe(t) || '')} · Semana ${sem}</em>${chipNota(n) ? `<span class="fxc-ver">${chipNota(n)}</span>` : ''}</span><span class="fxc-vis">${helmet(t, '', big ? 170 : 110, true, 'fxc-hel')}</span>`;
    strip = celda(esc(recordDe(t) || '–'), 'RÉCORD') + celda(esc(rivalTxt(t)), 'S' + semActual()) + celda(noticiasEquipo(t).length, 'NOTICIAS');
  } else {
    const E = T.eqs.slice(0, 4);
    cls = 'v-general'; st = `--c1:${col(E[0])[0]};--c3:${col(E[1])[0]}`;
    fondo = `<span class="fxc-num" aria-hidden="true">${sem}</span>`;
    const kw = /previa/i.test(n.titulo) ? 'LA PREVIA' : /resumen|recap/i.test(n.titulo) ? 'EL RESUMEN' : (TEMA_ETQ[et] || 'FANTASY FOOTBALL');
    mid = `<span class="fxc-txt"><small>${kw}</small><b>SEMANA ${sem}</b>${E.length ? `<em>${E.length} ${E.length === 1 ? 'equipo' : 'equipos'} en la nota</em>` : ''}</span>${E.length ? `<span class="fxc-vis pila">${E.slice(0, 3).map((t, i) => helmet(t, '', big ? 110 : 76, true, 'fxc-hel h' + i)).join('')}</span>` : ''}`;
    strip = E.length ? E.map(t => `<span class="fxc-q">${helmet(t, '', 22)}<span><b>${t}</b><i>${esc(recordDe(t) || '')}</i></span></span>`).join('') : celda('NFL', 'SEMANA ' + sem);
  }
  return `<span class="fxc ${cls} e-${et} ${big ? 'big' : ''}" style="${st}">${fondo}<span class="fxc-campo" aria-hidden="true"></span>${top}<span class="fxc-mid">${mid}</span><span class="fxc-strip">${strip}${marca}</span></span>`;
}
// Tarjeta de marca: el consejo de fantasy de Fantasy Expertos, flotando dentro de la nota o el artículo
/* El consejo de los Expertos: la acción siempre es gratis; el análisis completo y la lectura del modelo FX son Premium.
   Gratis ve un adelanto (primera frase + desvanecido) con el borde neón lento que marca lo Premium. */
const lecturaFX = j => {
  if (!j || !j.proy) return '';
  const lg = (j.log || []).filter(l => l.f && l.f[FMT] != null), u = lg.slice(-5).map(l => l.f[FMT]);
  const misma = Object.values(J).filter(x => x.pos === j.pos && x.proy).sort((a, b) => b.proy[FMT] - a.proy[FMT]), rk = misma.indexOf(j) + 1;
  const vk = j.pos === 'RB' || j.pos === 'QB' ? 'ra' : 'tg', vol = lg.slice(-3).map(l => (l.st || {})[vk] || 0), vm = vol.length ? n1(vol.reduce((a, b) => a + b, 0) / vol.length) : null;
  const dato = (k, v) => `<span><small>${k}</small><b>${v}</b></span>`;
  return `<div class="cs-fx"><div class="cs-fx-h">${sello()}<span>${tx('Lectura del modelo', 'Model read')}</span></div><div class="cs-fx-g">
    ${dato(tx('Proyección', 'Projection'), n1(j.proy[FMT]) + ' pts')}${rk ? dato(tx('Rango', 'Rank'), j.pos + rk) : ''}
    ${u.length ? dato(tx('Piso / techo', 'Floor / ceiling'), n1(Math.min(...u)) + ' / ' + n1(Math.max(...u))) : ''}${vm != null ? dato(vk === 'ra' ? tx('Acarreos (3 sem)', 'Carries (3 wk)') : tx('Targets (3 sem)', 'Targets (3 wk)'), vm) : ''}</div></div>`;
};
/* Zona Premium reutilizable: suscriptor ve el contenido; el resto ve un adelanto borroso con el borde neón y un clic a Premium. */
const zonaPrem = (html, gancho) => esPremium() ? `<div class="pz es-prem">${html}</div>`
  : `<div class="pz lock"><div class="pz-in" aria-hidden="true">${html}</div><a class="cs-cta pz-cta" href="#/premium">${CANDADO}<span>${esc(gancho)}</span><b>Premium ›</b></a></div>`;
const pisoTecho = j => { const u = (j.log || []).filter(l => l.f && l.f[FMT] != null).slice(-5).map(l => l.f[FMT]); return u.length >= 2 ? [Math.min(...u), Math.max(...u)] : null; };
/* Sello de la tecnología propia: marca todo lo que sale de nuestros sistemas. */
const sello = (x = '') => `<span class="fx-tech ${x}">${fxLogo(12)}<b>FX TECH</b> ANALYZER</span>`;
/* Ventaja FX: cada sección trae un extra hecho con nuestros sistemas. Botón (i) explica qué es; el contenido es Premium. */
const infoFX = t => `<button type="button" class="fx-info" aria-label="${tx('¿Qué es esto?', 'What is this?')}">i<span role="tooltip">${t}</span></button>`;
const proBloque = (titulo, info, html, gancho) => `<section class="block plusfx" data-chip="★ ${tx('VENTAJA FX', 'FX EDGE')}"><div class="head"><div><h2>${titulo} ${infoFX(info)}</h2></div><a class="all" href="#/premium">${tx('Todo Premium', 'All Premium')} ›</a></div><div class="card plus-in"><div class="plus-sello">${sello()}</div>${zonaPrem(html, gancho)}</div></section>`;
const filaPlus = (j, der, sub) => `<a class="cg-j" href="#/jugador/${j.id}" data-hover-j="${j.id}">${helmet(j.team, j.num, 30)}<span class="cg-jn"><b>${esc(j.n)}</b><small>${sub}</small></span>${der}</a>`;
function plusLesion() {
  const L = D.lesionados.map(x => J[x.id]).filter(j => j && (fuera(j) || estatus(j) === 'Duda') && ['QB', 'RB', 'WR', 'TE'].includes(j.pos) && (j.pEst > 5 || (j.rank && j.rank < 150))).slice(0, 8);
  const filas = L.map(j => { const b = P.filter(x => x.team === j.team && x.pos === j.pos && x.id !== j.id && juega(x)).sort((a, c) => c.pEst - a.pEst)[0]; return b ? filaPlus(b, `<b class="n cg-p">${n1(b.pEst)}</b>`, tx(`Si ${j.n} no juega, el beneficiado es él · ${b.pos} ${b.team}`, `If ${j.n} sits, he's the one who benefits · ${b.pos} ${b.team}`)) : ''; }).filter(Boolean);
  return filas.length ? proBloque(tx('Reemplazos FX', 'FX replacements'), tx('Para cada lesionado relevante, el compañero que hereda su volumen según el Modelo FX: el waiver que tu liga todavía no ve.', 'For every relevant injury, the teammate who inherits the volume according to the FX Model: the waiver your league hasn\'t spotted yet.'), filas.join(''), tx('Quién hereda el trabajo de cada lesionado', 'Who inherits each injured player\'s work')) : '';
}
function plusRepite() {
  if (!SEMNUM) return '';
  const L = P.filter(j => ptsSem(j, SEMNUM) != null && ['QB', 'RB', 'WR', 'TE'].includes(j.pos)).sort((a, b) => ptsSem(b, SEMNUM) - ptsSem(a, SEMNUM)).slice(0, 10);
  const filas = L.map(j => { const a = ptsSem(j, SEMNUM), p = j.p || 0, r = a ? p / a : 0, et = !juega(j) ? ['NO JUEGA', 'no'] : r >= .65 ? [tx('SOSTENIBLE', 'REPEATABLE'), 'ok'] : r >= .45 ? [tx('BAJA A TIERRA', 'REGRESSION'), 'mid'] : [tx('FUE UN PICO', 'ONE-OFF'), 'no'];
    return filaPlus(j, `<span class="rp ${et[1]}">${et[0]}</span>`, `S${SEMNUM}: ${n1(a)} → S${semActual()} FX: ${n1(p)}`); });
  return proBloque(tx('¿Repite? FX', 'Repeat? FX'), tx('Comparamos lo que hizo cada líder contra su proyección FX de esta semana: volumen, eficiencia y rival. Te dice si fue algo sostenible o un pico que no va a repetir.', 'We compare each leader\'s output with this week\'s FX projection: volume, efficiency and opponent. It tells you if it\'s sustainable or a one-off.'), filas.join(''), tx('Qué líderes van a repetir y cuáles fueron un pico', 'Which leaders will repeat and which were a one-off'));
}
function plusCompra() {
  const L = (D.agregados || []).map(id => J[id]).filter(j => j && j.team !== 'FA').slice(0, 10);
  const filas = L.map(j => { const v = valorROS(j), rep = REEMPLAZO[j.pos] || 20, rk = P.filter(x => x.pos === j.pos && juega(x)).sort((a, b) => b.pEst - a.pEst).indexOf(j) + 1, ok = v.valor > 15 || (rk && rk <= rep * .6);
    return filaPlus(j, `<span class="rp ${ok ? 'ok' : 'no'}">${ok ? tx('COMPRA', 'BUY') : tx('TRAMPA', 'TRAP')}</span>`, tx(`${j.pos}${rk || '–'} esta semana · valor resto de temporada ${Math.round(v.valor)}`, `${j.pos}${rk || '–'} this week · rest-of-season value ${Math.round(v.valor)}`)); });
  return filas.length ? proBloque(tx('¿Compra o trampa?', 'Buy or trap?'), tx('Todos agregan a los mismos jugadores. Medimos su valor real para el resto de la temporada contra un jugador de reemplazo: COMPRA si mejora tu equipo, TRAMPA si es puro ruido.', 'Everyone adds the same players. We measure their real rest-of-season value against a replacement player: BUY if it upgrades your team, TRAP if it\'s just noise.'), filas.join(''), tx('Qué agregados valen la pena y cuáles son trampa', 'Which adds are worth it and which are traps')) : '';
}
function plusPartidos(L) {
  if (!L || !L.length) return '';
  const tot = t => { const r = P.filter(j => j.team === t && juega(j)), top = (p, k) => r.filter(j => j.pos === p).sort((a, b) => b.pEst - a.pEst).slice(0, k); return [...top('QB', 1), ...top('RB', 2), ...top('WR', 3), ...top('TE', 1)]; };
  const filas = L.filter(g => g.estado !== 'post').map(g => { const a = tot(g.visita.ab || g.visita), b = tot(g.local.ab || g.local), sa = a.reduce((x, j) => x + j.pEst, 0), sb = b.reduce((x, j) => x + j.pEst, 0), llave = [...a, ...b].sort((x, y) => y.pEst - x.pEst)[0];
    return { g, sa, sb, llave, ta: g.visita.ab || g.visita, tb: g.local.ab || g.local }; }).filter(x => x.llave).sort((x, y) => (y.sa + y.sb) - (x.sa + x.sb));
  if (!filas.length) return '';
  const html = filas.map((x, i) => `<div class="pf-g"><span class="pf-t">${helmet(x.ta, '', 24)}<b class="n">${n1(x.sa)}</b></span><span class="pf-m">${i === 0 ? `<em>${tx('EL TIROTEO', 'SHOOTOUT')}</em>` : ''}<small>${tx('Llave', 'Key')}: <a href="#/jugador/${x.llave.id}">${esc(x.llave.n)}</a></small></span><span class="pf-t r"><b class="n">${n1(x.sb)}</b>${helmet(x.tb, '', 24)}</span></div>`).join('');
  return proBloque(tx('Pronóstico fantasy FX', 'FX fantasy forecast'), tx('Sumamos la proyección FX de los titulares de fantasy de cada equipo (QB, 2 RB, 3 WR, TE) para saber qué partidos van a dar más puntos y quién es la llave de cada uno.', 'We add up the FX projection of each team\'s fantasy starters (QB, 2 RB, 3 WR, TE) to know which games will score the most fantasy points and who the key player is.'), html, tx('Qué partidos dan más puntos de fantasy y su jugador llave', 'Which games score the most fantasy points and their key player'));
}
function plusCalendario(t) {
  const html = ['QB', 'RB', 'WR', 'TE'].map(pos => { const e = []; for (let w = semActual(); w <= 17; w++) { const r = rivalDe(t, w), x = r && estrellas(r.opp, pos); if (x) e.push(x.n); } const m = e.length ? e.reduce((a, b) => a + b, 0) / e.length : 0;
    return `<div class="pf-g"><span class="pf-t"><b>${pos}</b></span><span class="pf-m">${pintaEstrellas(m ? { n: Math.round(m), rank: '' } : null)}<small>${m >= 3.5 ? tx('Calendario a favor: compra', 'Soft schedule: buy') : m <= 2.5 ? tx('Calendario duro: vende', 'Tough schedule: sell') : tx('Calendario neutral', 'Neutral schedule')}</small></span><span class="pf-t r"><b class="n">${e.length}</b><small>${tx('juegos', 'games')}</small></span></div>`; }).join('');
  return proBloque(tx('Calendario FX resto de temporada', 'FX rest-of-season schedule'), tx('La dificultad promedio de los rivales que le quedan a este equipo, por posición, según los puntos que cada defensa permite. Clave para trades y playoffs de fantasy.', 'The average difficulty of this team\'s remaining opponents, by position, based on points each defense allows. Key for trades and fantasy playoffs.'), html, tx('A qué posiciones de este equipo comprar o vender por calendario', 'Which positions on this team to buy or sell by schedule'));
}
function plusMiLiga() {
  if (!LIGA || !(LIGA.jugadores || []).length) return `<section class="block plusfx" data-chip="★ ${tx('VENTAJA FX', 'FX EDGE')}"><a class="card plus-cta" href="#/premium"><b>${tx('Ve solo lo que afecta a TU equipo', 'See only what affects YOUR team')}</b><span>${tx('Conecta tu liga gratis y marcamos cada noticia que toca a tus jugadores.', 'Connect your league for free and we flag every story that touches your players.')}</span><em>${tx('Conectar mi liga', 'Connect my league')} ›</em></a></section>`;
  const mios = new Set(LIGA.jugadores), N = todasNoticias().filter(n => [...(n.jugadores || []), ...(n.menciona || [])].some(id => mios.has(id))).slice(0, 6);
  return N.length ? `<section class="block plusfx" data-chip="${tx('TU LIGA', 'YOUR LEAGUE')} · ${N.length}"><div class="head"><div><h2>${tx('Afecta a tu equipo', 'Affects your team')}</h2><p class="hsub">${esc(LIGA.nombre || '')}</p></div><a class="all" href="#/premium">${tx('Mi cuarto de guerra', 'My war room')} ›</a></div><div class="news stagger">${N.map(n => newsCard(n)).join('')}</div></section>` : '';
}
const consejo = ({ accion, texto, jugadores = [], veredicto }) => {
  if (!accion && !texto) return '';
  const full = esPremium(), j0 = jugadores[0];
  const frase = String(texto || '').split(/(?<=[.!?])\s+/)[0] || '', resto = String(texto || '').slice(frase.length).trim();
  const cuerpo = full ? `${texto ? `<p class="cs-texto">${enlaza(texto, jugadores)}</p>` : ''}${lecturaFX(j0)}`
    : `${frase ? `<p class="cs-texto">${enlaza(frase, jugadores)}</p>` : ''}${resto || (j0 && j0.proy) ? `<div class="cs-prev" aria-hidden="true"><p>${esc((resto || tx('El modelo FX ya tiene su lectura de este jugador para la semana.', 'The FX model already has its read on this player for the week.')).slice(0, 170))}</p></div>
      <a class="cs-cta" href="#/premium">${CANDADO}<span>${tx('Ver el análisis completo y la lectura del modelo FX', 'See the full analysis and the FX model read')}</span><b>Premium ›</b></a>` : ''}`;
  return `<aside class="consejo${full ? ' es-prem' : ' lock'}" aria-label="${tx('El consejo de los Expertos', 'Expert advice')}">
  <div class="cs-h"><span class="cs-sello">${fxLogo(22)}</span><span><small>${tx('EL CONSEJO DE LOS EXPERTOS', 'EXPERT ADVICE')}</small><b>Fantasy Expertos</b>${sello('mini')}</span>${veredicto ? `<span class="fxv-chip ${/START|AGR|ADD|COMPRA|BUY|AGUANTA|HOLD/i.test(veredicto) ? 'ok' : /SIT|VENDE|SELL/i.test(veredicto) ? 'no' : 'sky'}">${esc(veredicto)}</span>` : ''}${full ? '<span class="cs-badge">★ PREMIUM</span>' : ''}</div>
  ${accion ? `<p class="cs-accion">${enlaza(accion, jugadores)}</p>` : ''}${cuerpo}
  ${jugadores.length ? `<div class="cs-jug">${jugadores.map(j => `<a href="#/jugador/${j.id}">${helmet(j.team, j.num, 22)}<span>${esc(j.n)}</span>${fxPill(j)}</a>`).join('')}</div>` : ''}
</aside>`;
};
/* ---------- Enlaces internos: cada jugador o equipo mencionado lleva a su ficha ---------- */
let _rxLink = null, _mapLink = null;
const escRx = t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
function prepLinks() {
  _mapLink = new Map(); const keys = [];
  P.forEach(j => { if (!j.n || j.n.length < 6) return; const k = esc(j.n); if (!_mapLink.has(k)) { _mapLink.set(k, { t: 'j', id: j.id }); keys.push(k); } });
  Object.entries(EQUIPOS).forEach(([ab, nm]) => { const k = esc(nm), nick = esc(nm.split(' ').pop()); _mapLink.set(k, { t: 'e', id: ab }); keys.push(k); if (!_mapLink.has(nick)) { _mapLink.set(nick, { t: 'e', id: ab }); keys.push(nick); } });
  keys.sort((a, b) => b.length - a.length);
  _rxLink = new RegExp(`(?<![A-Za-zÀ-ÿ'])(${keys.map(escRx).join('|')})(?![A-Za-zÀ-ÿ])`, 'g');
}
// Escapa el texto y convierte en enlace los nombres conocidos. ctx = jugadores de la nota: también su apellido.
function enlaza(texto, ctx = []) {
  if (!P.length) return esc(texto);
  if (!_rxLink) prepLinks();
  let h = esc(texto);
  const extra = new Map(); ctx.forEach(j => { if (!j || !j.n) return; const ap = esc(apellido(j.n).replace(/\s+(Jr\.?|Sr\.?|II|III|IV)$/, '')); if (ap.length >= 4 && !_mapLink.has(ap)) extra.set(ap, { t: 'j', id: j.id }); });
  const rx = extra.size ? new RegExp(`${_rxLink.source.slice(0, -('(?![A-Za-zÀ-ÿ])'.length) - 1)}|${[...extra.keys()].map(escRx).join('|')})(?![A-Za-zÀ-ÿ])`, 'g') : _rxLink;
  return h.replace(rx, m => { const x = _mapLink.get(m) || extra.get(m); if (!x) return m; return x.t === 'j' ? `<a class="ilink" data-j="${x.id}" href="#/jugador/${x.id}">${m}</a>` : `<a class="ilink eq" href="#/equipo/${x.id}">${m}</a>`; });
}
document.addEventListener('click', e => { const li = e.target.closest && e.target.closest('[data-ir]'); if (li && !e.target.closest('a')) location.hash = li.dataset.ir; });
// Tarjeta flotante al pasar el cursor por un jugador enlazado (escritorio)
let _hc = null;
document.addEventListener('mouseover', e => { const a = e.target.closest && e.target.closest('a.ilink[data-j], a[data-hover-j]'); if (!a || !matchMedia('(hover:hover)').matches) return; const j = J[a.dataset.j || a.dataset.hoverJ]; if (!j) return;
  if (!_hc) { _hc = document.createElement('div'); _hc.className = 'hovercard'; document.body.appendChild(_hc); }
  const v = veredicto(j).v, ult = j.ult != null ? `${n1(j.ult)} <small>${tx('ÚLT', 'LAST')} S${j.ultW}</small>` : '–';
  _hc.innerHTML = `<div class="hc-h" style="${vars(j.team)}">${helmet(j.team, j.num, 40)}<span><b>${esc(j.n)}</b><small>${esc(j.pos)} · ${esc(EQUIPOS[j.team] || j.team)} · ${esc(rivalTxt(j.team))}</small></span></div>
    <div class="hc-d"><span><b class="n">${j.p != null ? n1(j.p) : '–'}</b><small>${tx('PROY FX', 'FX PROJ')}</small></span><span><b class="n">${ult}</b></span><span><b class="n">${n1(j.prom)}</b><small>${tx('PROM', 'AVG')}</small></span>${fxPill(j)}</div><p>${tx('Clic para ver su ficha completa', 'Click for full profile')} ›</p>`;
  const nm = a.querySelector('b') || a, r = nm.getBoundingClientRect(), x = Math.min(innerWidth - 300, Math.max(12, r.left)), abajo = r.bottom + 190 < innerHeight; _hc.style.left = x + 'px'; _hc.style.top = (abajo ? r.bottom + 8 : r.top - 8 - (_hc.offsetHeight || 170)) + scrollY + 'px'; _hc.classList.add('on');
});
document.addEventListener('mouseout', e => { if (_hc && e.target.closest && e.target.closest('a.ilink[data-j], a[data-hover-j]')) _hc.classList.remove('on'); });
addEventListener('hashchange', () => { if (_hc) _hc.classList.remove('on'); });
const CANDADO = '<svg class="ico-lock" viewBox="0 0 16 16" width="12" height="12" aria-hidden="true"><path d="M4 7V5a4 4 0 0 1 8 0v2h1v8H3V7h1zm2 0h4V5a2 2 0 0 0-4 0v2z" fill="currentColor"/></svg>';
const newsCard = (n, big) => {
  const ps = (n.jugadores || []).map(id => J[id]).filter(Boolean), lock = n.exclusivo && n.premium && !esPremium();
  return `<a class="story ${big ? 'big' : ''} ${n.exclusivo ? 'excl' : ''} ${lock ? 'lock' : ''}" href="#/noticia/${n.id}">${thumb(n, big)}
    <span class="st-body"><span class="st-meta ${n.etiqueta}">${esc(ETQ[n.etiqueta])}${n.fecha ? ' · ' + hace(n.fecha) : ''}${lock ? `<span class="st-lock">${CANDADO}PREMIUM</span>` : ''}</span><h3>${esc(n.titulo)}</h3>
      ${big ? `<ul class="claves">${(n.claves || []).slice(0, 3).map(c => `<li>${esc(c)}</li>`).join('')}</ul>` : `<p class="st-k">${esc((n.claves || [])[0] || '')}</p>`}
      <span class="st-who">${ps.slice(0, 3).map(x => `<span>${helmet(x.team, x.num, 20)}${esc(x.n)}</span>`).join('')}</span></span></a>`;
};

/* ---------- piezas comunes ---------- */
function prow(j, right = '', rk = '') {
  if (!j) return '';
  const st = estatus(j);
  return `<a class="prow" href="#/jugador/${j.id}">${rk !== '' ? `<span class="rk">${rk}</span>` : ''}${helmet(j.team, j.num, 34)}
    <span class="meta"><span class="pname">${esc(j.n)}</span><small>${esc(j.pos)} · ${esc(j.team)}${st !== 'Sano' ? ` · <b class="st-${st}">${st}</b>` : ''}</small></span>
    <span class="right">${right}</span></a>`;
}
const pillSt = j => { const s = estatus(j); return `<span class="pill ${s}">${s.toUpperCase()}</span>`; };
const spark = h => `<span class="spark" aria-hidden="true">${(h || []).map(v => `<i class="${v ? '' : 'z'}" style="height:${v ? Math.max(3, Math.min(22, v * .7)) : 3}px"></i>`).join('')}</span>`;
const crumbs = items => `<div class="crumbs wrap">${[['#/', 'Inicio'], ...items].map((c, i, a) => i < a.length - 1 ? `<a href="${c[0]}">${esc(c[1])}</a><span>›</span>` : `<b>${esc(c[1])}</b>`).join('')}</div>`;
const maxT = {};
const pct = (v, k) => { maxT[k] = maxT[k] || Math.max(1, ...P.map(j => j[k] || 0)); return Math.max(4, Math.round((v || 0) / maxT[k] * 100)); };
function recordDe(t) { const c = D.cal && D.cal.cal && D.cal.cal[t]; if (!c) return ''; let g = 0, p = 0, e = 0; Object.values(c).forEach(x => { if (x.fin) { if (x.pf > x.pc) g++; else if (x.pf < x.pc) p++; else e++; } }); return g + '-' + p + (e ? '-' + e : ''); }
function medidores(j) {
  const mismos = P.filter(x => x.pos === j.pos && x.prom != null), proms = mismos.map(x => x.prom).sort((a, b) => a - b);
  const pctl = v => v == null || !proms.length ? 0 : Math.round(proms.filter(x => x <= v).length / proms.length * 99);
  const prod = pctl(j.prom), forma = j.ult == null || !j.prom ? 0 : Math.min(99, Math.round(j.ult / j.prom * 50));
  const dem = j.add ? Math.max(8, Math.round(j.add / Math.max(1, ...P.map(x => x.add || 0)) * 99)) : j.drop ? 5 : 20;
  const st = estatus(j), salud = st === 'Sano' ? 99 : st === 'Duda' ? 50 : 10;
  const m = (l, v, c = '') => `<div class="meter ${c}"><span>${l}</span><span class="track">${Array.from({ length: 20 }, (_, k) => `<i class="${k < Math.round(v / 5) ? 'on' : ''}" style="animation-delay:${k * 25}ms"></i>`).join('')}</span><b>${v}</b></div>`;
  return m('PRODUCCIÓN', prod) + m('FORMA', forma, forma < 35 ? 'warn' : '') + m('DEMANDA', dem, j.drop && !j.add ? 'bad' : '') + m('SALUD', salud, st === 'Duda' ? 'warn' : st === 'Fuera' ? 'bad' : '');
}
const noEncontrado = () => { titulo('No encontrado'); return `<div class="page wrap loading"><p class="px" style="color:var(--accent);font-size:28px">FUMBLE</p><p>Esta página no existe o el dato aún no llega.</p><a class="btn" href="#/">Volver al inicio</a></div>`; };

/* =============================== PÁGINAS =============================== */
function bienvenida() {
  let visto = false; try { visto = localStorage.getItem('fx-bienvenida') === '2'; } catch (e) {}
  return visto ? '' : `<div class="hello" id="welcome">${fxLogo(34)}<p><b>Bienvenido a Fantasy Expertos.</b> Marcadores en vivo, rankings por proyección en PPR, Half o Standard, Start/Sit con razones y noticias verificadas.</p>
    <button type="button" aria-label="Cerrar" onclick="try{localStorage.setItem('fx-bienvenida','2')}catch(e){};document.getElementById('welcome').remove()">✕</button></div>`;
}
const topSemana = (pos, n = 3) => SEMNUM ? P.filter(x => x.pos === pos && ptsSem(x) != null).sort((a, b) => ptsSem(b) - ptsSem(a)).slice(0, n) : [];
function marqueeLideres() {
  if (!SEMNUM) return '';
  const items = Object.keys(POSICIONES).flatMap(pos => topSemana(pos, 3).map((j, i) => `<a class="mq" href="#/jugador/${j.id}" style="${vars(j.team)}"><i class="mq-pos">${pos}${i + 1}</i>${helmet(j.team, j.num, 28)}<span><small>${esc(nombre1(j.n))}</small><b>${esc(apellido(j.n))}</b></span><em class="n">${n1(ptsSem(j))}</em></a>`)).join('');
  return `<div class="marquee"><a class="mq-tag" href="#/lideres">LÍDERES<br>SEMANA ${SEMNUM}</a><div class="mq-view"><div class="mq-track">${items}${items}</div></div></div>`;
}
const STX = ['QB', 'RB', 'WR', 'TE', 'FLEX'];
let stxSel = 'RB';
function listaStarts(pos) {
  const L = P.filter(j => (pos === 'FLEX' ? ['RB', 'WR', 'TE'].includes(j.pos) : j.pos === pos) && juega(j)).sort((a, b) => b.pEst - a.pEst).slice(0, 10);
  return L.map((j, i) => { const r = rivalDe(j.team), e = r && estrellas(r.opp, j.pos);
    return `<a class="sx" href="#/jugador/${j.id}"><i class="n">${i + 1}</i>${helmet(j.team, j.num, 28)}<span class="sx-n"><b>${esc(j.n)}</b><small>${pos === 'FLEX' ? j.pos + ' · ' : ''}${rivalTxt(j.team)} ${pintaEstrellas(e)}</small></span><em class="n">${n1(j.p ?? j.pEst)}</em>${fxPill(j)}</a>`; }).join('');
}
function panelStarts() {
  return `<div class="panel stx"><div class="panel-h"><b>${fxLogo(18)} Starts de la semana ${semActual()}</b><a href="#/posicion/${stxSel === 'FLEX' ? 'RB' : stxSel}">Ranking ›</a></div>
    <div class="stx-tabs" role="tablist">${STX.map(p => `<button type="button" role="tab" class="${p === stxSel ? 'on' : ''}" data-p="${p}">${p}</button>`).join('')}</div>
    <div class="stx-list" id="stx-list">${listaStarts(stxSel)}</div><p class="panel-f">${sello('mini')} Proyección ${FMTS[FMT]} · toca un jugador para ver por qué</p></div>`;
}
function panelMedico() {
  const les = D.lesionados.map(x => J[x.id]).filter(Boolean).slice(0, 5);
  return les.length ? `<div class="panel"><div class="panel-h"><b><i class="dot"></i>Reporte médico</b><a href="#/lesionados">Todos ›</a></div>${les.map(j => `<a class="ml" href="#/jugador/${j.id}">${helmet(j.team, j.num, 28)}<span class="ml-n"><b>${esc(j.n)}</b><small>${esc(j.pos)} · ${esc(j.team)} · ${esc(parte(j))}</small></span>${pillSt(j)}</a>`).join('')}</div>` : '';
}
function inicio() {
  titulo('');
  const N = todasNoticias(), lead = N[0], sec = N.slice(1, 3), mas = N.slice(3, 9);
  const hubs = Object.keys(POSICIONES).map(p => {
    const top3 = P.filter(j => j.pos === p && juega(j)).sort((a, b) => b.pEst - a.pEst).slice(0, 3);
    return `<a class="hub" href="#/posicion/${p}"><span class="hub-h"><b>${p}</b><span>${POSICIONES[p]}</span></span>${top3.map((j, i) => `<span class="hub-r"><i class="n">${i + 1}</i>${helmet(j.team, j.num, 22)}<span>${esc(j.n)}</span><em class="n">${n1(j.pEst)}</em></span>`).join('')}<span class="hub-go">Ranking completo ›</span></a>`;
  }).join('');
  return `<div class="page">
  <div class="wrap">${bienvenida()}
    <section class="front">
      <div class="front-main">${lead ? newsCard(lead, true) : '<div class="empty">Las noticias llegan en el próximo ciclo.</div>'}<div class="front-sec">${sec.map(n => newsCard(n)).join('')}</div></div>
      <aside class="front-side">${panelMios()}${panelStarts()}${panelMedico()}</aside>
    </section>
  </div>
  <div class="ticker"><div class="tag"><i></i>ÚLTIMA HORA</div><div class="view"><div class="ticker-track">${tickerItems()}${tickerItems()}</div></div></div>
  <div class="wrap">
    <section class="block" data-chip="${enVivo() ? enVivo() + ' EN VIVO' : G.length ? G.filter(g => g.estado === 'post').length + '/' + G.length + ' FINAL' : 'S' + semActual()}" data-vivo="${enVivo() ? 1 : ''}" data-balon="1"><div class="head"><div><h2>Partidos de la semana ${esc(G[0] ? G[0].semana : semActual())}</h2><p class="hsub">En vivo primero, luego los próximos. Marcador, posesión y las figuras de fantasy de cada lado.</p></div><a class="all" href="#/partidos">Todas las semanas ›</a></div><div id="home-matches">${homeMatches()}</div></section>
    ${SEMNUM ? `<section class="block lideres-home" data-chip="S${SEMNUM} · ${FMTS[FMT]}"><div class="head"><div><h2>Líderes de la semana ${SEMNUM}</h2><p class="hsub">Los que más puntos ${FMTS[FMT]} hicieron, por posición. Toca uno para ver su ficha.</p></div><a class="all" href="#/lideres">Todos los líderes ›</a></div>${marqueeLideres()}</section>` : ''}
    ${mas.length ? `<section class="block" data-chip="+${N.filter(n => Date.now() - Date.parse(n.fecha || 0) < 864e5).length} HOY"><div class="head"><div><h2>Más noticias</h2><p class="hsub">Lo que mueve tus alineaciones, verificado contra el reporte oficial.</p></div><a class="all" href="#/noticias">Todas las noticias ›</a></div><div class="news stagger">${mas.map(n => newsCard(n)).join('')}</div></section>` : ''}
    <section class="block grid g2" data-chip="ÚLTIMAS 24 H">
      <div class="card"><div class="head"><h3>▲ Subiendo</h3><a class="all" href="#/tendencias">Todo ›</a></div><p class="sub">Los más agregados en ligas en las últimas 24 horas.</p>
        <div class="plist">${D.agregados.slice(0, 6).map(id => J[id] && prow(J[id], `<span class="bar"><i style="width:${pct(J[id].add, 'add')}%"></i></span>${fxPill(J[id])}`)).join('')}</div></div>
      <div class="card"><div class="head"><h3 style="color:var(--bad)">▼ Bajando</h3><a class="all" href="#/tendencias">Todo ›</a></div><p class="sub">A quién están soltando en las últimas 24 horas.</p>
        <div class="plist">${D.soltados.slice(0, 6).map(id => J[id] && prow(J[id], `<span class="bar down"><i style="width:${pct(J[id].drop, 'drop')}%"></i></span>${fxPill(J[id])}`)).join('')}</div></div>
    </section>
    ${duelo()}
    <section class="block" data-chip="S${semActual()} · ${FMTS[FMT]}"><div class="head"><div><h2>Rankings de la semana ${semActual()}</h2><p class="hsub">Top 3 por proyección ${FMTS[FMT]}, solo jugadores que sí juegan.</p></div><a class="all" href="#/posicion/QB">Rankings ›</a></div><div class="grid g5 stagger">${hubs}</div></section>
    ${fxtv()}
    <section class="block" data-chip="${G.length ? G.length * 2 : 32} JUEGAN · S${semActual()}"><div class="head"><div><h2>Los 32 equipos</h2><p class="hsub">Récord, rival de la semana, calendario y plantel de fantasy.</p></div><a class="all" href="#/equipos">Ver todos ›</a></div>${teamGrid()}</section>
  </div></div>`;
}
const tickerItems = () => todasNoticias().slice(0, 14).map(n => `<a href="#/noticia/${n.id}"><i class="tk ${n.etiqueta}">${esc(ETQ[n.etiqueta])}</i>${esc(n.titulo)}</a>`).join('');
function duelo() {
  const d = D.duelo || {};
  const find = name => P.find(j => j.n && j.n.toLowerCase() === String(name || '').toLowerCase());
  let a = find(d.a), b = find(d.b);
  if (!a || !b || a.pos !== b.pos) { const L = P.filter(j => j.pos === 'WR' && juega(j)).sort((x, y) => y.pEst - x.pEst); a = L[11]; b = L[12]; }
  if (!a || !b) return '';
  const fx = a.pEst >= b.pEst ? a : b;
  const lado = (j, k) => { const r = rivalDe(j.team), u3 = (j.temp || []).filter(v => v != null).slice(-3);
    return `<button class="pick" type="button" data-l="${k}" style="${vars(j.team)}">${helmet(j.team, j.num, 70, k === 'b')}<span class="pk-n"><small>${esc(nombre1(j.n))}</small><b>${esc(apellido(j.n))}</b><i>${esc(j.pos)} · ${esc(j.team)}</i></span>
      <span class="pk-s"><span><b class="n">${n1(j.p ?? j.pEst)}</b><i>PROY</i></span><span><b>${r ? (r.home ? 'vs ' : '@ ') + r.opp : 'BYE'}</b><i>${pintaEstrellas(r && estrellas(r.opp, j.pos))}</i></span><span><b class="n">${n1(u3.length ? u3.reduce((x, y) => x + y, 0) / u3.length : null)}</b><i>ÚLT. 3</i></span></span>
      <span class="pk-cta">Arranco a ${esc(apellido(j.n))}</span><small class="pk-res"></small></button>`; };
  const nombres = P.filter(j => j.team !== 'FA').sort((x, y) => y.pEst - x.pEst).slice(0, 320);
  return `<section class="block" id="startsit" data-chip="1 VS 1"><div class="head"><div><h2>${fxLogo(26)} Duelo del día: ¿a quién arrancas?</h2><p class="hsub">Dos ${a.pos} con proyección parecida y un solo lugar en tu alineación. Elige, y te mostramos el veredicto de los expertos y el porqué.</p></div></div>
    <div class="duelo" data-fx="${fx === a ? 'a' : 'b'}">${lado(a, 'a')}<span class="vs">VS</span>${lado(b, 'b')}</div>
    <div class="verdict" id="verdict"><b>${fxLogo(20)} FANTASY EXPERTOS ARRANCA A ${esc(fx.n).toUpperCase()}</b><p>${esc(d.veredicto && find(d.a) && find(d.b) ? d.veredicto : `Proyecta ${n1(fx.p ?? fx.pEst)} pts contra ${n1((fx === a ? b : a).p ?? (fx === a ? b : a).pEst)} y tiene ${veredicto(fx).e && veredicto(fx).e.n >= 3 ? 'el mejor matchup' : 'más volumen'} esta semana.`)}</p>
      <span class="actions"><a class="btn" href="#/comparar/${a.id}/${b.id}">Ver comparación completa</a></span></div>
    <form class="armaduelo" id="armaduelo" autocomplete="off"><b>Arma tu propio duelo</b><input list="fx-jug" name="a" placeholder="Jugador 1" aria-label="Jugador 1"><span>vs</span><input list="fx-jug" name="b" placeholder="Jugador 2" aria-label="Jugador 2"><button class="btn sm" type="submit">Comparar</button>
      <datalist id="fx-jug">${nombres.map(j => `<option value="${esc(j.n)}">${esc(j.pos + ' · ' + j.team)}</option>`).join('')}</datalist></form>
  </section>`;
}
function teamGrid() {
  const les = {}; P.forEach(j => { if (EQUIPOS[j.team] && estatus(j) !== 'Sano') les[j.team] = (les[j.team] || 0) + 1; });
  return `<div class="confs">${Object.entries(DIVS).map(([conf, divs]) => `<div class="conf"><h3 class="conf-t">${conf}</h3><div class="divs">${Object.entries(divs).map(([d, ts]) => `<div class="div"><h4>${conf} ${d}</h4>
    ${ts.slice().sort((a, b) => +(recordDe(b).split('-')[0] || 0) - +(recordDe(a).split('-')[0] || 0)).map(t => `<a class="trow" href="#/equipo/${t}" style="${vars(t)}">${helmet(t, '', 40)}<span class="tt"><b>${EQUIPOS[t]}</b><small>S${semActual()} ${rivalTxt(t)}${les[t] ? ' · ' + les[t] + ' lesionados' : ''}</small></span><span class="rec n">${recordDe(t) || '–'}</span></a>`).join('')}</div>`).join('')}</div></div>`).join('')}</div>`;
}

/* ---------- noticias ---------- */
function noticias(q) {
  titulo('Noticias');
  const f = q.get('tipo') || 'TODO', lim = +(q.get('ver') || 30);
  const L = todasNoticias().filter(n => f === 'TODO' || n.etiqueta === f);
  const dias = {};
  L.slice(0, lim).forEach(n => { const d = n.fecha ? new Date(n.fecha).toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' }) : 'Hoy'; (dias[d] = dias[d] || []).push(n); });
  return `<div class="page">${crumbs([['', 'Noticias']])}<div class="wrap"><section class="block">
    <div class="head"><div><h2>Noticias de fantasy</h2><p class="hsub">${L.length} noticias en el archivo · ${esc(actualizado())}</p></div></div>
    ${plusMiLiga()}
    <div class="chips">${['TODO', ...ETIQUETAS].map(t => `<a class="chip ${t === f ? 'on' : ''} ${t}" href="#/noticias${t === 'TODO' ? '' : '?tipo=' + encodeURIComponent(t)}">${t === 'TODO' ? 'TODAS' : ETQ[t]}</a>`).join('')}<a class="chip-blog" href="#/blog">Blog ›</a></div>
    ${LANG === 'en' && D.noticias.some(n => !n._en) ? `<p class="aviso-idioma">${fxLogo(14)} Some older stories are still in Spanish; every new story now arrives in English too. <a href="#/blog">Read the English blog ›</a></p>` : ''}
    ${Object.entries(dias).map(([d, ns], k) => `<h3 class="day">${esc(d)}</h3><div class="news ${k ? '' : 'first'} stagger">${ns.map((n, i) => newsCard(n, k === 0 && i === 0 && f === 'TODO')).join('')}</div>`).join('') || '<div class="empty">No hay noticias de este tipo.</div>'}
    ${L.length > lim ? `<p class="more"><a class="btn ghost" href="#/noticias?${f === 'TODO' ? '' : 'tipo=' + encodeURIComponent(f) + '&'}ver=${lim + 30}">Cargar más noticias</a></p>` : ''}
  </section></div></div>`;
}
function noticia(id) {
  const L = todasNoticias(), base = todasConVencidas().find(x => x.id === id);
  if (!base) return noEncontrado();
  const i = L.indexOf(base), sig = L[i + 1], ant = L[i - 1];
  const bloqueada = base.exclusivo && base.premium, prem = bloqueada && esPremium();
  if (prem) cargaBoveda(id);
  const n = prem && BOVEDA[id] ? { ...base, ...BOVEDA[id] } : base, cerrada = bloqueada && !(prem && BOVEDA[id]);
  titulo(n.titulo);
  const jug = [...(n.jugadores || []), ...(n.menciona || [])].map(x => J[x]).filter(Boolean), eqs = equiposDe(n);
  const rel = L.filter(x => x.id !== id && ((x.jugadores || []).some(p => (n.jugadores || []).includes(p)) || equiposDe(x).some(t => eqs.includes(t)))).slice(0, 3);
  const sec = (t, txt, cls = '') => txt ? `<section class="nsec ${cls}"><h3>${t}</h3><p>${enlaza(txt, jug)}</p></section>` : '';
  return `<div class="page">${crumbs([['#/noticias', 'Noticias'], ['#/noticias?tipo=' + encodeURIComponent(n.etiqueta), ETQ[n.etiqueta]], ['', n.titulo.slice(0, 40) + (n.titulo.length > 40 ? '…' : '')]])}<div class="wrap narrowish">
    <div class="nhead">${thumb(n, true)}</div>
    <p class="st-meta ${n.etiqueta}" style="margin-top:18px">${esc(ETQ[n.etiqueta])}${n.fecha ? ' · ' + hace(n.fecha) : ''}${n.exclusivo ? ' · ★ Premium FX' : ''}</p>
    <h1 class="ntitle">${esc(n.titulo)}</h1>
    ${n.aviso ? `<div class="aviso-nota"><b>⚠ NOTA ACTUALIZADA</b><p>${esc(n.aviso)}</p></div>` : ''}
    <div class="kcards stagger">${(n.claves || []).map((c, k) => `<div class="kcard"><b>${k + 1}</b><span>${enlaza(c, jug)}</span></div>`).join('')}${cerrada ? [2, 3].map(k => `<div class="kcard lock"><b>${k}</b><span>${CANDADO} Solo Premium</span></div>`).join('') : ''}</div>
    <div class="nbody">
      <div class="ncol">
        ${cerrada ? (prem ? '<div class="esq-lineas oro" aria-busy="true" aria-label="Abriendo nota Premium"><i></i><i></i><i></i><i></i><i></i></div>' : previaPremium()) : `${sec('Qué pasó', n.contexto || n.cuerpo)}${consejo({ accion: n.accion, texto: n.fantasy, jugadores: jug.slice(0, 4) })}${sec('Qué cambia para el equipo', n.equipo_impacto)}${(n.fuentes || []).length ? `<p class="n-fuentes"><b>${tx('Fuentes', 'Sources')}:</b> ${n.fuentes.map(f => f.u ? `<a href="${esc(f.u)}" target="_blank" rel="nofollow noopener">${esc(f.m)} ↗</a>` : esc(f.m)).join(' · ')} <small>${tx('Redacción y análisis propios a partir del reporte citado.', 'Our own write-up and analysis based on the cited report.')}</small></p>` : ''}`}
      </div>
      <aside class="nside">
        ${jug.length ? `<div class="card"><h3>Jugadores en la noticia</h3><p class="sub">Su veredicto para la semana ${semActual()}.</p><div class="plist">${jug.map(j => prow(j, `<span class="num sm">${n1(j.p ?? j.prom)}</span>${fxPill(j)}`)).join('')}</div>
          ${jug.length >= 2 ? `<p style="margin:12px 0 0"><a class="btn sm" href="#/comparar/${jug[0].id}/${jug[1].id}">Comparar cara a cara</a></p>` : ''}</div>` : ''}
        ${eqs.length ? `<div class="card"><h3>Equipos</h3><div class="eqchips">${eqs.slice(0, 6).map(t => `<a class="eqchip" href="#/equipo/${t}" style="${vars(t)}">${helmet(t, '', 30)}<span>${EQUIPOS[t]}<small>${recordDe(t)} · S${semActual()} ${rivalTxt(t)}</small></span></a>`).join('')}</div></div>` : ''}
      </aside>
    </div>
    <details class="reporte"><summary>⚑ Reportar un error en esta nota</summary><form id="f-reporte" class="fform" data-nota="${esc(n.id)}"><textarea name="m" maxlength="900" required placeholder="¿Qué dato está mal? Ej.: el jugador está lesionado, el rival no es ese…"></textarea><button class="btn sm" type="submit">Enviar reporte</button><small class="msg"></small></form></details>
    <div class="navnotas">${ant ? `<a class="nn" href="#/noticia/${ant.id}"><small>‹ Noticia anterior</small><b>${esc(ant.titulo)}</b></a>` : '<span></span>'}${sig ? `<a class="nn r" href="#/noticia/${sig.id}"><small>Siguiente noticia ›</small><b>${esc(sig.titulo)}</b></a>` : ''}</div>
    ${ctaRedes()}
    ${rel.length ? `<section class="block"><div class="head"><h2>Relacionadas</h2></div><div class="news stagger">${rel.map(x => newsCard(x)).join('')}</div></section>` : ''}
  </div></div>`;
}

/* ---------- jugador ---------- */
function jugador(id) {
  const j = J[id];
  if (!j) return noEncontrado();
  titulo(j.n);
  const st = estatus(j), v = veredicto(j), notas = noticiasDe(id), ext = (D.externas || []).filter(x => (x.j || []).includes(id)).slice(0, 6);
  const mismos = P.filter(x => x.pos === j.pos && juega(x)).sort((a, b) => b.pEst - a.pEst);
  const k = mismos.indexOf(j), vecinos = (k >= 0 ? mismos.slice(Math.max(0, k - 3), k + 4) : mismos.slice(0, 6)).filter(x => x.id !== id).slice(0, 6);
  const comp = P.filter(x => x.team === j.team && x.id !== id).sort((a, b) => b.pEst - a.pEst).slice(0, 6);
  const log = (j.log || []).slice().reverse(), hist = j.hist || [], max = Math.max(10, ...hist.filter(x => x != null));
  const r = rivalDe(j.team), prox = []; for (let w = semActual(); w < semActual() + 5 && w <= 18; w++) prox.push(w);
  const cols = j.pos === 'QB' ? [['py', 'YDS PASE'], ['ptd', 'TD P'], ['int', 'INT'], ['ry', 'YDS CAR'], ['rtd', 'TD C']] : j.pos === 'K' ? [['fgm', 'FG'], ['xpm', 'PAT']] : j.pos === 'DEF' ? [['sk', 'CAPTURAS'], ['dint', 'INT'], ['fr', 'FUM REC'], ['dtd', 'TD'], ['pa', 'PTS PERM']]
    : j.pos === 'RB' ? [['ra', 'ACAR'], ['ry', 'YDS CAR'], ['rtd', 'TD C'], ['rec', 'REC'], ['recy', 'YDS REC'], ['rectd', 'TD R']] : [['tg', 'TGT'], ['rec', 'REC'], ['recy', 'YDS REC'], ['rectd', 'TD R'], ['ry', 'YDS CAR']];
  const res = w => { const c = rivalDe(j.team, w); return c && c.fin ? `<span class="${c.pf > c.pc ? 'g' : c.pf < c.pc ? 'p' : ''}">${c.pf > c.pc ? 'G' : c.pf < c.pc ? 'P' : 'E'} ${c.pf}-${c.pc}</span>` : ''; };
  const VT = { START: 'ARRÁNCALO', FLEX: 'OPCIÓN FLEX', SIT: 'A LA BANCA', OUT: 'NO JUEGA', BYE: 'SEMANA DE DESCANSO' };
  return `<div class="page">${crumbs([['#/posicion/' + j.pos, 'Rankings ' + j.pos], ['', j.n]])}<div class="wrap">
    <div class="pcard" style="${vars(j.team)}">
      <div class="art"><span class="bignum">${esc(j.num ?? '')}</span>${helmet(j.team, j.num, 210, false, 'bob')}</div>
      <div class="info">
        <div class="tags"><a class="pos" href="#/posicion/${j.pos}">${esc(rw(j) !== '–' ? rw(j) + ' · S' + semActual() : j.pos)}</a>${EQUIPOS[j.team] ? `<a class="team" href="#/equipo/${j.team}">${esc(EQUIPOS[j.team])} ›</a>` : '<span class="team">Agente libre</span>'}${pillSt(j)}</div>
        <h1><small>${esc(nombre1(j.n))}</small>${esc(apellido(j.n))}</h1>
        <div class="meters">${medidores(j)}</div>
        <div class="actions">${vecinos[0] ? `<a class="btn" href="#/comparar/${id}/${vecinos[0].id}">⚔ Comparar</a>` : ''}<a class="btn ghost" href="#/posicion/${j.pos}">Ranking ${esc(j.pos)}</a>${botonSeguir(id)}</div>
      </div>
    </div>
    ${st !== 'Sano' || j.les ? `<div class="alert ${st}"><b>${st === 'Duda' ? 'EN DUDA' : st === 'Fuera' ? (fueraTemp(j) ? 'EN RESERVA DE LESIONADOS' : 'FUERA') : 'REPORTE MÉDICO'}${parte(j) ? ' · ' + esc(parte(j)).toUpperCase() : ''}</b>
      <p>${j.les ? [tr(j.les.detalle), tr(j.les.lado)].filter(Boolean).map(esc).join(' · ') : ''}${j.les && j.les.regreso ? ` · Regreso estimado: <b>${esc(fechaC(j.les.regreso))}</b>` : ''}${j.les && j.les.fecha ? ` · Reporte del ${esc(fechaC(j.les.fecha))}` : ''}${!j.les ? esc(j.injNota || 'Sin detalle adicional en el reporte oficial.') : ''}</p></div>` : ''}
    <section class="block" style="padding-top:22px"><div class="ssfx ${v.v}">
      <div class="ss-head">${fxLogo(54)}<div><small>START / SIT FX · SEMANA ${esc(semActual())}</small><b>${VT[v.v]}</b>${sello('mini')}</div>
        <div class="ss-riv">${r ? `${helmet(r.opp, '', 56, true)}<span><small>RIVAL</small><b>${r.home ? 'vs' : '@'} ${esc(r.opp)}</b>${pintaEstrellas(v.e)}</span>` : ''}${j.p != null ? `<span class="ss-proy"><small>PROYECCIÓN</small><b class="n">${n1(j.p)}</b><i>${FMTS[FMT]}</i></span>` : ''}</div></div>
      <ul class="ss-why">${v.razones.slice(0, 1).map(x => `<li>${enlaza(x, [j])}</li>`).join('')}</ul>
      ${v.razones.length > 1 || j.proy ? zonaPrem(`<ul class="ss-why">${v.razones.slice(1).map(x => `<li>${enlaza(x, [j])}</li>`).join('')}</ul>${lecturaFX(j)}`, tx('Todas las razones del veredicto y la lectura del modelo FX', 'Every reason behind the verdict and the FX model read')) : ''}</div></section>
    <div class="kpis stagger">
      <div class="kpi"><b>${esc(rp(j))}</b><span>Ranking temporada · ${FMTS[FMT]}</span></div>
      <div class="kpi"><b class="n">${n1(j.total)}</b><span>Puntos en la temporada</span></div>
      <div class="kpi"><b class="n">${n1(j.prom)}</b><span>Promedio por partido</span></div>
      <div class="kpi"><b class="n">${n1(j.ult)}</b><span>Último partido${j.ultW ? ' (S' + j.ultW + ')' : ''}</span></div>
      <div class="kpi"><b>${(j.log || []).filter(l => l.f).length}</b><span>Partidos jugados</span></div>
    </div>
    <section class="block" style="padding-top:28px"><div class="head"><div><h2>Partido por partido</h2><p class="hsub">Rival, resultado, puntos en los 3 formatos y estadísticas clave.</p></div></div>
      <div class="card scroll"><table class="tbl glog"><thead><tr><th>SEM</th><th>RIVAL</th><th>RES</th>${FMTS.map((f, i) => `<th class="${FMT === i ? 'hl' : ''}">${['PPR', 'HALF', 'STD'][i]}</th>`).join('')}${cols.map(c => `<th>${c[1]}</th>`).join('')}</tr></thead>
      <tbody>${log.map(l => { const c = rivalDe(j.team, l.w); return `<tr class="nolink"><td class="n">${l.w}</td><td>${c ? `<a class="team" href="#/equipo/${c.opp}">${c.home ? 'vs' : '@'} ${c.opp}</a>` : '<span class="team">BYE</span>'}</td><td class="n res">${res(l.w)}</td>
        ${[0, 1, 2].map(i => `<td class="n ${FMT === i ? 'hl' : ''}">${l.f ? n1(l.f[i]) : '–'}</td>`).join('')}${cols.map(cc => `<td class="n">${l.st && l.st[cc[0]] != null ? l.st[cc[0]] : l.f ? 0 : '–'}</td>`).join('')}</tr>`; }).join('')}</tbody></table></div></section>
    <div class="grid g2" style="margin-top:20px">
      <div class="card"><h3>Puntos por semana</h3><p class="sub">Formato ${FMTS[FMT]}. Gris = no jugó.</p>
        <div class="chart">${hist.map(x => `<div class="col"><em>${x == null ? '–' : n1(x)}</em><i class="${x ? '' : 'zero'}" style="${x ? 'height:' + Math.round(x / max * 150) + 'px' : ''}"></i></div>`).join('')}</div>
        <div class="chart-x">${(D.semanas || []).map(w => `<span>S${w}</span>`).join('')}</div></div>
      <div class="card"><h3>Próximos rivales</h3><p class="sub">Dificultad para un ${j.pos}: más estrellas = más fácil.</p>
        <div class="plist">${prox.map(w => { const c = rivalDe(j.team, w); return `<div class="prow nolink"><span class="rk">S${w}</span>${c ? helmet(c.opp, '', 32) : ''}<span class="meta"><span class="pname">${c ? (c.home ? 'vs ' : '@ ') + esc(EQUIPOS[c.opp] || c.opp) : 'BYE'}</span><small>${c ? new Date(c.fecha).toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short' }) : 'Descanso'}</small></span><span class="right">${c ? pintaEstrellas(estrellas(c.opp, j.pos)) : ''}</span></div>`; }).join('')}</div></div>
    </div>
    <div class="grid g2" style="margin-top:20px">
      <div class="card"><h3>Ficha</h3><div class="bio"><div><small>EDAD</small><b>${esc(j.edad ?? '–')}</b></div><div><small>EXPERIENCIA</small><b>${j.exp != null ? (j.exp === 0 ? 'Novato' : esc(j.exp) + ' años') : '–'}</b></div><div><small>ESTATURA</small><b>${altura(j.alt)}</b></div><div><small>PESO</small><b>${j.peso ? esc(j.peso) + ' lb' : '–'}</b></div><div style="grid-column:1/-1"><small>UNIVERSIDAD</small><b>${esc(j.col || '–')}</b></div></div></div>
      <div class="card"><h3>En los medios</h3><p class="sub">Lo más reciente publicado sobre él.</p>${ext.length ? `<div class="extlist">${ext.map(x => `<a class="ext" href="${esc(x.u || '#')}" target="_blank" rel="noopener"><b>${esc(x.t)}</b><small>ESPN · ${esc(fechaC(x.f))}</small></a>`).join('')}</div>` : '<p class="sub">Sin notas externas recientes.</p>'}
        <div class="kpis two"><div class="kpi"><b class="n" style="color:var(--accent)">${j.add ? '▲ ' + nf.format(j.add) : '–'}</b><span>Agregado en 24 h</span></div><div class="kpi"><b class="n" style="color:var(--bad)">${j.drop ? '▼ ' + nf.format(j.drop) : '–'}</b><span>Soltado en 24 h</span></div></div></div>
    </div>
    <section class="block"><div class="head"><h2>Noticias sobre ${esc(apellido(j.n))}</h2></div><div class="news stagger">${notas.slice(0, 6).map(n => newsCard(n)).join('') || '<div class="empty">Aún no hay noticias sobre este jugador.</div>'}</div></section>
    <section class="block grid g2">
      <div class="card"><h3>${esc(j.pos)} cerca en el ranking de la semana</h3><p class="sub">Alternativas parecidas. Toca VS para comparar.</p><div class="plist">${vecinos.map(x => prow(x, `<span class="num sm">${n1(x.pEst)}</span><a class="chip sm" href="#/comparar/${id}/${x.id}" onclick="event.stopPropagation()">VS</a>`, RANKW[x.id] || '')).join('')}</div></div>
      <div class="card"><h3>Compañeros en ${esc(j.team)}</h3><p class="sub">Su ofensiva en fantasy esta semana.</p><div class="plist">${comp.map(c => prow(c, fxPill(c))).join('') || '<p class="sub">Sin compañeros registrados.</p>'}</div></div>
    </section>
  </div></div>`;
}
function comparar(a, b) {
  const x = J[a], y = J[b];
  if (!x || !y) return noEncontrado();
  titulo(x.n + ' vs ' + y.n);
  const vx = veredicto(x), vy = veredicto(y), W = { START: 3, FLEX: 2, SIT: 1, BYE: 0, OUT: 0 };
  const filas = [['PROYECCIÓN S' + semActual(), x.pEst, y.pEst, n1(x.p ?? x.pEst), n1(y.p ?? y.pEst), 'alto'], ['START/SIT FX', W[vx.v], W[vy.v], vx.v, vy.v, 'alto'], ['DIFICULTAD RIVAL', vx.e ? vx.e.n : 0, vy.e ? vy.e.n : 0, vx.e ? '★'.repeat(vx.e.n) : '–', vy.e ? '★'.repeat(vy.e.n) : '–', 'alto'],
    ['PROMEDIO ' + ['PPR', 'HALF', 'STD'][FMT], x.prom ?? -1, y.prom ?? -1, n1(x.prom), n1(y.prom), 'alto'], ['ÚLTIMO PARTIDO', x.ult ?? -1, y.ult ?? -1, n1(x.ult), n1(y.ult), 'alto'], ['TOTAL TEMPORADA', x.total ?? -1, y.total ?? -1, n1(x.total), n1(y.total), 'alto'], ['ESTATUS', estatus(x) === 'Sano' ? 1 : 0, estatus(y) === 'Sano' ? 1 : 0, estatus(x), estatus(y), 'alto']];
  let px = 0, py = 0;
  const rows = filas.map(([l, a1, b1, tx, ty, m]) => { let wx = false, wy = false; if (m && a1 !== b1) { wx = a1 > b1; wy = !wx; wx ? px++ : py++; } return `<div class="cmp-row"><span class="${wx ? 'w' : ''}">${esc(tx)}</span><span>${l}</span><span class="${wy ? 'w' : ''}">${esc(ty)}</span></div>`; }).join('');
  const g = (x.pEst || 0) === (y.pEst || 0) ? (px >= py ? x : y) : (x.pEst > y.pEst ? x : y);
  return `<div class="page">${crumbs([['#/jugador/' + x.id, x.n], ['', 'Comparar']])}<div class="wrap"><section class="block"><div class="head"><h2>Cara a cara</h2></div>
    <div class="vsgrid"><div class="card side" style="${vars(x.team)}">${prow(x, fxPill(x))}</div><span class="vs">VS</span><div class="card side" style="${vars(y.team)}">${prow(y, fxPill(y))}</div></div>
    <div class="card" style="margin-top:18px">${rows}<div class="verdict show"><b>${fxLogo(20)} ARRANCA A ${esc(g.n).toUpperCase()}</b><p>Le gana ${Math.max(px, py)} de ${px + py} categorías y tiene ${g.pEst >= Math.max(x.pEst, y.pEst) ? 'la mejor proyección de la semana' : 'mejores números de temporada'}. Confirma su estatus antes del kickoff.</p></div></div>
  </section></div></div>`;
}

/* ---------- rankings de la semana ---------- */
function posicion(p) {
  if (!POSICIONES[p]) return noEncontrado();
  titulo('Ranking ' + p + ' semana ' + semActual());
  const ult = (D.semanas || []).filter(w => w <= (SEMNUM || 0)).slice(-3);
  const noJuegan = P.filter(j => j.pos === p && j.team !== 'FA' && !juega(j) && ((j.total || 0) > 20 || (j.rank && j.rank < 200))).sort((a, b) => (b.prom || 0) - (a.prom || 0)).slice(0, 24);
  return `<div class="page">${crumbs([['', 'Rankings ' + p]])}<div class="wrap"><section class="block">
    <div class="head"><div><h2>Ranking ${p} · Semana ${semActual()}</h2><p class="hsub">Ordenado por proyección ${FMTS[FMT]} de la semana. Solo jugadores que sí juegan; los lesionados y en descanso van aparte.</p></div><small>${esc(actualizado())}</small></div>
    <div class="chips">${Object.keys(POSICIONES).map(x => `<a class="chip ${x === p ? 'on' : ''}" href="#/posicion/${x}">${x}</a>`).join('')}</div>
    <div class="tools"><input id="filtro" type="search" placeholder="Filtrar por nombre, equipo o rival…" aria-label="Filtrar jugadores">
      <span class="chips" style="margin:0" id="fst">${['TODOS', 'START', 'FLEX', 'SIT'].map((s, i) => `<button type="button" class="chip ${i ? '' : 'on'} ${s}" data-s="${s}">${s}</button>`).join('')}</span></div>
    <div class="card scroll"><table class="tbl rank"><thead><tr>
      <th>#</th><th>JUGADOR</th><th>EQUIPO</th><th>RIVAL S${semActual()}</th><th>DIFICULTAD</th><th class="hl">PROY ${infoFX(tx('Proyección del FX Tech Analyzer: nuestro modelo combina el volumen y la eficiencia de esta temporada con la anterior, el rival y la salud del jugador.', 'FX Tech Analyzer projection: our model blends this and last season\'s volume and efficiency with the opponent and the player\'s health.'))}</th>
      ${ult.map(x => `<th>S${x}</th>`).join('')}<th>PROM</th><th>TOTAL</th><th>TENDENCIA</th><th class="pz-th"><a href="#/premium">${esPremium() ? '' : CANDADO}PISO–TECHO</a>${infoFX(tx('Lo mínimo y lo máximo que ha hecho en sus últimas 5 semanas. Piso alto = seguro para tu alineación; techo alto = jugador para ganar semanas cerradas. Exclusivo Premium.', 'The least and most he scored over his last 5 weeks. High floor = safe for your lineup; high ceiling = a player to win close weeks. Premium exclusive.'))}</th><th class="fxh">${fxLogo(18)} START/SIT</th>
    </tr></thead><tbody id="tb"></tbody></table></div>
    <p class="ss-note">Proyección: Modelo FX, propio (volumen y eficiencia de esta temporada, con la anterior como base). Dificultad = puntos que la defensa rival permite a la posición: ★★★★★ es el matchup ideal. START/FLEX/SIT combina proyección, rival, racha, noticias y comunidad.</p>
    ${noJuegan.length ? `<details class="desglose" style="margin-top:22px"><summary><span>No juegan en la semana ${semActual()} · ${noJuegan.length}</span><span>›</span></summary><div class="plist" style="padding:0 12px 12px">${noJuegan.map(j => prow(j, `<span class="team">${fuera(j) ? esc(parte(j) || j.inj) : 'BYE'}</span>${fxPill(j)}`)).join('')}</div></details>` : ''}
  </section></div></div>`;
}
function montaTabla(p) {
  let filtroV = 'TODOS';
  const ult = (D.semanas || []).filter(w => w <= (SEMNUM || 0)).slice(-3);
  const base = P.filter(j => j.pos === p && juega(j)).sort((a, b) => b.pEst - a.pEst).map((j, i) => ({ j, k: i + 1, v: veredicto(j), r: rivalDe(j.team) }));
  const pinta = () => {
    const f = ($('#filtro').value || '').toLowerCase();
    const lista = base.filter(x => (filtroV === 'TODOS' || x.v.v === filtroV) && (!f || x.j.n.toLowerCase().includes(f) || x.j.team.toLowerCase().includes(f) || (x.r && x.r.opp.toLowerCase().includes(f)) || (EQUIPOS[x.j.team] || '').toLowerCase().includes(f)));
    $('#tb').innerHTML = lista.map(({ j, k, v, r }) => `<tr data-id="${j.id}" class="tier-${v.v}"><td class="n rk">${k}</td>
      <td><span class="tpl">${helmet(j.team, j.num, 30)}<span><span class="pname">${esc(j.n)}</span>${estatus(j) !== 'Sano' ? ` <span class="pill ${estatus(j)}">${estatus(j).toUpperCase()}</span>` : ''}</span></span></td>
      <td><a class="team" href="#/equipo/${j.team}" onclick="event.stopPropagation()">${esc(j.team)}</a></td>
      <td>${r ? `<a class="team riv" href="#/equipo/${r.opp}" onclick="event.stopPropagation()">${helmet(r.opp, '', 22)}${r.home ? 'vs' : '@'} ${r.opp}</a>` : ''}</td>
      <td>${pintaEstrellas(v.e)}</td><td class="n hl">${n1(j.p ?? j.pEst)}${j.p == null ? '<sup>*</sup>' : ''}</td>
      ${ult.map(w => { const val = ptsSem(j, w); return `<td class="n wk">${val != null ? n1(val) : rivalDe(j.team, w) ? '–' : '<small>BYE</small>'}</td>`; }).join('')}
      <td class="n">${n1(j.prom)}</td><td class="n">${n1(j.total)}</td><td>${spark(j.hist)}</td><td class="n pz-td">${esPremium() ? (pisoTecho(j) ? n1(pisoTecho(j)[0]) + '–' + n1(pisoTecho(j)[1]) : '–') : `<a href="#/premium" onclick="event.stopPropagation()" title="Premium"><span class="pz-blur">${k * 3 % 9 + 4}.${k % 10}–${k * 7 % 13 + 14}.${k * 3 % 10}</span></a>`}</td><td>${fxPill(j)}</td></tr>`).join('') || '<tr><td colspan="13"><div class="empty">Ningún jugador coincide.</div></td></tr>';
    $('#tb').querySelectorAll('tr[data-id]').forEach(tr => tr.onclick = () => { location.hash = '#/jugador/' + tr.dataset.id; });
  };
  $('#filtro').oninput = pinta;
  document.querySelectorAll('#fst button').forEach(b => b.onclick = () => { filtroV = b.dataset.s; document.querySelectorAll('#fst button').forEach(x => x.classList.toggle('on', x === b)); pinta(); });
  pinta();
}

/* ---------- líderes ---------- */
// Puntos en vivo de la semana en curso: Sleeper directo desde el navegador (cada minuto mientras haya partidos)
const VIVO = { w: null, pts: null, t: 0, carga: false };
function cargaVivo(w) {
  if (VIVO.carga || (VIVO.w === w && Date.now() - VIVO.t < 60000)) return;
  VIVO.carga = true;
  fetch(`https://api.sleeper.app/v1/stats/nfl/regular/${D.temporada || new Date().getFullYear()}/${w}`).then(r => r.ok ? r.json() : null).then(st => {
    VIVO.carga = false; if (!st) return;
    const pts = {}; for (const [id, x] of Object.entries(st)) if (x && x.pts_ppr != null && J[id]) pts[id] = [x.pts_ppr, x.pts_half_ppr, x.pts_std];
    VIVO.w = w; VIVO.pts = pts; VIVO.t = Date.now();
    if (/^#\/(lideres|premium)/.test(location.hash)) repinta();
  }).catch(() => { VIVO.carga = false; VIVO.t = Date.now(); VIVO.w = w; });
}
const semanasJugadas = () => { const set = new Set(); P.forEach(j => (j.log || []).forEach(l => { if (l.f) set.add(l.w); })); return [...set].sort((a, b) => a - b); };
function lideres(q) {
  titulo('Líderes');
  const ahora = semActual(), jug = semanasJugadas(), vivoJuegos = G.some(g => g.estado === 'in'), empezo = G.some(g => g.estado !== 'pre') || jug.includes(ahora);
  if (empezo) cargaVivo(ahora);
  const ptsVivo = j => VIVO.w === ahora && VIVO.pts && VIVO.pts[j.id] ? VIVO.pts[j.id][FMT] : null;
  const pedida = q.get('s'), modoQ = q.get('ver'), sel = q.get('pos');
  const w = modoQ === 'temporada' ? null : +(pedida || (empezo ? ahora : (SEMNUM || ahora)));
  let modo = w == null ? 'temporada' : w === ahora && !empezo ? 'proy' : 'semana';
  if (modo === 'semana' && w === ahora && !P.some(j => (ptsVivo(j) ?? ptsSem(j, w)) != null)) modo = 'proy'; // aún sin puntos de la semana: se muestra la proyección
  const val = j => modo === 'temporada' ? j.total : modo === 'proy' ? j.p : w === ahora ? (ptsVivo(j) ?? ptsSem(j, w)) : ptsSem(j, w);
  const etq = modo === 'temporada' ? 'Temporada' : modo === 'proy' ? `Semana ${w} · Proyección` : `Semana ${w}${w === ahora && vivoJuegos ? ' · En vivo' : ''}`;
  const curProy = !jug.includes(ahora) && !(VIVO.w === ahora && VIVO.pts && Object.keys(VIVO.pts).length);
  const qs = (x, extra = '') => `#/lideres?${x == null ? 'ver=temporada' : 's=' + x}${extra}`;
  const semanas = [...new Set([...jug, ahora])].filter(x => x <= ahora).sort((a, b) => a - b);
  const chips = `<div class="chips semchips">${semanas.map(x => `<a class="chip ${x === w ? 'on' : ''} ${x === ahora ? 'actual' : ''}" href="${qs(x, sel ? '&pos=' + sel : '')}">S${x}${x === ahora ? (curProy ? ' · PROY' : vivoJuegos ? ' <i class="dotv"></i>VIVO' : '') : ''}</a>`).join('')}<a class="chip ${modo === 'temporada' ? 'on' : ''}" href="${qs(null, sel ? '&pos=' + sel : '')}">Temporada</a></div>`;
  const sub = modo === 'proy' ? `La semana ${w} aún no arranca: así se proyectan en ${FMTS[FMT]}. En cuanto empiece el primer partido, esta lista se vuelve en vivo.` : modo === 'temporada' ? `Total de la temporada en puntos ${FMTS[FMT]}.` : w === ahora ? `Puntos ${FMTS[FMT]} de la semana en curso. Se actualiza solo cada minuto mientras haya partidos.` : `Puntos ${FMTS[FMT]} de la semana ${w}.`;
  const pts = j => n1(val(j));
  if (sel && POSICIONES[sel]) {
    const L = P.filter(j => j.pos === sel && val(j) != null).sort((a, b) => val(b) - val(a));
    return `<div class="page">${crumbs([['#/lideres', 'Líderes'], ['', sel + ' · ' + etq]])}<div class="wrap"><section class="block">
      <div class="head"><div><h2>Líderes ${sel} · ${etq}</h2><p class="hsub">${sub}</p></div></div>${chips}
      <div class="chips">${Object.keys(POSICIONES).map(x => `<a class="chip ${x === sel ? 'on' : ''}" href="${qs(w, '&pos=' + x)}">${x}</a>`).join('')}</div>
      <div class="card scroll"><table class="tbl"><thead><tr><th>#</th><th>JUGADOR</th><th>EQUIPO</th><th>${modo === 'temporada' ? 'PARTIDOS' : 'RIVAL'}</th><th class="hl">${modo === 'proy' ? 'PROY' : 'PUNTOS'}</th><th>PROM</th></tr></thead><tbody>
      ${L.map((j, i) => `<tr onclick="location.hash='#/jugador/${j.id}'"><td class="n rk">${i + 1}</td><td><span class="tpl">${helmet(j.team, j.num, 28)}<span class="pname">${esc(j.n)}</span></span></td><td class="team">${esc(j.team)}</td><td class="team">${modo === 'temporada' ? (j.log || []).filter(l => l.f).length : rivalTxt(j.team, w)}</td><td class="n hl">${pts(j)}</td><td class="n">${n1(j.prom)}</td></tr>`).join('') || '<tr><td colspan="6" class="empty">Sin datos para esta semana todavía.</td></tr>'}</tbody></table></div>
    </section></div></div>`;
  }
  return `<div class="page">${crumbs([['', 'Líderes fantasy']])}<div class="wrap"><section class="block">
    <div class="head"><div><h2>Líderes fantasy · ${etq}</h2><p class="hsub">${sub} Toca “Ver todos” para la lista completa.</p></div></div>${chips}
    <div class="lgrid stagger">${Object.keys(POSICIONES).map(p => {
      const L = P.filter(j => j.pos === p && val(j) != null).sort((a, b) => val(b) - val(a)), top = L[0];
      return `<div class="lcol"><div class="lcol-h"><b>${p}</b><span>${POSICIONES[p]}</span></div>
        ${top ? `<a class="lead1" href="#/jugador/${top.id}" style="${vars(top.team)}">${helmet(top.team, top.num, 58, false, 'bob')}<span><small>Nº1 · ${esc(top.team)}</small><b><i>${esc(p === 'DEF' ? '' : nombre1(top.n))}</i>${esc(p === 'DEF' ? (EQUIPOS[top.team] || top.n) : apellido(top.n))}</b><em class="n">${pts(top)} pts</em></span></a>` : `<div class="empty sm">${p === 'DEF' ? 'Las defensivas llegan con la próxima actualización de datos.' : 'Sin datos todavía.'}</div>`}
        <div class="plist">${L.slice(1, 10).map((j, i) => `<a class="lrow" href="#/jugador/${j.id}"><i class="n">${i + 2}</i>${helmet(j.team, j.num, 24)}<span>${esc(j.n)}<small>${esc(j.team)}</small></span><em class="n">${pts(j)}</em></a>`).join('')}</div>
        ${L.length ? `<a class="lcol-all" href="${qs(w, '&pos=' + p)}">Ver los ${L.length} ${p} ›</a>` : ''}</div>`;
    }).join('')}</div></section>${plusRepite()}</div></div>`;
}

/* ---------- equipos ---------- */
function equipos() {
  titulo('Equipos');
  return `<div class="page">${crumbs([['', 'Equipos']])}<div class="wrap"><section class="block"><div class="head"><div><h2>Los 32 equipos</h2><p class="hsub">Por conferencia y división, con récord, rival de la semana y lesionados.</p></div></div>${teamGrid()}</section></div></div>`;
}
function equipo(t) {
  if (!EQUIPOS[t]) return noEncontrado();
  titulo(EQUIPOS[t]);
  const roster = P.filter(j => j.team === t).sort((a, b) => b.pEst - a.pEst), notas = noticiasEquipo(t), les = roster.filter(j => estatus(j) !== 'Sano');
  const div = Object.entries(DIVS).flatMap(([c, ds]) => Object.entries(ds).map(([d, ts]) => [c + ' ' + d, ts])).find(x => x[1].includes(t));
  const cal = (D.cal && D.cal.cal && D.cal.cal[t]) || {}, r = rivalDe(t);
  const grupos = Object.keys(POSICIONES).map(p => { const g = roster.filter(j => j.pos === p); return g.length ? `<div class="card"><h3>${p}</h3><p class="sub">${POSICIONES[p]} · proyección ${FMTS[FMT]} S${semActual()}</p><div class="plist">${g.map(j => prow(j, `<span class="num sm">${n1(j.p ?? j.prom)}</span>${fxPill(j)}`)).join('')}</div></div>` : ''; }).join('');
  return `<div class="page">${crumbs([['#/equipos', 'Equipos'], ['', EQUIPOS[t]]])}<div class="wrap">
    <div class="nhero" style="${vars(t)}"><div class="grid-in"><div class="hels">${helmet(t, '', 150, false, 'bob')}</div><div class="txt"><span class="tagx">${div ? div[0] : t}</span><h1>${esc(EQUIPOS[t])}</h1>
      <p class="hero-sub">Récord <b class="n">${recordDe(t) || '–'}</b> · ${r ? `Semana ${semActual()}: ${r.home ? 'vs' : '@'} ${EQUIPOS[r.opp] || r.opp}` : 'Semana de descanso'} · ${notas.length} noticias</p></div></div></div>
    ${les.length ? `<div class="alert"><b>REPORTE DE LESIONES</b><p>${les.map(j => `<a href="#/jugador/${j.id}">${esc(j.n)}</a> (${estatus(j)}${parte(j) ? ', ' + esc(parte(j)) : ''})`).join(' · ')}</p></div>` : ''}
    <section class="block"><div class="head"><div><h2>Calendario ${esc(D.cal ? D.cal.temporada : '')}</h2><p class="hsub">Resultados y lo que viene, semana por semana.</p></div></div>
      <div class="sched">${Array.from({ length: 18 }, (_, i) => i + 1).map(w => { const c = cal[w]; return `<a class="sw ${c && c.fin ? (c.pf > c.pc ? 'g' : 'p') : ''} ${w === semActual() ? 'now' : ''}" href="${c ? '#/equipo/' + c.opp : '#/equipos'}"><small>S${w}</small>${c ? helmet(c.opp, '', 34, !c.home) : '<b class="bye">BYE</b>'}<span>${c ? (c.home ? 'vs ' : '@ ') + c.opp : 'Descanso'}</span><em class="n">${c && c.fin ? (c.pf > c.pc ? 'G ' : c.pf < c.pc ? 'P ' : 'E ') + c.pf + '-' + c.pc : c ? fechaC(c.fecha) : ''}</em></a>`; }).join('')}</div></section>
    ${plusCalendario(t)}
    <section class="block"><div class="head"><div><h2>Plantel fantasy</h2><p class="hsub">Con su veredicto Start/Sit FX de esta semana.</p></div></div><div class="grid g3 stagger">${grupos || '<div class="empty">Sin jugadores registrados.</div>'}</div></section>
    <section class="block"><div class="head"><h2>Noticias de ${esc(EQUIPOS[t])}</h2></div><div class="news stagger">${notas.slice(0, 9).map(n => newsCard(n)).join('') || '<div class="empty">Aún no hay noticias de este equipo.</div>'}</div></section>
  </div></div>`;
}
function tendencias() {
  titulo('Tendencias');
  return `<div class="page">${crumbs([['', 'Tendencias']])}<div class="wrap"><section class="block"><div class="head"><div><h2>Tendencias en ligas</h2><p class="hsub">Movimientos de las últimas 24 horas en Sleeper, con nuestro veredicto.</p></div></div><div class="grid g2">
    <div class="card"><h3 style="color:var(--accent)">▲ Más agregados</h3><div class="plist">${D.agregados.map((id, i) => J[id] && prow(J[id], `<span class="bar"><i style="width:${pct(J[id].add, 'add')}%"></i></span><span class="num sm">${nf.format(J[id].add)}</span>${fxPill(J[id])}`, i + 1)).join('')}</div></div>
    <div class="card"><h3 style="color:var(--bad)">▼ Más soltados</h3><div class="plist">${D.soltados.map((id, i) => J[id] && prow(J[id], `<span class="bar down"><i style="width:${pct(J[id].drop, 'drop')}%"></i></span><span class="num sm" style="color:var(--bad)">${nf.format(J[id].drop)}</span>`, i + 1)).join('') || '<p class="sub">Sin datos hoy.</p>'}</div></div>
  </div></section>${plusCompra()}</div></div>`;
}
function lesionados(q) {
  titulo('Lesionados');
  const f = q.get('estatus') || 'TODOS';
  const orden = D.lesionados.map(x => J[x.id]).filter(Boolean);
  const lista = orden.filter(j => f === 'TODOS' || (f === 'IR' ? fueraTemp(j) : f === 'Fuera' ? j.inj === 'Out' : estatus(j) === f));
  return `<div class="page">${crumbs([['', 'Lesionados']])}<div class="wrap"><section class="block">
    <div class="head"><div><h2>Reporte médico</h2><p class="hsub">Solo jugadores relevantes para fantasy, ordenados por su impacto. Fuente: reporte oficial de lesiones · ${esc(actualizado())}</p></div><small>${lista.length} jugadores</small></div>
    <div class="chips">${[['TODOS', 'Todos'], ['Duda', 'En duda'], ['Fuera', 'Fuera esta semana'], ['IR', 'Reserva / temporada']].map(([s, t]) => `<a class="chip ${s === f ? 'on' : ''}" href="#/lesionados${s === 'TODOS' ? '' : '?estatus=' + s}">${t}</a>`).join('')}</div>
    ${plusLesion()}
    <div class="injgrid">${lista.map(j => `<a class="inj" href="#/jugador/${j.id}" style="${vars(j.team)}">${helmet(j.team, j.num, 44)}<span class="inj-n"><small>${esc(nombre1(j.n))}</small><b>${esc(apellido(j.n))}</b><i>${esc(j.pos)} · ${esc(j.team)} · ${esc(rw(j) !== '–' ? rw(j) : rp(j))}</i></span>
      <span class="inj-d"><span class="pill ${estatus(j)}">${fueraTemp(j) ? 'RESERVA' : estatus(j).toUpperCase()}</span><b>${esc(parte(j) || 'Sin detalle')}</b><small>${j.les && j.les.regreso ? 'Regreso: ' + esc(fechaC(j.les.regreso)) : j.les && j.les.fecha ? 'Reporte: ' + esc(fechaC(j.les.fecha)) : ''}</small></span></a>`).join('') || '<div class="empty">Sin lesionados con este estatus.</div>'}</div>
  </section></div></div>`;
}
function exclusivo() {
  titulo('Premium FX');
  const L = todasNoticias().filter(n => n.exclusivo);
  return `<div class="page">${crumbs([['', 'Premium FX']])}<div class="wrap">
    <div class="nhero" style="--c1:#3A2A05;--c2:#FFD45C"><div class="grid-in"><div class="txt"><span class="tagx" style="background:var(--gold)">★ PREMIUM FX</span><h1>Premium FX</h1><p class="hero-sub">Información de nuestra red de reporteros que no vas a encontrar en otro lado, desarrollada por los expertos.</p>${L.length ? `<p class="hero-n"><b>${L.length}</b> ${L.length === 1 ? 'nota exclusiva publicada' : 'notas exclusivas publicadas'}</p>` : ''}</div></div></div>
    ${esPremium() ? `<p class="prem-ok">★ Eres Premium: tienes acceso completo a todas las notas.</p>` : `<section class="block">${muroPremium()}</section>`}
    <section class="block"><div class="news stagger">${L.map(n => newsCard(n)).join('') || '<div class="empty">La primera nota exclusiva llega muy pronto. Mientras, revisa las <a href="#/noticias">noticias del día</a>.</div>'}</div></section>
  </div></div>`;
}


/* =============================== BLOG (ES / EN) =============================== */
let BLOG = null;
const cargaBlog = () => BLOG ? Promise.resolve(BLOG) : fetch(BASE + 'blog.json?v=' + Math.floor(Date.now() / 60000)).then(r => r.ok ? r.json() : []).catch(() => []).then(b => (BLOG = Array.isArray(b) ? b : []));
const enBlog = () => /^#\/blog/.test(location.hash || window.FX_RUTA || '');
const TIPO_B = { startsit: ['START / SIT', 'START / SIT'], waiver: ['WAIVER WIRE', 'WAIVER WIRE'], lesion: ['LESIONES', 'INJURIES'], trade: ['TRADES', 'TRADES'] };
const POSB = { QB: ['QB', 'QB'], RB: ['RB', 'RB'], WR: ['WR', 'WR'], TE: ['TE', 'TE'], K: ['Pateadores', 'Kickers'], DEF: ['Defensivas', 'Defenses'] };
const fechaB = f => new Date(f).toLocaleDateString(LANG === 'en' ? 'en-US' : 'es-MX', { day: 'numeric', month: 'short' });
function blogLista() {
  titulo('Blog');
  if (!BLOG) { cargaBlog().then(() => { if (enBlog()) repinta(); }); return cargador(); }
  const L = BLOG.filter(a => a[LANG] && a[LANG].titulo), w = semActual();
  return `<div class="page">${crumbs([['#/noticias', tx('Noticias', 'News')], ['', 'Blog']])}<div class="wrap narrowish">
    <section class="block"><div class="head"><div><h2>${tx('Blog de fantasy', 'Fantasy Football Blog')}</h2><p class="hsub">${tx('Las preguntas de la semana, respondidas con datos y con el Modelo FX.', 'This week\'s big questions, answered with data and the FX Model.')}</p></div></div>
    <div class="b-rk"><span>${tx('Rankings semana', 'Week')} ${w}</span>${Object.keys(POSB).map(p => `<a class="chip" href="#/posicion/${p}">${POSB[p][LANG === 'en' ? 1 : 0]}</a>`).join('')}</div>
    <div class="b-lista">${L.map(a => { const x = a[LANG], j = J[a.jugador];
      return `<a class="b-item" href="#/blog/${a.id}">${j ? helmet(j.team, j.num, 44) : fxLogo(30)}<span><small><b>${TIPO_B[a.tipo] ? TIPO_B[a.tipo][LANG === 'en' ? 1 : 0] : 'FX'}</b> · ${tx('Semana', 'Week')} ${esc(a.semana)} · ${esc(fechaB(a.fecha))}</small><b class="b-t">${esc(x.titulo)}</b><em>${esc(x.respuesta || '')}</em></span></a>`; }).join('') || `<div class="empty">${tx('Los primeros artículos llegan con la siguiente actualización.', 'The first articles arrive with the next update.')}</div>`}</div>
    </section></div></div>`;
}
function blogNota(id) {
  if (!BLOG) { cargaBlog().then(() => { if (enBlog()) repinta(); }); return cargador(); }
  const a = BLOG.find(x => x.id === id); if (!a) return noEncontrado();
  const x = a[LANG] || a.es, j = J[a.jugador], otro = LANG === 'en' ? 'es' : 'en';
  titulo(x.titulo);
  const ver = (x.fantasy && x.fantasy.veredicto) || '', bueno = /START|AGR|ADD|COMPRA|BUY|AGUANTA|HOLD/i.test(ver), malo = /SIT|VENDE|SELL/i.test(ver);
  return `<div class="page">${crumbs([['#/noticias', tx('Noticias', 'News')], ['#/blog', 'Blog'], ['', x.titulo.slice(0, 40) + (x.titulo.length > 40 ? '…' : '')]])}<div class="wrap narrowish"><article class="bnota">
    <p class="b-meta"><b>${TIPO_B[a.tipo] ? TIPO_B[a.tipo][LANG === 'en' ? 1 : 0] : 'FX'}</b> · ${tx('Semana', 'Week')} ${esc(a.semana)} · ${esc(fechaB(a.fecha))} · <button type="button" class="b-lang" data-lang="${otro}">${otro === 'en' ? 'Read in English' : 'Leer en español'}</button></p>
    <h1 class="ntitle">${esc(x.titulo)}</h1>
    <div class="b-resp">${fxLogo(26)}<p>${enlaza(x.respuesta || '', j ? [j] : [])}</p></div>
    ${j ? `<a class="b-jug" href="#/jugador/${j.id}" style="${vars(j.team)}">${helmet(j.team, j.num, 52)}<span><b>${esc(j.n)}</b><small>${esc(j.pos)} · ${esc(EQUIPOS[j.team] || j.team)} · ${esc(rivalTxt(j.team))}</small></span>${j.p != null ? `<em><b class="n">${n1(j.p)}</b><small>${tx('PROY FX', 'FX PROJ')} ${FMTS[FMT]}</small></em>` : ''}</a>` : ''}
    ${(x.secciones || []).map(sc => `<section class="nsec"><h3>${esc(sc.h2)}</h3><p>${enlaza(sc.texto, j ? [j] : [])}</p></section>`).join('')}
    ${x.fantasy ? consejo({ accion: '', texto: x.fantasy.texto, veredicto: ver, jugadores: j ? [j] : [] }) : ''}
    ${(x.faq || []).length ? `<section class="b-faq"><h3>${tx('Preguntas frecuentes', 'FAQ')}</h3>${x.faq.map(f => `<details><summary>${esc(f.q)}</summary><p>${enlaza(f.a, j ? [j] : [])}</p></details>`).join('')}</section>` : ''}
    ${(a.fuentes || []).length ? `<p class="b-fuentes">${tx('Reportes originales', 'Original reports')}: ${a.fuentes.map((f, i) => `<a href="${esc(f.u)}" target="_blank" rel="nofollow noopener">${i + 1}</a>`).join(' · ')}</p>` : ''}
    <p class="more"><a class="btn ghost" href="#/blog">${tx('Más del blog', 'More from the blog')}</a></p>
  </article></div></div>`;
}

/* ---------- temporada ---------- */
function semThumb(R, big) {
  const mvp = Object.values(R.top || {}).flat().sort((a, b) => (b.f ? b.f[FMT] : b.pts) - (a.f ? a.f[FMT] : a.pts))[0] || {};
  return `<span class="th wk der ${big ? 'th-big' : ''}" style="${vars(mvp.team)}"><span class="th-field" aria-hidden="true"></span>
    <span class="th-top"><span class="th-tag TENDENCIA">${R.cerrada ? 'RESUMEN DE LA SEMANA' : 'SEMANA EN CURSO'}</span><span class="th-imp SUBE">MVP</span></span>
    <span class="th-mid"><span class="wk-big"><small>SEMANA</small><b>${R.semana}</b></span>
      <span class="th-name"><small>${esc(nombre1(mvp.n))}</small><b>${esc(apellido(mvp.n || ''))}</b><em>${n1(mvp.f ? mvp.f[FMT] : mvp.pts)} pts · ${esc(mvp.team || '')}</em></span>
      <span class="th-vis">${helmet(mvp.team, J[mvp.id] && J[mvp.id].num, big ? 150 : 92, false, 'th-hel')}</span></span>
    <span class="th-strip"><span><b>${(R.claves || []).length || '–'}</b><i>APRENDIZAJES</i></span><span><b>${(R.sorpresas || []).length + (R.decepciones || []).length || '–'}</b><i>SORPRESAS Y DECEPCIONES</i></span><span><b>50</b><i>MEJORES</i></span><span class="th-brand">${fxLogo(18)}</span></span></span>`;
}
function temporada() {
  titulo('Temporada');
  const S = Object.values(D.resumenes || {}).sort((a, b) => b.semana - a.semana);
  return `<div class="page">${crumbs([['', 'Temporada ' + (D.temporada || '')]])}<div class="wrap"><section class="block">
    <div class="head"><div><h2>Temporada ${esc(D.temporada || '')}, semana por semana</h2><p class="hsub">El archivo de la temporada: cada jornada resumida y lista para consultar.</p></div></div>
    <div class="intro"><div><b>¿Qué encuentras aquí?</b><p>Una tarjeta por cada semana jugada. Entra a cualquiera y verás el resumen de la jornada, <b>10 aprendizajes</b> que te ayudan a decidir la siguiente, las <b>sorpresas y decepciones</b>, el <b>MVP</b> y el <b>top 10 por posición</b> en el formato que elijas (PPR, Half o Standard).</p></div>
      <ul><li><i class="n">10</i>aprendizajes por semana</li><li><i class="n">50</i>mejores por posición</li><li><i class="n">${Object.keys(D.resumenes || {}).length}</i>semanas en el archivo</li></ul></div>
    <div class="news stagger">${S.map(R => `<a class="story" href="#/semana/${R.semana}">${semThumb(R)}<span class="st-body"><span class="st-meta">Semana ${R.semana}${R.cerrada ? '' : ' · en curso'}</span><h3>${esc(R.titulo)}</h3><p class="st-k">${esc((R.claves || [])[0] || '')}</p></span></a>`).join('') || '<div class="empty">Generando el resumen de la temporada…</div>'}</div></section></div></div>`;
}
function semana(w) {
  const R = (D.resumenes || {})[w];
  if (!R) return noEncontrado();
  titulo('Semana ' + w);
  const lista = (t, arr, cls) => arr && arr.length ? `<div class="card ${cls}"><h3>${t}</h3><ul class="claves">${arr.map(x => `<li>${enlaza(x)}</li>`).join('')}</ul></div>` : '';
  const unico = t => { const m = [...enlaza(t).matchAll(/data-j="([^"]+)"/g)].map(x => x[1]); return new Set(m).size === 1 ? m[0] : null; };
  return `<div class="page">${crumbs([['#/temporada', 'Temporada'], ['', 'Semana ' + w]])}<div class="wrap narrowish">
    <div class="nhead">${semThumb(R, true)}</div>
    <p class="st-meta" style="margin-top:18px">Semana ${w} · ${R.cerrada ? 'jornada cerrada' : 'en curso'}</p><h1 class="ntitle">${esc(R.titulo)}</h1>
    ${R.cuerpo ? `<p class="lead-p">${enlaza(R.cuerpo)}</p>` : ''}
    ${(R.claves || []).length ? `<section class="block" style="padding-top:20px"><div class="head"><h2>${R.claves.length} cosas que aprendimos</h2></div><ol class="learn">${R.claves.map(c => { const u = unico(c); return `<li${u ? ` class="learn-link" data-ir="#/jugador/${u}" data-hover-j="${u}"` : ''}>${enlaza(c)}</li>`; }).join('')}</ol></section>` : '<p class="sub">El análisis completo de esta semana se está generando.</p>'}
    <div class="grid g2" style="margin-top:20px">${lista('Sorpresas', R.sorpresas, 'good')}${lista('Decepciones', R.decepciones, 'bad')}</div>
    <section class="block"><div class="head"><div><h2>Los mejores de la semana ${w}</h2><p class="hsub">Puntos ${FMTS[FMT]}.</p></div><a class="all" href="#/lideres?ver=semana">Líderes ›</a></div>
      <div class="lgrid">${Object.entries(R.top || {}).map(([p, l]) => `<div class="lcol"><div class="lcol-h"><b>${p}</b></div><div class="plist">${l.slice(0, 10).map((x, i) => `<a class="lrow" href="${J[x.id] ? '#/jugador/' + x.id : '#/semana/' + w}"><i class="n">${i + 1}</i>${helmet(x.team, J[x.id] && J[x.id].num, 24)}<span>${esc(x.n)}<small>${esc(x.team || '')}</small></span><em class="n">${n1(x.f ? x.f[FMT] : x.pts)}</em></a>`).join('')}</div></div>`).join('')}</div></section>
    <div class="navnotas">${D.resumenes[w - 1] ? `<a class="nn" href="#/semana/${w - 1}"><small>‹ Semana anterior</small><b>${esc(D.resumenes[w - 1].titulo)}</b></a>` : '<span></span>'}${D.resumenes[+w + 1] ? `<a class="nn r" href="#/semana/${+w + 1}"><small>Semana siguiente ›</small><b>${esc(D.resumenes[+w + 1].titulo)}</b></a>` : ''}</div>
  </div></div>`;
}

/* ---------- FX TV ---------- */
const ICO = {
  yt: '<svg width="20" height="20" viewBox="0 0 8 8" shape-rendering="crispEdges" aria-hidden="true"><rect x="0" y="1" width="8" height="6" fill="#FF3B30"/><rect x="3" y="2" width="1" height="4" fill="#fff"/><rect x="4" y="3" width="1" height="2" fill="#fff"/></svg>',
  tt: '<svg width="20" height="20" viewBox="0 0 8 8" shape-rendering="crispEdges" aria-hidden="true"><rect x="4" y="0" width="1" height="6" fill="#fff"/><rect x="5" y="1" width="2" height="1" fill="#25F4EE"/><rect x="2" y="4" width="2" height="1" fill="#fff"/><rect x="1" y="5" width="1" height="2" fill="#FE2C55"/><rect x="2" y="7" width="2" height="1" fill="#fff"/><rect x="4" y="6" width="1" height="1" fill="#fff"/></svg>',
  ig: '<svg width="20" height="20" viewBox="0 0 8 8" shape-rendering="crispEdges" aria-hidden="true"><rect x="0" y="0" width="8" height="8" fill="#C13584"/><rect x="1" y="1" width="6" height="6" fill="#0A1A10"/><rect x="3" y="3" width="2" height="2" fill="#FCAF45"/><rect x="5" y="2" width="1" height="1" fill="#FCAF45"/></svg>',
  sp: '<svg width="20" height="20" viewBox="0 0 8 8" shape-rendering="crispEdges" aria-hidden="true"><rect x="1" y="0" width="6" height="8" fill="#1DB954"/><rect x="0" y="1" width="8" height="6" fill="#1DB954"/><rect x="2" y="2" width="4" height="1" fill="#0A1A10"/><rect x="2" y="4" width="3" height="1" fill="#0A1A10"/><rect x="3" y="6" width="2" height="1" fill="#0A1A10"/></svg>'
};
const redBtn = (k, ico, txt) => D.redes[k] ? `<a class="social" href="${esc(D.redes[k].url)}" target="_blank" rel="noopener">${ICO[ico]}<span>${txt}<small>${esc(D.redes[k].usuario || '')}</small></span></a>` : '';
const grupoRedes = () => `<div class="redgroups"><div class="redgroup"><h4>FANTASY EXPERTOS</h4><div class="socials">${redBtn('youtube', 'yt', 'YouTube')}${redBtn('spotify', 'sp', 'Podcast')}${redBtn('instagramFX', 'ig', 'Instagram')}</div></div><div class="redgroup"><h4>JOE NFL</h4><div class="socials">${redBtn('tiktok', 'tt', 'TikTok')}${redBtn('instagram', 'ig', 'Instagram')}</div></div></div>`;
const vidCard = (v, big) => `<button class="vid ${big ? 'big' : ''}" type="button" data-v="${esc(v.id)}" aria-label="Reproducir ${esc(v.titulo)}"><span class="thumb"><img loading="lazy" src="https://i.ytimg.com/vi/${esc(v.id)}/${big ? 'maxresdefault' : 'hqdefault'}.jpg" onerror="if(this.dataset.r){this.remove()}else{this.dataset.r=1;this.src='https://i.ytimg.com/vi/${esc(v.id)}/hqdefault.jpg'}" alt=""><span class="play">${ICO.yt}</span>${v.corto ? '<span class="tm">SHORT</span>' : ''}</span>
  <span class="vinfo"><span class="vt">${esc(v.titulo)}</span><small>${v.fecha ? new Date(v.fecha).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}${v.vistas ? ' · ' + nf.format(v.vistas) + ' vistas' : ''}</small></span></button>`;
const videos = () => (D.videos.videos || []).slice().sort((a, b) => Date.parse(b.fecha || 0) - Date.parse(a.fecha || 0));
const podcast = () => D.redes.spotify ? `<div class="pod"><iframe title="Podcast Fantasy Expertos en Spotify" src="https://open.spotify.com/embed/show/${esc(D.redes.spotify.show)}?theme=0" width="100%" height="152" frameborder="0" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe></div>` : '';
const tvBloque = V => V.length ? `<div class="tv">${vidCard(V[0], true)}<div class="tv-side">${V.slice(1, 4).map(v => vidCard(v)).join('')}</div></div>` : `<a class="empty" href="${esc(D.redes.youtube ? D.redes.youtube.url : '#')}" target="_blank" rel="noopener">Mira nuestros videos en YouTube ›</a>`;
function fxtv() {
  return `<section class="block" data-chip="▶ NUEVO"><div class="head"><div><h2>FX TV</h2><p class="hsub">El podcast y lo más reciente del canal. Se reproduce aquí mismo.</p></div><a class="all" href="#/media">Todo el contenido ›</a></div>${podcast()}<div style="margin-top:18px">${tvBloque(videos())}</div></section>`;
}
function media() {
  titulo('FX TV');
  const V = videos(), largos = V.filter(v => !v.corto).length, R = D.redes;
  const canal = (k, ico, txt, url) => R[k] ? `<a class="tv-canal ${k}" href="${esc(url || R[k].url)}" target="_blank" rel="noopener">${ico}<span>${txt}</span></a>` : '';
  return `<div class="page">${crumbs([['', 'FX TV']])}<div class="wrap">
    <div class="tv-hero"><div><span class="tv-live"><i></i>FX TV</span><h1>Videos y podcast</h1><p class="hero-sub">El análisis de Fantasy Expertos en video y audio. Se reproduce aquí mismo, sin salir del sitio.</p>
      ${V.length ? `<p class="hero-n"><b>${V.length}</b> videos publicados${largos && largos !== V.length ? ` · ${largos} episodios completos` : ''}</p>` : ''}</div>
      <div class="tv-canales">${canal('youtube', ICO.yt, 'Suscríbete en YouTube', R.youtube && R.youtube.url + '?sub_confirmation=1')}${canal('spotify', ICO.sp, 'Escucha en Spotify')}${canal('tiktok', ICO.tt, 'Síguenos en TikTok')}</div></div>
    <section class="block"><div class="head"><div><h2>Lo más reciente</h2><p class="hsub">El video más nuevo siempre primero.</p></div></div>${tvBloque(V)}</section>
    ${R.spotify ? `<section class="block"><div class="head"><div><h2>El podcast</h2><p class="hsub">Fantasy Expertos en Spotify.</p></div><a class="all" href="${esc(R.spotify.url)}" target="_blank" rel="noopener">Abrir en Spotify ›</a></div>${podcast()}</section>` : ''}
    ${V.length > 4 ? `<section class="block"><div class="head"><h2>Más videos</h2></div><div class="vids">${V.slice(4, 22).map(v => vidCard(v)).join('')}</div></section>` : ''}
  </div></div>`;
}
const ctaRedes = () => D.redes.tiktok ? `<a class="tcta" href="${esc(D.redes.tiktok.url)}" target="_blank" rel="noopener">${ICO.tt}<span><b>¿Lo quieres en 60 segundos?</b> Esta y más jugadas en el TikTok de @joe.nfl</span><em>Seguir ›</em></a>` : '';

/* =============================== EN VIVO (ESPN) =============================== */
const AB = { WSH: 'WAS', JAC: 'JAX', LA: 'LAR' };
let G = [], gPrev = {}, gTimer;
const mapEvento = (e, wk) => {
  const c = e.competitions[0], st = e.status || c.status, sit = c.situation || {};
  const eq = c.competitors.map(t => ({ ab: AB[t.team.abbreviation] || t.team.abbreviation, nombre: t.team.displayName, local: t.homeAway === 'home', id: t.team.id, pts: +t.score || 0, rec: (t.records && t.records[0] && t.records[0].summary) || (t.record && t.record[0] && t.record[0].summary) || '',
    lideres: (t.leaders || []).map(l => ({ cat: l.shortDisplayName || l.name, val: l.leaders && l.leaders[0] && l.leaders[0].displayValue, quien: l.leaders && l.leaders[0] && l.leaders[0].athlete && l.leaders[0].athlete.displayName })).filter(x => x.quien) })).sort((a, b) => a.local - b.local);
  return { id: e.id, fecha: e.date || c.date, estado: st.type.state, detalle: st.type.shortDetail, sede: c.venue && c.venue.fullName, tv: (c.broadcasts && c.broadcasts[0] && (c.broadcasts[0].names || []).join(', ')) || '',
    visita: eq[0], local: eq[1], posesion: sit.possession, yarda: sit.yardLine, downs: sit.downDistanceText, ultima: sit.lastPlay && sit.lastPlay.text, zonaRoja: sit.isRedZone, semana: wk, nota: (c.notes && c.notes[0] && c.notes[0].headline) || '' };
};
const GW = {};
async function cargaSemana(tipo, w) {
  const k = tipo + '-' + w; if (GW[k]) return GW[k];
  const j = await (await fetch(`https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard?seasontype=${tipo}&week=${w}&dates=${(D.cal && D.cal.temporada) || ''}`)).json();
  return (GW[k] = (j.events || []).map(e => mapEvento(e, tipo == 2 ? w : null)));
}
async function cargaPartidos() {
  try {
    const j = await (await fetch('https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard')).json();
    G = (j.events || []).map(e => mapEvento(e, j.week && j.week.number));
    if (j.week && j.season) GW[(j.season.type || 2) + '-' + j.week.number] = G;
    const anot = [];
    G.forEach(g => { const p = gPrev[g.id]; if (p) [g.visita, g.local].forEach((t, k) => { const d = t.pts - (k ? p.l : p.v); if (d >= 6 || d === 3) anot.push({ g, t, d }); }); gPrev[g.id] = { v: g.visita.pts, l: g.local.pts }; });
    pintaMarcadores(); anot.forEach(celebra);
    if (/^#\/partidos/.test(location.hash) && !location.hash.includes('semana=')) refrescaVista(); else if (!location.hash || location.hash === '#/') refrescaVista();
    if (/^#\/partido\//.test(location.hash)) { const gid = location.hash.split('/')[2], gg = G.find(x => x.id === gid), h = $('#g-hero'); if (!$('.gsum')) router(); else if (gg && h) { h.innerHTML = heroPartido(gg); if (gg.estado === 'in' && !$('#fxlive')) router(); } }
  } catch (e) { console.log('Marcadores no disponibles', e); }
  clearTimeout(gTimer);
  gTimer = setTimeout(cargaPartidos, G.some(g => g.estado === 'in') ? 20000 : 120000);
}
const enVivo = () => { const n = G.filter(g => g.estado === 'in').length; const d = $('.tb-live'); if (d) d.classList.toggle('on', n > 0); return n; };
const ordenG = () => [...G].sort((a, b) => ({ in: 0, pre: 1, post: 2 }[a.estado] - { in: 0, pre: 1, post: 2 }[b.estado]) || Date.parse(a.fecha) - Date.parse(b.fecha));
const ganando = (g, k) => g.estado === 'pre' ? '' : (k ? g.local.pts > g.visita.pts : g.visita.pts > g.local.pts) ? 'gana' : '';
const horaJuego = g => new Date(g.fecha).toLocaleString('es-MX', { weekday: 'short', hour: 'numeric', minute: '2-digit' }).toUpperCase();
function pintaMarcadores() {
  const bar = $('#scorebar'); if (!bar || !G.length) return;
  bar.innerHTML = `<span class="sb-tag">${enVivo() ? '<i></i>EN VIVO' : 'SEMANA ' + (G[0].semana || '')}</span><div class="sb-list">${ordenG().map(g => `<a class="sb ${g.estado}" href="#/partido/${g.id}">
    <span class="sb-t ${ganando(g, 0)}">${helmet(g.visita.ab, '', 30)}${esc(g.visita.ab)}<b>${g.estado === 'pre' ? '' : g.visita.pts}</b></span>
    <span class="sb-t ${ganando(g, 1)}">${helmet(g.local.ab, '', 30)}${esc(g.local.ab)}<b>${g.estado === 'pre' ? '' : g.local.pts}</b></span><small>${esc(g.estado === 'pre' ? horaJuego(g) : g.detalle)}</small></a>`).join('')}</div>`;
}
function celebra({ g, t, d }) {
  const el = document.createElement('div');
  el.className = 'celebra'; el.style.cssText = vars(t.ab);
  el.innerHTML = `${escenaTD(t.ab)}<div class="ce-in">${helmet(t.ab, '', 90, false, 'bob')}<b>${d >= 6 ? 'TOUCHDOWN!' : 'FIELD GOAL!'}</b><span>${esc(t.nombre)} · ${g.visita.ab} ${g.visita.pts} – ${g.local.pts} ${g.local.ab}</span></div>`;
  el.onclick = () => { location.hash = '#/partido/' + g.id; el.remove(); };
  document.body.appendChild(el); setTimeout(() => el.remove(), 5200);
}
const fantasyDe = ab => P.filter(j => j.team === ab && j.team !== 'FA').sort((a, b) => (fuera(a) - fuera(b)) || b.pEst - a.pEst);
function matchCard(g) {
  const v = g.visita, l = g.local, pos = g.posesion, val = j => g.estado === 'post' ? ptsSem(j, g.semana) : (g.semana && g.semana !== semActual() ? j.prom : (j.p ?? j.pEst));
  const fx = ab => fantasyDe(ab).filter(juega).slice(0, 2).map(j => `${esc(apellido(j.n))} <b>${n1(val(j))}</b>`).join(' · ');
  return `<a class="match ${g.estado} ${g.zonaRoja ? 'rz' : ''}" href="#/partido/${g.id}" style="--cv:${col(v.ab)[0]};--cl:${col(l.ab)[0]}">
    <span class="m-top"><span>${g.estado === 'in' ? '<i></i>EN VIVO · ' + esc(g.detalle) : g.estado === 'post' ? 'FINAL' : esc(horaJuego(g))}</span><span>${esc(g.tv || '')}</span></span>
    <span class="m-face"><span class="m-team ${ganando(g, 0)}"><span class="hw v">${helmet(v.ab, '', 84)}</span><b>${esc(v.ab)}</b><small>${esc(v.rec)}</small>${pos === v.id ? '<i class="ball"></i>' : ''}</span>
      <span class="m-score">${g.estado === 'pre' ? '<span class="vsb">VS</span>' : `${v.pts}<em>–</em>${l.pts}`}</span>
      <span class="m-team ${ganando(g, 1)}"><span class="hw l">${helmet(l.ab, '', 84, true)}</span><b>${esc(l.ab)}</b><small>${esc(l.rec)}</small>${pos === l.id ? '<i class="ball"></i>' : ''}</span></span>
    ${g.estado === 'in' ? `<span class="m-field">${campo(g)}</span><span class="m-play">${esc(g.downs || '')}${g.ultima ? ' · ' + esc(g.ultima) : ''}</span>` : ''}
    <span class="m-fx"><span>${fx(v.ab)}</span><span>${fx(l.ab)}</span></span></a>`;
}
function campo(g) {
  const y = Math.max(0, Math.min(100, +g.yarda || 50)), x = 8 + y * .64, dueño = g.posesion === g.local.id ? g.local.ab : g.visita.ab;
  return `<svg viewBox="0 0 80 14" preserveAspectRatio="none" shape-rendering="crispEdges" aria-label="Posición del balón"><rect width="80" height="14" fill="#12441F"/><rect width="8" height="14" fill="${col(g.visita.ab)[0]}"/><rect x="72" width="8" height="14" fill="${col(g.local.ab)[0]}"/>
    ${Array.from({ length: 11 }, (_, i) => `<rect x="${8 + i * 6.4}" width=".4" height="14" fill="#fff" opacity=".35"/>`).join('')}<rect x="${x - 1.5}" y="5" width="3" height="4" fill="#8B4A2B"><animate attributeName="y" values="5;4;5" dur=".6s" repeatCount="indefinite" calcMode="discrete"/></rect><rect x="${x}" width=".5" height="14" fill="${col(dueño)[1]}"/></svg>`;
}
function homeMatches() { return G.length ? `<div class="matches">${ordenG().slice(0, 6).map(matchCard).join('')}</div>` : esqMatches(3); }
const PLAYOFFS = [['3-1', 'Wild Card'], ['3-2', 'Divisional'], ['3-3', 'Final de conferencia'], ['3-5', 'Super Bowl']];
function partidos(q) {
  titulo('Partidos');
  const act = (G[0] && G[0].semana) || semActual();
  const sel = (q && q.get('semana')) || ('2-' + act), [tipo, w] = sel.split('-');
  const nombre = tipo === '3' ? (PLAYOFFS.find(x => x[0] === sel) || [0, 'Playoffs'])[1] : 'Semana ' + w;
  const L = sel === '2-' + act && G.length ? G : GW[sel];
  if (!L) cargaSemana(tipo, w).then(() => { if ((location.hash.split('semana=')[1] || '2-' + act) === sel) app.innerHTML = partidos(q); }).catch(() => { const m = $('#wkmsg'); if (m) m.innerHTML = '<div class="empty">No pudimos cargar los partidos de esta semana. Intenta de nuevo en un momento.</div>'; });
  const grupos = L ? [['in', 'En vivo'], ['pre', 'Próximos'], ['post', 'Finales']].map(([k, t]) => { const X = L.filter(g => g.estado === k); return X.length ? `<h3 class="grp">${t} · ${X.length}</h3><div class="matches">${X.map(matchCard).join('')}</div>` : ''; }).join('') : `<div id="wkmsg">${esqMatches(6)}</div>`;
  const byes = tipo === '2' && D.cal ? Object.keys(EQUIPOS).filter(t => D.cal.cal[t] && !D.cal.cal[t][w]) : [];
  return `<div class="page">${crumbs([['', 'Partidos']])}<div class="wrap"><section class="block">
    <div class="head"><div><h2>Partidos · ${esc(nombre)}</h2><p class="hsub">Temporada regular de la semana 1 a la 18 y los playoffs. ${sel === '2-' + act ? (enVivo() ? 'Se actualiza cada 20 segundos.' : 'Semana actual.') : ''}</p></div></div>
    <div class="weeks" role="tablist">${Array.from({ length: 18 }, (_, i) => i + 1).map(n => `<a class="wkc ${sel === '2-' + n ? 'on' : ''} ${n < act ? 'past' : n === act ? 'now' : ''}" href="#/partidos?semana=2-${n}">S${n}</a>`).join('')}<span class="wsep"></span>${PLAYOFFS.map(([k, t]) => `<a class="wkc po ${sel === k ? 'on' : ''}" href="#/partidos?semana=${k}">${t}</a>`).join('')}</div>
    ${byes.length ? `<p class="byes">Descansan: ${byes.map(t => `<a href="#/equipo/${t}">${helmet(t, '', 20)}${t}</a>`).join('')}</p>` : ''}
    ${grupos || '<div class="empty">Esta semana aún no tiene partidos publicados.</div>'}
  </section>${sel === '2-' + act ? plusPartidos(L) : ''}</div></div>`;
}
// Marcador tipo televisión: horizontal y simétrico. Visita a la izquierda, local a la derecha.
const RELOJ = d => { const m = String(d || '').match(/(\d+:\d+)\s*-\s*(\d)(?:st|nd|rd|th)/i); if (m) return [`${m[2]}º CUARTO`, m[1]];
  if (/half/i.test(d)) return ['MEDIO TIEMPO', '']; const e = String(d || '').match(/end of (\d)/i); if (e) return [`FIN DEL ${e[1]}º`, '']; if (/OT/.test(d)) return ['TIEMPO EXTRA', String(d).split('-')[0].trim()]; return [String(d || '').toUpperCase(), '']; };
const DOWN = t => { const m = String(t || '').match(/(\d)(?:st|nd|rd|th) & (\w+) at (.+)/i); return m ? `${m[1]}ª y ${/goal/i.test(m[2]) ? 'gol' : m[2]} en ${m[3]}` : (t || ''); };
const BALON = '<svg class="balon" width="18" height="12" viewBox="0 0 9 6" shape-rendering="crispEdges" aria-label="Tiene el balón"><rect x="2" y="0" width="5" height="1" fill="#8B4A2B"/><rect x="1" y="1" width="7" height="4" fill="#8B4A2B"/><rect x="0" y="2" width="9" height="2" fill="#8B4A2B"/><rect x="2" y="5" width="5" height="1" fill="#8B4A2B"/><rect x="3" y="2" width="3" height="1" fill="#fff"/></svg>';
const WPC = {};
function heroPartido(g) {
  const pre = g.estado === 'pre', [r1, r2] = g.estado === 'in' ? RELOJ(g.detalle) : g.estado === 'post' ? ['FINAL', ''] : [horaJuego(g), ''];
  const eq = (t, k) => { const tiene = g.estado === 'in' && g.posesion === t.id;
    return `<a class="mk-eq ${k ? 'loc' : 'vis'}" href="#/equipo/${t.ab}">${helmet(t.ab, '', 92, !!k, 'mk-hel')}<span class="mk-nom"><b class="lg">${esc(t.nombre)}</b><b class="sm">${esc(t.ab)}</b><small>${esc(t.rec)}${t.rec ? ' · ' : ''}${k ? 'Local' : 'Visita'}</small>${tiene ? `<i class="mk-pos">${BALON} Balón</i>` : ''}</span></a>`; };
  return `<div class="mk ${g.estado}" style="--cv:${col(g.visita.ab)[0]};--cl:${col(g.local.ab)[0]}">
    <div class="mk-top"><span>${!pre ? `<b class="fx-live">${fxLogo(14)} FX ${g.estado === 'in' ? 'LIVE' : 'FINAL'}</b>` : ''}${g.estado === 'in' ? '<span class="vivo"><i class="dotv"></i>EN VIVO</span>' : ''}</span><span>${esc(g.sede || '')}</span></div>
    <div class="mk-row">${eq(g.visita, 0)}
      <b class="mk-pts ${ganando(g, 0)}">${pre ? '' : g.visita.pts}</b>
      <span class="mk-reloj"><b>${esc(pre ? 'VS' : r1)}</b>${pre ? `<small>${esc(r1)}</small>` : r2 ? `<small>${esc(r2)}</small>` : ''}</span>
      <b class="mk-pts ${ganando(g, 1)}">${pre ? '' : g.local.pts}</b>
      ${eq(g.local, 1)}</div>
    ${g.estado === 'in' ? `<div class="mk-campo">${campo(g)}</div><div class="mk-jugada"><small>${esc(DOWN(g.downs))}${g.zonaRoja ? ' · <b>ZONA ROJA</b>' : ''}</small><p>${esc(g.ultima || 'Esperando la siguiente jugada…')}</p></div>` : ''}
    <div id="g-wp">${WPC[g.id] || ''}</div>
  </div>`;
}
function partido(id) {
  const g = G.find(x => x.id === id) || Object.values(GW).flat().find(x => x.id === id);
  if (!g) {
    fetch('https://site.api.espn.com/apis/site/v2/sports/football/nfl/summary?event=' + id).then(r => r.json()).then(s => {
      const h = s.header; if (!h) return; const ev = mapEvento({ id, date: h.competitions[0].date, status: h.competitions[0].status, competitions: h.competitions }, h.week);
      GW['x-' + id] = [ev]; if (location.hash.includes(id)) router();
    }).catch(() => {});
    return cargador('CARGANDO PARTIDO');
  }
  titulo(`${g.visita.ab} vs ${g.local.ab}`);
  const notas = todasNoticias().filter(n => equiposDe(n).some(t => t === g.visita.ab || t === g.local.ab)).slice(0, 6);
  const lado = t => { const L = fantasyDe(t.ab).slice(0, 8), les = fantasyDe(t.ab).filter(j => estatus(j) !== 'Sano').slice(0, 6);
    return `<div class="card side-team" style="${vars(t.ab)}"><div class="head"><h3>${helmet(t.ab, '', 30)} ${esc(t.nombre)}</h3><a class="all" href="#/equipo/${t.ab}">Equipo ›</a></div>
      <p class="sub">Fantasy · ${g.estado === 'post' ? 'puntos ' + FMTS[FMT] + ' en este partido' : 'proyección ' + FMTS[FMT] + ' (los puntos finales llegan al terminar)'}</p>
      <div class="plist">${L.map(j => prow(j, `<span class="num sm">${n1(g.estado === 'post' ? ptsSem(j, g.semana) : (j.p ?? j.pEst))}</span>${fxPill(j)}`)).join('')}</div>
      ${les.length ? `<p class="sub" style="margin-top:14px">Reporte médico</p><div class="plist">${les.map(j => prow(j, `<span class="team">${esc(parte(j))}</span>${pillSt(j)}`)).join('')}</div>` : ''}</div>`; };
  setTimeout(() => detallePartido(g).then(() => { if (g.estado === 'in') vigilaPartido(g.id); }), 0);
  return `<div class="page">${crumbs([['#/partidos', 'Partidos'], ['', g.visita.ab + ' vs ' + g.local.ab]])}<div class="wrap">
    <div id="g-hero">${heroPartido(g)}</div>${g.estado !== 'pre' ? '<div id="g-eq"></div>' : ''}
    ${g.estado !== 'pre' ? `<div class="live-tabs" role="tablist"><button type="button" class="on" data-lt="fx">${fxLogo(14)} Fantasy en vivo</button><button type="button" data-lt="pbp">Jugada a jugada</button></div>` : ''}
    ${g.estado === 'pre' ? `<div class="gsum" id="gsum"><div class="esq-lineas" aria-busy="true" aria-label="Cargando estadísticas del partido"><i></i><i></i><i></i><i></i></div></div>
    <section class="block grid g2">${lado(g.visita)}${lado(g.local)}</section>` : `<div class="live-grid ver-fx">
      <section class="card fxlive" id="fxlive"><div class="esq-lineas" aria-busy="true" aria-label="Cargando fantasy en vivo"><i></i><i></i><i></i><i></i><i></i><i></i></div></section>
      <aside class="card pbp" id="pbp"><div class="esq-lineas" aria-busy="true" aria-label="Cargando jugadas"><i></i><i></i><i></i><i></i></div></aside>
    </div><div id="gsum" class="gsum"></div>`}
    ${notas.length ? `<section class="block"><div class="head"><h2>Noticias de ${esc(g.visita.ab)} y ${esc(g.local.ab)}</h2></div><div class="news stagger">${notas.map(n => newsCard(n)).join('')}</div></section>` : ''}
  </div></div>`;
}
async function detallePartido(g) {
  const box = $('#gsum'); if (!box) return;
  try {
    const s = await (await fetch('https://site.api.espn.com/apis/site/v2/sports/football/nfl/summary?event=' + g.id)).json();
    if (g.estado !== 'pre') return pintaVivo(g, s);
    const teams = (s.boxscore && s.boxscore.teams) || [];
    const statsDe = ab => { const t = teams.find(x => (AB[x.team.abbreviation] || x.team.abbreviation) === ab); return t ? Object.fromEntries((t.statistics || []).map(x => [x.name, x.displayValue])) : {}; };
    const sv = statsDe(g.visita.ab), sl = statsDe(g.local.ab);
    const filas = [['totalYards', 'Yardas totales'], ['netPassingYards', 'Yardas por pase'], ['rushingYards', 'Yardas por tierra'], ['firstDowns', 'Primeros downs'], ['thirdDownEff', 'Tercera oportunidad'], ['turnovers', 'Pérdidas de balón'], ['possessionTime', 'Posesión'], ['totalPenaltiesYards', 'Castigos']].filter(([k]) => sv[k] != null || sl[k] != null);
    const num = x => parseFloat(String(x || '0').replace(':', '.')) || 0;
    const statsHTML = filas.length ? `<div class="card"><h3>Estadísticas del partido</h3><div class="tstats">${filas.map(([k, t]) => { const a = num(sv[k]), b = num(sl[k]), tot = a + b || 1, mejorA = k === 'turnovers' || k === 'totalPenaltiesYards' ? a < b : a > b;
      return `<div class="tsr"><b class="${mejorA ? 'w' : ''}">${esc(sv[k] ?? '–')}</b><span><small>${t}</small><i style="--a:${Math.round(a / tot * 100)}%;--cv:${col(g.visita.ab)[0]};--cl:${col(g.local.ab)[0]}"></i></span><b class="${!mejorA && a !== b ? 'w' : ''}">${esc(sl[k] ?? '–')}</b></div>`; }).join('')}</div></div>` : '';
    const anot = (s.scoringPlays || []).map(p => `<div class="sp">${helmet(AB[p.team && p.team.abbreviation] || (p.team && p.team.abbreviation), '', 26)}<span><small>${p.period && p.period.number ? 'Q' + p.period.number : ''} ${esc((p.clock && p.clock.displayValue) || '')} · ${esc(p.scoringType && p.scoringType.displayName || '')}</small>${esc(p.text || '')}</span><b class="n">${p.awayScore}-${p.homeScore}</b></div>`).join('');
    const lid = g.estado === 'pre' ? [] : (s.leaders || []).flatMap(t => (t.leaders || []).map(c => ({ ab: AB[t.team && t.team.abbreviation] || (t.team && t.team.abbreviation), cat: c.displayName, a: c.leaders && c.leaders[0] }))).filter(x => x.a);
    const CAT = { 'Passing Yards': 'Yardas por pase', 'Rushing Yards': 'Yardas por tierra', 'Receiving Yards': 'Yardas por recepción', Sacks: 'Capturas', Tackles: 'Tacleadas', Interceptions: 'Intercepciones' };
    const lidHTML = lid.length ? `<div class="card span2"><h3>Líderes del partido</h3><p class="sub">Estadísticas de este juego${g.estado === 'in' ? ', en vivo' : ''}.</p><div class="leaders">${lid.map(x => `<div style="${vars(x.ab)}"><small>${esc(CAT[x.cat] || x.cat)} · ${esc(x.ab)}</small><b>${esc(x.a.athlete && x.a.athlete.displayName)}</b><span>${esc(x.a.displayValue || '')}</span></div>`).join('')}</div></div>` : '';
    // Proyecciones del partido por posición (antes del juego), con nuestros números
    const topDe = (ab, pos) => fantasyDe(ab).filter(j => j.pos === pos && !fuera(j)).sort((x, y) => (y.p ?? y.pEst ?? 0) - (x.p ?? x.pEst ?? 0));
    const slots = [['QB', 0], ['RB', 0], ['RB', 1], ['WR', 0], ['WR', 1], ['WR', 2], ['TE', 0], ['K', 0]];
    const pj = j => j ? (j.p ?? j.pEst) : null;
    const filaP = ([pos, i]) => { const a = topDe(g.visita.ab, pos)[i], b = topDe(g.local.ab, pos)[i]; if (!a && !b) return ''; const va = pj(a), vb = pj(b);
      const lado = (j, v, gana, der) => { if (!j) return '<span class="pp-j vacio">–</span>'; const h = helmet(j.team, j.num, 26, der), t = `<span><b><i class="nm-l">${esc(j.n)}</i><i class="nm-s">${esc(apellido(j.n))}</i></b><small>${esc(rw(j) !== '–' ? rw(j) : j.pos)}${estatus(j) !== 'Sano' ? ' · ' + esc(estatus(j)) : ''}</small></span>`, e = `<em>${v != null ? n1(v) : '–'}</em>`;
        return `<a class="pp-j ${der ? 'der' : ''} ${gana ? 'gana' : ''}" href="#/jugador/${j.id}">${der ? e + t + h : h + t + e}</a>`; };
      return `<div class="pp-row">${lado(a, va, va != null && (vb == null || va > vb))}<span class="pp-pos">${pos}${i + 1}</span>${lado(b, vb, vb != null && (va == null || vb > va), true)}</div>`; };
    const sumaP = ab => slots.reduce((t, [pos, i]) => t + (pj(topDe(ab, pos)[i]) || 0), 0);
    const proyHTML = g.estado === 'pre' ? `<div class="card span2 proy-partido"><div class="head"><div><h3>Proyecciones del partido</h3><p class="sub">Proyección fantasy ${FMTS[FMT]} de los titulares de cada equipo, posición por posición.</p></div></div>
      <div class="pp-head" style="--cv:${col(g.visita.ab)[0]};--cl:${col(g.local.ab)[0]}"><span>${helmet(g.visita.ab, '', 30)}<b>${g.visita.ab}</b><em>${n1(sumaP(g.visita.ab))}</em></span><small>PROY. TOTAL</small><span class="der"><em>${n1(sumaP(g.local.ab))}</em><b>${g.local.ab}</b>${helmet(g.local.ab, '', 30, true)}</span></div>
      <div class="pp-list">${slots.map(filaP).join('')}</div></div>` : '';
    // Líneas de apuesta: lo que publica la casa en ESPN; los cálculos implícitos son matemáticos, a partir de esas líneas
    const pc = (s.pickcenter || [])[0], pred = s.predictor;
    const ml = o => o && o.moneyLine != null ? +o.moneyLine : null, mlTxt = v => v == null ? '–' : (v > 0 ? '+' : '') + v;
    const probML = v => v == null ? null : v < 0 ? -v / (-v + 100) * 100 : 100 / (v + 100) * 100;
    const momio = v => v == null || v === '' ? '' : ` <i>(${(+v > 0 ? '+' : '') + v})</i>`;
    let preHTML = '';
    if ((pc || pred) && g.estado === 'pre') {
      const aO = (pc && pc.awayTeamOdds) || {}, hO = (pc && pc.homeTeamOdds) || {}, T = pc && pc.overUnder != null ? +pc.overUnder : null;
      const spr = pc && pc.spread != null ? +pc.spread : null; // negativo = favorito el local
      const favLocal = hO.favorite || (spr != null && spr < 0), favAb = favLocal ? g.local.ab : g.visita.ab, dogAb = favLocal ? g.visita.ab : g.local.ab, s0 = spr != null ? Math.abs(spr) : null;
      const imp = T != null && s0 != null ? { [favAb]: (T + s0) / 2, [dogAb]: (T - s0) / 2 } : null;
      const mA = ml(aO), mH = ml(hO), pA = probML(mA), pH = probML(mH);
      const ps = pc && pc.pointSpread, tt = pc && pc.total;
      const abre = ps && ps.home && ps.home.open && ps.home.open.line != null ? `${g.local.ab} ${ps.home.open.line}` : '';
      const tiles = [
        pc && pc.details ? ['LÍNEA (SPREAD)', `${esc(pc.details)}`, `${esc(g.visita.ab)} ${aO.spreadOdds != null ? mlTxt(+aO.spreadOdds) : ''} · ${esc(g.local.ab)} ${hO.spreadOdds != null ? mlTxt(+hO.spreadOdds) : ''}`.replace(/ · $/, '')] : null,
        mA != null || mH != null ? ['MONEYLINE', `${esc(g.visita.ab)} ${mlTxt(mA)} · ${esc(g.local.ab)} ${mlTxt(mH)}`, 'Ganador del partido'] : null,
        T != null ? ['TOTAL DE PUNTOS', `O/U ${n1(T)}`, `Over${momio(pc.overOdds)} · Under${momio(pc.underOdds)}`] : null,
        imp ? [`PUNTOS IMPLÍCITOS`, `${esc(g.visita.ab)} ${n1(imp[g.visita.ab])} · ${esc(g.local.ab)} ${n1(imp[g.local.ab])}`, 'Calculado con la línea y el total'] : null,
        pA != null && pH != null ? ['PROBABILIDAD POR MOMIO', `${esc(g.visita.ab)} ${n1(pA)}% · ${esc(g.local.ab)} ${n1(pH)}%`, 'Implícita en la moneyline'] : null,
        pred && pred.homeTeam ? ['PROBABILIDAD DE GANAR', `${esc(g.visita.ab)} ${n1(+pred.awayTeam.gameProjection)}% · ${esc(g.local.ab)} ${n1(+pred.homeTeam.gameProjection)}%`, 'Modelo estadístico'] : null,
        abre ? ['LÍNEA DE APERTURA', esc(abre), tt && tt.over && tt.over.open && tt.over.open.line ? `Total abrió en ${esc(String(tt.over.open.line).replace(/^o/i, ''))}` : 'Cómo abrió la semana'] : null
      ].filter(Boolean);
      preHTML = tiles.length ? `<div class="card span2 apuestas"><div class="head"><div><h3>Antes del kickoff</h3><p class="sub">Líneas de las casas de apuestas. Solo informativo.</p></div></div><div class="odds">${tiles.map(([k, v, d]) => `<div><small>${k}</small><b>${v}</b><span>${d}</span></div>`).join('')}</div></div>` : '';
    }
    box.innerHTML = `<section class="block grid g2" style="padding-top:22px">${preHTML}${proyHTML}${statsHTML}${lidHTML}${anot ? `<div class="card"><h3>Jugadas de anotación</h3><div class="splist">${anot}</div></div>` : ''}</section>`;
    if (!box.textContent.trim()) box.innerHTML = '';
  } catch (e) { box.innerHTML = ''; }
}
/* =============================== PARTIDO EN VIVO · SELLO FX =============================== */
// Puntos fantasy calculados con la misma regla de Sleeper que usa todo el sitio: [PPR, Half, STD]
const ptsFx = x => { const base = (x.py || 0) * .04 + (x.ptd || 0) * 4 - (x.int || 0) + (x.ry || 0) * .1 + (x.rtd || 0) * 6 + (x.recy || 0) * .1 + (x.rectd || 0) * 6 - (x.fl || 0) * 2 + (x.kp || 0);
  return [base + (x.rec || 0), base + (x.rec || 0) * .5, base].map(v => Math.round(v * 10) / 10); };
const abrev = n => { const p = String(n || '').replace(/\s+(Jr\.?|Sr\.?|II|III|IV)$/i, '').split(' '); return p.length > 1 ? (p[0][0] + '.' + p.slice(1).join('')).toLowerCase().replace(/[^a-z.]/g, '') : ''; };
function fantasyBox(s, g) {
  const porEspn = {}, porNom = {}; P.forEach(j => { if (j.espn) porEspn[j.espn] = j; porNom[sinAc(j.n).replace(/[^a-z]/g, '')] = j; });
  const M = {};
  ((s.boxscore && s.boxscore.players) || []).forEach(tm => { const ab = AB[tm.team && tm.team.abbreviation] || (tm.team && tm.team.abbreviation);
    (tm.statistics || []).forEach(cat => { const keys = cat.keys || [];
      (cat.athletes || []).forEach(a => { const at = a.athlete || {}, id = String(at.id || at.displayName), v = k => { const i = keys.indexOf(k); return i < 0 ? null : a.stats[i]; }, num = k => parseFloat(v(k)) || 0;
        const r = M[id] = M[id] || { id, n: at.displayName, ab, num: at.jersey, cats: new Set(), x: {} }; r.cats.add(cat.name); const x = r.x;
        if (cat.name === 'passing') { const ca = String(v('completions/passingAttempts') || '0/0').split('/'); x.cmp = +ca[0] || 0; x.att = +ca[1] || 0; x.py = num('passingYards'); x.ptd = num('passingTouchdowns'); x.int = num('interceptions'); }
        if (cat.name === 'rushing') { x.ra = num('rushingAttempts'); x.ry = num('rushingYards'); x.rtd = num('rushingTouchdowns'); }
        if (cat.name === 'receiving') { x.rec = num('receptions'); x.recy = num('receivingYards'); x.rectd = num('receivingTouchdowns'); x.tg = num('receivingTargets'); }
        if (cat.name === 'fumbles') x.fl = num('fumblesLost');
        if (cat.name === 'kicking') { const fg = String(v('fieldGoalsMade/fieldGoalAttempts') || '0/0').split('/'), xp = String(v('extraPointsMade/extraPointAttempts') || '0/0').split('/'); x.fgm = +fg[0] || 0; x.fga = +fg[1] || 0; x.xpm = +xp[0] || 0; x.xpa = +xp[1] || 0; }
      }); }); });
  // pateadores: puntos por distancia de cada gol de campo (de las jugadas de anotación)
  const fgs = (s.scoringPlays || []).map(p => (p.text || '').match(/^(.+?) (\d+) Yd Field Goal/i)).filter(Boolean);
  return Object.values(M).map(r => {
    const j = porEspn[r.id] || porNom[sinAc(r.n).replace(/[^a-z]/g, '')] || null, x = r.x;
    if (r.cats.has('kicking')) { const mias = fgs.filter(m => sinAc(r.n).includes(sinAc(m[1]).split(' ').pop())); x.kp = (mias.length ? mias.reduce((t, m) => t + (+m[2] >= 50 ? 5 : +m[2] >= 40 ? 4 : 3), 0) + Math.max(0, (x.fgm || 0) - mias.length) * 3 : (x.fgm || 0) * 3) + (x.xpm || 0); }
    const pos = j ? j.pos : r.cats.has('kicking') ? 'K' : (x.att || 0) >= 5 ? 'QB' : (x.ra || 0) > (x.rec || 0) ? 'RB' : 'WR';
    return { ...r, j, pos, f: ptsFx(x), proy: j && j.proy ? j.proy : null, ab: r.ab || (j && j.team) };
  }).filter(r => r.f[2] !== 0 || (r.x.att || r.x.ra || r.x.rec || r.x.tg || r.x.fga || r.x.xpa));
}
const lineaStats = r => { const x = r.x, t = [];
  if (x.att) t.push(`${x.cmp}/${x.att}`, `${x.py} YDS P`, ...(x.ptd ? [`${x.ptd} TD`] : []), ...(x.int ? [`${x.int} INT`] : []));
  if (x.ra) t.push(`${x.ra} CAR ${x.ry} YDS`, ...(x.rtd ? [`${x.rtd} TD C`] : []));
  if (x.rec || x.tg) t.push(`${x.rec || 0}/${x.tg || x.rec || 0} REC ${x.recy || 0} YDS`, ...(x.rectd ? [`${x.rectd} TD R`] : []));
  if (x.fga || x.xpa) t.push(`${x.fgm}/${x.fga} FG`, `${x.xpm}/${x.xpa} PAT`);
  if (x.fl) t.push(`${x.fl} FUM`);
  return t.join(' · '); };
const FXPREV = {}, ABIERTOS = new Set();
let FXFILTRO = 'todos', _vivoT = null;
function pintaFantasy(g, s) {
  const box = $('#fxlive'); if (!box) return;
  if (FXFILTRO !== 'todos' && FXFILTRO !== g.visita.ab && FXFILTRO !== g.local.ab) FXFILTRO = 'todos';
  const L = fantasyBox(s, g).sort((a, b) => b.f[FMT] - a.f[FMT]), prev = FXPREV[g.id] || {}, nuevo = {};
  const tot = ab => L.filter(r => r.ab === ab).reduce((t, r) => t + r.f[FMT], 0);
  const fila = (r, i) => { const pts = r.f[FMT], antes = prev[r.id], sube = antes != null && pts > antes + .05, baja = antes != null && pts < antes - .05; nuevo[r.id] = pts;
    const pr = r.proy ? r.proy[FMT] : null, pct = pr ? Math.min(100, Math.round(pts / pr * 100)) : null, supera = pr != null && pts > pr;
    const inner = `<i class="fxr-rk">${i + 1}</i>${helmet(r.ab, r.num || (r.j && r.j.num) || '', 34)}
      <span class="fxr-who"><b>${esc(r.n)}</b><small><em class="pos">${esc(r.pos)}</em> ${esc(r.ab || '')}${r.j && estatus(r.j) !== 'Sano' ? ' · ' + esc(estatus(r.j)) : ''}</small><span class="fxr-st">${esc(lineaStats(r))}</span>
        ${pr != null ? `<span class="fxr-bar ${supera ? 'top' : ''}"><i style="width:${pct}%"></i></span><span class="fxr-pr">${supera ? '<b>Superó su proyección</b> · ' : ''}proy ${n1(pr)}</span>` : ''}</span>
      <span class="fxr-pts"><b class="n">${n1(pts)}</b><small>PTS ${FMTS[FMT]}</small>${sube ? `<em class="fx-delta">+${n1(pts - antes)}</em>` : baja ? `<em class="fx-delta neg">${n1(pts - antes)}</em>` : ''}</span>`;
    const oc = FXFILTRO !== 'todos' && r.ab !== FXFILTRO ? ' hidden' : '';
    return r.j ? `<a class="fxr ${sube ? 'sube' : ''} ${baja ? 'baja' : ''} ${supera ? 'supera' : ''}"${oc} data-eq="${esc(r.ab)}" href="#/jugador/${r.j.id}">${inner}</a>` : `<div class="fxr ${sube ? 'sube' : ''} ${baja ? 'baja' : ''}"${oc} data-eq="${esc(r.ab)}">${inner}</div>`; };
  const filas = L.map(fila).join('');
  FXPREV[g.id] = nuevo;
  const chip = (k, t) => `<button type="button" class="chip ${FXFILTRO === k ? 'on' : ''}" data-fxf="${k}">${t}</button>`;
  box.innerHTML = `<div class="fxl-h"><div><span class="fxl-tag">${fxLogo(18)} FANTASY ${g.estado === 'in' ? 'EN VIVO' : 'FINAL'}</span><h2>¿Quién está sumando?</h2><p class="sub">Puntos ${FMTS[FMT]} con el modelo FX, jugada por jugada${g.estado === 'in' ? ' · se actualiza cada 15 s' : ''}.</p></div>
    <div class="fxl-tot" style="--cv:${col(g.visita.ab)[0]};--cl:${col(g.local.ab)[0]}"><span>${helmet(g.visita.ab, '', 26)}<b>${g.visita.ab}</b><em class="n">${n1(tot(g.visita.ab))}</em></span><small>PTS FX</small><span><em class="n">${n1(tot(g.local.ab))}</em><b>${g.local.ab}</b>${helmet(g.local.ab, '', 26, true)}</span></div></div>
    <div class="chips fxl-f">${chip('todos', 'Todos')}${chip(g.visita.ab, g.visita.ab)}${chip(g.local.ab, g.local.ab)}</div>
    <div class="fxl-list" data-filtro="${esc(FXFILTRO)}">${filas || '<div class="empty">Todavía no hay estadísticas de jugadores.</div>'}</div>`;
}
// Puntos FX que dejó cada jugada (pase, carrera, TD, intercepción), a partir del texto oficial de la jugada
function fxJugada(p, mapa) {
  const t = p.text || '', y = +p.statYardage || 0, tipo = (p.type && p.type.text) || '', td = /touchdown/i.test(tipo) || /TOUCHDOWN/.test(t), out = [];
  const nom = k => mapa[(k || '').toLowerCase().replace(/[^a-z.]/g, '')];
  const m = t.match(/([A-Z][a-zA-Z]{0,2}\.[A-Z][A-Za-z'\-]+)/g) || [];
  const rec = [1, .5, 0][FMT];
  if (/pass/i.test(tipo) && /complete|pass (short|deep)/i.test(t) && !/incomplete/i.test(t) && m.length >= 2 && !/Interception/i.test(tipo)) {
    const qb = nom(m[0]), wr = nom(m[1]);
    if (qb) out.push([qb, y * .04 + (td ? 4 : 0)]); if (wr) out.push([wr, rec + y * .1 + (td ? 6 : 0)]);
  } else if (/rush/i.test(tipo) && m.length) { const rb = nom(m[0]); if (rb) out.push([rb, y * .1 + (td ? 6 : 0)]); }
  else if (/interception/i.test(tipo) && m.length) { const qb = nom(m[0]); if (qb) out.push([qb, -1]); }
  return out.filter(([, v]) => Math.abs(v) >= .05);
}
function pintaJugadas(g, s) {
  const box = $('#pbp'); if (!box) return;
  box.querySelectorAll('details[open]').forEach(d => ABIERTOS.add(d.dataset.id)); box.querySelectorAll('details:not([open])').forEach(d => ABIERTOS.delete(d.dataset.id));
  const mapa = {}; fantasyBox(s, g).forEach(r => { const k = abrev(r.n); if (k) mapa[k] = r.n; });
  const dr = s.drives || {}, prevs = (dr.previous || []).slice().reverse(), cur = dr.current && dr.current.plays && dr.current.plays.length && g.estado === 'in' ? dr.current : null;
  const RES = { TD: 'TOUCHDOWN', FG: 'GOL DE CAMPO', PUNT: 'DESPEJE', INT: 'INTERCEPCIÓN', FUMBLE: 'BALÓN SUELTO', DOWNS: 'EN DOWNS', 'END OF HALF': 'FIN DE MITAD', 'END OF GAME': 'FIN DEL PARTIDO', 'MISSED FG': 'FG FALLADO', SF: 'SAFETY' };
  const jugada = p => { const y = +p.statYardage || 0, tipo = (p.type && p.type.text) || '', anota = p.scoringPlay, chips = fxJugada(p, mapa);
    return `<li class="pl ${anota ? 'anota' : ''}"><span class="pl-t">${p.period && p.period.number ? 'Q' + p.period.number : ''} ${esc((p.clock && p.clock.displayValue) || '')}${p.start && p.start.shortDownDistanceText ? ' · ' + esc(p.start.shortDownDistanceText) : ''}</span>
      ${anota ? `<b class="pl-anota">${esc(tipo.toUpperCase())}</b>` : ''}<p>${esc(p.text || tipo)}</p>
      <span class="pl-f">${y && !/kickoff|punt|penalty|timeout/i.test(tipo) ? `<em class="yd ${y > 0 ? 'pos' : 'neg'}">${y > 0 ? '+' : ''}${y} YDS</em>` : ''}${chips.map(([n, v]) => `<em class="fxc-p ${v < 0 ? 'neg' : ''}">${fxLogo(11)} ${esc(n.split(' ').slice(-1)[0] === 'III' || n.split(' ').slice(-1)[0] === 'Jr.' ? n.split(' ').slice(-2).join(' ') : n.split(' ').slice(-1)[0])} ${v > 0 ? '+' : ''}${n1(v)}</em>`).join('')}</span></li>`; };
  const drive = (d, abierto, actual) => { const ab = AB[d.team && d.team.abbreviation] || (d.team && d.team.abbreviation), res = (d.displayResult || d.result || '').toUpperCase(), plays = (d.plays || []).slice().reverse(), id = String(d.id || ab + d.description);
    const op = actual || ABIERTOS.has(id) || (abierto && !ABIERTOS.size);
    return `<details class="drv ${actual ? 'actual' : ''} ${/TD|TOUCHDOWN/.test(res) ? 'td' : /FG|FIELD/.test(res) ? 'fg' : ''}" data-id="${esc(id)}" ${op ? 'open' : ''}><summary>${helmet(ab, '', 26)}<span><b>${actual ? 'Drive actual · ' : ''}${esc(ab || '')}</b><small>${esc(d.description || '')}</small></span>${res ? `<em>${esc(RES[res] || res)}</em>` : actual ? '<em class="vivo"><i class="dotv"></i>EN JUEGO</em>' : ''}</summary><ol>${plays.map(jugada).join('')}</ol></details>`; };
  const html = (cur ? drive(cur, true, true) : '') + prevs.map((d, i) => drive(d, !cur && i === 0)).join('');
  box.innerHTML = `<div class="pbp-h"><h3>Jugada a jugada</h3>${g.estado === 'in' ? '<span class="vivo"><i class="dotv"></i>EN VIVO</span>' : ''}</div><p class="sub">Cada jugada con los puntos FX que dejó (${FMTS[FMT]}).</p><div class="pbp-list">${html || '<div class="empty">Las jugadas aparecen en cuanto empiece el partido.</div>'}</div>`;
}
function pintaVivo(g, s) {
  pintaFantasy(g, s); pintaJugadas(g, s);
  // probabilidad de ganar en vivo, dentro del marcador
  const wp = (s.winprobability || []).slice(-1)[0];
  WPC[g.id] = wp && g.estado === 'in' ? `<div class="wp ${wp.homeWinPercentage >= .5 ? 'gana-l' : 'gana-v'}" style="--p:${Math.round((1 - wp.homeWinPercentage) * 100)}%"><span><b class="n">${n1((1 - wp.homeWinPercentage) * 100)}%</b></span><i></i><span><b class="n">${n1(wp.homeWinPercentage * 100)}%</b></span><small>Probabilidad de ganar</small></div>` : '';
  const wb = $('#g-wp'); if (wb) wb.innerHTML = WPC[g.id];
  // abajo: estadísticas de equipo, anotaciones y la línea con la que abrió
  const teams = (s.boxscore && s.boxscore.teams) || [];
  const statsDe = ab => { const t = teams.find(x => (AB[x.team.abbreviation] || x.team.abbreviation) === ab); return t ? Object.fromEntries((t.statistics || []).map(x => [x.name, x.displayValue])) : {}; };
  const sv = statsDe(g.visita.ab), sl = statsDe(g.local.ab), num = x => parseFloat(String(x || '0').replace(':', '.')) || 0;
  const filas = [['totalYards', 'Yardas totales'], ['netPassingYards', 'Yardas por pase'], ['rushingYards', 'Yardas por tierra'], ['firstDowns', 'Primeros downs'], ['thirdDownEff', 'Tercera oportunidad'], ['turnovers', 'Pérdidas de balón'], ['possessionTime', 'Posesión'], ['totalPenaltiesYards', 'Castigos']].filter(([k]) => sv[k] != null || sl[k] != null);
  const statsHTML = filas.length ? `<div class="card eqcard"><div class="eq-h"><span>${helmet(g.visita.ab, '', 26)}<b>${g.visita.ab}</b></span><h3>Equipos</h3><span><b>${g.local.ab}</b>${helmet(g.local.ab, '', 26, true)}</span></div><div class="tstats">${filas.map(([k, t]) => { const a = num(sv[k]), b = num(sl[k]), tot = a + b || 1, mejorA = k === 'turnovers' || k === 'totalPenaltiesYards' ? a < b : a > b;
    return `<div class="tsr"><b class="${mejorA ? 'w' : ''}">${esc(sv[k] ?? '–')}</b><span><small>${t}</small><i style="--a:${Math.round(a / tot * 100)}%;--cv:${col(g.visita.ab)[0]};--cl:${col(g.local.ab)[0]}"></i></span><b class="${!mejorA && a !== b ? 'w' : ''}">${esc(sl[k] ?? '–')}</b></div>`; }).join('')}</div></div>` : '';
  const anot = (s.scoringPlays || []).slice().reverse().map(p => `<div class="sp">${helmet(AB[p.team && p.team.abbreviation] || (p.team && p.team.abbreviation), '', 26)}<span><small>${p.period && p.period.number ? 'Q' + p.period.number : ''} ${esc((p.clock && p.clock.displayValue) || '')} · ${esc(p.scoringType && p.scoringType.displayName || '')}</small>${esc(p.text || '')}</span><b class="n">${p.awayScore}-${p.homeScore}</b></div>`).join('');
  const pc = (s.pickcenter || [])[0];
  const linea = pc && (pc.details || pc.overUnder) ? `<div class="card linea-mini"><h3>La línea antes del partido</h3><p>${pc.details ? `<b>${esc(pc.details)}</b>` : ''}${pc.overUnder ? ` · O/U <b>${esc(pc.overUnder)}</b>` : ''}</p></div>` : '';
  const ge = $('#g-eq'); if (ge) ge.innerHTML = statsHTML;
  const gb = $('#gsum'); if (gb) gb.innerHTML = `<section class="block grid g2" style="padding-top:22px">${anot ? `<div class="card"><h3>Anotaciones</h3><div class="splist">${anot}</div></div>` : ''}${linea}</section>`;
}
// Mientras el partido está en vivo, todo se vuelve a pedir solo cada 15 segundos (sin recargar la página)
function vigilaPartido(id) {
  clearTimeout(_vivoT);
  _vivoT = setTimeout(() => {
    if (location.hash.split('?')[0] !== '#/partido/' + id) return;
    const g = G.find(x => x.id === id); if (!g || g.estado === 'pre') return;
    const h = $('#g-hero'); if (h) h.innerHTML = heroPartido(g);
    detallePartido(g).then(() => { if (g.estado === 'in') vigilaPartido(id); });
  }, 15000);
}
function refrescaVista() {
  if (/^#\/lideres/.test(location.hash) && G.some(g => g.estado === 'in')) cargaVivo(semActual());
  if (/^#\/partidos/.test(location.hash)) { app.innerHTML = partidos(new URLSearchParams(location.hash.split('?')[1] || '')); return; }
  const box = $('#home-matches'); if (box) box.innerHTML = homeMatches();
}

/* =============================== MEDICIÓN (Google Analytics) =============================== */
const mide = (ev, datos = {}) => { try { if (window.gtag) window.gtag('event', ev, datos); } catch (e) {} };
let _ultimaVista = '';
function vista(ruta) {
  const url = location.origin + '/' + ruta.replace(/^\/+/, '');
  if (url === _ultimaVista) return; _ultimaVista = url;
  mide('page_view', { page_location: url, page_title: document.title });
}

/* =============================== CUENTAS (Supabase) =============================== */
const SB_URL = 'https://eafzqftobwrtqdnawncn.supabase.co', SB_KEY = 'sb_publishable_T9r9COQ5f9h1QKa9rqaUyA_hWXOYUqc';
const SB_LLAVE = 'sb-eafzqftobwrtqdnawncn-auth-token';
let SB = null, YO = null, PERFIL = null, FAV = new Set(), _sbCarga = null, MODO = 'entrar', RECUPERA = false;
const baseURL = () => location.origin + location.pathname.replace(/(jugador|noticia|equipo)\/.*$/, '');
const ERR = m => /invalid login/i.test(m) ? 'Correo o contraseña incorrectos.' : /already registered|already been registered/i.test(m) ? 'Ese correo ya tiene cuenta. Entra con tu contraseña.' : /at least|weak|short/i.test(m) ? 'La contraseña es muy corta: usa mínimo 8 caracteres.' : /not confirmed/i.test(m) ? 'Primero confirma tu correo con el enlace que te mandamos.' : /rate|limit|security purposes/i.test(m) ? 'Demasiados intentos. Espera unos minutos.' : /provider is not enabled/i.test(m) ? 'El acceso con Google se activa muy pronto. Por ahora usa tu correo.' : 'No se pudo completar. Intenta de nuevo.';
const ls = (k, v) => { try { if (v === undefined) return localStorage.getItem(k); if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) { return null; } };
const cargaSB = () => _sbCarga || (_sbCarga = new Promise((ok, no) => {
  const s = document.createElement('script'); s.src = 'assets/vendor/supabase-2.117.2.js';
  s.onload = () => {
    SB = window.supabase.createClient(SB_URL, SB_KEY, { auth: { flowType: 'pkce', detectSessionInUrl: true, persistSession: true } });
    SB.auth.onAuthStateChange((ev, ses) => { if (ev === 'PASSWORD_RECOVERY') { RECUPERA = true; if (!/^#\/cuenta/.test(location.hash)) location.hash = '#/cuenta'; } const antes = YO && YO.id; YO = ses ? ses.user : null; pintaCuentaBtn(); if ((YO && YO.id) !== antes) setTimeout(cargaPerfil, 0); });
    ok(SB);
  };
  s.onerror = () => { _sbCarga = null; no(new Error('sin conexión')); };
  document.head.appendChild(s);
}));
async function cargaPerfil() {
  if (!YO) { PERFIL = null; FAV = new Set(); repinta(); return; }
  let p = {}, f = {};
  try { [p, f] = await Promise.all([SB.from('perfiles').select('*').eq('id', YO.id).maybeSingle(), SB.from('favoritos').select('jugador')]); } catch (e) { console.warn('Perfil no disponible', e); }
  PERFIL = p.data || { nombre: (YO.email || '').split('@')[0] };
  try { restauraLiga(); } catch (e) {}
  FAV = new Set((f.data || []).map(x => x.jugador));
  const pend = ls('fx-sigue'); if (pend && J[pend] && !FAV.has(pend)) { ls('fx-sigue', null); await SB.from('favoritos').insert({ jugador: pend }); FAV.add(pend); }
  if (/[?&]code=/.test(location.search)) history.replaceState(null, '', location.pathname + (location.hash || '#/cuenta'));
  pintaCuentaBtn(); repinta();
}
const repinta = () => { if (!D) return; const y = scrollY; router(); scrollTo(0, y); };
const ICONO_CUENTA = `<svg width="16" height="16" viewBox="0 0 8 8" shape-rendering="crispEdges" aria-hidden="true"><rect x="2" y="0" width="4" height="4" fill="currentColor"/><rect x="1" y="5" width="6" height="3" fill="currentColor"/></svg>`;
function pintaPieNews() {
  const el = $('#pie-news'); if (!el) return;
  const txt = `<div><h3>${fxLogo(26)} El resumen FX, cada semana</h3><p>Start/Sit, waivers y lo que tienes que saber antes del domingo. Directo a tu correo.</p></div>`;
  el.innerHTML = `<div class="newsbox">${txt}${!YO ? `<div class="nb-cta"><a class="btn" href="#/cuenta" data-reg>Crear mi cuenta gratis</a><small>Tu cuenta incluye el resumen semanal y tus jugadores favoritos.</small></div>`
    : PERFIL && PERFIL.newsletter === false ? `<div class="nb-cta"><a class="btn ghost" href="#/cuenta">Activar el resumen en mi cuenta</a></div>`
    : `<div class="nb-cta"><b class="nb-ok">✓ Estás suscrito</b><small>Te llega a ${esc(YO.email || '')}. <a href="#/cuenta">Administrar</a></small></div>`}</div>`;
}
function pintaCuentaBtn() { pintaPieNews();
  const b = $('#btn-cuenta'); if (!b) return;
  const ini = YO ? String((PERFIL && PERFIL.nombre) || YO.email || '?').trim().charAt(0).toUpperCase() : '';
  b.classList.toggle('in', !!YO); b.title = YO ? tx('Mi cuenta', 'My account') : tx('Entrar', 'Sign in');
  b.innerHTML = YO ? `<i>${esc(ini)}</i>` : `${ICONO_CUENTA}<span>${tx('ENTRAR', 'SIGN IN')}</span>`;
}
async function toggleFav(id, btn) {
  if (!YO) { ls('fx-sigue', id); location.hash = '#/cuenta'; return; }
  const sigue = FAV.has(id);
  const r = sigue ? await SB.from('favoritos').delete().eq('jugador', id) : await SB.from('favoritos').insert({ jugador: id });
  if (r.error) return;
  sigue ? FAV.delete(id) : FAV.add(id);
  if (btn) { btn.classList.toggle('on', !sigue); btn.textContent = !sigue ? '★ Siguiendo' : '☆ Seguir'; }
}
const botonSeguir = id => `<button type="button" class="btn ghost seguir ${FAV.has(id) ? 'on' : ''}" data-id="${id}">${FAV.has(id) ? '★ Siguiendo' : '☆ Seguir'}</button>`;
const panelMios = () => {
  const L = [...FAV].map(id => J[id]).filter(Boolean).sort((a, b) => b.pEst - a.pEst).slice(0, 8);
  return L.length ? `<div class="panel mios"><div class="panel-h"><b>★ Mis jugadores</b><a href="#/cuenta">Editar ›</a></div>${L.map(j => `<a class="ml" href="#/jugador/${j.id}">${helmet(j.team, j.num, 28)}<span class="ml-n"><b>${esc(j.n)}</b><small>${esc(j.pos)} · ${rivalTxt(j.team)} · ${n1(j.p ?? j.pEst)} pts</small></span>${fxPill(j)}</a>`).join('')}</div>` : '';
};
function cuenta(q = new URLSearchParams()) {
  titulo('Mi cuenta');
  if (!SB) { cargaSB().then(() => SB.auth.getSession()).then(() => { if (/^#\/cuenta/.test(location.hash)) repinta(); }).catch(() => { const a = $('#app'); if (a) a.innerHTML = '<div class="wrap empty">No pudimos conectar. Intenta de nuevo en un momento.</div>'; }); return cargador('CONECTANDO'); }
  if (RECUPERA && YO) return `<div class="page">${crumbs([['', 'Nueva contraseña']])}<div class="wrap"><section class="auth card">
    <div class="auth-h">${fxLogo(44)}<h1>Nueva contraseña</h1></div>
    <form id="f-nueva" class="fform"><label>Escribe tu nueva contraseña<input type="password" name="pass" required minlength="8" autocomplete="new-password" placeholder="Mínimo 8 caracteres"></label><button class="btn" type="submit">Guardar contraseña</button><small class="msg"></small></form>
  </section></div></div>`;
  if (!YO) { const reg = MODO === 'registro';
    return `<div class="page">${crumbs([['', reg ? 'Crear cuenta' : 'Entrar']])}<div class="wrap"><section class="auth card">
    <div class="auth-h">${fxLogo(44)}<h1>${reg ? 'Crea tu cuenta FX' : 'Entra a tu cuenta'}</h1></div>
    <p>Sigue a tus jugadores, arma tu portada con ellos y recibe el resumen semanal. Es gratis.</p>
    <button type="button" class="btn-google" id="g-login"><svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>Continuar con Google</button>
    <p class="legal">Al continuar con Google se crea tu cuenta, aceptas el <a href="#/privacidad">Aviso de privacidad</a> y recibes el resumen semanal (te das de baja desde tu cuenta cuando quieras).</p>
    <div class="o-sep"><span>o con tu correo</span></div>
    <form id="f-login" class="fform" data-modo="${reg ? 'registro' : 'entrar'}">
      ${reg ? '<label>Tu nombre<input name="nombre" maxlength="40" autocomplete="name" placeholder="¿Cómo te llamamos?"></label>' : ''}
      <label>Correo<input type="email" name="email" required placeholder="tu@correo.com" autocomplete="email"></label>
      <label>Contraseña<input type="password" name="pass" required minlength="8" autocomplete="${reg ? 'new-password' : 'current-password'}" placeholder="${reg ? 'Mínimo 8 caracteres' : 'Tu contraseña'}"></label>
      ${reg ? '<label class="chk"><input type="checkbox" name="news" checked> <span>Quiero recibir el resumen semanal de Fantasy Expertos. Me doy de baja cuando quiera.</span></label><p class="legal">Al crear tu cuenta aceptas el <a href="#/privacidad">Aviso de privacidad</a>.</p>' : ''}
      <button class="btn" type="submit">${reg ? 'Crear cuenta' : 'Entrar'}</button><small class="msg"></small>
    </form>
    <p class="auth-alt">${reg ? '¿Ya tienes cuenta? <button type="button" class="lnk" data-modo="entrar">Entra aquí</button>' : '¿Nuevo en FX? <button type="button" class="lnk" data-modo="registro">Crea tu cuenta gratis</button> · <button type="button" class="lnk" id="olvide">Olvidé mi contraseña</button>'}</p>
  </section></div></div>`; }
  const favs = [...FAV].map(id => J[id]).filter(Boolean).sort((a, b) => b.pEst - a.pEst);
  if (q.get('pago') && !esPremium()) esperaPago();
  const hasta = PERFIL && PERFIL.premium_hasta ? new Date(PERFIL.premium_hasta).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' }) : '';
  const tPrem = esPremium() ? `<div class="card prem-card"><h3>★ Premium FX</h3><p>${PERFIL.premium_tipo === 'temporada' ? 'Pase de temporada' : 'Suscripción mensual'}${hasta ? (PERFIL.premium_tipo === 'temporada' ? ' · válido hasta el ' : ' · próxima renovación: ') + hasta : ''}</p><p><a class="btn sm" href="#/premium">Leer el Exclusivo</a>${PAGO.portal && PERFIL.premium_tipo !== 'temporada' ? ` <a class="btn ghost sm" href="${PAGO.portal}" target="_blank" rel="noopener">Administrar o cancelar</a>` : ''}</p></div>`
    : q.get('pago') ? `<div class="card prem-card"><h3>★ Activando tu Premium…</h3><p class="px blink" style="color:var(--gold)">CONFIRMANDO PAGO</p><p class="sub">Tarda unos segundos.</p></div>`
    : `<div class="card prem-card"><h3>★ Hazte Premium</h3><p class="sub">Desbloquea todas las notas exclusivas de nuestra red de reporteros.</p>${(PAGO.mes || PAGO.temporada) ? planes() : '<small class="muro-pie">Las suscripciones abren en unos días.</small>'}</div>`;
  return `<div class="page">${crumbs([['', 'Mi cuenta']])}<div class="wrap narrowish"><section class="block">
    <div class="head"><div><h2>Hola, ${esc((PERFIL && PERFIL.nombre) || '')}</h2><p class="hsub">${esc(YO.email || '')}</p></div><button class="btn ghost sm" type="button" id="salir">Cerrar sesión</button></div>
    ${tPrem}
    <div class="grid g2" style="margin-top:20px">
      <div class="card"><h3>★ Mis jugadores</h3>${favs.length ? `<div class="plist">${favs.map(j => prow(j, `<em class="n">${n1(j.p ?? j.pEst)}</em>${fxPill(j)}`)).join('')}</div>` : '<p class="sub">Aún no sigues a nadie. Entra a la ficha de un jugador y toca ☆ Seguir: aparecerán aquí y en tu portada.</p>'}</div>
      <div class="card"><h3>Tu perfil</h3><form id="f-perfil" class="fform"><label>Nombre<input name="nombre" maxlength="40" value="${esc((PERFIL && PERFIL.nombre) || '')}"></label><label class="chk"><input type="checkbox" name="news" ${PERFIL && PERFIL.newsletter === false ? '' : 'checked'}> <span>Recibir el resumen semanal por correo</span></label><button class="btn sm" type="submit">Guardar</button><small class="msg"></small></form>
        <div class="zona-borrar"><button type="button" class="lnk peligro" id="borrar">Eliminar mi cuenta</button><small>Borra tu cuenta, tus jugadores y tu suscripción. No se puede deshacer.</small></div></div>
    </div></section></div></div>`;
}

/* ---------- Premium FX (Stripe) ---------- */
const PAGO = { mes: 'https://buy.stripe.com/test_5kQ9AS8v731a0Recsua7C00', temporada: 'https://buy.stripe.com/test_dRm9AScLn6dmdE0502a7C01', portal: 'https://billing.stripe.com/p/login/test_5kQ9AS8v731a0Recsua7C00' }; // enlaces de pago de Stripe
// Los enlaces de prueba (test_) solo se muestran a quien abrió el sitio con ?pruebas=1 (José, mientras probamos).
try { if (/[?&]pruebas=1/.test(location.search + location.hash)) localStorage.setItem('fx-pruebas', '1'); if (/[?&]pruebas=0/.test(location.search + location.hash)) localStorage.removeItem('fx-pruebas'); } catch (e) {}
if (Object.values(PAGO).some(u => /\/test_/.test(u)) && ls('fx-pruebas') !== '1') { PAGO.mes = ''; PAGO.temporada = ''; PAGO.portal = ''; }
const esPremium = () => !!(PERFIL && PERFIL.premium && (!PERFIL.premium_hasta || Date.parse(PERFIL.premium_hasta) > Date.now())) || (location.hostname === 'localhost' && (() => { try { return localStorage.getItem('fx-test-pro') === '1'; } catch (e) { return false; } })());
const BOVEDA = {};
function cargaBoveda(id) {
  if (BOVEDA[id] !== undefined || !SB) return; BOVEDA[id] = null;
  SB.from('exclusivos').select('nota').eq('id', id).maybeSingle().then(({ data }) => { if (data && data.nota) { BOVEDA[id] = data.nota; if (location.hash.includes(id)) repinta(); } else delete BOVEDA[id]; });
}
const linkPago = k => PAGO[k] && YO ? PAGO[k] + (PAGO[k].includes('?') ? '&' : '?') + 'client_reference_id=' + encodeURIComponent(YO.id) + (YO.email ? '&prefilled_email=' + encodeURIComponent(YO.email) : '') : '';
const planes = () => `<div class="planes">${PAGO.mes ? `<a class="plan" href="${linkPago('mes')}"><b>$59</b><span>MXN al mes</span><small>Cancela cuando quieras</small></a>` : ''}${PAGO.temporada ? `<a class="plan top" href="${linkPago('temporada')}"><i>MEJOR PRECIO</i><b>$199</b><span>MXN toda la temporada</span><small>Pago único, hasta el Super Bowl</small></a>` : ''}</div><small class="muro-pie">Pago seguro con Stripe: tarjeta, Apple Pay o Google Pay.</small>`;
// Vista previa bloqueada: muestra la estructura real de la nota (secciones) con renglones difuminados, nunca texto inventado
const previaPremium = () => `<div class="previa"><div class="previa-in" aria-hidden="true">${['Qué pasó', 'Impacto en fantasy', 'Qué cambia para el equipo'].map((t, k) => `<section class="nsec ${k === 1 ? 'fx' : ''}"><h3>${t}</h3><p class="ph"><i></i><i></i><i></i>${k ? '' : '<i></i>'}</p></section>`).join('')}<div class="accion">${fxLogo(30)}<div><small>QUÉ HACER HOY</small><p class="ph"><i></i><i></i></p></div></div></div>${muroPremium()}</div>`;
const BENEF = [['Notas de nuestra red de reporteros', 'Información que no vas a encontrar en otro lado.'], ['Trade targets y la previa de cada semana', 'A quién comprar, vender y arrancar antes que tu liga.'], ['Qué hacer hoy, nota por nota', 'Cada exclusiva termina con una acción concreta para tu equipo.'], ['El consejo completo de los expertos', 'En cada nota: el análisis entero, no solo el adelanto.'], ['La lectura del modelo FX', 'Proyección, rango, piso y techo y volumen de cada jugador.'], ['Start/Sit y trades a fondo', 'Todas las razones del veredicto y el valor de cada jugador en tus trades.']];
function muroPremium() {
  const btns = !YO ? `<a class="btn" href="#/cuenta" data-reg>Crea tu cuenta para suscribirte</a><small class="muro-pie">¿Ya tienes cuenta? <a href="#/cuenta">Entra aquí</a></small>`
    : (PAGO.mes || PAGO.temporada) ? planes() : `<small class="muro-pie">Las suscripciones abren en unos días.</small>`;
  return `<div class="muro"><div class="muro-h">${fxLogo(34)}<div><b>★ PREMIUM FX</b><h3>Sigue leyendo con Premium</h3></div></div><ul class="benef">${BENEF.map(([a, b]) => `<li><b>${a}</b><span>${b}</span></li>`).join('')}</ul>${btns}</div>`;
}
let _poll = 0;
function esperaPago() {
  if (_poll || !SB) return; _poll = 1; let k = 0;
  const t = setInterval(async () => { k++; if (YO) { const { data } = await SB.from('perfiles').select('*').eq('id', YO.id).maybeSingle(); if (data) PERFIL = data; }
    if (esPremium()) mide('purchase', { currency: 'MXN', value: PERFIL.premium_tipo === 'temporada' ? 199 : 59, items: [{ item_id: 'premium-' + (PERFIL.premium_tipo || 'mensual'), item_name: 'Premium FX ' + (PERFIL.premium_tipo || 'mensual') }] });
    if (esPremium() || k > 12) { clearInterval(t); _poll = 0; history.replaceState(null, '', location.pathname + '#/cuenta'); repinta(); } }, 3000);
}

function privacidad() {
  titulo('Aviso de privacidad');
  return `<div class="page">${crumbs([['', 'Aviso de privacidad']])}<div class="wrap narrowish"><article class="card legaltxt">
    <h1>Aviso de privacidad</h1><p class="sub">Última actualización: 20 de octubre de 2026</p>
    <h2>Quién es responsable</h2><p>Fantasy Expertos es responsable del tratamiento de los datos que nos das al crear tu cuenta en este sitio.</p>
    <h2>Qué datos usamos</h2><p>Tu correo electrónico, el nombre que elijas, los jugadores que sigues y, si entras con Google, el nombre y correo de tu cuenta de Google. No pedimos datos sensibles.</p>
    <h2>Estadísticas de visitas</h2><p>Usamos Google Analytics para saber cuántas personas visitan el sitio y qué secciones leen. Google puede usar cookies para esto; no lo usamos para identificarte personalmente.</p>
    <h2>Pagos de Premium</h2><p>Los pagos los procesa Stripe. Nosotros nunca vemos ni guardamos los datos de tu tarjeta; solo guardamos tu tipo de plan, su vigencia y el identificador de cliente que Stripe nos da para activar o cancelar tu acceso.</p>
    <h2>Para qué los usamos</h2><p>Para darte acceso a tu cuenta, guardar tus jugadores favoritos, mandarte el resumen semanal de fantasy (si lo tienes activado) y revisar los reportes de error que envías. No vendemos ni compartimos tus datos con terceros para su publicidad.</p>
    <h2>Dónde se guardan</h2><p>En Supabase, el proveedor de base de datos y acceso de este sitio, con acceso restringido: cada usuario solo puede ver y cambiar su propia información.</p>
    <h2>Tus derechos</h2><p>Puedes ver y cambiar tus datos, darte de baja del resumen semanal o borrar tu cuenta en cualquier momento desde <a href="#/cuenta">Mi cuenta</a>. Para cualquier otra solicitud de acceso, rectificación, cancelación u oposición, escríbenos por mensaje directo a <a href="https://www.instagram.com/fantasy.expertos" target="_blank" rel="noopener">@fantasy.expertos</a>.</p>
    <h2>Cambios</h2><p>Si este aviso cambia, lo publicaremos en esta misma página con su nueva fecha.</p>
  </article></div></div>`;
}

function baja(q) {
  titulo('Darme de baja');
  const t = q.get('t') || '';
  setTimeout(() => { const el = $('#baja-res'); if (!el) return;
    if (!/^[0-9a-f-]{36}$/i.test(t)) { el.className = ''; el.textContent = 'El enlace no es válido. Puedes darte de baja desde Mi cuenta.'; return; }
    cargaSB().then(sb => sb.rpc('darse_de_baja', { token: t })).then(({ data, error }) => { el.className = ''; el.style.color = ''; el.innerHTML = error ? 'No pudimos procesarlo. Intenta de nuevo en un momento.' : data ? '✓ Listo: ya no recibirás el resumen semanal. Tu cuenta y tus jugadores siguen igual; puedes reactivarlo cuando quieras en <a href="#/cuenta">Mi cuenta</a>.' : 'Ese enlace ya no es válido. Revisa tu suscripción en <a href="#/cuenta">Mi cuenta</a>.'; })
      .catch(() => { el.textContent = 'Sin conexión. Intenta de nuevo.'; }); }, 0);
  return `<div class="page">${crumbs([['', 'Darme de baja']])}<div class="wrap"><section class="auth card"><div class="auth-h">${fxLogo(44)}<h1>Resumen semanal</h1></div><p id="baja-res" class="px blink" style="color:var(--accent)">PROCESANDO…</p></section></div></div>`;
}

/* =============================== HERRAMIENTAS =============================== */
const SEM_FIN = 17, REEMPLAZO = { QB: 14, RB: 32, WR: 40, TE: 14, K: 14, DEF: 14 };
const ppj = j => { const jug = (j.temp || []).filter(v => v != null); if (!jug.length) return j.p ?? 0; const u3 = jug.slice(-3), r = u3.reduce((a, b) => a + b, 0) / u3.length; return .5 * j.prom + .3 * r + .2 * (j.p ?? j.prom); };
let _rep = {};
const nivelRep = pos => { const k = pos + FMT; if (_rep[k] == null) { const L = P.filter(j => j.pos === pos && j.team !== 'FA' && (j.temp || []).filter(v => v != null).length >= 2).map(ppj).sort((a, b) => b - a); _rep[k] = L[(REEMPLAZO[pos] || 14) - 1] || 0; } return _rep[k]; };
function valorROS(j) {
  let juegos = 0; if (j.team !== 'FA') for (let w = semActual(); w <= SEM_FIN; w++) if (rivalDe(j.team, w)) juegos++;
  if (j.inj === 'Out' || j.inj === 'Doubtful') juegos = Math.max(0, juegos - 1);
  const f = fueraTemp(j) ? .25 : estatus(j) === 'Duda' ? .95 : 1, p = ppj(j);
  return { ppj: p, juegos, valor: (Math.max(0, p - nivelRep(j.pos)) + p * .08) * juegos * f };
}
function herramientas() {
  titulo('Herramientas de fantasy');
  const t = (h, ico, n, d) => `<a class="tool card" href="${h}"><span class="tool-i">${ico}</span><b>${n}</b><p>${d}</p><span class="all">Abrir ›</span></a>`;
  return `<div class="page">${crumbs([['', 'Herramientas']])}<div class="wrap"><section class="block">
    <div class="head"><div><h2>Herramientas FX</h2><p class="hsub">Decide con datos: trades y start/sit de cada semana. Todo en ${FMTS[FMT]} (cámbialo arriba).</p></div></div>
    <div class="grid g3">${t('#/trade', '⇄', 'Analizador de trades', 'Agrega lo que das y lo que recibes. Te decimos si te conviene, con el valor de cada jugador para el resto de la temporada.')}
      ${t('#/posicion/QB', '★', 'Start / Sit de la semana', 'Rankings por proyección con veredicto START, FLEX o SIT y dificultad del rival.')}</div>
  </section></div></div>`;
}
let TR = { da: [], recibe: [] };
function trade(q) {
  titulo('Analizador de trades');
  TR = { da: (q.get('da') || '').split(',').filter(id => J[id]), recibe: (q.get('recibe') || '').split(',').filter(id => J[id]) };
  const lado = (k, t) => `<div class="card tr-lado"><h3>${t}</h3><div class="tr-lista" id="tr-${k}">${listaTrade(k)}</div><form class="tr-add" data-k="${k}" autocomplete="off"><input list="fx-todos" name="j" placeholder="Agregar jugador…" aria-label="Agregar jugador a ${t}"><button class="btn sm" type="submit">+</button></form></div>`;
  return `<div class="page">${crumbs([['#/herramientas', 'Herramientas'], ['', 'Analizador de trades']])}<div class="wrap narrowish"><section class="block">
    <div class="head"><div><h2>Analizador de trades</h2><p class="hsub">Valor de cada jugador para lo que resta de la temporada regular (hasta la semana ${SEM_FIN}) en ${FMTS[FMT]}.</p></div></div>
    <div class="tr-grid">${lado('da', 'TÚ DAS')}${lado('recibe', 'TÚ RECIBES')}</div>
    <div id="tr-res">${resTrade()}</div>
    <datalist id="fx-todos">${P.slice().sort((a, b) => b.pEst - a.pEst).map(j => `<option value="${esc(j.n)}">${esc(j.pos + ' · ' + j.team)}</option>`).join('')}</datalist>
  </section></div></div>`;
}
const listaTrade = k => TR[k].length ? TR[k].map(id => { const j = J[id], v = valorROS(j);
  return `<div class="tr-j" style="${vars(j.team)}">${helmet(j.team, j.num, 30)}<a class="tr-n" href="#/jugador/${j.id}"><b>${esc(j.n)}</b><small>${esc(j.pos)} · ${esc(j.team)} · ${n1(v.ppj)} pts/juego · ${v.juegos} juegos${estatus(j) !== 'Sano' ? ' · ' + estatus(j).toUpperCase() : ''}</small></a><em class="n">${Math.round(v.valor)}</em><button type="button" class="tr-x" data-k="${k}" data-id="${id}" aria-label="Quitar a ${esc(j.n)}">×</button></div>`; }).join('') : '<p class="sub">Sin jugadores todavía.</p>';
function resTrade() {
  if (!TR.da.length || !TR.recibe.length) return `<div class="verdict show"><b>${fxLogo(20)} ARMA EL TRADE</b><p>Agrega al menos un jugador de cada lado.</p></div>`;
  const a = TR.da.reduce((s, id) => s + valorROS(J[id]).valor, 0), b = TR.recibe.reduce((s, id) => s + valorROS(J[id]).valor, 0);
  const m = Math.max(a, b, 1), dif = (b - a) / m;
  const v = dif > .12 ? ['ACEPTA', 'Recibes más valor del que entregas.'] : dif < -.12 ? ['RECHAZA', 'Entregas más valor del que recibes.'] : ['PAREJO', 'El valor es similar: decide según la posición que más necesitas.'];
  const extra = [];
  if (TR.recibe.length > TR.da.length) extra.push(`Recibes ${TR.recibe.length} por ${TR.da.length}: tendrás que soltar a ${TR.recibe.length - TR.da.length} de tu banca.`);
  if (TR.da.length > TR.recibe.length) extra.push(`Das ${TR.da.length} por ${TR.recibe.length}: consolidas y liberas lugar para waivers.`);
  [...TR.da, ...TR.recibe].map(id => J[id]).filter(j => estatus(j) !== 'Sano').forEach(j => extra.push(`${j.n} está ${fueraTemp(j) ? 'en reserva de lesionados' : estatus(j).toLowerCase()}; ya está descontado en su valor.`));
  return `<div class="card tr-res"><div class="tr-bars"><div><small>TÚ DAS</small><span><i style="width:${(a / m * 100).toFixed(1)}%"></i></span><b class="n">${Math.round(a)}</b></div><div class="r"><small>TÚ RECIBES</small><span><i style="width:${(b / m * 100).toFixed(1)}%"></i></span><b class="n">${Math.round(b)}</b></div></div>
    <div class="verdict show tv-${v[0]}"><b>${fxLogo(20)} ${v[0]}</b><p>${esc(v[1] + ' ' + extra.join(' '))}</p></div>
    ${zonaPrem(`<div class="tr-det"><b>${tx('Valor de cada jugador, resto de temporada', 'Rest-of-season value per player')}</b>${[...TR.da.map(id => [id, '−']), ...TR.recibe.map(id => [id, '+'])].map(([id, sg]) => { const j = J[id], x = valorROS(j); return `<div class="tr-dl"><span>${sg} ${esc(j.n)}</span><em>${n1(x.ppj)} pts/${tx('juego', 'game')} · ${x.juegos} ${tx('juegos', 'games')}</em><b class="n">${Math.round(x.valor)}</b></div>`; }).join('')}${lecturaFX(J[TR.recibe[0]])}</div>`, tx('El valor de cada jugador y la lectura del modelo FX del que recibes', 'Each player\'s value and the FX model read on who you receive'))}
    <p class="sub" style="margin-top:12px">Valor = lo que aporta por encima de un jugador que encontrarías en waivers, en los juegos que le quedan. Combina su promedio, sus últimas 3 semanas, la proyección de esta semana y su estatus médico.</p></div>`;
}
const pintaTrade = () => { ['da', 'recibe'].forEach(k => { const el = $('#tr-' + k); if (el) el.innerHTML = listaTrade(k); }); const r = $('#tr-res'); if (r) r.innerHTML = resTrade(); history.replaceState(null, '', `${location.pathname}${location.search}#/trade?da=${TR.da.join(',')}&recibe=${TR.recibe.join(',')}`); };

/* ---------- formularios y botones (delegados) ---------- */
document.addEventListener('submit', async e => {
  const f = e.target; if (!f.id && !f.classList.contains('tr-add')) return;
  const msg = t => { const m = $('.msg', f); if (m) m.textContent = t; };
  if (f.id === 'f-login') { e.preventDefault(); const sb = await cargaSB(), email = f.email.value.trim(), password = f.pass.value, reg = f.dataset.modo === 'registro';
    msg(reg ? 'Creando tu cuenta…' : 'Entrando…');
    if (reg) { const nombre = (f.nombre.value || '').trim().slice(0, 40);
      const { data, error } = await sb.auth.signUp({ email, password, options: { data: { full_name: nombre || email.split('@')[0], newsletter: !!(f.news && f.news.checked) }, emailRedirectTo: baseURL() } });
      if (error) return msg(ERR(error.message));
      mide('sign_up', { method: 'email' });
      if (!data.session) return msg('✓ Cuenta creada. Te mandamos un correo para confirmarla; ábrelo y luego entra con tu contraseña.');
    } else { const { error } = await sb.auth.signInWithPassword({ email, password }); if (error) return msg(ERR(error.message)); mide('login', { method: 'email' }); }
    msg('✓ ¡Bienvenido!'); }
  else if (f.id === 'f-nueva') { e.preventDefault(); const { error } = await SB.auth.updateUser({ password: f.pass.value }); if (error) return msg(ERR(error.message)); RECUPERA = false; msg('✓ Contraseña guardada.'); setTimeout(repinta, 900); }
  else if (f.id === 'f-perfil') { e.preventDefault(); const d = { nombre: f.nombre.value.trim().slice(0, 40), newsletter: f.news.checked };
    const { error } = await SB.from('perfiles').update(d).eq('id', YO.id); if (!error) { PERFIL = { ...PERFIL, ...d }; pintaCuentaBtn(); } msg(error ? 'No se pudo guardar.' : '✓ Guardado'); }
  else if (f.id === 'f-news') { e.preventDefault(); const email = f.email.value.trim().toLowerCase(); msg('Guardando…');
    try { const { error } = await (await cargaSB()).from('suscriptores').insert({ email, fuente: 'sitio' }); msg(!error || error.code === '23505' ? '✓ ¡Listo! Te llegará el resumen de cada semana.' : 'Revisa tu correo e intenta de nuevo.'); if (!error) f.reset(); } catch (er) { msg('Sin conexión. Intenta de nuevo.'); } }
  else if (f.id === 'f-reporte') { e.preventDefault(); const t = f.m.value.trim(); if (!t) return; msg('Enviando…');
    try { const { error } = await (await cargaSB()).from('reportes').insert({ nota: f.dataset.nota, mensaje: t.slice(0, 900), user_id: YO ? YO.id : null }); msg(error ? 'No se pudo enviar.' : '✓ Gracias. Lo revisamos.'); if (!error) f.reset(); } catch (er) { msg('Sin conexión. Intenta de nuevo.'); } }
  else if (f.classList.contains('tr-add')) { e.preventDefault(); const v = f.j.value.trim().toLowerCase(); if (!v) return;
    const j = P.find(x => x.n.toLowerCase() === v) || P.filter(x => x.n.toLowerCase().includes(v)).sort((a, b) => b.pEst - a.pEst)[0];
    if (j && !TR.da.includes(j.id) && !TR.recibe.includes(j.id)) { TR[f.dataset.k].push(j.id); pintaTrade(); }
    f.reset(); const i = $(`.tr-add[data-k="${f.dataset.k}"] input`); if (i) i.focus(); }
});
document.addEventListener('click', e => {
  const x = e.target.closest('.tr-x, .seguir, #salir, [data-fmt], #g-login, #olvide, .lnk[data-modo], #borrar, [data-reg], .plan'); if (!x) return;
  if (x.classList.contains('plan')) { mide('begin_checkout', { currency: 'MXN', value: x.classList.contains('top') ? 199 : 59 }); return; }
  if (x.hasAttribute('data-reg')) { MODO = 'registro'; return; }
  if (x.id === 'borrar') { if (!x.dataset.ok) { x.dataset.ok = 1; x.textContent = 'Toca otra vez para confirmar: se borra todo'; return; }
    x.textContent = 'Borrando…'; SB.rpc('eliminar_mi_cuenta').then(({ error }) => { if (error) { x.textContent = 'No se pudo borrar. Intenta de nuevo.'; delete x.dataset.ok; return; } SB.auth.signOut().finally(() => { location.hash = '#/'; }); }); return; }
  if (x.id === 'g-login') { mide('login', { method: 'google' }); cargaSB().then(sb => sb.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: baseURL() } })).then(r => { if (r && r.error) { const m = $('#f-login .msg'); if (m) m.textContent = ERR(r.error.message); } }); return; }
  if (x.id === 'olvide') { const f = $('#f-login'), m = $('.msg', f), email = f.email.value.trim(); if (!email) { m.textContent = 'Escribe tu correo arriba y vuelve a tocar "Olvidé mi contraseña".'; f.email.focus(); return; }
    m.textContent = 'Enviando…'; SB.auth.resetPasswordForEmail(email, { redirectTo: baseURL() + '#/cuenta' }).then(({ error }) => { m.textContent = error ? ERR(error.message) : '✓ Te mandamos un enlace para crear una nueva contraseña. Ábrelo en este mismo navegador.'; }); return; }
  if (x.dataset.modo) { MODO = x.dataset.modo; repinta(); return; }
  if (x.classList.contains('tr-x')) { TR[x.dataset.k] = TR[x.dataset.k].filter(id => id !== x.dataset.id); pintaTrade(); }
  else if (x.classList.contains('seguir')) { mide('seguir_jugador', { jugador: x.dataset.id }); toggleFav(x.dataset.id, x); }
  else if (x.id === 'salir') SB.auth.signOut();
  else if (x.dataset.fmt) { FMT = +x.dataset.fmt; ls('fx-fmt', String(FMT)); aplicaFormato(); repinta(); }
});

/* =============================== ROUTER =============================== */
// Menú lateral (celular): mismas secciones que el escritorio
function menu(on, quieto) {
  const L = $('.links'), b = $('#menu-btn'), bg = $('#menu-bg'); if (!L) return;
  L.classList.toggle('open', on); if (bg) bg.hidden = !on; document.body.classList.toggle('menu-on', on);
  if (b) b.setAttribute('aria-expanded', on ? 'true' : 'false');
  if (on) { const a = L.querySelector('a.act') || L.querySelector('a[href]'); a && a.focus({ preventScroll: true }); } else if (!quieto && b) b.focus();
}
// El menú funciona desde el primer momento, aunque los datos sigan cargando
document.addEventListener('click', e => { const t = e.target.closest && e.target.closest('[data-lt]'); if (!t) return; const lg = $('.live-grid'); if (lg) { lg.classList.toggle('ver-fx', t.dataset.lt === 'fx'); lg.classList.toggle('ver-pbp', t.dataset.lt === 'pbp'); } document.querySelectorAll('[data-lt]').forEach(b => b.classList.toggle('on', b === t)); });
document.addEventListener('click', e => { const f = e.target.closest && e.target.closest('[data-fxf]'); if (f) { FXFILTRO = f.dataset.fxf; document.querySelectorAll('.fxl-list .fxr').forEach(r => { r.hidden = FXFILTRO !== 'todos' && r.dataset.eq !== FXFILTRO; }); document.querySelectorAll('[data-fxf]').forEach(b => b.classList.toggle('on', b === f)); } });
document.addEventListener('click', e => { const t = e.target.closest && e.target.closest('#menu-btn,#menu-x,#menu-bg'); if (t) { e.preventDefault(); menu(t.id === 'menu-btn'); } });
addEventListener('hashchange', () => { const L = $('.links'); if (L && L.classList.contains('open')) menu(false, true); });
let _rutaPrev = null;
/* =============================== PREMIUM FX · CUARTO DE GUERRA ===============================
   La pestaña Premium vende herramientas, no notas. El usuario conecta su liga (Sleeper en automático, cualquier otra
   plataforma a mano) y el sistema trabaja sobre SU plantel:
   - Alineación óptima de la semana con el porqué de cada decisión (Modelo FX + rival + salud + racha).
   - Alertas del plantel: lesionados, descanso y jugadores fuera, con su reemplazo.
   - Tu matchup: puntos proyectados contra tu rival y probabilidad de ganar.
   - Waivers para ti: libres en TU liga que mejoran tu posición más débil.
   - Trade targets: a quién pedir, a qué rival, y qué ofrecer de tu banca.
   - Exclusivas de la red de reporteros.
   Conectar la liga y ver el plantel es gratis (es el gancho); las decisiones y explicaciones son Premium.
   Los IDs de jugador de Sleeper son los mismos del sitio, así que la liga importada usa los datos del Modelo FX directo. */
const LIGA_K = 'fx-liga';
let LIGA = (() => { try { return JSON.parse(localStorage.getItem(LIGA_K) || 'null'); } catch (e) { return null; } })();
let _ligaSync = 0, _ligaOpc = null;
const guardaLiga = () => { try { LIGA ? localStorage.setItem(LIGA_K, JSON.stringify(LIGA)) : localStorage.removeItem(LIGA_K); } catch (e) {}
  // También en la cuenta: la liga te sigue en cualquier dispositivo y no se vuelve a pedir
  if (SB && YO) { const c = LIGA ? { fuente: LIGA.fuente, lid: LIGA.lid || null, uid: LIGA.uid || null, fmt: LIGA.fmt, nombre: LIGA.nombre, jugadores: LIGA.fuente === 'manual' ? LIGA.jugadores : undefined, fijos: LIGA.fijos || {} } : null, k = JSON.stringify(c);
    if (k !== guardaLiga._u) { guardaLiga._u = k; SB.auth.updateUser({ data: { fx_liga: c } }).catch(() => {}); } } };
function restauraLiga() {
  const c = YO && YO.user_metadata && YO.user_metadata.fx_liga; if (!c || (LIGA && LIGA.jugadores && LIGA.jugadores.length)) return;
  guardaLiga._u = JSON.stringify(c);
  if (c.fuente === 'sleeper' && c.lid && c.uid) cargaLigaSleeper(c.lid, c.uid).then(() => { if (c.fijos) { LIGA.fijos = c.fijos; guardaLiga(); } if (/^#\/premium/.test(location.hash)) repinta(); }).catch(() => {});
  else if (c.fuente === 'manual' && (c.jugadores || []).length) { LIGA = { ...c, slots: POS_BASE, fecha: new Date().toISOString() }; guardaLiga(); if (/^#\/premium/.test(location.hash)) repinta(); }
}
const sleeperGet = async u => { const r = await fetch('https://api.sleeper.app/v1/' + u); if (!r.ok) throw new Error(r.status); return r.json(); };
const SLOT_OK = { QB: ['QB'], RB: ['RB'], WR: ['WR'], TE: ['TE'], K: ['K'], DEF: ['DEF'], FLEX: ['RB', 'WR', 'TE'], WRRB_FLEX: ['RB', 'WR'], REC_FLEX: ['WR', 'TE'], SUPER_FLEX: ['QB', 'RB', 'WR', 'TE'] };
const SLOT_TXT = { FLEX: 'FLEX', WRRB_FLEX: 'W/R', REC_FLEX: 'W/T', SUPER_FLEX: 'SFLEX' };
const POS_BASE = ['QB', 'RB', 'RB', 'WR', 'WR', 'TE', 'FLEX', 'K', 'DEF'];
const fmtL = () => LIGA && LIGA.fmt != null ? LIGA.fmt : FMT;
const pL = j => !j || !juega(j) ? 0 : j.proy && j.proy[fmtL()] != null ? j.proy[fmtL()] : (j.prom || 0) * .9;
const fiL = j => { const u = (j.log || []).filter(l => l.f && l.f[fmtL()] != null).slice(-5).map(l => l.f[fmtL()]); return u.length >= 2 ? [Math.min(...u), Math.max(...u)] : null; };

/* ---------- Motor de decisiones ---------- */
/* ---------- Motor de decisiones (consciente del estado de cada partido) ---------- */
const POS_JUEGO = ['QB', 'RB', 'WR', 'TE'];
const juegoDe = t => (G.length && +G[0].semana === semActual() ? G : []).find(g => (g.visita && g.visita.ab === t) || (g.local && g.local.ab === t));
const ptsAhora = j => {
  const sp = LIGA && LIGA.mu && LIGA.mu.w === semActual() && LIGA.mu.pts ? LIGA.mu.pts[j.id] : null; if (sp != null && sp !== 0) return sp;
  if (VIVO.w === semActual() && VIVO.pts && VIVO.pts[j.id]) return VIVO.pts[j.id][fmtL()];
  const l = (j.log || []).find(x => x.w === semActual()); return l && l.f ? l.f[fmtL()] : null;
};
// Estado del jugador esta semana: post (ya jugó), in (jugando), pre (por jugar), bye, out
function edo(j) {
  if (!j) return { e: 'vacio', fin: 0 };
  const r = rivalDe(j.team); if (!r) return { e: 'bye', fin: 0 };
  const g = juegoDe(j.team), pts = ptsAhora(j), proy = j.proy && j.proy[fmtL()] != null ? j.proy[fmtL()] : (j.prom || 0) * .9;
  const est = g ? g.estado : ((j.log || []).some(l => l.w === semActual() && l.f) ? 'post' : 'pre');
  if (est === 'post') return { e: 'post', pts: pts || 0, fin: pts || 0, proy, r };
  if (est === 'in') return { e: 'in', pts: pts || 0, fin: (pts || 0) + proy * .45, proy, r, g };
  if (fuera(j)) return { e: 'out', fin: 0, proy: 0, r, g };
  return { e: 'pre', fin: proy, proy, r, g, kick: g && g.fecha };
}
const bloqueado = j => j && ['post', 'in'].includes(edo(j).e);
const disponible = j => j && edo(j).e === 'pre';
const diaHora = f => f ? new Date(f).toLocaleString(LANG === 'en' ? 'en-US' : 'es-MX', { weekday: 'short', hour: 'numeric', minute: '2-digit' }) : '';
const chipEdo = j => { const x = edo(j); return x.e === 'post' ? `<span class="ed post">FINAL</span><b class="n ed-p">${n1(x.pts)}</b>` : x.e === 'in' ? `<span class="ed in"><i></i>${tx('VIVO', 'LIVE')}</span><b class="n ed-p">${n1(x.pts)}</b>` : x.e === 'bye' ? `<span class="ed bye">BYE</span><b class="n ed-p">0.0</b>` : x.e === 'out' ? `<span class="ed out">${tx('FUERA', 'OUT')}</span><b class="n ed-p">0.0</b>` : x.e === 'vacio' ? '' : `<span class="ed pre">${esc(diaHora(x.kick)) || 'PROY'}</span><b class="n ed-p pr">${n1(x.proy)}</b>`; };
const matchupTxt = j => { const r = rivalDe(j.team), e = r && estrellas(r.opp, j.pos); if (!r) return ''; return `${r.home ? 'vs' : '@'} ${r.opp}${e ? ' · ' + (e.n >= 4 ? tx('rival a favor', 'soft matchup') : e.n <= 2 ? tx('rival difícil', 'tough matchup') : tx('rival neutral', 'neutral matchup')) : ''}`; };
const rangoPos = j => { const L = P.filter(x => x.pos === j.pos && juega(x)).sort((a, b) => b.pEst - a.pEst), k = L.indexOf(j); return k >= 0 ? j.pos + (k + 1) : j.pos; };
const sdJ = j => { const u = (j.log || []).filter(l => l.f && l.f[fmtL()] != null).slice(-6).map(l => l.f[fmtL()]); if (u.length < 3) return Math.max(4, (j.prom || 8) * .45); const m = u.reduce((a, b) => a + b, 0) / u.length; return Math.max(3.5, Math.sqrt(u.reduce((a, b) => a + (b - m) ** 2, 0) / (u.length - 1))); };
const ult3 = j => { const u = (j.log || []).filter(l => l.f && l.f[fmtL()] != null).slice(-3).map(l => l.f[fmtL()]); return u.length ? u.reduce((a, b) => a + b, 0) / u.length : null; };
const phi = z => { const t = 1 / (1 + .3275911 * Math.abs(z) / Math.SQRT2), y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - .284496736) * t + .254829592) * t * Math.exp(-z * z / 2); return .5 * (1 + (z >= 0 ? y : -y)); };

// Alineación: respeta a los que ya jugaron o están jugando (no se pueden mover) y optimiza el resto
function alineacion(ids, slots, actuales = [], fijos = {}) {
  const usados = new Set(), out = [];
  slots.forEach((s, i) => { const j = J[actuales[i]]; if (j && bloqueado(j)) { out[i] = { s, j, lock: true }; usados.add(j.id); } });
  Object.entries(fijos).forEach(([i, id]) => { const j = J[id], s = slots[i]; if (!out[i] && j && !usados.has(id) && ids.includes(id) && SLOT_OK[s] && SLOT_OK[s].includes(j.pos)) { out[i] = { s, j, tuyo: true }; usados.add(id); } });
  const pool = ids.map(id => J[id]).filter(j => j && !usados.has(j.id) && !bloqueado(j)).sort((a, b) => edo(b).fin - edo(a).fin);
  const orden = slots.map((s, i) => ({ s, i })).filter(x => SLOT_OK[x.s] && !out[x.i]).sort((a, b) => SLOT_OK[a.s].length - SLOT_OK[b.s].length);
  for (const { s, i } of orden) { const j = pool.find(p => !usados.has(p.id) && SLOT_OK[s].includes(p.pos)); if (j) usados.add(j.id); out[i] = { s, j }; }
  const tit = slots.map((s, i) => out[i] || { s, j: null }), banca = ids.map(id => J[id]).filter(j => j && !usados.has(j.id)).sort((a, b) => edo(b).fin - edo(a).fin);
  return { tit, banca, total: tit.reduce((a, x) => a + (x.j ? edo(x.j).fin : 0), 0) };
}
// Cambios concretos: lo que tienes alineado en Sleeper contra lo óptimo
function cambios(slots) {
  const act = LIGA.tit && LIGA.tit.length ? LIGA.tit : null; if (!act) return [];
  const opt = alineacion(LIGA.jugadores, slots, act, LIGA.fijos || {}), out = [];
  opt.tit.forEach((x, i) => {
    const a = J[act[i]], b = x.j; if (x.lock || !b || (a && a.id === b.id)) return;
    const ea = a ? edo(a) : { e: 'vacio', fin: 0 }, eb = edo(b), gan = eb.fin - ea.fin;
    if (['out', 'bye', 'vacio'].includes(ea.e)) out.push({ urg: 3, s: x.s, a, b, gan, txt: a ? tx(`${a.n} ${ea.e === 'bye' ? 'descansa esta semana' : 'está FUERA'}: mete a ${b.n} en ${SLOT_TXT[x.s] || x.s}.`, `${a.n} ${ea.e === 'bye' ? 'is on bye' : 'is OUT'}: start ${b.n} at ${SLOT_TXT[x.s] || x.s}.`) : tx(`Tienes ${SLOT_TXT[x.s] || x.s} vacío: mete a ${b.n}.`, `Your ${SLOT_TXT[x.s] || x.s} is empty: start ${b.n}.`) });
    else if (gan >= .8 && !bloqueado(a)) out.push({ urg: 2, s: x.s, a, b, gan, txt: tx(`Arranca a ${b.n} en lugar de ${a.n} en ${SLOT_TXT[x.s] || x.s}: +${n1(gan)} pts proyectados.`, `Start ${b.n} over ${a.n} at ${SLOT_TXT[x.s] || x.s}: +${n1(gan)} projected pts.`) });
  });
  return out.sort((a, b) => b.urg - a.urg || b.gan - a.gan);
}
const propios = () => new Set([...(LIGA.jugadores || []), ...Object.values(LIGA.otros || {}).flat()]);
function waiversPara(al) {
  const own = propios(), mis = LIGA.jugadores.map(id => J[id]).filter(Boolean);
  const peorTit = p => { const t = al.tit.filter(x => x.j && x.j.pos === p).map(x => edo(x.j).proy || 0); return t.length ? Math.min(...t) : 0; };
  const soltable = mis.filter(j => POS_JUEGO.includes(j.pos) && !al.tit.some(x => x.j && x.j.id === j.id)).map(j => ({ j, v: valorROS(j).valor, ppj: valorROS(j).ppj })).filter(x => x.v < 15 && x.ppj < 12).sort((a, b) => a.v - b.v);
  const L = Object.values(J).filter(j => !own.has(j.id) && j.team !== 'FA' && POS_JUEGO.includes(j.pos) && j.proy).map(j => {
    const v = valorROS(j).valor, pr = j.proy[fmtL()] || 0, add = j.add || 0, mej = pr - peorTit(j.pos);
    const her = P.find(x => x.team === j.team && x.pos === j.pos && x.id !== j.id && fuera(x) && x.pEst > pr);
    const score = v + Math.min(add / 700, 30) + Math.max(0, mej) * 2 + (her ? 6 : 0);
    return { j, v, pr, add, mej, her, score, suelta: (soltable.find(s => s.j.pos === j.pos && s.v < v * .8) || soltable.find(s => s.v < v * .8) || {}).j };
  }).filter(x => x.add > 250 || x.v > 10 || x.mej > 1).sort((a, b) => b.score - a.score).slice(0, 8);
  return L;
}
function streaming(al) {
  const own = propios(), out = [];
  for (const p of ['K', 'DEF']) { const t = al.tit.find(x => x.s === p), mi = t && t.j, e = mi ? edo(mi) : { e: 'vacio', proy: 0 };
    if (e.e === 'post' || e.e === 'in') continue;
    const libres = Object.values(J).filter(j => j.pos === p && !own.has(j.id) && disponible(j)).sort((a, b) => edo(b).proy - edo(a).proy).slice(0, 2);
    libres.forEach(j => { if (!mi || ['bye', 'out', 'vacio'].includes(e.e) || edo(j).proy - e.proy > 1.5) out.push({ j, mi, gan: edo(j).proy - (e.proy || 0) }); }); }
  return out;
}
function tradeIdeas(al) {
  if (!LIGA.otros) return { targets: [], vende: [], compra: [] };
  const mis = LIGA.jugadores.map(id => J[id]).filter(j => j && POS_JUEGO.includes(j.pos));
  const avgPos = p => { const L = P.filter(x => x.pos === p && juega(x)).sort((a, b) => b.pEst - a.pEst).slice(0, (LIGA.equipos || 12) * (p === 'QB' || p === 'TE' ? 1 : 2)); return L.reduce((a, x) => a + x.pEst, 0) / Math.max(1, L.length); };
  const debil = POS_JUEGO.map(p => { const t = al.tit.filter(x => x.j && x.j.pos === p).map(x => valorROS(x.j).ppj); return { p, r: t.length ? Math.min(...t) / Math.max(1, avgPos(p)) : 0 }; }).sort((a, b) => a.r - b.r)[0];
  const banca = mis.filter(j => !al.tit.some(x => x.j && x.j.id === j.id) && j.pos !== debil.p).map(j => ({ j, v: valorROS(j).valor })).sort((a, b) => b.v - a.v);
  const targets = [];
  for (const [rid, ids] of Object.entries(LIGA.otros)) for (const id of ids) { const j = J[id]; if (!j || j.pos !== debil.p || fueraTemp(j)) continue; const v = valorROS(j).valor, of = banca.find(m => m.v >= v * .85 && m.v <= v * 1.35); if (of && v > 15) targets.push({ j, v, rid, of: of.j }); }
  const vende = mis.map(j => { const u = ptsSem(j, SEMNUM), vr = valorROS(j); return { j, u, ppj: vr.ppj, v: vr.valor }; }).filter(x => x.u != null && x.ppj > 0 && x.u >= x.ppj * 1.7 && x.u >= 15).sort((a, b) => b.u / b.ppj - a.u / a.ppj).slice(0, 3);
  const compra = Object.entries(LIGA.otros).flatMap(([rid, ids]) => ids.map(id => ({ j: J[id], rid }))).filter(x => x.j && POS_JUEGO.includes(x.j.pos) && !fuera(x.j)).map(x => ({ ...x, u3: ult3(x.j), vr: valorROS(x.j) })).filter(x => x.u3 != null && x.vr.ppj >= 11 && x.u3 <= x.vr.ppj * .7).sort((a, b) => b.vr.valor - a.vr.valor).slice(0, 4);
  return { debil: debil.p, targets: targets.sort((a, b) => b.v - a.v).slice(0, 4), vende, compra };
}

/* ---------- Importar ---------- */
async function importaSleeper(usuario) {
  const u = await sleeperGet('user/' + encodeURIComponent(usuario.trim()));
  if (!u || !u.user_id) throw new Error(tx('No encontramos ese usuario de Sleeper.', 'We could not find that Sleeper user.'));
  const ls = await sleeperGet(`user/${u.user_id}/leagues/nfl/${D.temporada || new Date().getFullYear()}`);
  if (!ls || !ls.length) throw new Error(tx('Ese usuario no tiene ligas esta temporada.', 'That user has no leagues this season.'));
  return { u, ls };
}
async function cargaLigaSleeper(lid, uid) {
  const [lg, rs, us] = await Promise.all([sleeperGet('league/' + lid), sleeperGet(`league/${lid}/rosters`), sleeperGet(`league/${lid}/users`)]);
  const mio = rs.find(r => r.owner_id === uid || (r.co_owners || []).includes(uid)); if (!mio) throw new Error(tx('No encontramos tu equipo en esa liga.', 'We could not find your team in that league.'));
  const nom = Object.fromEntries((us || []).map(x => [x.user_id, (x.metadata && x.metadata.team_name) || x.display_name]));
  const rec = (lg.scoring_settings || {}).rec;
  LIGA = { fuente: 'sleeper', lid, uid, nombre: lg.name, equipos: lg.total_rosters, rid: mio.roster_id, slots: (lg.roster_positions || POS_BASE).filter(s => s !== 'BN' && s !== 'IR' && s !== 'TAXI'),
    fmt: rec >= 1 ? 0 : rec >= .5 ? 1 : 2, jugadores: mio.players || [], otros: Object.fromEntries(rs.filter(r => r !== mio).map(r => [r.roster_id, r.players || []])),
    duenos: Object.fromEntries(rs.map(r => [r.roster_id, nom[r.owner_id] || ('Equipo ' + r.roster_id)])), rec: Object.fromEntries(rs.map(r => [r.roster_id, r.settings ? `${r.settings.wins || 0}-${r.settings.losses || 0}${r.settings.ties ? '-' + r.settings.ties : ''}` : ''])), fijos: (LIGA && LIGA.lid === lid && LIGA.fijos) || {}, fecha: new Date().toISOString() };
  LIGA.duenoYo = nom[uid] || ''; LIGA.tit = mio.starters || null;
  try { const m = await sleeperGet(`league/${lid}/matchups/${semActual()}`), yo = m.find(x => x.roster_id === mio.roster_id); const riv = yo && m.find(x => x.matchup_id === yo.matchup_id && x.roster_id !== mio.roster_id);
    LIGA.rival = riv ? riv.roster_id : null; if (yo && yo.starters) LIGA.tit = yo.starters; LIGA.titR = riv && riv.starters || null;
    LIGA.mu = { pts: { ...(yo && yo.players_points || {}), ...(riv && riv.players_points || {}) }, yo: yo ? yo.points : null, rv: riv ? riv.points : null, w: semActual() };
  } catch (e) { LIGA.rival = null; }
  guardaLiga();
}
function sincroniza() { if (!LIGA || LIGA.fuente !== 'sleeper' || _ligaSync || Date.now() - Date.parse(LIGA.fecha || 0) < (enVivo() ? 2 : 10) * 60e3) return; _ligaSync = 1; cargaLigaSleeper(LIGA.lid, LIGA.uid).then(() => { _ligaSync = 0; if (/^#\/premium/.test(location.hash)) repinta(); }).catch(() => { _ligaSync = 0; }); }

/* ---------- Vista ---------- */
const tarjetaHerr = (ico, t, d, cuerpo, gancho, libre) => `<section class="cg-tool card"><div class="cg-th"><span class="cg-ico">${ico}</span><div><h3>${t}</h3><p>${d}</p></div>${libre ? `<span class="cg-free">${tx('GRATIS', 'FREE')}</span>` : `<span class="cg-pro">★ PRO</span>`}</div>${sello('cg')}${libre ? cuerpo : zonaPrem(cuerpo, gancho)}</section>`;
const filaJ = (j, der = '', sub = '') => `<a class="cg-j" href="#/jugador/${j.id}" data-hover-j="${j.id}">${helmet(j.team, j.num, 30)}<span class="cg-jn"><b>${esc(j.n)}</b><small>${esc(j.pos)} · ${esc(j.team)} · ${esc(rivalTxt(j.team))}${sub ? ' · ' + sub : ''}</small></span>${der}</a>`;

function conectaVista() {
  return `<section class="cg-conecta card">
    <div class="cg-th"><span class="cg-ico">${pixel(ART.rayo)}</span><div><h3>${tx('Conecta tu liga', 'Connect your league')}</h3><p>${tx('Trae tu equipo en 10 segundos y todo el sitio trabaja para tu plantel.', 'Bring your team in 10 seconds and the whole site works for your roster.')}</p></div><span class="cg-free">${tx('GRATIS', 'FREE')}</span></div>
    <div class="cg-tabs"><button type="button" class="on" data-cg-modo="sleeper">Sleeper</button><button type="button" data-cg-modo="manual">${tx('ESPN, Yahoo u otra (a mano)', 'ESPN, Yahoo or other (manual)')}</button></div>
    <form class="cg-f" data-cg="sleeper"><input name="u" placeholder="${tx('Tu usuario de Sleeper', 'Your Sleeper username')}" autocomplete="off" required><button class="btn" type="submit">${tx('Buscar mis ligas', 'Find my leagues')}</button></form>
    <div class="cg-ligas" id="cg-ligas">${_ligaOpc ? _ligaOpc.ls.map(l => `<button type="button" class="cg-liga" data-cg-lid="${l.league_id}"><b>${esc(l.name)}</b><small>${l.total_rosters} ${tx('equipos', 'teams')} · ${(l.scoring_settings || {}).rec >= 1 ? 'PPR' : (l.scoring_settings || {}).rec >= .5 ? 'HALF' : 'STD'}</small></button>`).join('') : ''}</div>
    <div class="cg-manual" hidden><p class="sub">${tx('Busca y agrega a tus jugadores. Lo guardamos en este dispositivo.', 'Search and add your players. We save it on this device.')}</p><input id="cg-busca" placeholder="${tx('Nombre del jugador…', 'Player name…')}" autocomplete="off"><div id="cg-res"></div>
      <button type="button" class="btn" data-cg-listo>${tx('Listo, ver mi cuarto de guerra', 'Done, open my war room')}</button>
      <label class="cg-fmt">${tx('Formato', 'Format')} <select id="cg-fmt">${FMTS.map((f, i) => `<option value="${i}">${f}</option>`).join('')}</select></label></div>
    <p class="cg-msg" id="cg-msg" role="status"></p>
    <p class="legal">${tx('ESPN y Yahoo no permiten importar ligas privadas sin tu contraseña; por seguridad nunca te la pedimos. Captura tu plantel a mano y te damos las mismas herramientas.', 'ESPN and Yahoo don\'t allow importing private leagues without your password; for your security we never ask for it. Enter your roster manually and you get the same tools.')}</p></section>`;
}

/* ---------- Página de venta Premium: arte pixel propio (sin emojis), un nivel por función ---------- */
const PXC = { G: '#5BC489', D: '#2E6B47', Y: '#FFD45C', L: '#B8892A', O: '#8B4A2B', P: '#5E2F1A', W: '#E9FFF1', R: '#F2786A', X: '#A8433A', K: '#0B130F', B: '#6FB7F0', S: '#9FB4A8', M: '#3B5446' };
const pixel = (g, cls = '') => { const w = Math.max(...g.map(r => r.length)), h = g.length; let o = ''; g.forEach((r, y) => [...r].forEach((c, x) => { if (PXC[c]) o += `<rect x="${x}" y="${y}" width="1.04" height="1.04" fill="${PXC[c]}"/>`; })); return `<svg class="px-art ${cls}" viewBox="0 0 ${w} ${h}" shape-rendering="crispEdges" aria-hidden="true">${o}</svg>`; };
const ART = {
  linea: ['.....MMMMMM.....', '....MSSSSSSM....', '.KKKKKKKKKKKKKK.', '.KWWWWWWWWWWWWK.', '.KWGGWDDDDDDWWK.', '.KWGGWWWWWWWWWK.', '.KWWWWWWWWWWWWK.', '.KWGGWDDDDDWWWK.', '.KWGGWWWWWWWWWK.', '.KWWWWWWWWWWWWK.', '.KWYYWDDDDWWWWK.', '.KWYYWWWWWWWWWK.', '.KWWWWWWWWWWWWK.', '.KWRRWDDDWWWWWK.', '.KWWWWWWWWWWWWK.', '.KKKKKKKKKKKKKK.'],
  marcador: ['KKKKKKKKKKKKKKKK', 'KMMMMMMMMMMMMMMK', 'KMYYYMMMMMMRRRMK', 'KMYMYMMKKMMRMRMK', 'KMYMYMMKKMMRMRMK', 'KMYYYMMMMMMRRRMK', 'KMMMMMMMMMMMMMMK', 'KMGGGGGGGGGRRRMK', 'KMGGGGGGGGGRRRMK', 'KMMMMMMMMMMMMMMK', 'KKKKKKKKKKKKKKKK', '.......SS.......', '.......SS.......', '.......SS.......', '.....SSSSSS.....', '....SSSSSSSS....'],
  iman: ['......OOOO......', '.....OPWPOO.....', '......OOOO......', '................', '..W..........W..', '...W........W...', '..WWWW....WWWW..', '..WWWW....WWWW..', '..RRRR....RRRR..', '..RRRR....RRRR..', '..RRRR....RRRR..', '..RRRRR..RRRRR..', '...RRRRRRRRRR...', '...XRRRRRRRRX...', '....XXRRRRXX....', '......XXXX......'],
  trade: ['..........G.....', '..........GG....', '..GGGGGGGGGGG...', '..GGGGGGGGGGGG..', '..GGGGGGGGGGG...', '..........GG....', '..........G.....', '................', '................', '.....Y..........', '....YY..........', '...YYYYYYYYYYY..', '..YYYYYYYYYYYY..', '...YYYYYYYYYYY..', '....YY..........', '.....Y..........'],
  sirena: ['.......WW.......', '..W....WW....W..', '...W........W...', '......RRRR......', '.....RRWRRR.....', '....RRWWRRRR....', '....RRWRRRRR....', '.WW.RRRRRRRR.WW.', '....RRRRRRRR....', '....XRRRRRRX....', '...SSSSSSSSSS...', '..SSSSSSSSSSSS..', '..MMMMMMMMMMMM..', '................', '................', '................'],
  micro: ['......SSSS......', '.....SWSMSS.....', '.....SSSSSS.....', '.....SWSMSS.....', '.....SSSSSS.....', '.....SWSMSS.....', '......SSSS......', '...Y........Y...', '...YY......YY...', '....YYYYYYYY....', '.......YY.......', '.......YY.......', '.......YY.......', '....YYYYYYYY....', '................', '................'],
  moneda: ['.....YYYYYY.....', '...YYLLLLLLYY...', '..YLLYYYYYYLLY..', '.YLYYYYYYYYYYLY.', '.YLYYKKKKKYYYLY.', 'YLYYYKYYYYYYYYLY', 'YLYYYKKKKYYYYYLY', 'YLYYYKYYYYYYYYLY', 'YLYYYKYYYYYYYYLY', 'YLYYYKYYYYYYYYLY', '.YLYYYYYYYYYYLY.', '.YLYYYYYYYYYYLY.', '..YLLYYYYYYLLY..', '...YYLLLLLLYY...', '.....YYYYYY.....', '................'],
  rayo: ['.........YY.....', '........YY......', '.......YY.......', '......YYY.......', '.....YYY........', '....YYYYYYY.....', '.......YYY......', '......YYY.......', '.....YY.........', '....YY..........', '...Y............', '................'],
  balon: ['....PPPPPP....', '..POOOOOOOOP..', '.POOOOOOOOOOP.', 'POOWOWOWOWOOOP', 'POOWWWWWWWOOOP', 'POOWOWOWOWOOOP', '.POOOOOOOOOOP.', '..POOOOOOOOP..', '....PPPPPP....']
};
const ctaPrem = (t, cls = '') => `<a class="btn pv-btn ${cls}" href="${!YO ? '#/cuenta' : '#/premium?planes=1'}" ${!YO ? 'data-reg' : 'data-ir-planes'}>${t}</a>`;
function ventaHero() {
  const nJ = P.filter(j => j.proy).length, nN = todasNoticias().length;
  const dato = (n, t, suf = '') => `<div><b class="n" data-cuenta="${n}">${n}</b>${suf}<small>${t}</small></div>`;
  return `<section class="pv-hero">
    <div class="pv-hero-txt"><span class="pv-coin">${pixel(ART.moneda, 'gira')}<em>INSERT COIN</em></span>
      <h1>${tx('El cuarto de guerra de tu liga', 'Your league\'s war room')}</h1>
      <p>${tx('Conectas tu liga una vez. Desde ese momento el FX Tech Analyzer revisa tu equipo todos los días y te dice qué hacer, con el porqué de cada decisión.', 'Connect your league once. From then on, the FX Tech Analyzer checks your team every day and tells you what to do, with the why behind every call.')}</p>
      <div class="pv-ctas">${ctaPrem(tx('Desbloquear Premium', 'Unlock Premium'))}<a class="btn ghost" href="#pv-conecta" data-pv-ir="pv-conecta">${tx('Conectar mi liga gratis', 'Connect my league free')}</a></div>
      <small class="pv-nota">${tx('Desde $59 MXN al mes · cancela cuando quieras', 'From $59 MXN a month · cancel anytime')}</small></div>
    <div class="pv-board" aria-label="FX Tech Analyzer">
      <div class="pv-board-top">${sello()}<span class="pv-led"><i></i>${tx('EN LÍNEA', 'ONLINE')}</span></div>
      <div class="pv-board-g">${dato(nJ, tx('jugadores proyectados', 'players projected'))}${dato(32, tx('defensas medidas', 'defenses measured'))}${dato(2, tx('temporadas de datos', 'seasons of data'))}${dato(nN, tx('notas verificadas', 'verified stories'))}</div>
      <div class="pv-marq"><span>${Array(2).fill(tx('START · SIT · WAIVERS · TRADES · MATCHUPS · LESIONES · PISO · TECHO · ', 'START · SIT · WAIVERS · TRADES · MATCHUPS · INJURIES · FLOOR · CEILING · ')).join('')}</span></div>
      <div class="pv-field" aria-hidden="true"><i class="pv-ball">${pixel(ART.balon)}</i></div>
    </div></section>`;
}
function niveles() {
  const wr = P.filter(j => j.pos === 'WR' && juega(j) && j.p).sort((a, b) => b.p - a.p), a1 = wr[8], b1 = wr[16];
  const ag = (D.agregados || []).map(id => J[id]).find(j => j && j.p && juega(j)), les = D.lesionados.map(x => J[x.id]).find(j => j && j.pEst > 8);
  const N = [
    { s: 'linea', t: tx('Alineación óptima', 'Optimal lineup'), h: tx('Deja de adivinar quién va de titular.', 'Stop guessing who starts.'), b: [tx('Ordenamos tu plantel con la proyección FX en el formato de TU liga', 'We sort your roster with the FX projection in YOUR league format'), tx('Cada posición trae el porqué: rival, salud, racha y volumen', 'Every slot comes with the why: opponent, health, streak and volume'), tx('Te avisa cuando un jugador de tu banca le gana al titular', 'It flags when a bench player beats your starter')],
      demo: a1 && b1 ? `<div class="pv-d-row"><span>FLEX</span><b>${esc(a1.n)}</b><em class="n">${n1(a1.p)}</em></div><div class="pv-d-row off"><span>${tx('BANCA', 'BENCH')}</span><b>${esc(b1.n)}</b><em class="n">${n1(b1.p)}</em></div><p class="pv-d-why">${tx(`Arranca a ${esc(a1.n)}: +${n1(a1.p - b1.p)} pts proyectados.`, `Start ${esc(a1.n)}: +${n1(a1.p - b1.p)} projected pts.`)}</p>` : '' },
    { s: 'marcador', t: tx('Probabilidad de ganar', 'Win probability'), h: tx('Sabes si eres favorito antes del domingo.', 'Know if you are the favorite before Sunday.'), b: [tx('Tu alineación óptima contra la de tu rival real', 'Your optimal lineup against your real opponent\'s'), tx('Si eres favorito: juega seguro. Si no: busca techo', 'If you are the favorite: play it safe. If not: chase ceiling'), tx('Se recalcula con cada lesión y cada cambio', 'Recalculated with every injury and every move')],
      demo: `<div class="pv-mu"><b class="n">118.4</b><div class="pv-bar"><i style="--w:64%"></i></div><b class="n">104.9</b></div><p class="pv-d-why">${tx('64% de probabilidad de ganar · ejemplo', '64% win probability · example')}</p>` },
    { s: 'iman', t: tx('Waivers para ti', 'Waivers for you'), h: tx('Los libres de TU liga, no los de todo el mundo.', 'Free agents in YOUR league, not everyone\'s.'), b: [tx('Solo jugadores que nadie tiene en tu liga', 'Only players nobody has in your league'), tx('Ordenados por cuánto mejoran tu posición más débil', 'Ranked by how much they upgrade your weakest spot'), tx('Valor para el resto de la temporada, no solo esta semana', 'Rest-of-season value, not just this week')],
      demo: ag ? `<div class="pv-d-row"><span>${esc(ag.pos)}</span><b>${esc(ag.n)}</b><em class="n">${n1(ag.p)}</em></div><p class="pv-d-why">${tx('El más agregado hoy · ¿está libre en tu liga?', 'Today\'s most added · is he free in your league?')}</p>` : '' },
    { s: 'trade', t: 'Trade targets', h: tx('El trade que te conviene, con nombre y apellido.', 'The trade that helps you, by name.'), b: [tx('Detecta tu posición débil y quién la tiene fuerte en tu liga', 'Spots your weak position and who is strong there in your league'), tx('Te propone qué ofrecer de tu banca sin perder valor', 'Suggests what to offer from your bench without losing value'), tx('Un clic y lo mides en el analizador de trades', 'One click and you measure it in the trade analyzer')],
      demo: `<div class="pv-d-row"><span>${tx('DAS', 'GIVE')}</span><b>WR · ${tx('tu banca', 'your bench')}</b><em>↔</em></div><div class="pv-d-row"><span>${tx('RECIBES', 'GET')}</span><b>RB1 · ${tx('de tu rival', 'from a rival')}</b><em class="ok">ACEPTA</em></div>` },
    { s: 'sirena', t: tx('Alertas del plantel', 'Roster alerts'), h: tx('Nadie de tu equipo te toma por sorpresa.', 'Nobody on your team catches you off guard.'), b: [tx('Lesionados, en duda y descansos de TU plantel', 'Injured, questionable and byes on YOUR roster'), tx('Te dice si el afectado es titular y quién lo reemplaza', 'Tells you if he is a starter and who replaces him'), tx('Revisado contra el reporte oficial', 'Checked against the official report')],
      demo: les ? `<div class="pv-d-row"><span class="r">${fuera(les) ? tx('FUERA', 'OUT') : tx('DUDA', 'Q')}</span><b>${esc(les.n)}</b><em>${esc(parte(les) || '')}</em></div><p class="pv-d-why">${tx('Si es tu titular, te damos el reemplazo.', 'If he is your starter, we give you the replacement.')}</p>` : '' },
    { s: 'micro', t: tx('Exclusivas FX', 'FX exclusives'), h: tx('Lo que tu liga se entera mañana.', 'What your league finds out tomorrow.'), b: [tx('Notas de nuestra red de reporteros', 'Notes from our reporter network'), tx('Cada exclusiva termina con una acción concreta', 'Every exclusive ends with a concrete move'), tx('El consejo completo de los expertos en cada nota', 'The full expert advice in every story')], demo: '' }
  ];
  return N.map((x, i) => `<section class="block pv-lvl ${i % 2 ? 'inv' : ''}"><div class="pv-art"><div class="pv-crt">${pixel(ART[x.s], 'big a-' + x.s)}<span class="pv-lv">LEVEL ${String(i + 1).padStart(2, '0')}</span></div>${x.demo ? `<div class="card pv-demo">${sello('mini')}${x.demo}</div>` : ''}</div>
    <div class="pv-txt"><small class="pv-k">★ PREMIUM · ${String(i + 1).padStart(2, '0')}/06</small><h2>${x.t}</h2><p class="pv-h">${x.h}</p><ul>${x.b.map(t => `<li>${t}</li>`).join('')}</ul>${ctaPrem(tx('Desbloquear', 'Unlock') + ' ' + x.t.toLowerCase(), 'sm')}</div></section>`).join('');
}
function cadaSeccion() {
  const C = [['#/posicion/RB', tx('Piso–techo', 'Floor–ceiling'), tx('Rankings', 'Rankings')], ['#/lideres', tx('¿Repite?', 'Repeat?'), tx('Líderes', 'Leaders')], ['#/tendencias', tx('¿Compra o trampa?', 'Buy or trap?'), tx('Tendencias', 'Trends')], ['#/lesionados', tx('Reemplazos FX', 'FX replacements'), tx('Lesionados', 'Injuries')], ['#/partidos', tx('Pronóstico fantasy', 'Fantasy forecast'), tx('Partidos', 'Games')], ['#/equipo/KC', tx('Calendario FX', 'FX schedule'), tx('Equipos', 'Teams')], ['#/noticias', tx('Consejo completo', 'Full advice'), tx('Noticias', 'News')], ['#/trade', tx('Valor por jugador', 'Value per player'), 'Trades']];
  return `<section class="block pv-cart"><div class="pv-sec-h"><small class="pv-k">BONUS STAGE</small><h2>${tx('Y en cada sección del sitio, una ventaja más', 'And in every section of the site, one more edge')}</h2></div>
    <div class="pv-cart-g">${C.map(([h, t, s]) => `<a class="card pv-cartucho" href="${h}"><span class="pv-ct">${s}</span><b>${t}</b><i>${pixel(ART.rayo)}</i></a>`).join('')}</div></section>`;
}
function precios() {
  const F = [[tx('Noticias, líderes, rankings y partidos', 'News, leaders, rankings and games'), 1, 1], [tx('Conectar tu liga y ver tu plantel', 'Connect your league and see your roster'), 1, 1], [tx('Alertas del plantel', 'Roster alerts'), 1, 1], [tx('Alineación óptima con el porqué', 'Optimal lineup with the why'), 0, 1], [tx('Probabilidad de ganar tu matchup', 'Matchup win probability'), 0, 1], [tx('Waivers y trade targets de tu liga', 'Your league\'s waivers and trade targets'), 0, 1], [tx('Ventaja FX en cada sección', 'FX edge in every section'), 0, 1], [tx('Exclusivas y consejo completo', 'Exclusives and full advice'), 0, 1]];
  const ok = v => v ? `<i class="si">${pixel(['.......G', '......GG', 'G....GG.', 'GG..GG..', '.GGGG...', '..GG....'])}</i>` : '<i class="no">—</i>';
  const plan = (k, precio, per, nota, top) => `<a class="pv-plan ${top ? 'top' : ''}" href="${!YO ? '#/cuenta' : (linkPago(k) || '#/cuenta')}" ${!YO ? 'data-reg' : ''}>${top ? `<em>${tx('MEJOR PRECIO', 'BEST PRICE')}</em>` : ''}<span class="pv-coin-s">${pixel(ART.moneda)}${top ? pixel(ART.moneda) + pixel(ART.moneda) : ''}</span><b class="n">$${precio}</b><span>MXN ${per}</span><small>${nota}</small><u>${top ? tx('Quiero el pase de temporada', 'I want the season pass') : tx('Empezar mensual', 'Start monthly')}</u></a>`;
  return `<section class="block pv-precios" id="pv-planes"><div class="pv-sec-h"><small class="pv-k">SELECT PLAYER</small><h2>${tx('Elige tu plan', 'Pick your plan')}</h2></div>
    <div class="pv-pr-g"><div class="pv-planes">${plan('mes', 59, tx('al mes', 'a month'), tx('Cancela cuando quieras', 'Cancel anytime'))}${plan('temporada', 199, tx('toda la temporada', 'whole season'), tx('Pago único, hasta el Super Bowl', 'One payment, through the Super Bowl'), 1)}</div>
    <div class="card pv-tabla"><div class="pv-tr h"><span></span><b>${tx('Gratis', 'Free')}</b><b class="g">Premium</b></div>${F.map(([t, a, b]) => `<div class="pv-tr"><span>${t}</span>${ok(a)}${ok(b)}</div>`).join('')}</div></div>
    <p class="legal">${tx('Pago seguro con Stripe: tarjeta, Apple Pay o Google Pay. Nunca vemos ni guardamos los datos de tu tarjeta.', 'Secure payment with Stripe: card, Apple Pay or Google Pay. We never see or store your card details.')}</p></section>`;
}
function animaPremium() {
  const io = new IntersectionObserver(es => es.forEach(e => { if (!e.isIntersecting) return; io.unobserve(e.target); const el = e.target, fin = +el.dataset.cuenta, t0 = performance.now();
    const paso = t => { const k = Math.min(1, (t - t0) / 1200); el.textContent = Math.round(fin * (1 - Math.pow(1 - k, 3))); if (k < 1) requestAnimationFrame(paso); }; el.textContent = '0'; requestAnimationFrame(paso); }), { threshold: .4 });
  document.querySelectorAll('[data-cuenta]').forEach(el => io.observe(el));
  if (/planes=1/.test(location.hash)) setTimeout(() => { const p = document.getElementById('pv-planes'); if (p) p.scrollIntoView({ behavior: 'smooth' }); }, 300);
}
document.addEventListener('click', e => { const a = e.target.closest('[data-pv-ir],[data-ir-planes]'); if (!a) return; const id = a.dataset.pvIr || 'pv-planes', el = document.getElementById(id); if (el) { e.preventDefault(); el.scrollIntoView({ behavior: 'smooth', block: 'start' }); } });

/* ---------- Cuarto de guerra: tablero + herramientas por pestaña ---------- */
const TABS_CG = [['', 'Mi semana', 'My week'], ['alineacion', 'Alineación', 'Lineup'], ['waivers', 'Waivers', 'Waivers'], ['trades', 'Trades', 'Trades'], ['plantel', 'Plantel', 'Roster'], ['exclusivas', 'Exclusivas', 'Exclusives']];
const jLink = (j, sub = '') => `<a class="wr-j" href="#/jugador/${j.id}" data-hover-j="${j.id}">${helmet(j.team, j.num, 30)}<span><b>${esc(j.n)}</b><small>${esc(j.pos)} · ${esc(j.team)}${sub ? ' · ' + sub : ''}</small></span></a>`;
const pieTech = () => `<div class="pie-tech">${sello('mini')}</div>`;
const slotsL = () => LIGA.slots && LIGA.slots.length ? LIGA.slots : POS_BASE;
function lados() {
  const slots = slotsL(), act = LIGA.tit && LIGA.tit.length ? LIGA.tit : null;
  const yo = alineacion(LIGA.jugadores, slots, act || [], LIGA.fijos || {});
  let rv = null; if (LIGA.rival && LIGA.otros && LIGA.otros[LIGA.rival]) { const ra = LIGA.titR && LIGA.titR.length ? LIGA.titR : null; rv = ra ? { tit: slots.map((s, i) => ({ s, j: J[ra[i]] || null })) } : alineacion(LIGA.otros[LIGA.rival], slots); }
  const suma = l => l.tit.reduce((a, x) => { const e = edo(x.j); a.act += e.pts || 0; a.fin += e.fin || 0; a.rest += e.e === 'pre' ? e.proy : e.e === 'in' ? e.proy * .45 : 0; a.faltan += e.e === 'pre' || e.e === 'in' ? 1 : 0; return a; }, { act: 0, fin: 0, rest: 0, faltan: 0 });
  const sy = suma(yo), sr = rv ? suma(rv) : null;
  if (LIGA.mu && LIGA.mu.yo != null) sy.act = LIGA.mu.yo; if (sr && LIGA.mu && LIGA.mu.rv != null) sr.act = LIGA.mu.rv;
  return { slots, yo, rv, sy, sr };
}
function marcador(L) {
  const { sy, sr } = L, nada = sy.act + (sr ? sr.act : 0) === 0, big = x => nada ? x.fin : x.act;
  const eq = (nom, rec, x, lado) => `<div class="mp-eq ${lado}"><span class="mp-av">${esc((nom || '?').trim().slice(0, 2).toUpperCase())}</span><div><b>${esc(nom || '')}</b><small>${rec ? esc(rec) + ' · ' : ''}${nada ? tx('proyección', 'projected') : tx('proy', 'proj') + ' ' + n1(x.fin)}</small></div><strong class="n">${n1(big(x))}</strong></div>`;
  if (!sr) return `<div class="mp-head">${eq(LIGA.duenoYo || tx('Mi equipo', 'My team'), LIGA.rec && LIGA.rec[LIGA.rid], sy, 'l')}<p class="mp-sin">${LIGA.fuente === 'manual' ? tx('Conecta Sleeper para jugar contra tu rival real.', 'Connect Sleeper to play against your real opponent.') : tx('Sin rival esta semana.', 'No opponent this week.')}</p></div>`;
  const sd = Math.max(5, 27 * Math.sqrt((sy.rest + sr.rest) / Math.max(1, sy.fin + sr.fin))), pc = Math.round(phi((sy.fin - sr.fin) / sd) * 100);
  const lect = sy.faltan + sr.faltan === 0 ? (sy.fin >= sr.fin ? tx('Semana cerrada: ganaste.', 'Week closed: you won.') : tx('Semana cerrada: perdiste.', 'Week closed: you lost.'))
    : pc >= 70 ? tx('Eres favorito: en cada duda elige al jugador con piso más alto.', 'You are favored: in every close call pick the higher floor.')
    : pc <= 30 ? tx('Vienes de atrás: en cada duda elige al jugador con más techo.', 'You are the underdog: in every close call pick the higher ceiling.')
    : tx('Duelo cerrado: revisa cada FLEX y el reporte médico antes del kickoff.', 'Tight matchup: check every FLEX and the injury report before kickoff.');
  return `<div class="mp-head">${eq(LIGA.duenoYo || tx('Mi equipo', 'My team'), LIGA.rec && LIGA.rec[LIGA.rid], sy, 'l')}<span class="mp-vs">VS</span>${eq(LIGA.duenos[LIGA.rival] || 'Rival', LIGA.rec && LIGA.rec[LIGA.rival], sr, 'r')}</div>
    <div class="mp-prob"><span class="n">${pc}%</span><div class="wr-barra"><i style="width:${pc}%"></i></div><span class="n r">${100 - pc}%</span></div><p class="mp-lect">${lect}</p>`;
}
function tablero(L) {
  const act = LIGA.tit || [], abierto = tablero._abre;
  const corto = n => { const p = String(n).split(' '); return p.length > 1 && !/D\/ST$/.test(n) ? p[0][0] + '. ' + p.slice(1).join(' ') : n; };
  const celda = (j, lado) => j ? `<a class="mp-j ${lado}" href="#/jugador/${j.id}" data-hover-j="${j.id}"><b><span class="nl">${esc(j.n)}</span><span class="nc">${esc(corto(j.n))}</span></b><small>${esc(j.pos)} · ${esc(j.team)}${edo(j).e === 'pre' ? ' · ' + esc(rivalTxt(j.team)) : ''}</small></a>` : `<span class="mp-j ${lado} vacio">${tx('Vacío', 'Empty')}</span>`;
  const pts = j => { if (!j) return '<span class="mp-p"></span>'; const e = edo(j); return `<span class="mp-p ${e.e}">${e.e === 'pre' ? `<em>${n1(e.proy)}</em>` : e.e === 'bye' ? '<em class="x">BYE</em>' : e.e === 'out' ? `<em class="x">${tx('FUERA', 'OUT')}</em>` : `<b>${n1(e.pts)}</b>`}<small>${e.e === 'pre' ? (diaHora(e.kick) || 'PROY') : e.e === 'in' ? tx('EN VIVO', 'LIVE') : e.e === 'post' ? 'FINAL' : ''}</small></span>`; };
  const filas = L.yo.tit.map((x, i) => { const j = x.j, r = L.rv && L.rv.tit[i] && L.rv.tit[i].j, distinto = act.length && j && act[i] !== j.id, alts = !x.lock ? L.yo.banca.filter(b => SLOT_OK[x.s] && SLOT_OK[x.s].includes(b.pos) && disponible(b)) : [];
    return `<div class="mp-row ${x.lock ? 'lock' : ''} ${distinto ? 'dif' : ''}">${helmet(j ? j.team : 'FA', j ? j.num : '', 30)}${celda(j, 'l')}${pts(j)}
      <button type="button" class="mp-slot" data-swap="${i}" ${x.lock || !alts.length ? 'disabled' : ''} title="${tx('Cambiar', 'Swap')}">${SLOT_TXT[x.s] || x.s}${!x.lock && alts.length ? '<i>⇅</i>' : ''}</button>
      ${L.rv ? `${pts(r)}${celda(r, 'r')}${helmet(r ? r.team : 'FA', r ? r.num : '', 30)}` : '<span></span><span></span><span></span>'}</div>
      ${abierto === i ? `<div class="mp-alts">${alts.map(b => `<button type="button" data-pon="${i}:${b.id}">${helmet(b.team, b.num, 24)}<span><b>${esc(b.n)}</b><small>${esc(b.pos)} · ${esc(rivalTxt(b.team))}</small></span><em class="n">${n1(edo(b).proy)}</em></button>`).join('')}</div>` : ''}`; }).join('');
  const nDif = act.length ? L.yo.tit.filter((x, i) => x.j && act[i] !== x.j.id).length : 0, tuyos = Object.keys(LIGA.fijos || {}).length;
  return `<div class="mp-lineup"><div class="mp-lh"><b>${tx('Titulares', 'Starters')}</b>${nDif ? `<a href="#/premium/alineacion" class="mp-aviso">${tx(`${nDif} cambio${nDif > 1 ? 's' : ''} pendiente${nDif > 1 ? 's' : ''} en Sleeper`, `${nDif} pending change${nDif > 1 ? 's' : ''} in Sleeper`)} ›</a>` : `<span class="mp-ok">${tx('Alineación óptima', 'Optimal lineup')}</span>`}${tuyos ? `<button type="button" class="mp-reset" data-reset>${tx('Volver a la óptima', 'Reset to optimal')}</button>` : ''}</div>${filas}
    <div class="mp-tot"><span>${tx('Total', 'Total')}</span><b class="n">${n1(L.sy.fin)}</b><span></span>${L.sr ? `<b class="n">${n1(L.sr.fin)}</b>` : '<span></span>'}<span></span></div>
    <details class="mp-banca"><summary>${tx('Banca', 'Bench')} · ${L.yo.banca.length}</summary>${L.yo.banca.map(b => `<div class="mp-row banca">${helmet(b.team, b.num, 26)}${celda(b, 'l')}${pts(b)}</div>`).join('')}</details></div>`;
}
function plan(L) {
  const slots = L.slots, al = alineacion(LIGA.jugadores, slots, LIGA.tit || [], LIGA.fijos || {}), A = [];
  cambios(slots).slice(0, 3).forEach(c => A.push({ n: c.urg === 3 ? 'urg' : 'mov', t: c.urg === 3 ? tx('URGENTE', 'URGENT') : tx('ALINEACIÓN', 'LINEUP'), txt: c.txt, ir: 'alineacion' }));
  if (!LIGA.tit) { const malos = al.tit.filter(x => x.j && ['out', 'bye'].includes(edo(x.j).e)); if (malos.length) A.push({ n: 'urg', t: tx('URGENTE', 'URGENT'), txt: tx('Tienes titulares fuera o en descanso: revisa tu alineación óptima.', 'You have starters out or on bye: check your optimal lineup.'), ir: 'alineacion' }); }
  al.tit.filter(x => x.j && edo(x.j).e === 'pre' && estatus(x.j) === 'Duda').forEach(x => { const b = al.banca.find(y => SLOT_OK[x.s].includes(y.pos) && disponible(y)); A.push({ n: 'ojo', t: tx('EN DUDA', 'QUESTIONABLE'), txt: tx(`${x.j.n} está en duda${parte(x.j) ? ' (' + parte(x.j) + ')' : ''}. ${b ? `Si lo descartan, tu plan B es ${b.n} (${n1(edo(b).proy)} pts).` : 'No tienes plan B en la banca: mira waivers.'}`, `${x.j.n} is questionable${parte(x.j) ? ' (' + parte(x.j) + ')' : ''}. ${b ? `If ruled out, your plan B is ${b.n} (${n1(edo(b).proy)} pts).` : 'No plan B on your bench: check waivers.'}`), ir: 'alineacion' }); });
  const w = waiversPara(al)[0]; if (w && (w.mej > 1.5 || w.her)) A.push({ n: 'add', t: 'WAIVER', txt: tx(`Agrega a ${w.j.n}${w.suelta ? ` y suelta a ${w.suelta.n}` : ''}: ${w.her ? `hereda el trabajo de ${w.her.n} (fuera)` : `+${n1(w.mej)} pts sobre tu ${w.j.pos} titular más débil`}.`, `Add ${w.j.n}${w.suelta ? ` and drop ${w.suelta.n}` : ''}: ${w.her ? `inherits ${w.her.n}'s work (out)` : `+${n1(w.mej)} pts over your weakest ${w.j.pos} starter`}.`), ir: 'waivers' });
  const s = streaming(al)[0]; if (s && s.gan > 2) A.push({ n: 'add', t: 'STREAMING', txt: tx(`Cambia tu ${s.j.pos}: ${s.j.n} proyecta ${n1(edo(s.j).proy)} (${s.mi ? '+' + n1(s.gan) + ' sobre ' + s.mi.n : 'no tienes ' + s.j.pos})`, `Stream your ${s.j.pos}: ${s.j.n} projects ${n1(edo(s.j).proy)} (${s.mi ? '+' + n1(s.gan) + ' over ' + s.mi.n : 'you have no ' + s.j.pos})`), ir: 'waivers' });
  const ti = tradeIdeas(al); if (ti.vende[0]) { const v = ti.vende[0]; A.push({ n: 'trade', t: tx('VENDE ALTO', 'SELL HIGH'), txt: tx(`${v.j.n} hizo ${n1(v.u)} pts, su promedio es ${n1(v.ppj)}. Su valor de mercado está en el pico: ofrécelo hoy.`, `${v.j.n} scored ${n1(v.u)} pts vs a ${n1(v.ppj)} average. His market value peaked: shop him today.`), ir: 'trades' }); }
  if (!A.length) A.push({ n: 'ok', t: 'OK', txt: tx('Tu alineación ya es la óptima y no hay movimientos que te mejoren hoy. Vuelve después del reporte médico.', 'Your lineup is already optimal and no move improves you today. Check back after the injury report.'), ir: '' });
  return `<ol class="wr-plan">${A.slice(0, 6).map((a, i) => `<li class="${a.n}"><span class="wr-n n">${i + 1}</span><span class="wr-t">${a.t}</span><p>${enlaza(esc(a.txt), [])}</p>${a.ir ? `<a class="wr-go" href="#/premium/${a.ir}">${tx('Resolver', 'Fix it')} ›</a>` : ''}</li>`).join('')}</ol>`;
}
function vistaSemana(L, pro) {
  const al = L.yo, wv = waiversPara(al), ti = tradeIdeas(al), alertas = LIGA.jugadores.map(id => J[id]).filter(j => j && (fuera(j) || estatus(j) === 'Duda'));
  const tiles = [['alineacion', ART.linea, tx('¿A quién arranco?', 'Who do I start?'), tx('Compara dos jugadores', 'Compare two players')], ['waivers', ART.iman, `${wv.length} waivers`, tx('que mejoran tu equipo', 'that upgrade you')], ['trades', ART.trade, `${ti.targets.length + ti.vende.length + ti.compra.length} trades`, tx('vende alto, compra bajo', 'sell high, buy low')], ['plantel', ART.sirena, `${alertas.length} ${tx('alertas', 'alerts')}`, tx('salud de tu plantel', 'roster health')]];
  const resto = `<section class="wr-sec"><div class="wr-h"><h3>${tx('Qué hacer esta semana', 'What to do this week')}</h3></div>${plan(L)}</section>
    <div class="wr-tiles">${tiles.map(([h, a, t, d]) => `<a class="wr-tile" href="#/premium/${h}">${pixel(a)}<b>${t}</b><small>${d}</small></a>`).join('')}</div>`;
  return `<section class="wr-sec mp">${marcador(L)}${pro ? tablero(L) : ''}</section>${pro ? resto : zonaPrem(tablero(L) + resto, tx('Tu alineación óptima, tu matchup y tu plan de la semana', 'Your optimal lineup, matchup and weekly plan'))}`;
}
function vistaAlineacion(L) {
  const al = alineacion(LIGA.jugadores, L.slots, LIGA.tit || [], LIGA.fijos || {}), cs = cambios(L.slots), mis = LIGA.jugadores.map(id => J[id]).filter(j => j && disponible(j)).sort((a, b) => edo(b).proy - edo(a).proy);
  const linea = x => { const j = x.j; if (!j) return `<div class="wr-al vacio"><span class="wr-slot">${SLOT_TXT[x.s] || x.s}</span><p>${tx('Vacío: no tienes a nadie elegible. Revisa waivers.', 'Empty: nobody eligible. Check waivers.')}</p></div>`;
    const e = edo(j), ft = fiL(j), u = ult3(j);
    const det = e.e === 'post' ? tx(`Ya jugó: ${n1(e.pts)} pts. Fijo.`, `Already played: ${n1(e.pts)} pts. Locked.`) : e.e === 'in' ? tx(`Jugando: ${n1(e.pts)} pts hasta ahora. Fijo.`, `Playing: ${n1(e.pts)} pts so far. Locked.`) : e.e === 'out' ? tx('FUERA esta semana: no lo alinees.', 'OUT this week: bench him.') : e.e === 'bye' ? tx('Semana de descanso.', 'Bye week.')
      : `${rangoPos(j)} · ${matchupTxt(j)}${u != null ? ' · ' + tx('últimas 3: ', 'last 3: ') + n1(u) : ''}${ft ? ' · ' + tx('piso/techo ', 'floor/ceiling ') + n1(ft[0]) + '–' + n1(ft[1]) : ''}`;
    return `<div class="wr-al ${x.lock ? 'lock' : ''}"><span class="wr-slot">${SLOT_TXT[x.s] || x.s}</span>${jLink(j)}<span class="wr-ed">${chipEdo(j)}</span><p>${det}</p></div>`; };
  const op = (sel) => mis.map(j => `<option value="${j.id}" ${j.id === sel ? 'selected' : ''}>${esc(j.n)} · ${j.pos} · ${n1(edo(j).proy)}</option>`).join('');
  const a0 = mis[0] && mis[0].id, b0 = (mis.find(j => mis[0] && j.pos === mis[0].pos && j.id !== a0) || mis[1] || {}).id;
  return `${cs.length ? `<section class="wr-sec"><div class="wr-h"><h3>${tx('Cambios que debes hacer en Sleeper', 'Moves to make in Sleeper')}</h3><small>${cs.length}</small></div><ol class="wr-plan">${cs.map((c, i) => `<li class="${c.urg === 3 ? 'urg' : 'mov'}"><span class="wr-n n">${i + 1}</span><span class="wr-t">${SLOT_TXT[c.s] || c.s}</span><p>${esc(c.txt)}</p></li>`).join('')}</ol></section>` : LIGA.tit ? `<p class="wr-ok">${tx('Tu alineación en Sleeper ya es la óptima según el FX Tech Analyzer.', 'Your Sleeper lineup is already optimal per the FX Tech Analyzer.')}</p>` : ''}
    <section class="wr-sec"><div class="wr-h"><h3>${tx('Alineación óptima', 'Optimal lineup')} · ${tx('Semana', 'Week')} ${semActual()}</h3><small>${FMTS[fmtL()]} · ${tx('proy', 'proj')} ${n1(al.total)}</small></div><div class="wr-als">${al.tit.map(linea).join('')}</div>
      <details class="wr-banca"><summary>${tx('Banca', 'Bench')} · ${al.banca.length}</summary>${al.banca.map(j => `<div class="wr-al banca">${jLink(j, edo(j).e === 'pre' ? matchupTxt(j) : '')}<span class="wr-ed">${chipEdo(j)}</span></div>`).join('')}</details></section>
    <section class="wr-sec" id="duelo-sec"><div class="wr-h"><h3>${tx('¿A quién arranco?', 'Who do I start?')}</h3><small>${tx('Elige dos de tus jugadores', 'Pick two of your players')}</small></div>
      <div class="wr-duelo-f"><select data-duelo="a">${op(a0)}</select><span>VS</span><select data-duelo="b">${op(b0)}</select></div><div id="duelo-res">${a0 && b0 ? dueloHtml(J[a0], J[b0]) : ''}</div></section>`;
}
function dueloHtml(a, b) {
  if (!a || !b || a === b) return '';
  const ea = edo(a), eb = edo(b), sd = Math.sqrt(sdJ(a) ** 2 + sdJ(b) ** 2), pa = phi((ea.proy - eb.proy) / sd), g = pa >= .5 ? a : b, pg = Math.round(Math.max(pa, 1 - pa) * 100);
  const col = (j, e) => { const ft = fiL(j), u = ult3(j), r = rivalDe(j.team), es = r && estrellas(r.opp, j.pos); return `<div class="wr-dc ${j === g ? 'gana' : ''}">${jLink(j)}<dl><dt>${tx('Proyección', 'Projection')}</dt><dd class="n">${n1(e.proy)}</dd><dt>${tx('Últimas 3', 'Last 3')}</dt><dd class="n">${u != null ? n1(u) : '–'}</dd><dt>${tx('Piso / techo', 'Floor / ceiling')}</dt><dd class="n">${ft ? n1(ft[0]) + ' / ' + n1(ft[1]) : '–'}</dd><dt>${tx('Rival', 'Opponent')}</dt><dd>${r ? (r.home ? 'vs ' : '@ ') + r.opp + ' ' + pintaEstrellas(es) : 'BYE'}</dd><dt>${tx('Salud', 'Health')}</dt><dd>${estatus(j) === 'Sano' ? tx('Sano', 'Healthy') : esc(estatus(j))}</dd></dl></div>`; };
  const techo = (fiL(a) || [0, 0])[1] > (fiL(b) || [0, 0])[1] ? a : b, piso = (fiL(a) || [0, 0])[0] > (fiL(b) || [0, 0])[0] ? a : b;
  return `<div class="wr-dv"><b>${tx('Arranca a', 'Start')} ${esc(g.n)}</b><span class="n">${pg}%</span><small>${tx(`de probabilidad de superar a ${(g === a ? b : a).n} según su proyección y su variación semanal.`, `chance to outscore ${(g === a ? b : a).n} based on projection and weekly variance.`)}</small>
    <p>${pg < 58 ? tx(`Es casi un volado. Si vas de favorito elige piso (${esc(piso.n)}); si vas abajo elige techo (${esc(techo.n)}).`, `It's nearly a coin flip. If you're favored pick floor (${esc(piso.n)}); if you're behind pick ceiling (${esc(techo.n)}).`) : tx('Ventaja clara en los datos.', 'Clear edge in the data.')}</p></div><div class="wr-dg">${col(a, ea)}${col(b, eb)}</div>`;
}
function vistaWaivers(L) {
  const al = alineacion(LIGA.jugadores, L.slots, LIGA.tit || [], LIGA.fijos || {}), W = waiversPara(al), S = streaming(al);
  const card = x => `<div class="wr-wv">${jLink(x.j, rangoPos(x.j) + ' · ' + matchupTxt(x.j))}<b class="n wr-big">${n1(x.pr)}</b>
    <div class="wr-tags">${x.add ? `<span>▲ ${nf.format(x.add)} ${tx('ligas en 24 h', 'leagues in 24 h')}</span>` : ''}${x.her ? `<span class="hot">${tx('Hereda el trabajo de', 'Inherits work from')} ${esc(x.her.n)}</span>` : ''}${x.mej > .5 ? `<span class="ok">+${n1(x.mej)} ${tx('vs tu titular', 'vs your starter')}</span>` : ''}<span>${tx('Valor resto de temporada', 'Rest-of-season value')} ${Math.round(x.v)}</span></div>
    ${x.suelta ? `<p class="wr-drop">${tx('Suelta a', 'Drop')} <a href="#/jugador/${x.suelta.id}">${esc(x.suelta.n)}</a> · ${tx('valor', 'value')} ${Math.round(valorROS(x.suelta).valor)}</p>` : ''}</div>`;
  return `<section class="wr-sec"><div class="wr-h"><h3>${tx('Waivers para tu equipo', 'Waivers for your team')}</h3><small>${tx('Libres en tu liga · ordenados por impacto', 'Free in your league · sorted by impact')}</small></div>
    <div class="wr-wvs">${W.map(card).join('') || `<p class="wr-ok">${tx('No hay libres que mejoren tu equipo hoy.', 'No free agents upgrade your team today.')}</p>`}</div></section>
    ${S.length ? `<section class="wr-sec"><div class="wr-h"><h3>Streaming K / DEF</h3><small>${tx('Solo si mejora al que tienes', 'Only if it beats yours')}</small></div>${S.map(s => `<div class="wr-al banca">${jLink(s.j, matchupTxt(s.j))}<b class="n">${n1(edo(s.j).proy)}</b><p>${s.mi ? tx(`+${n1(s.gan)} sobre ${s.mi.n}`, `+${n1(s.gan)} over ${s.mi.n}`) : tx('No tienes uno alineado', 'You have none in your lineup')}</p></div>`).join('')}</section>` : ''}`;
}
function vistaTrades(L) {
  const al = alineacion(LIGA.jugadores, L.slots, LIGA.tit || [], LIGA.fijos || {}), T = tradeIdeas(al);
  if (!LIGA.otros) return `<p class="wr-ok">${tx('Conecta Sleeper para ver los planteles de tus rivales y armar trades reales.', 'Connect Sleeper to see your rivals\' rosters and build real trades.')}</p>`;
  const lnk = (d, r) => `<a class="wr-go" href="#/trade?da=${d}&recibe=${r}">${tx('Analizar trade', 'Analyze trade')} ›</a>`;
  return `<section class="wr-sec"><div class="wr-h"><h3>${tx('Refuerza tu', 'Upgrade your')} ${T.debil}</h3><small>${tx('Tu posición más débil contra el resto de la liga', 'Your weakest spot vs the league')}</small></div>
    ${T.targets.map(x => `<div class="wr-tr">${jLink(x.j, LIGA.duenos[x.rid] ? tx('de', 'from') + ' ' + esc(LIGA.duenos[x.rid]) : '')}<p>${tx('Ofrece a', 'Offer')} <b>${esc(x.of.n)}</b> · ${tx('valor', 'value')} ${Math.round(valorROS(x.of).valor)} ${tx('por', 'for')} ${Math.round(x.v)}</p>${lnk(x.of.id, x.j.id)}</div>`).join('') || `<p class="wr-ok">${tx('No vemos un trade justo que te mejore en esa posición.', 'No fair trade improves that spot right now.')}</p>`}</section>
    <section class="wr-sec"><div class="wr-h"><h3>${tx('Vende alto', 'Sell high')}</h3><small>${tx('Tuyos con una semana muy por encima de su promedio', 'Yours with a week far above their average')}</small></div>
    ${T.vende.map(x => `<div class="wr-tr">${jLink(x.j)}<p>${tx(`S${SEMNUM}: ${n1(x.u)} pts · promedio ${n1(x.ppj)}. Su precio nunca va a estar más alto.`, `W${SEMNUM}: ${n1(x.u)} pts · average ${n1(x.ppj)}. His price won't get higher.`)}</p></div>`).join('') || `<p class="wr-ok">${tx('Nadie de tu plantel está inflado esta semana.', 'Nobody on your roster is inflated this week.')}</p>`}</section>
    <section class="wr-sec"><div class="wr-h"><h3>${tx('Compra bajo', 'Buy low')}</h3><small>${tx('De tus rivales: buenos jugadores en mala racha', 'From your rivals: good players in a slump')}</small></div>
    ${T.compra.map(x => `<div class="wr-tr">${jLink(x.j, LIGA.duenos[x.rid] ? tx('de', 'from') + ' ' + esc(LIGA.duenos[x.rid]) : '')}<p>${tx(`Últimas 3: ${n1(x.u3)} pts · su nivel real: ${n1(x.vr.ppj)}. Su dueño puede venderlo barato.`, `Last 3: ${n1(x.u3)} pts · true level: ${n1(x.vr.ppj)}. His owner may sell cheap.`)}</p></div>`).join('') || `<p class="wr-ok">${tx('Sin oportunidades claras hoy.', 'No clear opportunities today.')}</p>`}</section>`;
}
function vistaPlantel() {
  const mis = LIGA.jugadores.map(id => J[id]).filter(Boolean).sort((a, b) => valorROS(b).valor - valorROS(a).valor), tit = new Set(LIGA.tit || []);
  const tag = j => { const v = valorROS(j), u = ptsSem(j, SEMNUM); if (fueraTemp(j)) return [tx('RESERVA', 'IR'), 'no']; if (u != null && v.ppj > 0 && u >= v.ppj * 1.7 && u >= 15) return [tx('VENDE ALTO', 'SELL HIGH'), 'gold']; if (v.valor < 3 && !['K', 'DEF'].includes(j.pos)) return [tx('SOLTABLE', 'DROPPABLE'), 'no']; if (v.valor > 40) return [tx('PILAR', 'CORE'), 'ok']; return [tx('AGUANTA', 'HOLD'), 'mid']; };
  return `<section class="wr-sec"><div class="wr-h"><h3>${tx('Tu plantel', 'Your roster')}</h3><small>${tx('Ordenado por valor para el resto de la temporada', 'Sorted by rest-of-season value')}</small></div>
    <div class="card scroll"><table class="tbl wr-tbl"><thead><tr><th>${tx('JUGADOR', 'PLAYER')}</th><th>${tx('ESTA SEMANA', 'THIS WEEK')}</th><th>${tx('VALOR', 'VALUE')}</th><th>PPJ</th><th>${tx('PISO–TECHO', 'FLOOR–CEIL')}</th><th>${tx('ACCIÓN', 'ACTION')}</th></tr></thead><tbody>
    ${mis.map(j => { const v = valorROS(j), ft = fiL(j), t = tag(j); return `<tr><td>${jLink(j, tit.has(j.id) ? tx('titular', 'starter') : '')}</td><td><span class="wr-ed">${chipEdo(j)}</span></td><td class="n">${Math.round(v.valor)}</td><td class="n">${n1(v.ppj)}</td><td class="n">${ft ? n1(ft[0]) + '–' + n1(ft[1]) : '–'}</td><td><span class="rp ${t[1]}">${t[0]}</span></td></tr>`; }).join('')}</tbody></table></div></section>`;
}
function cuartoGuerra(tab, pro) {
  const L = lados(), vistas = { '': () => vistaSemana(L, pro), alineacion: () => vistaAlineacion(L), waivers: () => vistaWaivers(L), trades: () => vistaTrades(L), plantel: () => vistaPlantel(), exclusivas: () => exclusivasBloque(todasNoticias().filter(n => n.exclusivo).slice(0, 9), pro) };
  const v = vistas[tab] ? tab : '', libre = v === '' || v === 'plantel' || v === 'exclusivas';
  const cuerpo = vistas[v]();
  return `<div class="wr-top"><div class="wr-liga"><div><small>${LIGA.fuente === 'sleeper' ? 'SLEEPER' : 'MANUAL'} · ${FMTS[fmtL()]}${LIGA.equipos ? ' · ' + LIGA.equipos + ' ' + tx('equipos', 'teams') : ''} · ${tx('Semana', 'Week')} ${semActual()}</small><h1>${esc(LIGA.nombre || tx('Mi equipo', 'My team'))}</h1></div>
      <div class="cg-acc">${LIGA.fuente === 'sleeper' ? `<button type="button" class="btn ghost sm" data-cg-sync>${tx('Actualizar', 'Refresh')}</button>` : ''}<button type="button" class="btn ghost sm" data-cg-salir>${tx('Cambiar liga', 'Change league')}</button></div></div>
    <nav class="wr-tabs" aria-label="${tx('Herramientas', 'Tools')}">${TABS_CG.map(([k, es, en]) => `<a href="#/premium${k ? '/' + k : ''}" class="${k === v ? 'on' : ''}">${tx(es, en)}</a>`).join('')}</nav></div>
    <div class="wr-body">${pro || libre ? cuerpo : zonaPrem(cuerpo, tx('Desbloquea esta herramienta con Premium', 'Unlock this tool with Premium'))}${pieTech()}</div>`;
}
document.addEventListener('click', e => {
  const sw = e.target.closest('[data-swap]'); if (sw && !sw.disabled) { tablero._abre = tablero._abre === +sw.dataset.swap ? null : +sw.dataset.swap; repinta(); return; }
  const po = e.target.closest('[data-pon]'); if (po && LIGA) { const [i, id] = po.dataset.pon.split(':'); LIGA.fijos = { ...(LIGA.fijos || {}) }; Object.keys(LIGA.fijos).forEach(k => { if (LIGA.fijos[k] === id) delete LIGA.fijos[k]; }); LIGA.fijos[i] = id; tablero._abre = null; guardaLiga(); repinta(); return; }
  if (e.target.closest('[data-reset]') && LIGA) { LIGA.fijos = {}; tablero._abre = null; guardaLiga(); repinta(); }
});
document.addEventListener('change', e => { const s = e.target.closest('[data-duelo]'); if (!s) return; const a = document.querySelector('[data-duelo="a"]'), b = document.querySelector('[data-duelo="b"]'), r = document.getElementById('duelo-res'); if (r) r.innerHTML = dueloHtml(J[a.value], J[b.value]); });

function premiumHub(tab = '') {
  titulo('Premium FX');
  const pro = esPremium(), excl = todasNoticias().filter(n => n.exclusivo).slice(0, 6);
  sincroniza();
  const hero = pro ? `<div class="cg-hero solo"><div class="cg-hero-in"><span class="cg-tag">★ PREMIUM FX</span><h1>${tx('Tu cuarto de guerra', 'Your war room')}</h1><p class="prem-ok">★ ${tx('Eres Premium: todas las herramientas están desbloqueadas.', 'You are Premium: every tool is unlocked.')}</p></div>${sello()}</div>` : ventaHero();
  const venta = pro ? '' : niveles() + cadaSeccion() + precios();
  if (!LIGA || !(LIGA.jugadores || []).length) return `<div class="page pv">${crumbs([['', 'Premium FX']])}<div class="wrap">${hero}${pro ? '' : niveles()}<div id="pv-conecta">${conectaVista()}</div>${pro ? '' : cadaSeccion() + precios()}${exclusivasBloque(excl, pro)}</div></div>`;

  cargaVivo(semActual());
  return `<div class="page pv wr">${crumbs([['#/premium', 'Premium FX'], ['', LIGA.nombre || tx('Mi equipo', 'My team')]])}<div class="wrap">${cuartoGuerra(tab, pro)}${venta}</div></div>`;
}
function exclusivasBloque(L, pro) {
  return `<section class="block" data-chip="${tx('RED DE REPORTEROS', 'REPORTER NETWORK')}"><div class="head"><div><h2>${tx('Exclusivas FX', 'FX exclusives')}</h2><p class="hsub">${tx('Información de nuestra red de reporteros que no vas a encontrar en otro lado.', 'Information from our reporter network you won\'t find anywhere else.')}</p></div><a class="all" href="#/exclusivo">${tx('Todas', 'All')} ›</a></div>
    <div class="news stagger">${L.map(n => newsCard(n)).join('') || `<div class="empty">${tx('La primera exclusiva llega muy pronto.', 'The first exclusive arrives very soon.')}</div>`}</div></section>`;
}

/* ---------- Eventos ---------- */
const cgMsg = (t, mal) => { const m = document.getElementById('cg-msg'); if (m) { m.textContent = t; m.classList.toggle('mal', !!mal); } };
document.addEventListener('submit', async e => {
  const f = e.target.closest('form[data-cg="sleeper"]'); if (!f) return; e.preventDefault();
  cgMsg(tx('Buscando tus ligas…', 'Finding your leagues…'));
  try { _ligaOpc = await importaSleeper(f.u.value); if (_ligaOpc.ls.length === 1) { await cargaLigaSleeper(_ligaOpc.ls[0].league_id, _ligaOpc.u.user_id); _ligaOpc = null; mide('liga_conectada', { fuente: 'sleeper' }); return repinta(); } repinta(); cgMsg(tx('Elige tu liga:', 'Pick your league:')); }
  catch (er) { cgMsg(er.message && !/^\d+$/.test(er.message) ? er.message : tx('No pudimos conectar con Sleeper. Revisa el usuario.', 'We couldn\'t reach Sleeper. Check the username.'), true); }
});
document.addEventListener('click', async e => {
  const l = e.target.closest('[data-cg-lid]');
  if (l && _ligaOpc) { cgMsg(tx('Trayendo tu equipo…', 'Bringing your team…')); try { await cargaLigaSleeper(l.dataset.cgLid, _ligaOpc.u.user_id); _ligaOpc = null; mide('liga_conectada', { fuente: 'sleeper' }); repinta(); } catch (er) { cgMsg(er.message, true); } return; }
  const m = e.target.closest('[data-cg-modo]');
  if (m) { document.querySelectorAll('[data-cg-modo]').forEach(b => b.classList.toggle('on', b === m)); const man = m.dataset.cgModo === 'manual'; document.querySelector('form[data-cg="sleeper"]').hidden = man; document.querySelector('.cg-manual').hidden = !man; return; }
  const a = e.target.closest('[data-cg-add]');
  if (a) { LIGA = LIGA && LIGA.fuente === 'manual' ? LIGA : { fuente: 'manual', nombre: tx('Mi equipo', 'My team'), slots: POS_BASE, jugadores: [], fmt: +(document.getElementById('cg-fmt') || { value: FMT }).value, fecha: new Date().toISOString() };
    if (!LIGA.jugadores.includes(a.dataset.cgAdd)) LIGA.jugadores.push(a.dataset.cgAdd); guardaLiga(); cgMsg(tx(`${LIGA.jugadores.length} jugadores en tu plantel. Agrega todos y listo.`, `${LIGA.jugadores.length} players on your roster. Add them all and you're set.`));
    a.disabled = true; a.textContent = '✓'; if (LIGA.jugadores.length === 1) mide('liga_conectada', { fuente: 'manual' }); return; }
  if (e.target.closest('[data-cg-listo]')) { if (LIGA && LIGA.jugadores.length) repinta(); else cgMsg(tx('Agrega al menos un jugador.', 'Add at least one player.'), true); return; }
  if (e.target.closest('[data-cg-salir]')) { LIGA = null; _ligaOpc = null; guardaLiga(); repinta(); return; }
  if (e.target.closest('[data-cg-sync]')) { if (LIGA) LIGA.fecha = 0; sincroniza(); return; }
});
document.addEventListener('input', e => {
  if (e.target.id === 'cg-fmt' && LIGA && LIGA.fuente === 'manual') { LIGA.fmt = +e.target.value; guardaLiga(); }
  if (e.target.id !== 'cg-busca') return;
  const q = e.target.value.trim().toLowerCase(), box = document.getElementById('cg-res'); if (!box) return;
  if (q.length < 2) { box.innerHTML = ''; return; }
  const ya = new Set((LIGA && LIGA.jugadores) || []);
  box.innerHTML = Object.values(J).filter(j => j.n && j.n.toLowerCase().includes(q) && ['QB', 'RB', 'WR', 'TE', 'K', 'DEF'].includes(j.pos)).sort((a, b) => (b.proy ? b.proy[0] : 0) - (a.proy ? a.proy[0] : 0)).slice(0, 8)
    .map(j => `<div class="cg-res">${helmet(j.team, j.num, 26)}<span><b>${esc(j.n)}</b><small>${esc(j.pos)} · ${esc(j.team)}</small></span><button type="button" class="btn sm" data-cg-add="${j.id}" ${ya.has(j.id) ? 'disabled' : ''}>${ya.has(j.id) ? '✓' : '+'}</button></div>`).join('');
});

function router() {
  const [ruta, qs] = ((location.hash || window.FX_RUTA || '').slice(1) || '/').split('?');
  const q = new URLSearchParams(qs || ''), [, seccion, a, b] = ruta.split('/');
  const R = { '': () => inicio(), blog: () => a ? blogNota(a) : blogLista(), noticias: () => noticias(q), reportajes: () => noticias(q), noticia: () => noticia(a), reportaje: () => noticia(a), jugador: () => jugador(a), comparar: () => comparar(a, b), posicion: () => posicion(a),
    equipos: () => equipos(), equipo: () => equipo(a), partidos: () => partidos(q), partido: () => partido(a), lideres: () => lideres(q), media: () => media(), exclusivo: () => exclusivo(), premium: () => premiumHub(a || ''), temporada: () => temporada(), semana: () => semana(a), tendencias: () => tendencias(), lesionados: () => lesionados(q),
    cuenta: () => cuenta(q), herramientas: () => herramientas(), trade: () => trade(q), privacidad: () => privacidad(), baja: () => baja(q) };
  app.innerHTML = (R[seccion || ''] || noEncontrado)();
  if (ruta !== _rutaPrev) { _rutaPrev = ruta; app.classList.remove('entra'); void app.offsetWidth; app.classList.add('entra'); }
  scrollTo({ top: 0 });
  vista(ruta + (seccion === 'noticias' || seccion === 'lideres' || seccion === 'lesionados' ? (qs ? '?' + qs : '') : ''));
  const act = s => s === (seccion || '') || (seccion === 'exclusivo' && s === 'premium') || (seccion === 'noticia' && s === 'noticias') || (seccion === 'partido' && s === 'partidos') || (seccion === 'semana' && s === 'temporada') || (seccion === 'trade' && s === 'herramientas');
  document.querySelectorAll('.links a').forEach(l => l.classList.toggle('act', act(l.dataset.s)));
  if ($('.links').classList.contains('open')) menu(false, true);
  if (seccion === 'posicion') montaTabla(a);
  if (seccion === 'premium') animaPremium();
  document.querySelectorAll('.vid').forEach(v => v.onclick = () => { v.querySelector('.thumb').innerHTML = `<iframe src="https://www.youtube.com/embed/${v.dataset.v}?autoplay=1&rel=0" title="Video de Fantasy Expertos" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe>`; v.onclick = null; });
  const du = $('.duelo');
  document.querySelectorAll('.pick').forEach(btn => btn.onclick = () => {
    const fx = du.dataset.fx, mio = btn.dataset.l;
    document.querySelectorAll('.pick').forEach(x => { x.classList.toggle('mine', x === btn); x.classList.toggle('fx', x.dataset.l === fx); $('.pk-res', x).textContent = x.dataset.l === fx ? (x === btn ? '✓ Coincides con los expertos' : '★ Elección de los expertos') : (x === btn ? 'Tu elección' : ''); });
    $('#verdict').classList.add('show'); du.classList.add('done');
  });
  const ad = $('#armaduelo');
  if (ad) ad.onsubmit = e => { e.preventDefault(); const f = new FormData(ad), q = v => P.find(j => j.n.toLowerCase() === String(v || '').trim().toLowerCase());
    const x = q(f.get('a')), y = q(f.get('b')); if (x && y) location.hash = '#/comparar/' + x.id + '/' + y.id; else ad.classList.add('err'); };
  document.querySelectorAll('.stx-tabs button').forEach(bt => bt.onclick = () => { stxSel = bt.dataset.p; document.querySelectorAll('.stx-tabs button').forEach(x => x.classList.toggle('on', x === bt)); $('#stx-list').innerHTML = listaStarts(stxSel); });
}

/* =============================== BUSCADOR =============================== */
function buscador() {
  const inp = $('#q'), box = $('#sugg'); let sel = -1, res = [];
  const pinta = () => {
    const v = inp.value.trim().toLowerCase();
    box.innerHTML = res.map((j, i) => `<a href="#/jugador/${j.id}" class="${i === sel ? 'sel' : ''}">${helmet(j.team, j.num, 44)}<span>${esc(j.n)}</span><span class="pos">${j.pos === 'DEF' ? 'DEF' : esc(j.pos)}</span><span class="team">${esc(j.team)}</span></a>`).join('')
      + Object.keys(EQUIPOS).filter(t => v.length > 1 && (t.toLowerCase() === v || EQUIPOS[t].toLowerCase().includes(v))).slice(0, 3).map(t => `<a href="#/equipo/${t}">${helmet(t, '', 44)}<span>${EQUIPOS[t]}</span><span class="team">Equipo</span></a>`).join('');
    if (!box.innerHTML && v.length > 1) box.innerHTML = `<div class="sugg-vacio">Sin resultados para «${esc(inp.value.trim())}». Prueba con el apellido o el nombre del equipo.</div>`;
    box.classList.toggle('on', !!box.innerHTML);
  };
  inp.oninput = () => { const v = inp.value.trim().toLowerCase(); sel = -1; res = v.length < 2 ? [] : P.filter(j => j.n.toLowerCase().includes(v)).sort((a, b) => b.pEst - a.pEst).slice(0, 8); pinta(); };
  inp.onkeydown = e => { const L = box.querySelectorAll('a');
    if (e.key === 'ArrowDown') { sel = Math.min(L.length - 1, sel + 1); e.preventDefault(); pinta(); } else if (e.key === 'ArrowUp') { sel = Math.max(0, sel - 1); e.preventDefault(); pinta(); }
    else if (e.key === 'Enter' && L[Math.max(0, sel)]) { location.hash = L[Math.max(0, sel)].getAttribute('href'); cierra(); } else if (e.key === 'Escape') cierra(); };
  const cierra = () => { box.classList.remove('on'); inp.value = ''; inp.blur(); };
  box.onclick = cierra;
  document.addEventListener('click', e => { if (!e.target.closest('.search')) box.classList.remove('on'); });
}

/* =============================== ARRANQUE =============================== */
/* App instalable: funciona sin internet con lo último guardado y se puede agregar a la pantalla de inicio */
if ('serviceWorker' in navigator) addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
addEventListener('beforeinstallprompt', e => {
  e.preventDefault(); const aviso = e, links = $('.links'); if (!links || $('#instalar')) return;
  const b = document.createElement('a'); b.id = 'instalar'; b.href = '#'; b.textContent = '⬇ INSTALAR'; b.className = 'instalar';
  b.onclick = ev => { ev.preventDefault(); aviso.prompt(); aviso.userChoice.finally(() => b.remove()); };
  links.appendChild(b);
});
const BASE = 'data/v2/';
const cargar = (f, d) => fetch(BASE + f + '?v=' + Math.floor(Date.now() / 60000)).then(r => r.ok ? r.json() : d).catch(() => d);
Promise.all([cargar('hoy.json', null), cargar('jugadores.json', []), cargar('archivo.json', []), cargar('semanas.json', {}), fetch('data/redes.json').then(r => r.json()).catch(() => ({})), cargar('videos.json', {}), cargar('calendario.json', null), cargar('externas.json', [])])
.then(([hoy, jugadores, archivo, resumenes, redes, videos, calendario, externas]) => {
  if (!hoy) throw new Error('sin datos');
  P = Array.isArray(jugadores) ? jugadores.filter(j => j && j.n) : [];
  P.forEach(j => J[j.id] = j);
  D = hoy;
  D.noticias = (hoy.noticias || []).map(normN);
  D.archivo = (Array.isArray(archivo) ? archivo : []).map(normN);
  D.lesionados = (hoy.lesionados || []).filter(x => x.id && J[x.id]);
  D.agregados = hoy.agregados || []; D.soltados = hoy.soltados || [];
  D.resumenes = resumenes || {}; D.redes = redes || {}; D.videos = videos || {}; D.cal = calendario; D.externas = externas || [];
  aplicaFormato();
  document.querySelectorAll('.fmt button').forEach((b, i) => b.onclick = () => { FMT = i; try { localStorage.setItem('fx-fmt', i); } catch (e) {} aplicaFormato(); router(); });
  const pie = $('#pie-redes'); if (pie) pie.innerHTML = `<div id="pie-news"></div><div class="follow"><div><h3>Síguenos</h3><p>Tips diarios, el podcast y los videos de cada semana.</p></div>${grupoRedes()}</div>`;
  pintaCuentaBtn(); if (ls(SB_LLAVE) || /[?&]code=/.test(location.search)) cargaSB().catch(() => {});
  const fu = $('#fuentes'); if (fu) fu.textContent = tx('Datos: ', 'Data: ') + (hoy.fuentes || ['Sleeper', 'ESPN']).join(', ') + '.';
  buscador(); cargaPartidos();
  aplicaIdioma();
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && $('.links').classList.contains('open')) menu(false); });
  addEventListener('hashchange', router);
  router();
}).catch(e => { app.innerHTML = '<div class="wrap loading"><p class="px">Actualizando datos</p><p>Estamos preparando la información. Vuelve en un par de minutos.</p></div>'; console.error(e); });
})();

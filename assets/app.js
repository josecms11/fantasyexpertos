/* FANTASY EXPERTOS – app v10. Todo se arma desde data/v2/*.json (motor en GitHub Actions) + ESPN en vivo. */
(() => {
const $ = (s, el = document) => el.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const app = $('#app');

const EQUIPOS = { ARI: 'Arizona Cardinals', ATL: 'Atlanta Falcons', BAL: 'Baltimore Ravens', BUF: 'Buffalo Bills', CAR: 'Carolina Panthers', CHI: 'Chicago Bears', CIN: 'Cincinnati Bengals', CLE: 'Cleveland Browns', DAL: 'Dallas Cowboys', DEN: 'Denver Broncos', DET: 'Detroit Lions', GB: 'Green Bay Packers', HOU: 'Houston Texans', IND: 'Indianapolis Colts', JAX: 'Jacksonville Jaguars', KC: 'Kansas City Chiefs', LV: 'Las Vegas Raiders', LAC: 'Los Angeles Chargers', LAR: 'Los Angeles Rams', MIA: 'Miami Dolphins', MIN: 'Minnesota Vikings', NE: 'New England Patriots', NO: 'New Orleans Saints', NYG: 'New York Giants', NYJ: 'New York Jets', PHI: 'Philadelphia Eagles', PIT: 'Pittsburgh Steelers', SF: 'San Francisco 49ers', SEA: 'Seattle Seahawks', TB: 'Tampa Bay Buccaneers', TEN: 'Tennessee Titans', WAS: 'Washington Commanders' };
const COL = { ARI: ['#97233F', '#FFB612'], ATL: ['#A71930', '#101820'], BAL: ['#241773', '#9E7C0C'], BUF: ['#00338D', '#C60C30'], CAR: ['#0085CA', '#101820'], CHI: ['#0B162A', '#C83803'], CIN: ['#FB4F14', '#101820'], CLE: ['#311D00', '#FF3C00'], DAL: ['#003594', '#869397'], DEN: ['#FB4F14', '#002244'], DET: ['#0076B6', '#B0B7BC'], GB: ['#203731', '#FFB612'], HOU: ['#03202F', '#A71930'], IND: ['#002C5F', '#A2AAAD'], JAX: ['#006778', '#D7A22A'], KC: ['#E31837', '#FFB81C'], LV: ['#101820', '#A5ACAF'], LAC: ['#0080C6', '#FFC20E'], LAR: ['#003594', '#FFA300'], MIA: ['#008E97', '#FC4C02'], MIN: ['#4F2683', '#FFC62F'], NE: ['#002244', '#C60C30'], NO: ['#D3BC8D', '#101820'], NYG: ['#0B2265', '#A71930'], NYJ: ['#125740', '#FFFFFF'], PHI: ['#004C54', '#A5ACAF'], PIT: ['#FFB612', '#101820'], SF: ['#AA0000', '#B3995D'], SEA: ['#002244', '#69BE28'], TB: ['#D50A0A', '#FF7900'], TEN: ['#0C2340', '#4B92DB'], WAS: ['#5A1414', '#FFB612'] };
const col = t => COL[t] || ['#2E6B47', '#5BC489'];
const vars = t => `--c1:${col(t)[0]};--c2:${col(t)[1]}`;
const POSICIONES = { QB: 'Quarterbacks', RB: 'Running backs', WR: 'Receptores', TE: 'Alas cerradas', K: 'Pateadores' };
const ESTATUS = { Questionable: 'Duda', Doubtful: 'Duda', Out: 'Fuera', IR: 'Fuera', PUP: 'Fuera', Sus: 'Fuera', NA: 'Fuera' };
const ETIQUETAS = ['START', 'SIT', 'WAIVER', 'LESIÓN', 'TRADE', 'TENDENCIA'];
const ETQ = { START: 'START', SIT: 'SIT', WAIVER: 'WAIVER WIRE', LESIÓN: 'REPORTE MÉDICO', TRADE: 'TRADE', TENDENCIA: 'TENDENCIA' };
const DIVS = { AFC: { ESTE: ['BUF', 'MIA', 'NE', 'NYJ'], NORTE: ['BAL', 'CIN', 'CLE', 'PIT'], SUR: ['HOU', 'IND', 'JAX', 'TEN'], OESTE: ['DEN', 'KC', 'LV', 'LAC'] },
  NFC: { ESTE: ['DAL', 'NYG', 'PHI', 'WAS'], NORTE: ['CHI', 'DET', 'GB', 'MIN'], SUR: ['ATL', 'CAR', 'NO', 'TB'], OESTE: ['ARI', 'LAR', 'SF', 'SEA'] } };
const FMTS = ['PPR', 'HALF PPR', 'STANDARD'];
let FMT = 0; try { FMT = +(localStorage.getItem('fx-fmt') || 0) || 0; } catch (e) {}

let D = null, P = [], J = {}, RANKPOS = {}, RANKW = {}, SEMNUM = null;

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
const CORTE = { QB: [12, 20], RB: [24, 40], WR: [30, 50], TE: [10, 18], K: [12, 18] };
function veredicto(j) {
  const r = rivalDe(j.team), st = estatus(j), razones = [];
  if (j.team === 'FA') return { v: 'SIT', razones: ['Agente libre: no tiene equipo esta semana.'], e: null };
  if (fuera(j)) return { v: 'OUT', razones: [`${fueraTemp(j) ? 'En reserva de lesionados' : 'Descartado para esta semana'}${parte(j) ? ' (' + parte(j) + ')' : ''}. No lo alinees.`], e: null };
  if (!r) return { v: 'BYE', razones: ['Semana de descanso: su equipo no juega.'], e: null };
  const k = RANKW[j.id] || 99, [c1, c2] = CORTE[j.pos] || [12, 18];
  const e = estrellas(r.opp, j.pos);
  razones.push(j.p != null ? `Proyección ${FMTS[FMT]} de ${n1(j.p)} pts: es el ${j.pos}${k} de la semana ${semActual()}.` : `Sin proyección oficial; por su promedio (${n1(j.prom)}) es el ${j.pos}${k} de la semana.`);
  if (e) razones.push(`${r.home ? 'En casa' : 'De visita'} ante ${r.opp}: ${e.n >= 4 ? 'defensa que regala puntos' : e.n <= 2 ? 'defensa dura' : 'matchup neutral'} contra ${j.pos} (Nº${e.rank} en puntos permitidos).`);
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

/* ---------- miniatura de noticia: el gancho visual ---------- */
function thumb(n, big) {
  const ps = (n.jugadores || []).map(id => J[id]).filter(Boolean);
  const p = ps[0], t1 = n.equipo || (p && p.team) || '', p2 = ps.find(x => x.team !== (p && p.team));
  const h = hash(n.id), et = n.etiqueta, imp = n.impacto || 'NEUTRO', lado = h % 2 ? 'der' : 'izq';
  const nomA = p ? nombre1(p.n) : (EQUIPOS[t1] || '').split(' ').slice(0, -1).join(' ');
  const nomB = p ? apellido(p.n) : (EQUIPOS[t1] || 'Fantasy Expertos').split(' ').pop();
  const largo = nomB.length > 11 ? 'xl' : nomB.length > 8 ? 'l' : '';
  const num = p && p.num != null ? p.num : '';
  const datos = p ? [[rw(p) !== '–' ? rw(p) : p.pos, 'S' + semActual()], [p.p != null ? n1(p.p) : n1(p.prom), p.p != null ? 'PROY' : 'PROM'], [fuera(p) ? estatus(p).toUpperCase() : rivalTxt(p.team), fuera(p) ? 'ESTATUS' : 'RIVAL']] : [[recordDe(t1) || t1 || 'NFL', 'RÉCORD'], [rivalTxt(t1), 'S' + semActual()], [noticiasEquipo(t1).length, 'NOTICIAS']];
  const vende = /vend/i.test((n.accion || '') + ' ' + (n.titulo || ''));
  let badge = '';
  if (et === 'START') badge = `<span class="stamp start">START</span>`;
  else if (et === 'SIT') badge = `<span class="stamp sit">SIT</span>`;
  else if (et === 'TRADE') badge = `<span class="stamp ${vende ? 'sit' : 'start'}">${vende ? 'VENDE' : 'COMPRA'}</span>`;
  else if (et === 'WAIVER') badge = `<span class="ticket"><b>+ AGRÉGALO</b>${p && p.add ? `<span>${p.add >= 1000 ? Math.round(p.add / 1000) + 'K' : p.add} ligas</span>` : ''}</span>`;
  else if (et === 'LESIÓN') badge = `<span class="medic"><i class="cross"><i></i><i></i></i><b>${p ? estatus(p).toUpperCase() : 'LESIÓN'}</b>${p && parte(p) ? `<small>${esc(parte(p))}</small>` : ''}</span>`;
  let vis = helmet(t1, num, big ? 170 : 104, lado === 'izq', 'th-hel');
  if (p2 && et !== 'LESIÓN' && h % 2) vis = `<span class="vsx">${helmet(t1, num, 90, false, 'th-hel')}<b>VS</b>${helmet(p2.team, p2.num, 90, true, 'th-hel')}</span>`;
  let trend = '';
  if (et === 'TENDENCIA' && p) { const sr = (p.temp || []).filter(v => v != null).slice(-6), mx = Math.max(10, ...sr); if (sr.length > 1) trend = `<svg class="trend" viewBox="0 0 100 40" preserveAspectRatio="none" aria-hidden="true"><polyline points="${sr.map((v, i) => `${Math.round(i / (sr.length - 1) * 100)},${Math.round(36 - v / mx * 32)}`).join(' ')}" fill="none" stroke="var(--c2)" stroke-width="3" vector-effect="non-scaling-stroke"/></svg>`; }
  const claro = (x => { const v = parseInt(x.slice(1), 16); return (v >> 16) * .299 + ((v >> 8) & 255) * .587 + (v & 255) * .114 > 150; })(col(t1)[0]);
  return `<span class="th ${et} ${lado} ${big ? 'th-big' : ''} pat${h % 3} ${claro ? 'claro' : ''}" style="${vars(t1)}">
    <span class="th-num" aria-hidden="true">${esc(num)}</span><span class="th-field" aria-hidden="true"></span>${trend}
    <span class="th-top"><span class="th-tag ${et}">${n.exclusivo ? '★ EXCLUSIVO' : ETQ[et]}</span>${badge}<span class="th-imp ${imp}">${flecha(imp, 14)}${imp === 'SUBE' ? 'SUBE' : imp === 'BAJA' ? 'BAJA' : 'ESTABLE'}</span></span>
    <span class="th-mid"><span class="th-name ${largo}"><small>${esc(nomA)}</small><b>${esc(nomB)}</b><em>${esc(p ? p.pos + ' · ' + (EQUIPOS[p.team] || p.team) : EQUIPOS[t1] || '')}</em></span><span class="th-vis">${vis}</span></span>
    <span class="th-strip">${datos.map(([a, b]) => `<span><b>${esc(a)}</b><i>${b}</i></span>`).join('')}<span class="th-brand">${fxLogo(18)}</span></span>
  </span>`;
}
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
  return visto ? '' : `<div class="hello" id="welcome">${fxLogo(34)}<p><b>Bienvenido a Fantasy Expertos.</b> Marcadores en vivo, rankings por proyección en PPR, Half o Standard, Start/Sit con razones y noticias verificadas. Todo se actualiza solo.</p>
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
    <div class="stx-list" id="stx-list">${listaStarts(stxSel)}</div><p class="panel-f">Proyección ${FMTS[FMT]} · toca un jugador para ver por qué</p></div>`;
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
    <section class="block"><div class="head"><div><h2>Partidos de la semana ${esc(G[0] ? G[0].semana : semActual())}</h2><p class="hsub">En vivo primero, luego los próximos. Marcador, posesión y las figuras de fantasy de cada lado.</p></div><a class="all" href="#/partidos">Todas las semanas ›</a></div><div id="home-matches">${homeMatches()}</div></section>
    ${SEMNUM ? `<section class="block lideres-home"><div class="head"><div><h2>Líderes de la semana ${SEMNUM}</h2><p class="hsub">Los que más puntos ${FMTS[FMT]} hicieron, por posición. Toca uno para ver su ficha.</p></div><a class="all" href="#/lideres">Todos los líderes ›</a></div>${marqueeLideres()}</section>` : ''}
    ${mas.length ? `<section class="block"><div class="head"><div><h2>Más noticias</h2><p class="hsub">Lo que mueve tus alineaciones, verificado contra el reporte oficial.</p></div><a class="all" href="#/noticias">Todas las noticias ›</a></div><div class="news stagger">${mas.map(n => newsCard(n)).join('')}</div></section>` : ''}
    <section class="block grid g2">
      <div class="card"><div class="head"><h3>▲ Subiendo</h3><a class="all" href="#/tendencias">Todo ›</a></div><p class="sub">Los más agregados en ligas en las últimas 24 horas.</p>
        <div class="plist">${D.agregados.slice(0, 6).map(id => J[id] && prow(J[id], `<span class="bar"><i style="width:${pct(J[id].add, 'add')}%"></i></span>${fxPill(J[id])}`)).join('')}</div></div>
      <div class="card"><div class="head"><h3 style="color:var(--bad)">▼ Bajando</h3><a class="all" href="#/tendencias">Todo ›</a></div><p class="sub">A quién están soltando en las últimas 24 horas.</p>
        <div class="plist">${D.soltados.slice(0, 6).map(id => J[id] && prow(J[id], `<span class="bar down"><i style="width:${pct(J[id].drop, 'drop')}%"></i></span>${fxPill(J[id])}`)).join('')}</div></div>
    </section>
    ${duelo()}
    <section class="block"><div class="head"><div><h2>Rankings de la semana ${semActual()}</h2><p class="hsub">Top 3 por proyección ${FMTS[FMT]}, solo jugadores que sí juegan.</p></div><a class="all" href="#/posicion/QB">Rankings ›</a></div><div class="grid g5 stagger">${hubs}</div></section>
    ${fxtv()}
    <section class="block"><div class="head"><div><h2>Los 32 equipos</h2><p class="hsub">Récord, rival de la semana, calendario y plantel de fantasy.</p></div><a class="all" href="#/equipos">Ver todos ›</a></div>${teamGrid()}</section>
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
  return `<section class="block" id="startsit"><div class="head"><div><h2>${fxLogo(26)} Duelo del día: ¿a quién arrancas?</h2><p class="hsub">Dos ${a.pos} con proyección parecida y un solo lugar en tu alineación. Elige, y te mostramos el veredicto de los expertos y el porqué.</p></div></div>
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
    <div class="chips">${['TODO', ...ETIQUETAS].map(t => `<a class="chip ${t === f ? 'on' : ''} ${t}" href="#/noticias${t === 'TODO' ? '' : '?tipo=' + encodeURIComponent(t)}">${t === 'TODO' ? 'TODAS' : ETQ[t]}</a>`).join('')}</div>
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
  const sec = (t, txt, cls = '') => txt ? `<section class="nsec ${cls}"><h3>${t}</h3><p>${esc(txt)}</p></section>` : '';
  return `<div class="page">${crumbs([['#/noticias', 'Noticias'], ['#/noticias?tipo=' + encodeURIComponent(n.etiqueta), ETQ[n.etiqueta]], ['', n.titulo.slice(0, 40) + (n.titulo.length > 40 ? '…' : '')]])}<div class="wrap narrowish">
    <div class="nhead">${thumb(n, true)}</div>
    <p class="st-meta ${n.etiqueta}" style="margin-top:18px">${esc(ETQ[n.etiqueta])}${n.fecha ? ' · ' + hace(n.fecha) : ''}${n.exclusivo ? ' · ★ Exclusivo FX' : ''}</p>
    <h1 class="ntitle">${esc(n.titulo)}</h1>
    ${n.aviso ? `<div class="aviso-nota"><b>⚠ NOTA ACTUALIZADA</b><p>${esc(n.aviso)}</p></div>` : ''}
    <div class="kcards stagger">${(n.claves || []).map((c, k) => `<div class="kcard"><b>${k + 1}</b>${esc(c)}</div>`).join('')}${cerrada ? [2, 3].map(k => `<div class="kcard lock"><b>${k}</b><span>${CANDADO} Solo Premium</span></div>`).join('') : ''}</div>
    <div class="nbody">
      <div class="ncol">
        ${cerrada ? (prem ? '<div class="esq-lineas oro" aria-busy="true" aria-label="Abriendo nota Premium"><i></i><i></i><i></i><i></i><i></i></div>' : previaPremium()) : `${sec('Qué pasó', n.contexto || n.cuerpo)}
        ${sec('Impacto en fantasy', n.fantasy, 'fx')}
        ${sec('Qué cambia para el equipo', n.equipo_impacto)}
        ${n.accion ? `<div class="accion">${fxLogo(30)}<div><small>QUÉ HACER HOY</small><p>${esc(n.accion)}</p></div></div>` : ''}`}
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
  const cols = j.pos === 'QB' ? [['py', 'YDS PASE'], ['ptd', 'TD P'], ['int', 'INT'], ['ry', 'YDS CAR'], ['rtd', 'TD C']] : j.pos === 'K' ? [['fgm', 'FG'], ['xpm', 'PAT']]
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
      <div class="ss-head">${fxLogo(54)}<div><small>START / SIT FX · SEMANA ${esc(semActual())}</small><b>${VT[v.v]}</b></div>
        <div class="ss-riv">${r ? `${helmet(r.opp, '', 56, true)}<span><small>RIVAL</small><b>${r.home ? 'vs' : '@'} ${esc(r.opp)}</b>${pintaEstrellas(v.e)}</span>` : ''}${j.p != null ? `<span class="ss-proy"><small>PROYECCIÓN</small><b class="n">${n1(j.p)}</b><i>${FMTS[FMT]}</i></span>` : ''}</div></div>
      <ul class="ss-why">${v.razones.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div></section>
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
      <th>#</th><th>JUGADOR</th><th>EQUIPO</th><th>RIVAL S${semActual()}</th><th>DIFICULTAD</th><th class="hl">PROY</th>
      ${ult.map(x => `<th>S${x}</th>`).join('')}<th>PROM</th><th>TOTAL</th><th>TENDENCIA</th><th class="fxh">${fxLogo(18)} START/SIT</th>
    </tr></thead><tbody id="tb"></tbody></table></div>
    <p class="ss-note">Proyección: Sleeper (si no existe, se estima con su promedio). Dificultad = puntos que la defensa rival permite a la posición: ★★★★★ es el matchup ideal. START/FLEX/SIT combina proyección, rival, racha, noticias y comunidad.</p>
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
      <td class="n">${n1(j.prom)}</td><td class="n">${n1(j.total)}</td><td>${spark(j.hist)}</td><td>${fxPill(j)}</td></tr>`).join('') || '<tr><td colspan="12"><div class="empty">Ningún jugador coincide.</div></td></tr>';
    $('#tb').querySelectorAll('tr[data-id]').forEach(tr => tr.onclick = () => { location.hash = '#/jugador/' + tr.dataset.id; });
  };
  $('#filtro').oninput = pinta;
  document.querySelectorAll('#fst button').forEach(b => b.onclick = () => { filtroV = b.dataset.s; document.querySelectorAll('#fst button').forEach(x => x.classList.toggle('on', x === b)); pinta(); });
  pinta();
}

/* ---------- líderes ---------- */
function lideres(q) {
  titulo('Líderes');
  const modo = q.get('ver') || (SEMNUM ? 'semana' : 'temporada'), sel = q.get('pos');
  const val = j => modo === 'semana' ? ptsSem(j) : j.total;
  const etq = modo === 'semana' ? 'Semana ' + SEMNUM : 'Temporada';
  const chips = `<div class="chips"><a class="chip ${modo === 'semana' ? 'on' : ''}" href="#/lideres?ver=semana${sel ? '&pos=' + sel : ''}">Semana ${esc(SEMNUM || '')}</a><a class="chip ${modo === 'temporada' ? 'on' : ''}" href="#/lideres?ver=temporada${sel ? '&pos=' + sel : ''}">Temporada</a></div>`;
  if (sel && POSICIONES[sel]) {
    const L = P.filter(j => j.pos === sel && val(j) != null).sort((a, b) => val(b) - val(a));
    return `<div class="page">${crumbs([['#/lideres?ver=' + modo, 'Líderes'], ['', sel + ' · ' + etq]])}<div class="wrap"><section class="block">
      <div class="head"><div><h2>Líderes ${sel} · ${etq}</h2><p class="hsub">Todos los ${POSICIONES[sel].toLowerCase()} con puntos ${FMTS[FMT]}.</p></div></div>${chips}
      <div class="chips">${Object.keys(POSICIONES).map(x => `<a class="chip ${x === sel ? 'on' : ''}" href="#/lideres?ver=${modo}&pos=${x}">${x}</a>`).join('')}</div>
      <div class="card scroll"><table class="tbl"><thead><tr><th>#</th><th>JUGADOR</th><th>EQUIPO</th><th>${modo === 'semana' ? 'RIVAL' : 'PARTIDOS'}</th><th class="hl">PUNTOS</th><th>PROM</th><th>TENDENCIA</th></tr></thead><tbody>
      ${L.map((j, i) => `<tr onclick="location.hash='#/jugador/${j.id}'"><td class="n rk">${i + 1}</td><td><span class="tpl">${helmet(j.team, j.num, 28)}<span class="pname">${esc(j.n)}</span></span></td><td class="team">${esc(j.team)}</td><td class="team">${modo === 'semana' ? rivalTxt(j.team, SEMNUM) : (j.log || []).filter(l => l.f).length}</td><td class="n hl">${n1(val(j))}</td><td class="n">${n1(j.prom)}</td><td>${spark(j.hist)}</td></tr>`).join('')}</tbody></table></div>
    </section></div></div>`;
  }
  return `<div class="page">${crumbs([['', 'Líderes fantasy']])}<div class="wrap"><section class="block">
    <div class="head"><div><h2>Líderes fantasy · ${etq}</h2><p class="hsub">Los 10 mejores por posición en puntos ${FMTS[FMT]}. Toca “Ver todos” para la lista completa.</p></div></div>${chips}
    <div class="lgrid stagger">${Object.keys(POSICIONES).map(p => {
      const L = P.filter(j => j.pos === p && val(j) != null).sort((a, b) => val(b) - val(a)), top = L[0];
      return `<div class="lcol"><div class="lcol-h"><b>${p}</b><span>${POSICIONES[p]}</span></div>
        ${top ? `<a class="lead1" href="#/jugador/${top.id}" style="${vars(top.team)}">${helmet(top.team, top.num, 58, false, 'bob')}<span><small>Nº1 · ${esc(top.team)}</small><b><i>${esc(nombre1(top.n))}</i>${esc(apellido(top.n))}</b><em class="n">${n1(val(top))} pts</em></span></a>` : ''}
        <div class="plist">${L.slice(1, 10).map((j, i) => `<a class="lrow" href="#/jugador/${j.id}"><i class="n">${i + 2}</i>${helmet(j.team, j.num, 24)}<span>${esc(j.n)}<small>${esc(j.team)}</small></span><em class="n">${n1(val(j))}</em></a>`).join('')}</div>
        <a class="lcol-all" href="#/lideres?ver=${modo}&pos=${p}">Ver los ${L.length} ${p} ›</a></div>`;
    }).join('')}</div></section></div></div>`;
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
    <section class="block"><div class="head"><div><h2>Plantel fantasy</h2><p class="hsub">Con su veredicto Start/Sit FX de esta semana.</p></div></div><div class="grid g3 stagger">${grupos || '<div class="empty">Sin jugadores registrados.</div>'}</div></section>
    <section class="block"><div class="head"><h2>Noticias de ${esc(EQUIPOS[t])}</h2></div><div class="news stagger">${notas.slice(0, 9).map(n => newsCard(n)).join('') || '<div class="empty">Aún no hay noticias de este equipo.</div>'}</div></section>
  </div></div>`;
}
function tendencias() {
  titulo('Tendencias');
  return `<div class="page">${crumbs([['', 'Tendencias']])}<div class="wrap"><section class="block"><div class="head"><div><h2>Tendencias en ligas</h2><p class="hsub">Movimientos de las últimas 24 horas en Sleeper, con nuestro veredicto.</p></div></div><div class="grid g2">
    <div class="card"><h3 style="color:var(--accent)">▲ Más agregados</h3><div class="plist">${D.agregados.map((id, i) => J[id] && prow(J[id], `<span class="bar"><i style="width:${pct(J[id].add, 'add')}%"></i></span><span class="num sm">${nf.format(J[id].add)}</span>${fxPill(J[id])}`, i + 1)).join('')}</div></div>
    <div class="card"><h3 style="color:var(--bad)">▼ Más soltados</h3><div class="plist">${D.soltados.map((id, i) => J[id] && prow(J[id], `<span class="bar down"><i style="width:${pct(J[id].drop, 'drop')}%"></i></span><span class="num sm" style="color:var(--bad)">${nf.format(J[id].drop)}</span>`, i + 1)).join('') || '<p class="sub">Sin datos hoy.</p>'}</div></div>
  </div></section></div></div>`;
}
function lesionados(q) {
  titulo('Lesionados');
  const f = q.get('estatus') || 'TODOS';
  const orden = D.lesionados.map(x => J[x.id]).filter(Boolean);
  const lista = orden.filter(j => f === 'TODOS' || (f === 'IR' ? fueraTemp(j) : f === 'Fuera' ? j.inj === 'Out' : estatus(j) === f));
  return `<div class="page">${crumbs([['', 'Lesionados']])}<div class="wrap"><section class="block">
    <div class="head"><div><h2>Reporte médico</h2><p class="hsub">Solo jugadores relevantes para fantasy, ordenados por su impacto. Fuentes: reporte oficial de Sleeper y ESPN · ${esc(actualizado())}</p></div><small>${lista.length} jugadores</small></div>
    <div class="chips">${[['TODOS', 'Todos'], ['Duda', 'En duda'], ['Fuera', 'Fuera esta semana'], ['IR', 'Reserva / temporada']].map(([s, t]) => `<a class="chip ${s === f ? 'on' : ''}" href="#/lesionados${s === 'TODOS' ? '' : '?estatus=' + s}">${t}</a>`).join('')}</div>
    <div class="injgrid">${lista.map(j => `<a class="inj" href="#/jugador/${j.id}" style="${vars(j.team)}">${helmet(j.team, j.num, 44)}<span class="inj-n"><small>${esc(nombre1(j.n))}</small><b>${esc(apellido(j.n))}</b><i>${esc(j.pos)} · ${esc(j.team)} · ${esc(rw(j) !== '–' ? rw(j) : rp(j))}</i></span>
      <span class="inj-d"><span class="pill ${estatus(j)}">${fueraTemp(j) ? 'RESERVA' : estatus(j).toUpperCase()}</span><b>${esc(parte(j) || 'Sin detalle')}</b><small>${j.les && j.les.regreso ? 'Regreso: ' + esc(fechaC(j.les.regreso)) : j.les && j.les.fecha ? 'Reporte: ' + esc(fechaC(j.les.fecha)) : ''}</small></span></a>`).join('') || '<div class="empty">Sin lesionados con este estatus.</div>'}</div>
  </section></div></div>`;
}
function exclusivo() {
  titulo('Exclusivo FX');
  const L = todasNoticias().filter(n => n.exclusivo);
  return `<div class="page">${crumbs([['', 'Exclusivo FX']])}<div class="wrap">
    <div class="nhero" style="--c1:#3A2A05;--c2:#FFD45C"><div class="grid-in"><div class="txt"><span class="tagx" style="background:var(--gold)">★ PREMIUM FX</span><h1>Exclusivo FX</h1><p class="hero-sub">Información de nuestra red de reporteros que no vas a encontrar en otro lado, desarrollada por los expertos.</p>${L.length ? `<p class="hero-n"><b>${L.length}</b> ${L.length === 1 ? 'nota exclusiva publicada' : 'notas exclusivas publicadas'}</p>` : ''}</div></div></div>
    ${esPremium() ? `<p class="prem-ok">★ Eres Premium: tienes acceso completo a todas las notas.</p>` : `<section class="block">${muroPremium()}</section>`}
    <section class="block"><div class="news stagger">${L.map(n => newsCard(n)).join('') || '<div class="empty">La primera nota exclusiva llega muy pronto. Mientras, revisa las <a href="#/noticias">noticias del día</a>.</div>'}</div></section>
  </div></div>`;
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
  const lista = (t, arr, cls) => arr && arr.length ? `<div class="card ${cls}"><h3>${t}</h3><ul class="claves">${arr.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>` : '';
  return `<div class="page">${crumbs([['#/temporada', 'Temporada'], ['', 'Semana ' + w]])}<div class="wrap narrowish">
    <div class="nhead">${semThumb(R, true)}</div>
    <p class="st-meta" style="margin-top:18px">Semana ${w} · ${R.cerrada ? 'jornada cerrada' : 'en curso'}</p><h1 class="ntitle">${esc(R.titulo)}</h1>
    ${R.cuerpo ? `<p class="lead-p">${esc(R.cuerpo)}</p>` : ''}
    ${(R.claves || []).length ? `<section class="block" style="padding-top:20px"><div class="head"><h2>${R.claves.length} cosas que aprendimos</h2></div><ol class="learn">${R.claves.map(c => `<li>${esc(c)}</li>`).join('')}</ol></section>` : '<p class="sub">El análisis completo de esta semana se está generando.</p>'}
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
  return `<section class="block"><div class="head"><div><h2>FX TV</h2><p class="hsub">El podcast y lo más reciente del canal. Se reproduce aquí mismo.</p></div><a class="all" href="#/media">Todo el contenido ›</a></div>${podcast()}<div style="margin-top:18px">${tvBloque(videos())}</div></section>`;
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
    if (/^#\/partido\//.test(location.hash) && !$('.gsum')) router();
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
  </section></div></div>`;
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
  setTimeout(() => detallePartido(g), 0);
  return `<div class="page">${crumbs([['#/partidos', 'Partidos'], ['', g.visita.ab + ' vs ' + g.local.ab]])}<div class="wrap">
    <div class="jumbo game" style="--cv:${col(g.visita.ab)[0]};--cl:${col(g.local.ab)[0]}">
      <div class="jumbo-top"><span>${g.estado === 'in' ? '<i class="dot"></i>EN VIVO' : g.estado === 'post' ? 'FINAL' : esc(horaJuego(g))}</span><span>${esc(g.sede || '')}${g.tv ? ' · ' + esc(g.tv) : ''}</span></div>
      <div class="g-face"><a class="g-team" href="#/equipo/${g.visita.ab}">${helmet(g.visita.ab, '', 140, false, g.posesion === g.visita.id ? 'bob' : '')}<b>${esc(g.visita.nombre)}</b><small>${esc(g.visita.rec)} · Visita</small></a>
        <div class="g-score"><span class="${ganando(g, 0)}">${g.estado === 'pre' ? '–' : g.visita.pts}</span><em>${g.estado === 'in' ? esc(g.detalle) : g.estado === 'post' ? 'FINAL' : 'VS'}</em><span class="${ganando(g, 1)}">${g.estado === 'pre' ? '–' : g.local.pts}</span></div>
        <a class="g-team" href="#/equipo/${g.local.ab}">${helmet(g.local.ab, '', 140, true, g.posesion === g.local.id ? 'bob' : '')}<b>${esc(g.local.nombre)}</b><small>${esc(g.local.rec)} · Local</small></a></div>
      ${g.estado === 'in' ? `<div class="g-field">${campo(g)}</div><div class="led"><small>${esc(g.downs || '')}${g.zonaRoja ? ' · ZONA ROJA' : ''}</small>${esc(g.ultima || 'Esperando la siguiente jugada…')}</div>` : ''}
    </div>
    <div class="gsum" id="gsum"><div class="esq-lineas" aria-busy="true" aria-label="Cargando estadísticas del partido"><i></i><i></i><i></i><i></i></div></div>
    <section class="block grid g2">${lado(g.visita)}${lado(g.local)}</section>
    ${notas.length ? `<section class="block"><div class="head"><h2>Noticias de ${esc(g.visita.ab)} y ${esc(g.local.ab)}</h2></div><div class="news stagger">${notas.map(n => newsCard(n)).join('')}</div></section>` : ''}
  </div></div>`;
}
async function detallePartido(g) {
  const box = $('#gsum'); if (!box) return;
  try {
    const s = await (await fetch('https://site.api.espn.com/apis/site/v2/sports/football/nfl/summary?event=' + g.id)).json();
    const teams = (s.boxscore && s.boxscore.teams) || [];
    const statsDe = ab => { const t = teams.find(x => (AB[x.team.abbreviation] || x.team.abbreviation) === ab); return t ? Object.fromEntries((t.statistics || []).map(x => [x.name, x.displayValue])) : {}; };
    const sv = statsDe(g.visita.ab), sl = statsDe(g.local.ab);
    const filas = [['totalYards', 'Yardas totales'], ['netPassingYards', 'Yardas por pase'], ['rushingYards', 'Yardas por tierra'], ['firstDowns', 'Primeros downs'], ['thirdDownEff', 'Tercera oportunidad'], ['turnovers', 'Pérdidas de balón'], ['possessionTime', 'Posesión'], ['totalPenaltiesYards', 'Castigos']].filter(([k]) => sv[k] != null || sl[k] != null);
    const num = x => parseFloat(String(x || '0').replace(':', '.')) || 0;
    const statsHTML = filas.length ? `<div class="card"><h3>Estadísticas del partido</h3><div class="tstats">${filas.map(([k, t]) => { const a = num(sv[k]), b = num(sl[k]), tot = a + b || 1, mejorA = k === 'turnovers' || k === 'totalPenaltiesYards' ? a < b : a > b;
      return `<div class="tsr"><b class="${mejorA ? 'w' : ''}">${esc(sv[k] ?? '–')}</b><span><small>${t}</small><i style="--a:${Math.round(a / tot * 100)}%;--cv:${col(g.visita.ab)[0]};--cl:${col(g.local.ab)[0]}"></i></span><b class="${!mejorA && a !== b ? 'w' : ''}">${esc(sl[k] ?? '–')}</b></div>`; }).join('')}</div></div>` : '';
    const anot = (s.scoringPlays || []).map(p => `<div class="sp">${helmet(AB[p.team && p.team.abbreviation] || (p.team && p.team.abbreviation), '', 26)}<span><small>${p.period && p.period.number ? 'Q' + p.period.number : ''} ${esc((p.clock && p.clock.displayValue) || '')} · ${esc(p.scoringType && p.scoringType.displayName || '')}</small>${esc(p.text || '')}</span><b class="n">${p.awayScore}-${p.homeScore}</b></div>`).join('');
    const lid = (s.leaders || []).flatMap(t => (t.leaders || []).map(c => ({ ab: AB[t.team && t.team.abbreviation] || (t.team && t.team.abbreviation), cat: c.displayName, a: c.leaders && c.leaders[0] }))).filter(x => x.a);
    const lidHTML = lid.length ? `<div class="card"><h3>Líderes del partido</h3><div class="leaders">${lid.map(x => `<div style="${vars(x.ab)}"><small>${esc(x.cat)} · ${esc(x.ab)}</small><b>${esc(x.a.athlete && x.a.athlete.displayName)}</b><span>${esc(x.a.displayValue || '')}</span></div>`).join('')}</div></div>` : '';
    const pc = (s.pickcenter || [])[0], pred = s.predictor;
    const preHTML = (pc || pred) && g.estado === 'pre' ? `<div class="card"><h3>Antes del kickoff</h3><div class="leaders">${pc && pc.details ? `<div><small>LÍNEA</small><b>${esc(pc.details)}</b><span>${esc(pc.provider && pc.provider.name || '')}</span></div>` : ''}${pc && pc.overUnder ? `<div><small>TOTAL DE PUNTOS</small><b class="n">${esc(pc.overUnder)}</b><span>Over/Under</span></div>` : ''}${pred && pred.homeTeam ? `<div><small>PROBABILIDAD ${esc(g.local.ab)}</small><b class="n">${n1(+pred.homeTeam.gameProjection)}%</b><span>Modelo ESPN</span></div><div><small>PROBABILIDAD ${esc(g.visita.ab)}</small><b class="n">${n1(+pred.awayTeam.gameProjection)}%</b><span>Modelo ESPN</span></div>` : ''}</div></div>` : '';
    box.innerHTML = `<section class="block grid g2" style="padding-top:22px">${preHTML}${statsHTML}${lidHTML}${anot ? `<div class="card"><h3>Jugadas de anotación</h3><div class="splist">${anot}</div></div>` : ''}</section>`;
    if (!box.textContent.trim()) box.innerHTML = '';
  } catch (e) { box.innerHTML = ''; }
}
function refrescaVista() {
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
  const [p, f] = await Promise.all([SB.from('perfiles').select('*').eq('id', YO.id).maybeSingle(), SB.from('favoritos').select('jugador')]);
  PERFIL = p.data || { nombre: (YO.email || '').split('@')[0] };
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
  b.classList.toggle('in', !!YO); b.title = YO ? 'Mi cuenta' : 'Entrar';
  b.innerHTML = YO ? `<i>${esc(ini)}</i>` : `${ICONO_CUENTA}<span>ENTRAR</span>`;
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
  const tPrem = esPremium() ? `<div class="card prem-card"><h3>★ Premium FX</h3><p>${PERFIL.premium_tipo === 'temporada' ? 'Pase de temporada' : 'Suscripción mensual'}${hasta ? (PERFIL.premium_tipo === 'temporada' ? ' · válido hasta el ' : ' · próxima renovación: ') + hasta : ''}</p><p><a class="btn sm" href="#/exclusivo">Leer el Exclusivo</a>${PAGO.portal && PERFIL.premium_tipo !== 'temporada' ? ` <a class="btn ghost sm" href="${PAGO.portal}" target="_blank" rel="noopener">Administrar o cancelar</a>` : ''}</p></div>`
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
const esPremium = () => !!(PERFIL && PERFIL.premium && (!PERFIL.premium_hasta || Date.parse(PERFIL.premium_hasta) > Date.now()));
const BOVEDA = {};
function cargaBoveda(id) {
  if (BOVEDA[id] !== undefined || !SB) return; BOVEDA[id] = null;
  SB.from('exclusivos').select('nota').eq('id', id).maybeSingle().then(({ data }) => { if (data && data.nota) { BOVEDA[id] = data.nota; if (location.hash.includes(id)) repinta(); } else delete BOVEDA[id]; });
}
const linkPago = k => PAGO[k] && YO ? PAGO[k] + (PAGO[k].includes('?') ? '&' : '?') + 'client_reference_id=' + encodeURIComponent(YO.id) + (YO.email ? '&prefilled_email=' + encodeURIComponent(YO.email) : '') : '';
const planes = () => `<div class="planes">${PAGO.mes ? `<a class="plan" href="${linkPago('mes')}"><b>$59</b><span>MXN al mes</span><small>Cancela cuando quieras</small></a>` : ''}${PAGO.temporada ? `<a class="plan top" href="${linkPago('temporada')}"><i>MEJOR PRECIO</i><b>$199</b><span>MXN toda la temporada</span><small>Pago único, hasta el Super Bowl</small></a>` : ''}</div><small class="muro-pie">Pago seguro con Stripe: tarjeta, Apple Pay o Google Pay.</small>`;
// Vista previa bloqueada: muestra la estructura real de la nota (secciones) con renglones difuminados, nunca texto inventado
const previaPremium = () => `<div class="previa"><div class="previa-in" aria-hidden="true">${['Qué pasó', 'Impacto en fantasy', 'Qué cambia para el equipo'].map((t, k) => `<section class="nsec ${k === 1 ? 'fx' : ''}"><h3>${t}</h3><p class="ph"><i></i><i></i><i></i>${k ? '' : '<i></i>'}</p></section>`).join('')}<div class="accion">${fxLogo(30)}<div><small>QUÉ HACER HOY</small><p class="ph"><i></i><i></i></p></div></div></div>${muroPremium()}</div>`;
const BENEF = [['Notas de nuestra red de reporteros', 'Información que no vas a encontrar en otro lado.'], ['Trade targets y la previa de cada semana', 'A quién comprar, vender y arrancar antes que tu liga.'], ['Qué hacer hoy, nota por nota', 'Cada exclusiva termina con una acción concreta para tu equipo.']];
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
const SEM_FIN = 17, REEMPLAZO = { QB: 14, RB: 32, WR: 40, TE: 14, K: 14 };
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
let _rutaPrev = null;
function router() {
  const [ruta, qs] = ((location.hash || window.FX_RUTA || '').slice(1) || '/').split('?');
  const q = new URLSearchParams(qs || ''), [, seccion, a, b] = ruta.split('/');
  const R = { '': () => inicio(), noticias: () => noticias(q), reportajes: () => noticias(q), noticia: () => noticia(a), reportaje: () => noticia(a), jugador: () => jugador(a), comparar: () => comparar(a, b), posicion: () => posicion(a),
    equipos: () => equipos(), equipo: () => equipo(a), partidos: () => partidos(q), partido: () => partido(a), lideres: () => lideres(q), media: () => media(), exclusivo: () => exclusivo(), temporada: () => temporada(), semana: () => semana(a), tendencias: () => tendencias(), lesionados: () => lesionados(q),
    cuenta: () => cuenta(q), herramientas: () => herramientas(), trade: () => trade(q), privacidad: () => privacidad(), baja: () => baja(q) };
  app.innerHTML = (R[seccion || ''] || noEncontrado)();
  if (ruta !== _rutaPrev) { _rutaPrev = ruta; app.classList.remove('entra'); void app.offsetWidth; app.classList.add('entra'); }
  scrollTo({ top: 0 });
  vista(ruta + (seccion === 'noticias' || seccion === 'lideres' || seccion === 'lesionados' ? (qs ? '?' + qs : '') : ''));
  const act = s => s === (seccion || '') || (seccion === 'noticia' && s === 'noticias') || (seccion === 'partido' && s === 'partidos') || (seccion === 'semana' && s === 'temporada') || (seccion === 'trade' && s === 'herramientas');
  document.querySelectorAll('.tabbar a, .links a').forEach(l => l.classList.toggle('act', act(l.dataset.s)));
  $('.links').classList.remove('open');
  if (seccion === 'posicion') montaTabla(a);
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
    box.innerHTML = res.map((j, i) => `<a href="#/jugador/${j.id}" class="${i === sel ? 'sel' : ''}">${helmet(j.team, j.num, 44)}<span>${esc(j.n)}</span><span class="pos">${esc(j.pos)}</span><span class="team">${esc(j.team)}</span></a>`).join('')
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
  const fu = $('#fuentes'); if (fu) fu.textContent = 'Datos: ' + (hoy.fuentes || ['Sleeper', 'ESPN']).join(', ') + '.';
  buscador(); cargaPartidos();
  const mas = $('#tb-mas'); if (mas) mas.onclick = () => { $('.links').classList.toggle('open'); mas.classList.toggle('act'); };
  addEventListener('hashchange', router);
  router();
}).catch(e => { app.innerHTML = '<div class="wrap loading"><p class="px">Actualizando datos</p><p>Estamos preparando la información. Vuelve en un par de minutos.</p></div>'; console.error(e); });
})();

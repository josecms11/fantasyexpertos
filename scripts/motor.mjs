// FANTASY EXPERTOS – Motor automático v2 (GitHub Actions, cada 10 min)
// Fuentes: Sleeper (jugadores, estadísticas, proyecciones, tendencias), ESPN (calendario, noticias, lesiones),
// RSS de medios, YouTube y el buzón del reportero. Gemini escribe; reglas propias verifican antes de publicar.
// Todo se escribe en data/v2/ (la versión vieja de Apps Script escribía en data/ y ya no puede pisar nada).
import fs from 'node:fs';

const DIR = 'data/v2';
const LOG = []; const t0 = Date.now();
const log = (...a) => { const m = `[${((Date.now() - t0) / 1000).toFixed(1)}s] ` + a.join(' '); console.log(m); LOG.push(m); fs.mkdirSync(DIR, { recursive: true }); fs.writeFileSync(DIR + '/estado.json', JSON.stringify({ fecha: new Date().toISOString(), log: LOG }, null, 2)); };
const conTiempo = (ms = 25000) => AbortSignal.timeout(ms);
const KEY = process.env.GEMINI_API_KEY;
const RSS = ['https://www.cbssports.com/rss/headlines/nfl/', 'https://sports.yahoo.com/nfl/rss/'];
const POS = ['QB', 'RB', 'WR', 'TE', 'K'];
const TOP = 420, HIST = 5, CUOTA_DIA = 40, CADA_IA_MIN = 115;
const leer = (f, d) => { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch { return d; } };
const guardar = (f, o, pretty) => { fs.mkdirSync(f.split('/').slice(0, -1).join('/'), { recursive: true }); fs.writeFileSync(f, JSON.stringify(o, null, pretty ? 2 : 0)); };
const get = async (u, ms = 40000) => { try { const r = await fetch(u, { headers: { 'User-Agent': 'Mozilla/5.0 FantasyExpertos' }, signal: conTiempo(ms) }); return r.ok ? r.json() : null; } catch (e) { log('GET falló', u.slice(0, 90), e.message); return null; } };
const norm = t => String(t || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\b(jr|sr|ii|iii|iv)\b/g, '').replace(/[^a-z]/g, '');
const r1 = v => v == null || isNaN(v) ? null : Math.round(v * 10) / 10;
const AB = { WSH: 'WAS', JAC: 'JAX', LA: 'LAR' };
const ESTATUS = { Questionable: 'Duda', Doubtful: 'Duda', Out: 'Fuera', IR: 'Fuera', PUP: 'Fuera', Sus: 'Fuera', NA: 'Fuera' };

/* ---------- cuota de Gemini (la capa gratis es muy limitada) ---------- */
const cuota = leer(DIR + '/cuota.json', {});
const hoyKey = new Date().toISOString().slice(0, 10);
if (cuota.dia !== hoyKey) { cuota.dia = hoyKey; cuota.usadas = 0; cuota.bloqueado = null; }
const quedan = () => CUOTA_DIA - (cuota.usadas || 0);
let MODELOS = null;
async function modelos() {
  if (MODELOS) return MODELOS;
  const pref = process.env.GEMINI_MODEL ? [process.env.GEMINI_MODEL] : [];
  const l = await get(`https://generativelanguage.googleapis.com/v1beta/models?key=${KEY}&pageSize=200`, 15000);
  const nombres = ((l && l.models) || []).filter(m => (m.supportedGenerationMethods || []).includes('generateContent')).map(m => m.name.replace('models/', ''));
  const flash = nombres.filter(n => /flash/.test(n) && !/image|tts|audio|live|exp|preview|thinking/.test(n));
  const orden = n => { const v = parseFloat((n.match(/gemini-(\d+(\.\d+)?)/) || [])[1] || 0); return v * 10 + (/lite/.test(n) ? 0 : 1); };
  MODELOS = [...new Set([...pref, ...flash.sort((a, b) => orden(b) - orden(a)), 'gemini-3.8-flash', 'gemini-2.5-flash', 'gemini-2.5-flash-lite'])];
  log('Modelos disponibles:', MODELOS.slice(0, 6).join(', '));
  return MODELOS;
}
async function gemini(prompt, tokens = 16000) {
  if (!KEY) { log('Falta GEMINI_API_KEY'); return null; }
  if (quedan() <= 0) { log('Cuota diaria de IA agotada, se reintenta mañana'); return null; }
  for (const m of await modelos()) {
    if (cuota.bloqueado && cuota.bloqueado[m]) continue;
    let r;
    try {
      r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${KEY}`, {
        signal: conTiempo(240000), method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { responseMimeType: 'application/json', temperature: 0.6, maxOutputTokens: tokens } })
      });
    } catch (e) { log('Gemini sin respuesta', m, e.message); continue; }
    const j = await r.json().catch(() => ({}));
    if (r.status === 429 || r.status === 404) { (cuota.bloqueado = cuota.bloqueado || {})[m] = r.status; guardar(DIR + '/cuota.json', cuota, true); log('Modelo sin cuota hoy', m, r.status); continue; }
    if (r.status >= 500) { log('Modelo saturado, pruebo otro', m, r.status); continue; }
    cuota.usadas = (cuota.usadas || 0) + 1; guardar(DIR + '/cuota.json', cuota, true);
    try { const t = j.candidates[0].content.parts.map(x => x.text || '').join(''); log('IA OK con', m); return JSON.parse(t.slice(t.indexOf('{'), t.lastIndexOf('}') + 1)); }
    catch { log('Gemini respuesta inválida', m, JSON.stringify(j).slice(0, 300)); return null; }
  }
  return null;
}
const VOZ = 'Eres el editor de Fantasy Expertos, el rincón de fantasy football para fans de habla hispana. Español de México, tono experto, directo y con personalidad. Escribe con tus propias palabras, nunca copies frases de las fuentes. Todo se aterriza a decisiones de fantasy. REGLAS DE VERACIDAD: usa SOLO hechos presentes en las fuentes y en la lista de estatus que te doy; si un jugador está OUT o IR jamás lo recomiendes para arrancar; no inventes cifras, fechas ni lesiones; si no estás seguro de un dato, no lo uses. Responde SOLO JSON. ';
const FORMATO = '{"noticias":[{"titulo":"titular original y punchy, máximo 9 palabras","claves":["3 puntos clave de máximo 12 palabras"],"contexto":"qué pasó y por qué, 50 a 80 palabras","fantasy":"impacto en fantasy: a quién sube o baja, en qué formatos y ligas, 50 a 80 palabras","equipo_impacto":"cómo cambia al equipo y a sus compañeros, 30 a 60 palabras","accion":"qué hacer hoy en tu liga, una frase accionable","etiqueta":"START | SIT | WAIVER | LESIÓN | TENDENCIA","impacto":"SUBE | BAJA | NEUTRO","equipo":"abreviatura NFL del equipo principal","equipos":["todas las abreviaturas NFL relacionadas"],"jugadores":["nombre completo en inglés; el primero DEBE ser el protagonista que aparece en el titular; no incluyas jugadores mencionados de paso"]}]}';

/* ---------- Fuentes de texto ---------- */
async function titularesRSS() {
  const out = [];
  for (const u of RSS) {
    try {
      const xml = await (await fetch(u, { signal: conTiempo() })).text();
      for (const m of xml.matchAll(/<item>([\s\S]*?)<\/item>/g)) {
        const t = (m[1].match(/<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/) || [])[1] || '';
        const d = ((m[1].match(/<description>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/) || [])[1] || '').replace(/<[^>]+>/g, '');
        if (t) out.push((t + ' — ' + d).slice(0, 400));
        if (out.length > 30) break;
      }
    } catch (e) { log('RSS falló', u, e.message); }
  }
  return out;
}
async function noticiasESPN() {
  const j = await get('https://site.api.espn.com/apis/site/v2/sports/football/nfl/news?limit=80');
  return ((j && j.articles) || []).map(a => ({
    titulo: a.headline, desc: a.description || '', fecha: a.published, url: a.links && a.links.web && a.links.web.href,
    atletas: (a.categories || []).filter(c => c.type === 'athlete').map(c => String(c.athleteId || (c.athlete && c.athlete.id) || '')).filter(Boolean),
    equipos: (a.categories || []).filter(c => c.type === 'team').map(c => c.team && c.team.abbreviation ? (AB[c.team.abbreviation] || c.team.abbreviation) : null).filter(Boolean)
  })).filter(a => a.titulo);
}
async function lesionesESPN() {
  const j = await get('https://site.api.espn.com/apis/site/v2/sports/football/nfl/injuries');
  const out = {};
  for (const t of (j && j.injuries) || []) for (const i of t.injuries || []) {
    const a = i.athlete || {}; const id = String(a.id || ((a.links || []).map(l => (l.href || '').match(/id\/(\d+)/)).find(Boolean) || [])[1] || '');
    const d = i.details || {};
    const reg = { st: i.status, fecha: i.date, tipo: d.type || '', lugar: d.location || '', detalle: d.detail || '', lado: d.side || '', regreso: d.returnDate || '', nombre: a.displayName || '' };
    if (id) out['e' + id] = reg; if (a.displayName) out['n' + norm(a.displayName)] = reg;
  }
  return out;
}
async function videosYT(canal) {
  if (!canal) return [];
  try {
    const xml = await (await fetch('https://www.youtube.com/feeds/videos.xml?channel_id=' + canal, { signal: conTiempo(), headers: { 'User-Agent': 'Mozilla/5.0' } })).text();
    return [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)].map(m => ({
      id: (m[1].match(/<yt:videoId>(.*?)<\/yt:videoId>/) || [])[1],
      titulo: ((m[1].match(/<title>([\s\S]*?)<\/title>/) || [])[1] || '').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'"),
      fecha: (m[1].match(/<published>(.*?)<\/published>/) || [])[1],
      vistas: +((m[1].match(/views="(\d+)"/) || [])[1] || 0),
      corto: /\/shorts\//.test(m[1])
    })).filter(v => v.id);
  } catch (e) { log('YouTube falló', e.message); return []; }
}

/* ---------- Sleeper ---------- */
function proyeccionesDe(raw) {
  const out = {};
  if (Array.isArray(raw)) raw.forEach(x => { if (x && x.player_id && x.stats) out[x.player_id] = x.stats; });
  else if (raw) Object.entries(raw).forEach(([k, v]) => { out[k] = v && v.stats ? v.stats : v; });
  return out;
}
async function sleeper() {
  const estado = await get('https://api.sleeper.app/v1/state/nfl');
  const temporada = estado.season, semana = estado.week;
  const raw = await get('https://api.sleeper.app/v1/players/nfl', 90000);
  const todos = {};
  for (const [k, p] of Object.entries(raw || {})) {
    if (!p.active || !POS.includes(p.position)) continue;
    todos[k] = { n: p.full_name, pos: p.position, team: p.team, num: p.number, edad: p.age, exp: p.years_exp, col: p.college, alt: p.height, peso: p.weight, espn: p.espn_id ? String(p.espn_id) : null,
      rank: p.search_rank && p.search_rank < 9999999 ? p.search_rank : null, inj: p.injury_status, injParte: p.injury_body_part, injNota: p.injury_notes, depth: p.depth_chart_order };
  }
  const semanas = []; for (let w = 1; w <= semana; w++) semanas.push(w);
  const stats = {};
  for (const w of semanas) stats[w] = await get(`https://api.sleeper.app/v1/stats/nfl/regular/${temporada}/${w}`) || {};
  // proyecciones de la semana a jugar y la siguiente
  const proy = {};
  for (const w of [semana, semana + 1]) {
    let p = proyeccionesDe(await get(`https://api.sleeper.app/v1/projections/nfl/regular/${temporada}/${w}`));
    if (!Object.keys(p).length) p = proyeccionesDe(await get(`https://api.sleeper.app/projections/nfl/${temporada}/${w}?season_type=regular&position[]=QB&position[]=RB&position[]=WR&position[]=TE&position[]=K`));
    proy[w] = p;
  }
  const add = await get('https://api.sleeper.app/v1/players/nfl/trending/add?lookback_hours=24&limit=25') || [];
  const drop = await get('https://api.sleeper.app/v1/players/nfl/trending/drop?lookback_hours=24&limit=25') || [];
  return { temporada, semana, semanas, stats, proy, todos, add, drop };
}

/* ---------- Calendario (ESPN) ---------- */
async function calendario(temporada) {
  const cal = {}, juegos = [];
  for (let w = 1; w <= 18; w++) {
    const j = await get(`https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard?seasontype=2&week=${w}&dates=${temporada}`);
    for (const e of (j && j.events) || []) {
      const c = e.competitions[0], t = c.competitors.map(x => ({ ab: AB[x.team.abbreviation] || x.team.abbreviation, home: x.homeAway === 'home', pts: +x.score || 0 }));
      const fin = e.status.type.state === 'post';
      for (const [a, b] of [[t[0], t[1]], [t[1], t[0]]]) { cal[a.ab] = cal[a.ab] || {}; cal[a.ab][w] = { opp: b.ab, home: a.home, fecha: e.date, fin, pf: fin ? a.pts : null, pc: fin ? b.pts : null, id: e.id }; }
      juegos.push({ w, id: e.id, fecha: e.date, fin });
    }
  }
  return { cal, juegos };
}

/* =================================== MAIN =================================== */
log('Inicio');
const redes = leer('data/redes.json', {});
const prevVid = leer(DIR + '/videos.json', { videos: [] });
const nuevosVid = await videosYT(redes.youtube && redes.youtube.canal);
const mapaV = new Map([...(prevVid.videos || []), ...nuevosVid].map(v => [v.id, v]));
nuevosVid.forEach(v => mapaV.set(v.id, v));
const videos = [...mapaV.values()].sort((a, b) => Date.parse(b.fecha || 0) - Date.parse(a.fecha || 0)).slice(0, 60);
if (videos.length) guardar(DIR + '/videos.json', { actualizado: new Date().toISOString(), canal: redes.youtube && redes.youtube.canal, videos }, true);
log('YouTube:', nuevosVid.length, 'nuevos,', videos.length, 'en total');

const s = await sleeper();
log('Sleeper:', Object.keys(s.todos).length, 'activos, semana', s.semana, '· proyecciones S' + s.semana + ':', Object.keys(s.proy[s.semana] || {}).length);
const { cal } = await calendario(s.temporada);
const lesE = await lesionesESPN();
const newsE = await noticiasESPN();
log('ESPN: lesiones', Object.keys(lesE).length / 2 | 0, '· noticias', newsE.length);

// ¿Qué semana se analiza? la primera donde la mayoría de juegos no ha terminado
let semJuego = 18;
for (let w = 1; w <= 18; w++) { let tot = 0, pend = 0; Object.values(cal).forEach(t => { if (t[w]) { tot++; if (!t[w].fin) pend++; } }); if (tot && pend / tot > .5) { semJuego = w; break; } }
if (!Object.keys(s.proy[semJuego] || {}).length && s.proy[s.semana + 1] && semJuego === s.semana + 1) s.proy[semJuego] = s.proy[s.semana + 1];

// defensa contra posición
const permitidos = {};
for (const w of s.semanas) for (const [k, x] of Object.entries(s.stats[w] || {})) {
  const p = s.todos[k]; if (!p || !p.team || x.pts_ppr == null) continue;
  const rival = cal[p.team] && cal[p.team][w] && cal[p.team][w].opp; if (!rival) continue;
  const d = (permitidos[rival] = permitidos[rival] || {}); const q = (d[p.pos] = d[p.pos] || { pts: 0, juegos: new Set() });
  q.pts += x.pts_ppr; q.juegos.add(w);
}
const dvp = {};
for (const pos of POS) {
  Object.entries(permitidos).map(([t, d]) => [t, d[pos] ? d[pos].pts / Math.max(1, d[pos].juegos.size) : 0]).sort((a, b) => b[1] - a[1])
    .forEach(([t, v], i) => { dvp[t] = dvp[t] || {}; dvp[t][pos] = { prom: r1(v), rank: i + 1 }; });
}

// selección de jugadores relevantes
const addM = Object.fromEntries(s.add.map(t => [t.player_id, t.count])), dropM = Object.fromEntries(s.drop.map(t => [t.player_id, t.count]));
const PW = s.proy[semJuego] || {};
const totalPPR = k => s.semanas.reduce((a, w) => a + ((s.stats[w] && s.stats[w][k] && s.stats[w][k].pts_ppr) || 0), 0);
const candidatos = Object.keys(s.todos).filter(k => s.todos[k].team || addM[k] || dropM[k])
  .map(k => [k, (PW[k] && PW[k].pts_ppr || 0) * 3 + totalPPR(k) / Math.max(1, s.semanas.length) + (s.todos[k].rank ? Math.max(0, 300 - s.todos[k].rank) / 30 : 0)])
  .sort((a, b) => b[1] - a[1]).map(x => x[0]);
const set = new Set(candidatos.slice(0, TOP)); [...Object.keys(addM), ...Object.keys(dropM)].forEach(k => s.todos[k] && set.add(k));

const linea = (w, k) => { const x = s.stats[w] && s.stats[w][k]; if (!x || x.pts_ppr == null) return null;
  const st = {}; [['py', 'pass_yd'], ['ptd', 'pass_td'], ['int', 'pass_int'], ['ra', 'rush_att'], ['ry', 'rush_yd'], ['rtd', 'rush_td'], ['tg', 'rec_tgt'], ['rec', 'rec'], ['recy', 'rec_yd'], ['rectd', 'rec_td'], ['fl', 'fum_lost'], ['fgm', 'fgm'], ['xpm', 'xpm']].forEach(([a, b]) => { if (x[b]) st[a] = Math.round(x[b]); });
  return { f: [r1(x.pts_ppr), r1(x.pts_half_ppr), r1(x.pts_std)], st }; };
const espnA = {}; // espn id -> sleeper id
const jugadores = [...set].map(k => {
  const p = s.todos[k];
  if (p.espn) espnA[p.espn] = k;
  const log_ = s.semanas.map(w => { const l = { w, ...(linea(w, k) || {}) }; const c = cal[p.team] && cal[p.team][w]; if (c) { l.opp = c.opp; l.home = c.home; } return l; });
  const pr = PW[k];
  const le = (p.espn && lesE['e' + p.espn]) || lesE['n' + norm(p.n)] || null;
  return { id: k, ...p, team: p.team || 'FA', log: log_,
    proy: pr ? [r1(pr.pts_ppr), r1(pr.pts_half_ppr), r1(pr.pts_std)] : null,
    les: le ? { st: le.st, fecha: le.fecha, tipo: le.tipo || le.lugar, detalle: le.detalle, lado: le.lado, regreso: le.regreso } : null,
    add: addM[k] || 0, drop: dropM[k] || 0 };
});
const J = Object.fromEntries(jugadores.map(j => [j.id, j]));
const porNombre = {}; jugadores.forEach(j => { porNombre[norm(j.n)] = j.id; });
Object.entries(s.todos).forEach(([k, p]) => { if (!porNombre[norm(p.n)]) porNombre[norm(p.n)] = k; });
const fueraTemp = j => ['IR', 'PUP', 'Sus', 'NA'].includes(j.inj) || (j.les && /injured reserve/i.test(j.les.st || ''));
const estadoTxt = j => j.inj ? `${j.inj}${j.injParte ? ' (' + j.injParte + ')' : ''}` : 'activo';

// noticias externas ligadas a jugadores y equipos (para la ficha de cada jugador y como fuente de la IA)
const externas = newsE.map(a => ({ t: a.titulo, d: a.desc.slice(0, 220), f: a.fecha, u: a.url, j: a.atletas.map(e => espnA[e]).filter(Boolean), e: a.equipos }));
guardar(DIR + '/externas.json', externas);

guardar(DIR + '/calendario.json', { temporada: s.temporada, semana: semJuego, semanaStats: s.semana, cal, dvp });

/* ---------- Noticias propias (IA cada ~2 h) ---------- */
const archivo = leer(DIR + '/archivo.json', []);
const prevHoy = leer(DIR + '/hoy.json', {});
const ahora = new Date().toISOString(), sello = ahora.replace(/\D/g, '').slice(0, 12);
const tocaIA = (!prevHoy.ultimaIA || Date.now() - Date.parse(prevHoy.ultimaIA) > CADA_IA_MIN * 60e3) && quedan() > 2;
let nuevas = [], duelo = null;
const palabras = t => new Set(norm2(t).split(' ').filter(w => w.length > 3));
function norm2(t) { return String(t || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9 ]/g, ' '); }
const parecido = (a, b) => { const A = palabras(a), B = palabras(b); let c = 0; A.forEach(w => B.has(w) && c++); return c / Math.max(1, Math.min(A.size, B.size)); };
const ligar = n => (n.jugadores || []).map(x => porNombre[norm(x)]).filter(Boolean);
// El jugador de la tarjeta debe ser el protagonista: su apellido tiene que aparecer en el titular.
const apellidoDe = nm => norm(String(nm || '').replace(/\b(jr|sr|ii|iii|iv)\.?$/i, '').trim().split(/\s+/).slice(-1)[0]);
const protagonista = (n, id) => { const p = J[id] || s.todos[id]; if (!p) return false; const ap = apellidoDe(p.n); const txt = norm(n.titulo || ''); return ap.length > 2 && txt.includes(ap); };
function verificar(n) {
  const ids = ligar(n), p = J[ids[0]] || s.todos[ids[0]];
  const motivo = [];
  if (p && fueraTemp(p) && ['START', 'WAIVER', 'ARRANCA'].includes(n.etiqueta)) motivo.push(`${p.n} está ${estadoTxt(p)}`);
  if (p && p.inj === 'Out' && n.etiqueta === 'START') motivo.push(`${p.n} está OUT`);
  const reciente = archivo.filter(a => Date.now() - Date.parse(a.fecha || 0) < 7 * 864e5);
  if (reciente.some(a => parecido(a.titulo, n.titulo) > .5 || (ids[0] && a.jugadores && a.jugadores[0] === ids[0] && a.etiqueta === n.etiqueta))) motivo.push('duplicada');
  return motivo;
}
if (tocaIA) {
  const relevantes = jugadores.filter(j => j.team !== 'FA' && ((j.proy && j.proy[0] > 6) || (j.rank && j.rank < 200)));
  const estatus = relevantes.filter(j => j.inj).map(j => `${j.n} (${j.pos}, ${j.team}): ${estadoTxt(j)}`).slice(0, 90);
  const fuentes = [...newsE.slice(0, 45).map(a => `${a.titulo} — ${a.desc}`.slice(0, 380)), ...(await titularesRSS())];
  const proyTop = POS.map(pos => pos + ': ' + relevantes.filter(j => j.pos === pos && j.proy).sort((a, b) => b.proy[0] - a.proy[0]).slice(0, 8).map(j => `${j.n} ${j.proy[0]}`).join(', ')).join(' | ');
  const ia = await gemini(VOZ + `Escribe exactamente 12 noticias de fantasy para la semana ${semJuego}. Varía las etiquetas (al menos 2 START, 2 SIT, 2 WAIVER y lesiones si hay). Forma: ` + FORMATO +
    ' En el mismo JSON agrega "duelo":{"a":"jugador","b":"jugador","veredicto":"a quién arrancar y por qué, máximo 40 palabras"} con dos jugadores sanos de la misma posición.' +
    `\nESTATUS OFICIAL (fuente de verdad):\n${estatus.join('\n')}\nPROYECCIONES PPR SEMANA ${semJuego}: ${proyTop}\nMás agregados: ${s.add.slice(0, 12).map(t => s.todos[t.player_id] && s.todos[t.player_id].n).filter(Boolean).join(', ')}\nMás soltados: ${s.drop.slice(0, 10).map(t => s.todos[t.player_id] && s.todos[t.player_id].n).filter(Boolean).join(', ')}\nYa publicadas (NO repitas tema ni jugador principal): ${JSON.stringify(archivo.slice(0, 30).map(n => n.titulo))}\nFUENTES:\n${fuentes.join('\n')}`);
  duelo = ia && ia.duelo;
  for (const [i, n] of ((ia && ia.noticias) || []).entries()) {
    if (n.etiqueta === 'ARRANCA') n.etiqueta = 'START'; if (n.etiqueta === 'BANCA') n.etiqueta = 'SIT';
    const motivo = verificar(n);
    if (motivo.length) { log('Descartada:', n.titulo, '→', motivo.join(', ')); continue; }
    let ids = ligar(n), menciona = [];
    if (ids.length && !protagonista(n, ids[0])) { menciona = ids; ids = []; }
    const equipos = [...new Set([n.equipo, ...(n.equipos || []), ...[...ids, ...menciona].map(id => (J[id] || s.todos[id] || {}).team)].filter(Boolean))];
    nuevas.push({ id: `n${sello}${String(i).padStart(2, '0')}`, fecha: ahora, semana: semJuego, ...n, equipos, jugadores: ids, menciona });
  }
  log('Noticias nuevas verificadas:', nuevas.length);
}

// Exclusivas del reportero
const rep = leer('data/reportero.json', { notas: [] });
const pendientes = (rep.notas || []).filter(x => !x.procesada);
let exclusivas = [];
if (pendientes.length && quedan() > 0) {
  // Una llamada por correo para que ningún punto se pierda; cada tema del reportero se vuelve su propia nota
  for (const nota of pendientes) {
    const ex = await gemini(VOZ + `Esta es una nota EXCLUSIVA de nuestro reportero (puede traer errores de dedo en nombres: corrígelos al nombre oficial). Conviértela en notas premium "Exclusivo FX".
REGLAS: cubre ABSOLUTAMENTE TODOS los puntos del texto, sin omitir ninguno. Genera una nota por cada tema: cada récord es una nota; cada grupo de trade targets por posición (QB, RB, WR, TE) es una nota con TODOS los nombres de ese grupo y si es comprar o vender; si trae el calendario o previa de la semana, haz una nota "Previa de la semana" con los partidos y horarios clave. Usa la etiqueta TRADE para comprar/vender, TENDENCIA para récords y previas, y las demás cuando apliquen. En "claves" resume el punto; en "accion" di exactamente qué hacer (comprar, vender, mantener, arrancar). Máximo 16 notas. Forma: ` + FORMATO.replace('START | SIT | WAIVER | LESIÓN | TENDENCIA', 'START | SIT | WAIVER | LESIÓN | TENDENCIA | TRADE') + `\nNOTA DEL REPORTERO (${nota.asunto || ''}):\n` + nota.texto.slice(0, 30000), 20000);
    const lista = ((ex && ex.noticias) || []).map((n, i) => { const ids = ligar(n); return { id: `x${sello}${String(exclusivas.length + i).padStart(2, '0')}`, fecha: ahora, semana: semJuego, exclusivo: true, fuente: nota.fecha, ...n, equipos: [...new Set([n.equipo, ...(n.equipos || []), ...ids.map(id => (J[id] || {}).team)].filter(Boolean))], jugadores: ids }; });
    if (lista.length) { exclusivas.push(...lista); nota.procesada = true; nota.notas = lista.length; log('Exclusivas de', nota.asunto, '→', lista.length, 'notas'); }
  }
  guardar('data/reportero.json', rep, true);
}
// re-ligar equipos de noticias viejas que no los tenían
archivo.forEach(n => { if (!n.equipos) n.equipos = [...new Set([n.equipo, ...(n.jugadores || []).map(id => (J[id] || {}).team)].filter(Boolean))]; if (n.etiqueta === 'ARRANCA') n.etiqueta = 'START'; if (n.etiqueta === 'BANCA') n.etiqueta = 'SIT'; });
// Revisión continua: cada corrida vuelve a revisar las notas de los últimos 14 días contra el estatus de hoy.
const RECOMIENDA = ['START', 'WAIVER', 'ARRANCA'];
let corregidas = 0;
for (const a of archivo) {
  if (Date.now() - Date.parse(a.fecha || 0) > 14 * 864e5) continue;
  if (a.jugadores && a.jugadores.length && !a.exclusivo && !protagonista(a, a.jugadores[0])) { a.menciona = a.jugadores; a.jugadores = []; corregidas++; }
  const p = a.jugadores && J[a.jugadores[0]];
  const fuera = p && (fueraTemp(p) || p.inj === 'Out');
  if (fuera && (RECOMIENDA.includes(a.etiqueta) || a.impacto === 'SUBE')) {
    const aviso = `Actualización: ${p.n} ahora está ${p.inj === 'Out' ? 'OUT' : estadoTxt(p)}${p.injParte ? ' (' + p.injParte + ')' : ''}. Esta recomendación ya no aplica.`;
    if (a.aviso !== aviso) { a.aviso = aviso; a.vencida = true; corregidas++; }
  } else if (a.vencida && p && !fuera) { delete a.aviso; delete a.vencida; corregidas++; }
}
if (corregidas) log('Notas del archivo corregidas por estatus o protagonista:', corregidas);
// Bóveda Premium: la exclusiva completa va a Supabase (solo la ven los Premium); en el sitio público queda titular y avance.
const SBK = process.env.SUPABASE_SECRET, SBURL = 'https://eafzqftobwrtqdnawncn.supabase.co';
const PRIVADOS = ['contexto', 'fantasy', 'equipo_impacto', 'accion', 'cuerpo'];
const completa = n => n.exclusivo && PRIVADOS.some(k => n[k]);
const avance = n => { const t = { ...n, premium: true, claves: (n.claves || []).slice(0, 1) }; PRIVADOS.forEach(k => delete t[k]); return t; };
async function aBoveda(lista) {
  if (!SBK) { log('Bóveda: falta SUPABASE_SECRET; las exclusivas siguen públicas'); return false; }
  const h = { apikey: SBK, 'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates,return=minimal' }; if (/^eyJ/.test(SBK)) h.Authorization = 'Bearer ' + SBK;
  const r = await fetch(SBURL + '/rest/v1/exclusivos', { method: 'POST', headers: h, signal: conTiempo(30000),
    body: JSON.stringify(lista.map(n => ({ id: n.id, fecha: n.fecha, semana: n.semana ?? null, titulo: n.titulo, nota: n }))) }).catch(e => ({ ok: false, status: e.message, text: async () => '' }));
  if (!r.ok) log('Bóveda: error', r.status, (await r.text()).slice(0, 160));
  return r.ok;
}
const porSubir = [...exclusivas, ...archivo.filter(completa)];
if (porSubir.length && await aBoveda(porSubir)) {
  exclusivas.splice(0, exclusivas.length, ...exclusivas.map(avance));
  archivo.forEach((n, i) => { if (completa(n)) archivo[i] = avance(n); });
  log('Bóveda Premium:', porSubir.length, 'exclusivas guardadas');
}
const todasNuevas = [...exclusivas, ...nuevas];
const nuevoArchivo = [...todasNuevas, ...archivo].slice(0, 800);
guardar(DIR + '/archivo.json', nuevoArchivo);

/* ---------- Resúmenes semanales (10 claves), máx. 1 por corrida ---------- */
const resumenes = leer(DIR + '/semanas.json', {});
for (const w of s.semanas.slice().reverse()) {
  if (quedan() <= 3) break;
  const st = s.stats[w]; if (!st || !Object.keys(st).length) continue;
  const cerrada = Object.values(cal).every(t => !t[w] || t[w].fin);
  const r = resumenes[w];
  if (r && r.v === 2 && (r.cerrada || Date.now() - Date.parse(r.fecha) < 8 * 3600e3)) continue;
  const top = {};
  for (const pos of POS) top[pos] = Object.entries(st).filter(([k, v]) => s.todos[k] && s.todos[k].pos === pos && v.pts_ppr != null).sort((a, b) => b[1].pts_ppr - a[1].pts_ppr).slice(0, 12)
    .map(([k, v]) => ({ id: k, n: s.todos[k].n, team: s.todos[k].team, pts: r1(v.pts_ppr), f: [r1(v.pts_ppr), r1(v.pts_half_ppr), r1(v.pts_std)] }));
  const res = Object.values(cal).map(t => t[w]).filter(x => x && x.fin && x.home).map(x => x);
  const marc = Object.entries(cal).filter(([t, c]) => c[w] && c[w].home && c[w].fin).map(([t, c]) => `${c[w].opp} ${c[w].pc} @ ${t} ${c[w].pf}`).join(', ');
  const txt = await gemini(VOZ + `Escribe el análisis de fantasy de la Semana ${w}. Forma: {"titulo":"máximo 9 palabras","claves":["exactamente 10 aprendizajes de máximo 16 palabras, concretos y con nombres"],"cuerpo":"120 a 160 palabras","sorpresas":["3 frases cortas"],"decepciones":["3 frases cortas"]}. Marcadores: ${marc}. Mejores por posición (PPR): ${JSON.stringify(Object.fromEntries(Object.entries(top).map(([p, l]) => [p, l.slice(0, 6).map(x => x.n + ' ' + x.pts)])))}`, 6000);
  if (txt) { resumenes[w] = { v: 2, semana: w, cerrada, fecha: ahora, top, titulo: txt.titulo || `Semana ${w}`, claves: txt.claves || [], cuerpo: txt.cuerpo || '', sorpresas: txt.sorpresas || [], decepciones: txt.decepciones || [] }; log('Resumen semana', w); }
  else if (!r) resumenes[w] = { v: 1, semana: w, cerrada, fecha: ahora, top, titulo: `Semana ${w}`, claves: [], cuerpo: '' };
  else r.top = top;
  break;
}
guardar(DIR + '/semanas.json', resumenes);

/* ---------- Publicar ---------- */
const lesionados = jugadores.filter(j => ESTATUS[j.inj] && j.team !== 'FA' && ((j.proy && j.proy[0] > 4) || (j.rank && j.rank < 220) || totalPPR(j.id) > 30))
  .sort((a, b) => ((b.proy && b.proy[0]) || totalPPR(b.id) / 6) - ((a.proy && a.proy[0]) || totalPPR(a.id) / 6)).slice(0, 40).map(j => ({ id: j.id, estatus: ESTATUS[j.inj] }));
const hoy = {
  actualizado: ahora, ultimaIA: nuevas.length ? ahora : prevHoy.ultimaIA, semana: semJuego, semanaStats: s.semana, temporada: s.temporada, semanas: s.semanas.slice(-HIST),
  noticias: todasNuevas.length ? todasNuevas : (prevHoy.noticias ? prevHoy.noticias.map(n => nuevoArchivo.find(a => a.id === n.id) || n) : nuevoArchivo.slice(0, 12)),
  lesionados, agregados: s.add.map(t => t.player_id).filter(k => J[k]), soltados: s.drop.map(t => t.player_id).filter(k => J[k]),
  duelo: duelo || prevHoy.duelo || null, fuentes: ['Sleeper', 'ESPN', 'CBS Sports', 'Yahoo Sports']
};
guardar(DIR + '/jugadores.json', jugadores);
guardar(DIR + '/hoy.json', hoy, true);
log(`Listo: ${todasNuevas.length} noticias nuevas (${exclusivas.length} exclusivas) · ${jugadores.length} jugadores · archivo ${nuevoArchivo.length} · semana de juego ${semJuego} · IA usada hoy ${cuota.usadas}/${CUOTA_DIA}`);

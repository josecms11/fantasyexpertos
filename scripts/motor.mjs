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
const POS = ['QB', 'RB', 'WR', 'TE', 'K', 'DEF'];
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
// Si la respuesta llega cortada, rescata los objetos completos de la lista "noticias".
function rescata(t) {
  const i = t.indexOf('"noticias"'); if (i < 0) return null;
  const ini = t.indexOf('[', i); if (ini < 0) return null;
  const ok = []; let prof = 0, desde = -1, enTxt = false, esc = false;
  for (let k = ini + 1; k < t.length; k++) {
    const c = t[k];
    if (enTxt) { if (esc) esc = false; else if (c === '\\') esc = true; else if (c === '"') enTxt = false; continue; }
    if (c === '"') enTxt = true;
    else if (c === '{') { if (prof === 0) desde = k; prof++; }
    else if (c === '}') { prof--; if (prof === 0 && desde >= 0) { try { ok.push(JSON.parse(t.slice(desde, k + 1))); } catch { /* incompleto */ } desde = -1; } }
    else if (c === ']' && prof === 0) break;
  }
  return ok.length ? { noticias: ok } : null;
}
async function gemini(prompt, tokens = 32000) {
  if (!KEY) { log('Falta GEMINI_API_KEY'); return null; }
  if (quedan() <= 0) { log('Cuota diaria de IA agotada, se reintenta mañana'); return null; }
  for (const m of await modelos()) {
    if (cuota.bloqueado && cuota.bloqueado[m]) continue;
    let r;
    try {
      r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${KEY}`, {
        signal: conTiempo(150000), method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { responseMimeType: 'application/json', temperature: 0.6, maxOutputTokens: tokens } })
      });
    } catch (e) { log('Gemini sin respuesta', m, e.message); continue; }
    const j = await r.json().catch(() => ({}));
    if (r.status === 429 || r.status === 404) { (cuota.bloqueado = cuota.bloqueado || {})[m] = r.status; guardar(DIR + '/cuota.json', cuota, true); log('Modelo sin cuota hoy', m, r.status); continue; }
    if (r.status >= 500) { log('Modelo saturado, pruebo otro', m, r.status); continue; }
    cuota.usadas = (cuota.usadas || 0) + 1; guardar(DIR + '/cuota.json', cuota, true);
    const c0 = (j.candidates || [])[0] || {}, t = ((c0.content || {}).parts || []).map(x => x.text || '').join('');
    try { const o = JSON.parse(t.slice(t.indexOf('{'), t.lastIndexOf('}') + 1)); log('IA OK con', m); return o; }
    catch {
      const r2 = rescata(t);
      if (r2) { log('IA respuesta cortada (' + (c0.finishReason || '?') + '), rescatadas', r2.noticias.length, 'notas con', m); return r2; }
      log('Gemini respuesta inválida', m, c0.finishReason || '', t.slice(0, 160)); return null;
    }
  }
  return null;
}
const VOZ = 'Eres el editor de Fantasy Expertos, el rincón de fantasy football para fans de habla hispana. Español de México, tono experto, directo y con personalidad. Escribe con tus propias palabras, nunca copies frases de las fuentes. Escribe SIEMPRE las cifras con dígitos (28.9 pts, 3 TD, semana 7), nunca con letras. Todo se aterriza a decisiones de fantasy. REGLAS DE VERACIDAD: usa SOLO hechos presentes en las fuentes y en la lista de estatus que te doy; si un jugador está OUT o IR jamás lo recomiendes para arrancar; no inventes cifras, fechas ni lesiones; si no estás seguro de un dato, no lo uses. Responde SOLO JSON. ';
const FORMATO = '{"noticias":[{"titulo":"titular original y punchy, máximo 9 palabras","claves":["3 puntos clave de máximo 12 palabras"],"contexto":"qué pasó y por qué, 50 a 80 palabras","fantasy":"impacto en fantasy: a quién sube o baja, en qué formatos y ligas, 50 a 80 palabras","equipo_impacto":"cómo cambia al equipo y a sus compañeros, 30 a 60 palabras","accion":"qué hacer hoy en tu liga, una frase accionable","en":{"titulo":"same headline in US English, max 9 words","claves":["3 key points in English"],"contexto":"in English","fantasy":"in English","equipo_impacto":"in English","accion":"one actionable sentence in English"},"etiqueta":"START | SIT | WAIVER | LESIÓN | TENDENCIA","impacto":"SUBE | BAJA | NEUTRO","equipo":"abreviatura NFL del equipo principal","equipos":["todas las abreviaturas NFL relacionadas"],"jugadores":["nombre completo en inglés; el primero DEBE ser el protagonista que aparece en el titular; no incluyas jugadores mencionados de paso"]}]}';

/* ---------- Fuentes de texto ---------- */
async function titularesRSS() {
  const out = [];
  for (const u of RSS) {
    try {
      const xml = await (await fetch(u, { signal: conTiempo() })).text();
      for (const m of xml.matchAll(/<item>([\s\S]*?)<\/item>/g)) {
        const t = (m[1].match(/<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/) || [])[1] || '';
        const d = ((m[1].match(/<description>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/) || [])[1] || '').replace(/<[^>]+>/g, '');
        const ln = ((m[1].match(/<link>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/link>/) || [])[1] || '').trim();
        if (t) out.push({ t, txt: (t + ' — ' + d).slice(0, 400), u: /^https?:\/\//.test(ln) ? ln : null, m: /cbssports/.test(u) ? 'CBS Sports' : /yahoo/.test(u) ? 'Yahoo Sports' : 'RSS' });
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
    todos[k] = { n: p.position === 'DEF' ? `${p.last_name || k} D/ST` : p.full_name || [p.first_name, p.last_name].filter(Boolean).join(' ') || k, pos: p.position, team: p.team, num: p.number, edad: p.age, exp: p.years_exp, col: p.college, alt: p.height, peso: p.weight, espn: p.espn_id ? String(p.espn_id) : null,
      rank: p.search_rank && p.search_rank < 9999999 ? p.search_rank : null, inj: p.injury_status, injParte: p.injury_body_part, injNota: p.injury_notes, depth: p.depth_chart_order };
  }
  const semanas = []; for (let w = 1; w <= semana; w++) semanas.push(w);
  const stats = {};
  for (const w of semanas) stats[w] = await get(`https://api.sleeper.app/v1/stats/nfl/regular/${temporada}/${w}`) || {};
  // proyecciones de la semana a jugar y la siguiente
  const proy = {};
  for (const w of [semana, semana + 1]) {
    let p = proyeccionesDe(await get(`https://api.sleeper.app/v1/projections/nfl/regular/${temporada}/${w}`));
    if (!Object.keys(p).length) p = proyeccionesDe(await get(`https://api.sleeper.app/projections/nfl/${temporada}/${w}?season_type=regular&position[]=QB&position[]=RB&position[]=WR&position[]=TE&position[]=K&position[]=DEF`));
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
const candidatos = Object.keys(s.todos).filter(k => s.todos[k].pos !== 'DEF' && (s.todos[k].team || addM[k] || dropM[k]))
  .map(k => [k, (PW[k] && PW[k].pts_ppr || 0) * 3 + totalPPR(k) / Math.max(1, s.semanas.length) + (s.todos[k].rank ? Math.max(0, 300 - s.todos[k].rank) / 30 : 0)])
  .sort((a, b) => b[1] - a[1]).map(x => x[0]);
const set = new Set(candidatos.slice(0, TOP)); Object.keys(s.todos).filter(k => s.todos[k].pos === 'DEF' && s.todos[k].team).forEach(k => set.add(k)); // las 32 defensivas siempre [...Object.keys(addM), ...Object.keys(dropM)].forEach(k => s.todos[k] && set.add(k));

const linea = (w, k) => { const x = s.stats[w] && s.stats[w][k]; if (!x) return null;
  const jugo = x.pts_ppr != null || x.gp || x.off_snp || x.rec_tgt || x.rush_att || x.pass_att; if (!jugo) return null; // una semana jugada con 0 puntos también cuenta
  const st = {}; [['py', 'pass_yd'], ['ptd', 'pass_td'], ['int', 'pass_int'], ['ra', 'rush_att'], ['ry', 'rush_yd'], ['rtd', 'rush_td'], ['tg', 'rec_tgt'], ['rec', 'rec'], ['recy', 'rec_yd'], ['rectd', 'rec_td'], ['fl', 'fum_lost'], ['fgm', 'fgm'], ['xpm', 'xpm'], ['sk', 'sack'], ['dint', 'int'], ['fr', 'fum_rec'], ['dtd', 'def_td'], ['pa', 'pts_allow'], ['sf', 'safe']].forEach(([a, b]) => { if (x[b]) st[a] = Math.round(x[b]); });
  return { f: [r1(x.pts_ppr || 0), r1(x.pts_half_ppr ?? x.pts_ppr ?? 0), r1(x.pts_std ?? x.pts_ppr ?? 0)], st }; };
const espnA = {}; // espn id -> sleeper id
const jugadores = [...set].map(k => {
  const p = s.todos[k];
  if (p.espn) espnA[p.espn] = k;
  const log_ = s.semanas.map(w => { const l = { w, ...(linea(w, k) || {}) }; const c = cal[p.team] && cal[p.team][w]; if (c) { l.opp = c.opp; l.home = c.home; } return l; });
  const pr = PW[k];
  const le = (p.espn && lesE['e' + p.espn]) || lesE['n' + norm(p.n)] || null;
  return { id: k, ...p, team: p.team || 'FA', log: log_,
    proy: null,
    les: le ? { st: le.st, fecha: le.fecha, tipo: le.tipo || le.lugar, detalle: le.detalle, lado: le.lado, regreso: le.regreso } : null,
    add: addM[k] || 0, drop: dropM[k] || 0 };
});
/* ---------- Modelo FX v2: proyección propia ----------
   Volumen esperado (targets, acarreos, yardas de pase) ponderado por recencia × eficiencia del jugador
   regresada a la media de su posición (los TD, que son lo más ruidoso, se regresan mucho más). K y DEF: promedio
   ponderado con regresión. Parámetros elegidos con backtest S4-S7 2026 (scripts de auditoría).                      */
const FX = { version: 'FX v3', hl: 8, mEf: 40, mTd: 160, aPrev: 0.3 };
/* v3: la temporada anterior entra como "juegos previos" con peso aPrev (mitad si cambió de equipo); la actual pesa más
   y domina conforme avanza el año. Backtest S3-S7: error medio 4.79 vs 4.87 sin historia (scripts de auditoría). */
const PREVIA = await (async () => {
  const año = Number(s.temporada) - 1, f = DIR + '/previa.json', c = leer(f, null);
  if (c && c.año === año && Object.keys(c.j || {}).length > 200) return c.j;
  let txt = null;
  try { const r = await fetch(`https://github.com/nflverse/nflverse-data/releases/download/stats_player/stats_player_week_${año}.csv`, { signal: conTiempo(60000) }); if (r.ok) txt = await r.text(); } catch (e) { log('Previa falló', e.message); }
  if (!txt) return (c && c.j) || {};
  const filas = txt.trim().split('\n'), H = filas.shift().split(','), ix = k => H.indexOf(k), num = (c2, k) => +c2[ix(k)] || 0, P = {};
  const cs = l => { const o = []; let c = '', q = false; for (const ch of l) { if (ch === '"') q = !q; else if (ch === ',' && !q) { o.push(c); c = ''; } else c += ch; } o.push(c); return o; };
  for (const l of filas) { const c2 = cs(l); if (c2[ix('season_type')] !== 'REG') continue;
    const k = norm(c2[ix('player_display_name')]) + '|' + c2[ix('position')], x = P[k] = P[k] || { g: 0 };
    x.g++; x.team = c2[ix('team')];
    const add = (a, v) => x[a] = Math.round(((x[a] || 0) + v) * 10) / 10;
    add('tg', num(c2, 'targets')); add('rec', num(c2, 'receptions')); add('recy', num(c2, 'receiving_yards')); add('rectd', num(c2, 'receiving_tds'));
    add('ra', num(c2, 'carries')); add('ry', num(c2, 'rushing_yards')); add('rtd', num(c2, 'rushing_tds')); add('py', num(c2, 'passing_yards')); add('ptd', num(c2, 'passing_tds'));
    add('int', num(c2, 'passing_interceptions')); add('fl', num(c2, 'rushing_fumbles_lost') + num(c2, 'receiving_fumbles_lost') + num(c2, 'sack_fumbles_lost')); }
  for (const k in P) if (P[k].g < 3) delete P[k];
  guardar(f, { año, fuente: 'nflverse (datos públicos)', j: P }); log('Previa', año, ':', Object.keys(P).length, 'jugadores'); return P;
})();
const previaDe = j => { const x = PREVIA[norm(j.n) + '|' + j.pos]; if (!x) return null; const mismo = x.team === j.team || (x.team === 'LA' && j.team === 'LAR'); return { x, a: FX.aPrev * (mismo ? 1 : .5) }; };
const STK = ['tg', 'rec', 'recy', 'rectd', 'ra', 'ry', 'rtd', 'py', 'ptd', 'int', 'fl'];
function tasasPos(lista, W) { const T = {}; for (const j of lista) for (const l of j.log) { if (l.w >= W || !l.st || !l.f) continue; const t = T[j.pos] = T[j.pos] || {}; for (const k of STK) t[k] = (t[k] || 0) + (l.st[k] || 0); } return T; }
function proyFX(j, W, T) {
  const hist = j.log.filter(l => l.w < W && l.f && l.f[0] != null), pv = j.pos === 'K' || j.pos === 'DEF' ? null : previaDe(j); if (!hist.length && !pv) return null;
  const w = l => Math.pow(.5, (W - 1 - l.w) / FX.hl), n = hist.length, pg = pv ? pv.a * pv.x.g : 0, sw = hist.reduce((a, l) => a + w(l), 0) + pg;
  if (j.pos === 'K' || j.pos === 'DEF') return [0, 1, 2].map(k => { const v = hist.reduce((a, l) => a + w(l) * (l.f[k] ?? l.f[0]), 0) / sw; return r1((n * v + 2 * .8 * v) / (n + 2)); });
  const ex = k => pv ? pv.a * (pv.x[k] || 0) : 0, tp = T[j.pos] || {};
  const vol = k => (hist.reduce((a, l) => a + w(l) * ((l.st || {})[k] || 0), 0) + ex(k)) / sw, tot = k => hist.reduce((a, l) => a + ((l.st || {})[k] || 0), 0) + ex(k);
  const tasa = (num, den, m) => { const d = tot(den) + m; return d ? (tot(num) + m * ((tp[num] || 0) / Math.max(1, tp[den] || 0))) / d : 0; };
  const tg = vol('tg'), ra = vol('ra'), qb = j.pos === 'QB', py = vol('py');
  const rec = tg * tasa('rec', 'tg', FX.mEf), recy = tg * tasa('recy', 'tg', FX.mEf), rectd = tg * tasa('rectd', 'tg', FX.mTd);
  const ry = ra * tasa('ry', 'ra', FX.mEf), rtd = ra * tasa('rtd', 'ra', FX.mTd), ptd = qb ? py * tasa('ptd', 'py', FX.mTd * 40) : 0, it = qb ? vol('int') : 0, fl = vol('fl');
  const base = py * .04 + ptd * 4 - it + ry * .1 + rtd * 6 + recy * .1 + rectd * 6 - fl * 2;
  return [base + rec, base + rec * .5, base].map(v => r1(Math.max(0, v)));
}
{ const T = tasasPos(jugadores, semJuego); for (const j of jugadores) j.proy = proyFX(j, semJuego, T); }
log('Modelo', FX.version, ':', jugadores.filter(j => j.proy).length, 'proyecciones propias para la semana', semJuego);
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
// Noticias al momento: el motor reacciona a reportes NUEVOS. En horario pico de EE. UU. (10 a. m. a medianoche del Este)
// revisa cada corrida y escribe en cuanto aparece algo; fuera de pico, cada 90 min. La cuota diaria se reparte con el blog.
const vistos = new Set(leer(DIR + '/vistos.json', []));
const claveF = t => norm(String(t || '')).slice(0, 90);
const horaET = (new Date().getUTCHours() + 20) % 24, pico = horaET >= 10;
const fuentesTodas = [...newsE.slice(0, 45).map(a => ({ k: claveF(a.titulo), txt: `${a.titulo} — ${a.desc}`.slice(0, 380), u: a.url })), ...(await titularesRSS()).map(t => ({ k: claveF(t.t), txt: t.txt, u: t.u, m: t.m }))];
fuentesTodas.forEach(f => { if (!f.m) f.m = 'ESPN'; });
const fuentesNuevas = fuentesTodas.filter(f => f.k && !vistos.has(f.k));
const tocaIA = fuentesNuevas.length > 0 && (!prevHoy.ultimaIA || Date.now() - Date.parse(prevHoy.ultimaIA) > (pico ? 20 : 90) * 60e3) && quedan() > 8;
log('Fuentes nuevas:', fuentesNuevas.length, '· horario', pico ? 'pico' : 'normal', '· toca IA:', tocaIA);
let nuevas = [], duelo = null;
const palabras = t => new Set(norm2(t).split(' ').filter(w => w.length > 3));
function norm2(t) { return String(t || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9 ]/g, ' '); }
const parecido = (a, b) => { const A = palabras(a), B = palabras(b); let c = 0; A.forEach(w => B.has(w) && c++); return c / Math.max(1, Math.min(A.size, B.size)); };
const ligar = n => (n.jugadores || []).map(x => porNombre[norm(x)]).filter(Boolean);
// El jugador de la tarjeta debe ser el protagonista: su apellido tiene que aparecer en el titular.
const apellidoDe = nm => norm(String(nm || '').replace(/\b(jr|sr|ii|iii|iv)\.?$/i, '').trim().split(/\s+/).slice(-1)[0]);
const protagonista = (n, id) => { const p = J[id] || s.todos[id]; if (!p) return false; const ap = apellidoDe(p.n); const txt = norm(n.titulo || ''); return ap.length > 2 && txt.includes(ap); };
const EQUIPOS = { ARI: 'Arizona Cardinals', ATL: 'Atlanta Falcons', BAL: 'Baltimore Ravens', BUF: 'Buffalo Bills', CAR: 'Carolina Panthers', CHI: 'Chicago Bears', CIN: 'Cincinnati Bengals', CLE: 'Cleveland Browns', DAL: 'Dallas Cowboys', DEN: 'Denver Broncos', DET: 'Detroit Lions', GB: 'Green Bay Packers', HOU: 'Houston Texans', IND: 'Indianapolis Colts', JAX: 'Jacksonville Jaguars', KC: 'Kansas City Chiefs', LV: 'Las Vegas Raiders', LAC: 'Los Angeles Chargers', LAR: 'Los Angeles Rams', MIA: 'Miami Dolphins', MIN: 'Minnesota Vikings', NE: 'New England Patriots', NO: 'New Orleans Saints', NYG: 'New York Giants', NYJ: 'New York Jets', PHI: 'Philadelphia Eagles', PIT: 'Pittsburgh Steelers', SF: 'San Francisco 49ers', SEA: 'Seattle Seahawks', TB: 'Tampa Bay Buccaneers', TEN: 'Tennessee Titans', WAS: 'Washington Commanders' };
const NICK = Object.fromEntries(Object.entries(EQUIPOS).map(([ab, nm]) => [nm.split(' ').pop().toLowerCase(), ab]));
/* ---------- Verificador automático antes de publicar (notas y blog) ----------
   1) cifras siempre con dígitos  2) toda cifra decimal debe existir en los datos o fuentes que recibió la IA
   3) el equipo del protagonista no puede estar equivocado  4) el matchup no puede contradecir nuestra calificación */
const NUM_LETRAS = /\b(cero|uno|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez|once|doce|trece|catorce|quince|dieci\w+|veinte|veinti\w+|treinta|cuarenta|cincuenta|zero|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty)(\s+y\s+\w+|-\w+)?\s+(punto|point)\b/i;
const textosDe = x => [x.titulo, ...(x.claves || []), x.contexto, x.fantasy && typeof x.fantasy === 'object' ? x.fantasy.texto : x.fantasy, x.equipo_impacto, x.accion, x.respuesta, ...(x.secciones || []).map(c => c.texto), ...(x.faq || []).map(f => f.a)].filter(v => typeof v === 'string');
function revisaTexto(partes, hechos, prot, matchup) {
  const out = [], txt = partes.flatMap(textosDe).join(' \n ');
  if (!txt.trim()) return out;
  if (NUM_LETRAS.test(txt)) out.push('cifras escritas con letras');
  const nums = (String(hechos).match(/\d+(?:\.\d+)?/g) || []).map(Number);
  const raras = [...new Set((txt.match(/(?<![\d.])\d+\.\d+(?![\d.])/g) || []).map(Number))].filter(v => !nums.some(x => Math.abs(x - v) < 0.051));
  if (raras.length) out.push('cifras que no están en los datos: ' + raras.slice(0, 4).join(', '));
  if (prot && prot.n && EQUIPOS[prot.team]) {
    const rx = new RegExp(prot.n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + `[^.\\n]{0,45}?\\b(?:de los|con los|of the|for the|with the)\\s+([A-Z][a-z0-9]+)`, 'g');
    for (const m of txt.matchAll(rx)) { const ab = NICK[m[1].toLowerCase()]; if (ab && ab !== prot.team) out.push(`equipo equivocado: ${prot.n} con ${m[1]}`); }
  }
  if (matchup) {
    const frases = txt.split(/(?<=[.!?])\s+/).filter(f => /defens|defense|rival|matchup|opponent/i.test(f));
    const pos = /(favorable|accesible|fácil|facil|vulnerable|débil|debil|blanda|generosa|weak|soft|easy|exploitable|friendly|leaky)/i, neg = /(difícil|dificil|dura|complicad|tough|difficult|stingy|stout)/i;
    if (matchup === 'DIFÍCIL' && frases.some(f => pos.test(f) && !neg.test(f))) out.push('matchup contradice la calificación (DIFÍCIL)');
    if (matchup === 'FÁCIL' && frases.some(f => neg.test(f) && !pos.test(f))) out.push('matchup contradice la calificación (FÁCIL)');
  }
  return out;
}
function verificar(n) {
  const ids = ligar(n), p = J[ids[0]] || s.todos[ids[0]];
  const motivo = [];
  if (p && fueraTemp(p) && ['START', 'WAIVER', 'ARRANCA'].includes(n.etiqueta)) motivo.push(`${p.n} está ${estadoTxt(p)}`);
  if (p && p.inj === 'Out' && n.etiqueta === 'START') motivo.push(`${p.n} está OUT`);
  const reciente = archivo.filter(a => Date.now() - Date.parse(a.fecha || 0) < 7 * 864e5);
  if (reciente.some(a => parecido(a.titulo, n.titulo) > .5 || (ids[0] && a.jugadores && a.jugadores[0] === ids[0] && a.etiqueta === n.etiqueta))) motivo.push('duplicada');
  return motivo;
}
const pideDuelo = !prevHoy.dueloFecha || Date.now() - Date.parse(prevHoy.dueloFecha) > 20 * 3600e3;
if (tocaIA) {
  const relevantes = jugadores.filter(j => j.team !== 'FA' && ((j.proy && j.proy[0] > 6) || (j.rank && j.rank < 200)));
  const estatus = relevantes.filter(j => j.inj).map(j => `${j.n} (${j.pos}, ${j.team}): ${estadoTxt(j)}`).slice(0, 90);
  const usadas = fuentesNuevas.slice(0, 30), fuentes = usadas.map((f, i) => `[${i + 1}] (${f.m}) ${f.txt}`);
  const proyTop = POS.map(pos => pos + ': ' + relevantes.filter(j => j.pos === pos && j.proy).sort((a, b) => b.proy[0] - a.proy[0]).slice(0, 8).map(j => `${j.n} ${j.proy[0]}`).join(', ')).join(' | ');
  const ia = await gemini(VOZ + `Escribe de 1 a 4 noticias de fantasy para la semana ${semJuego}, SOLO sobre lo que reportan las FUENTES (son reportes nuevos de las últimas horas; cada una lleva su número [n]). En cada nota pon "fuentes":[números de las FUENTES que usaste]; es obligatorio, una nota sin fuente se descarta. Redacta con tus propias palabras: es nuestra versión, citando al medio original. Ignora lo que no tenga impacto en fantasy. Cada nota en español y su versión en inglés estadounidense (llave "en"). Forma: ` + FORMATO +
    (pideDuelo ? ' En el mismo JSON agrega "duelo":{"a":"jugador","b":"jugador","veredicto":"a quién arrancar y por qué, máximo 40 palabras"} con dos jugadores sanos de la misma posición.' : '') +
    `\nESTATUS OFICIAL (fuente de verdad):\n${estatus.join('\n')}\nPROYECCIONES PPR DEL MODELO FX, SEMANA ${semJuego}: ${proyTop}\nMás agregados: ${s.add.slice(0, 12).map(t => s.todos[t.player_id] && s.todos[t.player_id].n).filter(Boolean).join(', ')}\nMás soltados: ${s.drop.slice(0, 10).map(t => s.todos[t.player_id] && s.todos[t.player_id].n).filter(Boolean).join(', ')}\nYa publicadas (NO repitas tema ni jugador principal): ${JSON.stringify(archivo.slice(0, 30).map(n => n.titulo))}\nFUENTES:\n${fuentes.join('\n')}`);
  duelo = ia && ia.duelo;
  fuentesNuevas.forEach(f => vistos.add(f.k)); guardar(DIR + '/vistos.json', [...vistos].slice(-800));
  const hechosIA = `${estatus.join(' ')} ${proyTop} ${fuentes.join(' ')}`;
  for (const [i, n] of ((ia && ia.noticias) || []).entries()) {
    if (n.etiqueta === 'ARRANCA') n.etiqueta = 'START'; if (n.etiqueta === 'BANCA') n.etiqueta = 'SIT';
    const motivo = [...verificar(n), ...revisaTexto([n, n.en || {}], hechosIA, J[ligar(n)[0]])];
    if (motivo.length) { log('Descartada:', n.titulo, '→', motivo.join(', ')); continue; }
    let ids = ligar(n), menciona = [];
    if (ids.length && !protagonista(n, ids[0])) { menciona = ids; ids = []; }
    const equipos = [...new Set([n.equipo, ...(n.equipos || []), ...[...ids, ...menciona].map(id => (J[id] || s.todos[id] || {}).team)].filter(Boolean))];
    const refs = [...new Set((Array.isArray(n.fuentes) ? n.fuentes : []).map(Number))].map(k => usadas[k - 1]).filter(Boolean).map(f => ({ m: f.m, u: f.u || null, t: String(f.txt).split(' — ')[0].slice(0, 140) })).slice(0, 4);
    if (!refs.length) { const ap = [...ids, ...menciona].map(id => (J[id] || s.todos[id] || {}).n).filter(Boolean).map(x => x.split(' ').slice(-1)[0].toLowerCase());
      const f = ap.length && usadas.find(f => ap.some(a => a.length > 3 && f.txt.toLowerCase().includes(a))); if (f) refs.push({ m: f.m, u: f.u || null, t: String(f.txt).split(' — ')[0].slice(0, 140) }); }
    if (!refs.length) { log('Descartada (sin fuente citada):', n.titulo); continue; }
    nuevas.push({ id: `n${sello}${String(i).padStart(2, '0')}`, fecha: ahora, semana: semJuego, ...n, fuentes: refs, equipos, jugadores: ids, menciona });
  }
  log('Noticias nuevas verificadas:', nuevas.length);
}

// Exclusivas del reportero: los correos viven en Supabase (privado). El archivo público data/reportero.json ya no se usa.
const SBK = process.env.SUPABASE_SECRET, SBURL = 'https://eafzqftobwrtqdnawncn.supabase.co';
const sbH = () => { const h = { apikey: SBK, 'Content-Type': 'application/json' }; if (/^eyJ/.test(SBK || '')) h.Authorization = 'Bearer ' + SBK; return h; };
let rep = { notas: [] }, repDeSupabase = false;
if (SBK) {
  try {
    const r = await fetch(SBURL + '/rest/v1/reportero?procesada=eq.false&order=fecha.asc&limit=10', { headers: sbH(), signal: conTiempo(20000) });
    if (r.ok) { rep.notas = await r.json(); repDeSupabase = true; } else log('Reportero (Supabase): error', r.status, (await r.text()).slice(0, 120));
  } catch (e) { log('Reportero (Supabase): sin respuesta', e.message); }
}
// Sin Supabase no hay correos que procesar (el archivo público ya no existe).
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
  if (repDeSupabase) {
    for (const n of pendientes.filter(x => x.procesada && x.id)) await fetch(SBURL + '/rest/v1/reportero?id=eq.' + n.id, { method: 'PATCH', headers: { ...sbH(), Prefer: 'return=minimal' }, body: JSON.stringify({ procesada: true, notas: n.notas || 0 }), signal: conTiempo(20000) }).catch(e => log('Reportero: no se pudo marcar', e.message));
  } else log('Reportero: sin Supabase, no se marca como procesado (nada se publica en GitHub)');
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
  if (r && r.v === 3 && (r.cerrada || Date.now() - Date.parse(r.fecha) < 8 * 3600e3)) continue;
  const top = {};
  for (const pos of POS) top[pos] = Object.entries(st).filter(([k, v]) => s.todos[k] && s.todos[k].pos === pos && v.pts_ppr != null).sort((a, b) => b[1].pts_ppr - a[1].pts_ppr).slice(0, 12)
    .map(([k, v]) => ({ id: k, n: s.todos[k].n, team: s.todos[k].team, pts: r1(v.pts_ppr), f: [r1(v.pts_ppr), r1(v.pts_half_ppr), r1(v.pts_std)] }));
  const res = Object.values(cal).map(t => t[w]).filter(x => x && x.fin && x.home).map(x => x);
  const marc = Object.entries(cal).filter(([t, c]) => c[w] && c[w].home && c[w].fin).map(([t, c]) => `${c[w].opp} ${c[w].pc} @ ${t} ${c[w].pf}`).join(', ');
  const txt = await gemini(VOZ + `Escribe el análisis de fantasy de la Semana ${w}. Forma: {"titulo":"máximo 9 palabras","claves":["exactamente 10 aprendizajes de máximo 16 palabras, concretos y con nombres"],"cuerpo":"120 a 160 palabras","sorpresas":["3 frases cortas"],"decepciones":["3 frases cortas"]}. Marcadores: ${marc}. Mejores por posición (PPR): ${JSON.stringify(Object.fromEntries(Object.entries(top).map(([p, l]) => [p, l.slice(0, 6).map(x => x.n + ' ' + x.pts)])))}`, 6000);
  if (txt && NUM_LETRAS.test(JSON.stringify(txt))) log('Resumen S' + w + ' descartado: cifras con letras');
  if (txt && !NUM_LETRAS.test(JSON.stringify(txt))) { resumenes[w] = { v: 3, semana: w, cerrada, fecha: ahora, top, titulo: txt.titulo || `Semana ${w}`, claves: txt.claves || [], cuerpo: txt.cuerpo || '', sorpresas: txt.sorpresas || [], decepciones: txt.decepciones || [] }; log('Resumen semana', w); }
  else if (!r) resumenes[w] = { v: 1, semana: w, cerrada, fecha: ahora, top, titulo: `Semana ${w}`, claves: [], cuerpo: '' };
  else r.top = top;
  break;
}
guardar(DIR + '/semanas.json', resumenes);

/* ---------- Blog SEO bilingüe (ES / EN) ----------
   Cada ~5 h escribe 2 artículos con títulos en forma de pregunta sobre los jugadores del momento (lo que la gente
   busca en Google: ¿lo arranco?, ¿lo agrego?, ¿juega?, ¿lo vendo?). Hechos: nuestros datos + reportes originales
   (con enlace a la fuente). Análisis y veredicto: propios, con el Modelo FX. Nunca se copia texto de las fuentes. */
const blog = leer(DIR + '/blog.json', []);
const CADA_BLOG_MIN = 300, BLOG_POR_CORRIDA = 2;
const ultimaBlog = blog.reduce((m, a) => Math.max(m, Date.parse(a.fecha || 0)), 0);
const tocaBlog = (process.env.FX_BLOG === '1' || Date.now() - ultimaBlog > (pico ? 150 : CADA_BLOG_MIN) * 60e3) && quedan() > 4;
const slugB = t => String(t || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80);
if (tocaBlog) {
  const rankFX = {}; POS.forEach(ps => jugadores.filter(j => j.pos === ps && j.proy && j.team !== 'FA').sort((a, b) => b.proy[0] - a.proy[0]).forEach((j, i) => { rankFX[j.id] = i + 1; }));
  const temas = [];
  s.add.forEach(t => { const j = J[t.player_id]; if (j && j.team !== 'FA' && !fueraTemp(j)) temas.push({ tipo: 'waiver', j, peso: t.count }); });
  jugadores.filter(j => ESTATUS[j.inj] && j.team !== 'FA' && j.proy && j.proy[0] > 8).forEach(j => temas.push({ tipo: 'lesion', j, peso: j.proy[0] * 1000 }));
  jugadores.filter(j => j.proy && rankFX[j.id] <= 24 && !j.inj && !['K', 'DEF'].includes(j.pos)).forEach(j => temas.push({ tipo: 'startsit', j, peso: j.proy[0] * 500 + (j.add || 0) }));
  s.drop.forEach(t => { const j = J[t.player_id]; if (j && j.proy && j.proy[0] > 6 && !fueraTemp(j)) temas.push({ tipo: 'trade', j, peso: t.count }); });
  const reciente = blog.filter(a => Date.now() - Date.parse(a.fecha) < 10 * 864e5);
  const usado = t => reciente.some(a => a.jugador === t.j.id && (a.tipo === t.tipo || Date.now() - Date.parse(a.fecha) < 3 * 864e5));
  const orden = ['startsit', 'waiver', 'lesion', 'trade', 'startsit', 'lesion', 'waiver'];
  const giro = blog.length % orden.length, elegidos = [];
  for (let k = 0; k < orden.length && elegidos.length < BLOG_POR_CORRIDA; k++) {
    const tipo = orden[(giro + k) % orden.length];
    const t = temas.filter(x => x.tipo === tipo && !usado(x) && !elegidos.some(e => e.j.id === x.j.id)).sort((a, b) => b.peso - a.peso)[0];
    if (t) elegidos.push(t);
  }
  const FMT_TIPO = { startsit: ['¿Arrancar o sentar a {N} en la semana {W}?', 'Should you start {N} in Week {W}?'], waiver: ['¿Vale la pena agregar a {N} en la semana {W}?', 'Should you pick up {N} in Week {W}?'],
    lesion: ['Lesión de {N}: ¿juega en la semana {W} y qué hacer en fantasy?', '{N} injury update: will he play in Week {W}? Fantasy impact'], trade: ['¿Vender o aguantar a {N}? Valor de trade semana {W}', 'Should you sell or hold {N}? Week {W} trade value'] };
  for (const t of elegidos) {
    if (Date.now() - t0 > 7 * 60e3) { log('Blog: sin tiempo en esta corrida, sigue en la próxima'); break; }
    const j = t.j, rival = cal[j.team] && cal[j.team][semJuego], d = rival && dvp[rival.opp] && dvp[rival.opp][j.pos];
    const ult = j.log.filter(l => l.f).slice(-4).map(l => `S${l.w} ${l.home ? 'vs' : '@'} ${l.opp || '?'}: ${l.f[0]} pts PPR · ${Object.entries(l.st || {}).map(([k, v]) => k + '=' + v).join(' ')}`);
    const jug = j.log.filter(l => l.f), tot = r1(jug.reduce((a, l) => a + l.f[0], 0));
    const noticiasJ = externas.filter(x => (x.j || []).includes(j.id)).slice(0, 4), nuestras = archivo.filter(n => (n.jugadores || []).includes(j.id)).slice(0, 3);
    const [tEs, tEn] = FMT_TIPO[t.tipo].map(x => x.replace('{N}', j.n).replace('{W}', semJuego));
    const datos = `JUGADOR: ${j.n} (${j.pos}, ${j.team}). Edad ${j.edad ?? '?'}, experiencia ${j.exp ?? '?'} años.
ESTATUS: ${estadoTxt(j)}${j.les ? ` · reporte: ${j.les.st || ''} ${j.les.tipo || ''} ${j.les.detalle || ''} ${j.les.regreso ? 'regreso estimado ' + j.les.regreso : ''}` : ''}.
TEMPORADA ${s.temporada}: ${jug.length} juegos, ${tot} pts PPR, promedio ${jug.length ? r1(tot / jug.length) : 0}.
ÚLTIMOS JUEGOS: ${ult.join(' | ') || 'sin juegos'}.
MODELO FX (propio) SEMANA ${semJuego}: ${j.proy ? `${j.proy[0]} PPR / ${j.proy[1]} Half / ${j.proy[2]} STD · ${j.pos}${rankFX[j.id] || '?'} de la semana` : 'sin proyección'}.
RIVAL SEMANA ${semJuego}: ${rival ? `${rival.home ? 'vs' : '@'} ${rival.opp}` : 'descanso (BYE)'}${d ? ` · MATCHUP ${d.rank <= 10 ? 'FÁCIL' : d.rank >= 23 ? 'DIFÍCIL' : 'NEUTRAL'} (esa defensa permite ${d.prom} pts por juego a ${j.pos}; es la Nº${d.rank} de 32, donde Nº1 = la que MÁS permite y Nº32 = la que MENOS permite)` : ''}.
COMUNIDAD: agregado en ${j.add || 0} ligas y soltado en ${j.drop || 0} en 24 h.
REPORTES ORIGINALES (hechos verificables; NO copies su redacción): ${noticiasJ.map(x => `«${x.t}» — ${x.d}`).join(' | ') || 'ninguno'}.
NUESTRAS NOTAS PREVIAS: ${nuestras.map(n => n.titulo + ': ' + (n.claves || []).join('; ')).join(' | ') || 'ninguna'}.`;
    const pide = `Eres el editor de Fantasy Expertos. Escribe UN artículo de blog optimizado para Google que responde la pregunta del momento sobre este jugador, en DOS versiones: español latinoamericano neutro (claro para México, EE. UU. hispano y Latinoamérica) e inglés estadounidense con la terminología estándar de fantasy football (start/sit, waiver wire, PPR, flex, bye, ceiling, floor).
Reglas: usa SOLO los datos que te doy; cifras siempre con dígitos (28.9 pts), nunca con letras; para el rival usa la etiqueta MATCHUP tal cual (FÁCIL/NEUTRAL/DIFÍCIL), no la reinterpretes; no inventes cifras, lesiones, fechas ni citas; escribe con tus propias palabras (cero frases copiadas de los reportes); primero la noticia y el contexto, después el análisis y al final la recomendación de fantasy; tono experto, cercano, claro y sin relleno; nada de nombres de otras marcas o medios.
Título ES base: "${tEs}" · Título EN base: "${tEn}" (puedes mejorarlos, mantén la pregunta, el nombre y la semana; máximo 70 caracteres).
Responde SOLO JSON: {"es":{"titulo":"","descripcion":"máx 155 caracteres","respuesta":"2 o 3 oraciones que responden directo la pregunta","secciones":[{"h2":"","texto":"90 a 140 palabras"}],"fantasy":{"veredicto":"START|SIT|FLEX|AGRÉGALO|ESPERA|VENDE|COMPRA|AGUANTA","texto":"70 a 110 palabras: qué hacer exactamente en PPR, Half y STD"},"faq":[{"q":"","a":""}],"palabras":["5 búsquedas reales que este texto responde"]},"en":{mismas llaves en inglés; veredicto en inglés: START|SIT|FLEX|ADD|WAIT|SELL|BUY|HOLD}}. Exactamente 3 secciones y 3 preguntas frecuentes por idioma.
DATOS:
${datos}`;
    const r = await gemini(pide, 12000);
    if (!r || !r.es || !r.en || !r.es.titulo || !r.en.titulo || !(r.es.secciones || []).length) { log('Blog: respuesta incompleta para', j.n); continue; }
    if (fueraTemp(j) && /START|FLEX/.test(String(r.es.fantasy && r.es.fantasy.veredicto))) { log('Blog descartado (fuera y recomendado):', j.n); continue; }
    { const mu = d ? (d.rank <= 10 ? 'FÁCIL' : d.rank >= 23 ? 'DIFÍCIL' : 'NEUTRAL') : null, fallas = revisaTexto([r.es, r.en], datos, j, mu);
      if (fallas.length) { log('Blog descartado por verificación:', j.n, '→', fallas.join(' | ')); continue; } }
    const id = 'b' + ahora.replace(/\D/g, '').slice(0, 12) + String(elegidos.indexOf(t));
    const art = { id, fecha: ahora, semana: semJuego, tipo: t.tipo, jugador: j.id, equipo: j.team, modelo: FX.version,
      fuentes: noticiasJ.filter(x => x.u).map(x => ({ t: x.t, u: x.u })),
      es: { ...r.es, slug: slugB(r.es.titulo) + '-' + id.slice(-6) }, en: { ...r.en, slug: slugB(r.en.titulo) + '-' + id.slice(-6) } };
    blog.unshift(art); log('Blog:', art.es.titulo, '/', art.en.titulo);
  }
  guardar(DIR + '/blog.json', blog.slice(0, 600));
}

/* ---------- Publicar ---------- */
const lesionados = jugadores.filter(j => ESTATUS[j.inj] && j.team !== 'FA' && ((j.proy && j.proy[0] > 4) || (j.rank && j.rank < 220) || totalPPR(j.id) > 30))
  .sort((a, b) => ((b.proy && b.proy[0]) || totalPPR(b.id) / 6) - ((a.proy && a.proy[0]) || totalPPR(a.id) / 6)).slice(0, 40).map(j => ({ id: j.id, estatus: ESTATUS[j.inj] }));
const hoy = {
  modelo: FX.version,
  actualizado: ahora, ultimaIA: nuevas.length ? ahora : prevHoy.ultimaIA, semana: semJuego, semanaStats: s.semana, temporada: s.temporada, semanas: s.semanas.slice(-HIST),
  noticias: todasNuevas.length ? todasNuevas : (prevHoy.noticias ? prevHoy.noticias.map(n => nuevoArchivo.find(a => a.id === n.id) || n) : nuevoArchivo.slice(0, 12)),
  lesionados, agregados: s.add.map(t => t.player_id).filter(k => J[k]), soltados: s.drop.map(t => t.player_id).filter(k => J[k]),
  duelo: duelo || prevHoy.duelo || null, dueloFecha: duelo ? ahora : (prevHoy.dueloFecha || null), fuentes: ['Sleeper', 'ESPN', 'CBS Sports', 'Yahoo Sports']
};
// Precisión del modelo: cada semana terminada se compara FX (recalculado con lo que se sabía antes) contra el
// resultado real y contra una proyección de referencia externa. La referencia NO se publica; solo los errores.
try {
  const M = leer(DIR + '/modelo.json', { version: FX.version, semanas: {} }), Wc = semJuego - 1;
  if (Wc >= 3 && !(M.semanas[Wc] && M.semanas[Wc].cerrada)) {
    const ref = proyeccionesDe(await get(`https://api.sleeper.app/v1/projections/nfl/regular/${s.temporada}/${Wc}`)), T = tasasPos(jugadores, Wc);
    const filas = jugadores.map(j => { const act = (j.log.find(l => l.w === Wc && l.f) || {}).f; const prev = j.log.filter(l => l.w < Wc && l.f).length;
      const fx = proyFX(j, Wc, T), r = ref[j.id] && ref[j.id].pts_ppr; return act && prev >= 2 && fx && r != null ? { pos: j.pos, act: act[0], fx: fx[0], r } : null; }).filter(Boolean);
    const mae = k => Math.round(filas.reduce((a, x) => a + Math.abs(x[k] - x.act), 0) / Math.max(1, filas.length) * 100) / 100;
    const rk = v => { const o = v.map((x, i) => [x, i]).sort((a, b) => a[0] - b[0]), r = []; o.forEach(([, i], k) => r[i] = k); return r; };
    const sp = (L, k) => { const n = L.length; if (n < 6) return null; const a = rk(L.map(x => x[k])), b = rk(L.map(x => x.act)); return Math.round((1 - 6 * a.reduce((t, x, i) => t + (x - b[i]) ** 2, 0) / (n * (n * n - 1))) * 1000) / 1000; };
    const porPos = Object.fromEntries(POS.map(ps => { const L = filas.filter(x => x.pos === ps); return [ps, { n: L.length, spearmanFX: sp(L, 'fx'), spearmanRef: sp(L, 'r') }]; }));
    const juegosPend = Object.values(cal).some(t => t[Wc] && !t[Wc].fin);
    if (filas.length) { M.version = FX.version; M.semanas[Wc] = { n: filas.length, maeFX: mae('fx'), maeRef: mae('r'), porPos, cerrada: !juegosPend, fecha: new Date().toISOString() }; guardar(DIR + '/modelo.json', M, true); log('Precisión S' + Wc + ': error FX', mae('fx'), '· referencia', mae('r'), '· n', filas.length); }
  }
} catch (e) { log('Precisión del modelo: error', e.message); }
guardar(DIR + '/jugadores.json', jugadores);
guardar(DIR + '/hoy.json', hoy, true);
log(`Listo: ${todasNuevas.length} noticias nuevas (${exclusivas.length} exclusivas) · ${jugadores.length} jugadores · archivo ${nuevoArchivo.length} · semana de juego ${semJuego} · IA usada hoy ${cuota.usadas}/${CUOTA_DIA}`);

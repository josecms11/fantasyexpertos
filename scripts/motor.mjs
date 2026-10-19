// FANTASY EXPERTOS – Motor automático (GitHub Actions, cada hora)
// 1. Noticias de medios (RSS) + notas exclusivas del reportero (data/reportero.json, las sube Apps Script)
// 2. Datos de Sleeper: jugadores, lesiones, puntos por semana, agregados/soltados
// 3. Gemini escribe noticias propias y notas EXCLUSIVAS a partir del reportero
// 4. Guarda archivo histórico y resúmenes semanales (catch-up de la temporada)
import fs from 'node:fs';
const LOG = []; const t0 = Date.now();
const log = (...a) => { const m = `[${((Date.now() - t0) / 1000).toFixed(1)}s] ` + a.join(' '); console.log(m); LOG.push(m); fs.mkdirSync('data', { recursive: true }); fs.writeFileSync('data/estado.json', JSON.stringify({ fecha: new Date().toISOString(), log: LOG }, null, 2)); };
const TO = { signal: undefined };
const conTiempo = (ms = 25000) => AbortSignal.timeout(ms);

const KEY = process.env.GEMINI_API_KEY;
const MODELO = process.env.GEMINI_MODEL || 'gemini-3.8-flash';
const RSS = ['https://www.cbssports.com/rss/headlines/nfl/', 'https://sports.yahoo.com/nfl/rss/'];
const TOP = 350, HIST = 5;
const leer = (f, d) => { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch { return d; } };
const guardar = (f, o, pretty) => { fs.mkdirSync(f.split('/').slice(0, -1).join('/'), { recursive: true }); fs.writeFileSync(f, JSON.stringify(o, null, pretty ? 2 : 0)); };
const get = async u => { try { const r = await fetch(u, { headers: { 'User-Agent': 'FantasyExpertos/1.0' }, signal: conTiempo(40000) }); return r.ok ? r.json() : null; } catch (e) { log('GET falló', u, e.message); return null; } };
const norm = t => String(t || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z]/g, '');

/* ---------- RSS ---------- */
async function titulares() {
  const out = [];
  for (const u of RSS) {
    try {
      const xml = await (await fetch(u, { signal: conTiempo() })).text();
      for (const m of xml.matchAll(/<item>([\s\S]*?)<\/item>/g)) {
        const t = (m[1].match(/<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/) || [])[1] || '';
        const d = ((m[1].match(/<description>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/) || [])[1] || '').replace(/<[^>]+>/g, '');
        if (t) out.push((t + ' — ' + d).slice(0, 500));
        if (out.length > 40) break;
      }
    } catch (e) { console.log('RSS falló', u, e.message); }
  }
  return out;
}

/* ---------- Sleeper ---------- */
async function sleeper() {
  const estado = await get('https://api.sleeper.app/v1/state/nfl');
  const temporada = estado.season, semana = estado.week;
  const raw = await get('https://api.sleeper.app/v1/players/nfl');
  const todos = {};
  for (const [k, p] of Object.entries(raw || {})) {
    if (!p.active || !['QB', 'RB', 'WR', 'TE', 'K'].includes(p.position)) continue;
    todos[k] = { n: p.full_name, pos: p.position, team: p.team, num: p.number, edad: p.age, exp: p.years_exp, col: p.college, alt: p.height, peso: p.weight,
      rank: p.search_rank && p.search_rank < 9999999 ? p.search_rank : null, inj: p.injury_status, injParte: p.injury_body_part, injNota: p.injury_notes };
  }
  const semanas = []; for (let w = 1; w <= semana; w++) semanas.push(w);
  const stats = {};
  for (const w of semanas) stats[w] = await get(`https://api.sleeper.app/v1/stats/nfl/regular/${temporada}/${w}`) || {};
  const add = await get('https://api.sleeper.app/v1/players/nfl/trending/add?lookback_hours=24&limit=15') || [];
  const drop = await get('https://api.sleeper.app/v1/players/nfl/trending/drop?lookback_hours=24&limit=15') || [];
  const addM = Object.fromEntries(add.map(t => [t.player_id, t.count])), dropM = Object.fromEntries(drop.map(t => [t.player_id, t.count]));
  const ids = Object.keys(todos).filter(k => (todos[k].rank && todos[k].team) || addM[k] || dropM[k]).sort((a, b) => (todos[a].rank || 1e9) - (todos[b].rank || 1e9));
  const set = new Set(ids.slice(0, TOP)); [...Object.keys(addM), ...Object.keys(dropM)].forEach(k => todos[k] && set.add(k));
  const pts = (w, k) => stats[w]?.[k]?.pts_ppr != null ? Math.round(stats[w][k].pts_ppr * 10) / 10 : null;
  const semHist = semanas.slice(-HIST);
  const jugadores = [...set].map(k => {
    const p = todos[k], temp = semanas.map(w => pts(w, k)), jug = temp.filter(v => v != null);
    return { id: k, ...p, team: p.team || 'FA', hist: semHist.map(w => pts(w, k)), temp,
      total: jug.length ? Math.round(jug.reduce((a, b) => a + b, 0) * 10) / 10 : null,
      prom: jug.length ? Math.round(jug.reduce((a, b) => a + b, 0) / jug.length * 10) / 10 : null, add: addM[k] || 0, drop: dropM[k] || 0 };
  });
  return { temporada, semana, semanas, semHist, stats, todos, jugadores, agregados: add.map(t => t.player_id).filter(k => todos[k]), soltados: drop.map(t => t.player_id).filter(k => todos[k]) };
}

/* ---------- Gemini ---------- */
async function gemini(prompt) {
  if (!KEY) { console.log('Falta GEMINI_API_KEY'); return null; }
  let r; try { r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODELO}:generateContent?key=${KEY}`, {
    signal: conTiempo(120000), method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { responseMimeType: 'application/json', temperature: 0.7, maxOutputTokens: 16000 } })
  }); } catch (e) { log('Gemini sin respuesta', e.message); return null; }
  const j = await r.json();
  try { const t = j.candidates[0].content.parts.map(x => x.text || '').join(''); return JSON.parse(t.slice(t.indexOf('{'), t.lastIndexOf('}') + 1)); }
  catch { log('Gemini falló', JSON.stringify(j).slice(0, 400)); return null; }
}
const FORMATO = '{"noticias":[{"titulo":"titular original y punchy, máximo 8 palabras","claves":["3 puntos clave de máximo 10 palabras"],"cuerpo":"desglose propio de 60 a 90 palabras con el impacto en fantasy","etiqueta":"LESIÓN | WAIVER | ARRANCA | BANCA | TENDENCIA","impacto":"SUBE | BAJA | NEUTRO","equipo":"abreviatura NFL del equipo principal","jugadores":["nombre completo en inglés, el principal primero"]}]}';
const VOZ = 'Eres el editor de Fantasy Expertos, el rincón de fantasy football para fans de habla hispana. Español de México, tono experto, directo y con personalidad. Escribe con tus propias palabras, nunca copies frases de las fuentes. Todo se aterriza a decisiones de fantasy. Responde SOLO JSON. ';

/* ---------- YouTube (sin clave: página del canal + RSS) ---------- */
async function videosYT(handle) {
  try {
    const html = await (await fetch('https://www.youtube.com/' + handle, { signal: conTiempo(), headers: { 'User-Agent': 'Mozilla/5.0', 'Accept-Language': 'es' } })).text();
    const cid = (html.match(/"channelId":"(UC[\w-]{22})"/) || html.match(/channel\/(UC[\w-]{22})/) || [])[1];
    if (!cid) { log('No encontré el canal de YouTube'); return null; }
    const xml = await (await fetch('https://www.youtube.com/feeds/videos.xml?channel_id=' + cid, { signal: conTiempo() })).text();
    const vids = [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)].map(m => ({
      id: (m[1].match(/<yt:videoId>(.*?)<\/yt:videoId>/) || [])[1],
      titulo: ((m[1].match(/<title>([\s\S]*?)<\/title>/) || [])[1] || '').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'"),
      fecha: (m[1].match(/<published>(.*?)<\/published>/) || [])[1],
      vistas: +((m[1].match(/views="(\d+)"/) || [])[1] || 0),
      corto: /\/shorts\//.test(m[1])
    })).filter(v => v.id);
    return { canal: cid, videos: vids };
  } catch (e) { log('YouTube falló', e.message); return null; }
}

/* ---------- MAIN ---------- */
log('Inicio');
const redes = leer('data/redes.json', {});
const yt = redes.youtube ? await videosYT(redes.youtube.usuario) : null;
if (yt) guardar('data/videos.json', { actualizado: new Date().toISOString(), ...yt }, true);

log('YouTube:', yt ? yt.videos.length + ' videos' : 'sin datos');
const s = await sleeper();
log('Sleeper:', s.jugadores.length, 'jugadores, semana', s.semana);
const porNombre = Object.fromEntries(s.jugadores.map(j => [norm(j.n), j.id]));
const J = Object.fromEntries(s.jugadores.map(j => [j.id, j]));
const nombres = ids => ids.slice(0, 15).map(id => J[id] ? `${J[id].n} (${J[id].pos}, ${J[id].team})` : '').filter(Boolean);
const ESTATUS = { Questionable: 'Duda', Doubtful: 'Duda', Out: 'Fuera', IR: 'Fuera', PUP: 'Fuera', Sus: 'Fuera' };
const lesionados = s.jugadores.filter(j => ESTATUS[j.inj] && j.team !== 'FA' && (j.total || 0) > 0).sort((a, b) => (b.total || 0) - (a.total || 0)).slice(0, 25).map(j => ({ id: j.id, estatus: ESTATUS[j.inj] }));
const archivo = leer('data/archivo.json', []);
const liga = n => (n.jugadores || []).map(x => porNombre[norm(x)]).filter(Boolean);
const ahora = new Date().toISOString();
const sello = ahora.replace(/\D/g, '').slice(0, 12);

// 1) Noticias del ciclo (con IA solo una vez por hora para cuidar la cuota gratis)
const prevHoy = leer('data/hoy.json', {});
const tocaIA = !prevHoy.ultimaIA || Date.now() - Date.parse(prevHoy.ultimaIA) > 55 * 60e3;
const tit = tocaIA ? await titulares() : [];
const ia = !tocaIA ? null : await gemini(VOZ + 'Escribe exactamente 10 noticias de fantasy a partir de estos titulares de medios y datos. Forma: ' + FORMATO + ' En el mismo JSON agrega "duelo":{"a":"jugador","b":"jugador","veredicto":"a quién arrancar y por qué, máximo 40 palabras"}.' +
  `\nLesionados: ${JSON.stringify(nombres(lesionados.map(x => x.id)))}\nMás agregados: ${JSON.stringify(nombres(s.agregados))}\nMás soltados: ${JSON.stringify(nombres(s.soltados))}\nYa publicadas (no repitas): ${JSON.stringify(archivo.slice(0, 25).map(n => n.titulo))}\nTITULARES:\n${tit.join('\n')}`);
const nuevas = (ia?.noticias || []).map((n, i) => ({ id: `n${sello}${String(i).padStart(2, '0')}`, fecha: ahora, semana: s.semana, ...n, jugadores: liga(n) }));

// 2) Exclusivas del reportero (premium)
const rep = leer('data/reportero.json', { notas: [] });
const pendientes = (rep.notas || []).filter(x => !x.procesada);
let exclusivas = [];
if (pendientes.length) {
  const ex = await gemini(VOZ + 'Estas son notas EXCLUSIVAS de nuestro reportero. Conviértelas en notas premium "Exclusivo FX": más profundas, con contexto y una recomendación accionable. Forma: ' +
    FORMATO.replace('"noticias"', '"noticias"') + '\nNOTAS:\n' + pendientes.map(x => x.texto).join('\n---\n').slice(0, 50000));
  exclusivas = (ex?.noticias || []).map((n, i) => ({ id: `x${sello}${String(i).padStart(2, '0')}`, fecha: ahora, semana: s.semana, exclusivo: true, ...n, jugadores: liga(n) }));
}
const todasNuevas = [...exclusivas, ...nuevas];
const ultimaIA = nuevas.length ? ahora : prevHoy.ultimaIA;
const nuevoArchivo = [...todasNuevas, ...archivo].slice(0, 600);
if (todasNuevas.length) guardar('data/archivo.json', nuevoArchivo);

// 3) Catch-up: resumen de cada semana que falte
const resumenes = leer('data/semanas.json', {});
let hechos = 0;
for (const w of s.semanas) {
  if (hechos >= 3) break;
  const st = s.stats[w];
  if (!st || !Object.keys(st).length) continue;
  const cerrada = w < s.semana;
  if (resumenes[w] && (resumenes[w].cerrada || !cerrada && Date.now() - Date.parse(resumenes[w].fecha) < 6 * 3600e3)) continue;
  const top = {};
  for (const pos of ['QB', 'RB', 'WR', 'TE', 'K']) {
    top[pos] = Object.entries(st).filter(([k, v]) => s.todos[k]?.pos === pos && v.pts_ppr != null)
      .sort((a, b) => b[1].pts_ppr - a[1].pts_ppr).slice(0, 10).map(([k, v]) => ({ id: k, n: s.todos[k].n, team: s.todos[k].team, pts: Math.round(v.pts_ppr * 10) / 10 }));
  }
  const txt = await gemini(VOZ + `Escribe el resumen de fantasy de la Semana ${w}. Forma: {"titulo":"máximo 8 palabras","claves":["4 puntos clave de máximo 12 palabras"],"cuerpo":"80 a 120 palabras"}. Mejores por posición (PPR): ${JSON.stringify(Object.fromEntries(Object.entries(top).map(([p, l]) => [p, l.slice(0, 5).map(x => x.n + ' ' + x.pts)])))}`);
  hechos++;
  resumenes[w] = { semana: w, cerrada, fecha: ahora, top, titulo: txt?.titulo || `Semana ${w}`, claves: txt?.claves || [], cuerpo: txt?.cuerpo || '' };
  log('Resumen semana', w);
}
guardar('data/semanas.json', resumenes);

// 4) Publicar
const hoy = {
  actualizado: ahora, ultimaIA, semana: s.semana, temporada: s.temporada, semanas: s.semHist,
  noticias: (todasNuevas.length ? todasNuevas : (prevHoy.noticias && prevHoy.noticias[0] && prevHoy.noticias[0].claves ? prevHoy.noticias : nuevoArchivo.slice(0, 10))),
  lesionados, agregados: s.agregados, soltados: s.soltados,
  duelo: ia?.duelo || prevHoy.duelo || null
};
guardar('data/jugadores.json', s.jugadores);
guardar('data/hoy.json', hoy, true);
if (pendientes.length && exclusivas.length) { rep.notas.forEach(x => x.procesada = true); guardar('data/reportero.json', rep, true); }
log(`Listo: ${todasNuevas.length} noticias nuevas (${exclusivas.length} exclusivas), ${s.jugadores.length} jugadores, archivo ${nuevoArchivo.length}`);

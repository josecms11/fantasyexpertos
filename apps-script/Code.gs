/**
 * FANTASY EXPERTOS – Motor automático (v3)
 * Corre cada hora y:
 *  1. Lee los correos del reportero (fxnews@8creativo.info)
 *  2. Lee noticias de NFL por RSS
 *  3. Trae de Sleeper: jugadores, lesiones, puntos por semana, más agregados y más soltados
 *  4. Gemini escribe 10 reportajes propios en español y los liga a jugadores
 *  5. Publica data/hoy.json y data/jugadores.json en GitHub → la página se actualiza sola
 *
 * Claves (Configuración del proyecto → Propiedades de la secuencia de comandos):
 *  GEMINI_API_KEY, GITHUB_TOKEN
 */

const CFG = {
  SHEET_ID: '1OvwgryYyPr1Bul_sfomLaVWsx4jaghe8O6isGqHkMjo',
  BUZON: 'fxnews@8creativo.info',
  ETIQUETA: 'Fantasy-Dump',
  REPO: 'josecms11/fantasyexpertos',
  RSS: [
    'https://www.cbssports.com/rss/headlines/nfl/',
    'https://sports.yahoo.com/nfl/rss/'
  ],
  MODELO: 'gemini-3.8-flash',
  TOP_JUGADORES: 350,   // cuántos jugadores tienen página propia
  SEMANAS_HIST: 5       // semanas de puntos que se guardan por jugador
};

/* ---------- Ejecutar UNA vez para dejar todo listo ---------- */
function instalar() {
  ScriptApp.getProjectTriggers().forEach(t => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger('ciclo').timeBased().everyHours(1).create();
  ciclo();
}

/* ---------- Ciclo principal ---------- */
function ciclo() {
  const hoja = SpreadsheetApp.openById(CFG.SHEET_ID).getSheets()[0];
  leerCorreos_(hoja);
  leerRSS_(hoja);
  const s = datosSleeper_();
  const ia = escribirConGemini_(notasRecientes_(hoja), s);

  // Liga cada reportaje con los jugadores que menciona (por nombre)
  const porNombre = {};
  s.jugadores.forEach(j => porNombre[normaliza_(j.n)] = j.id);
  const noticias = (ia.noticias || []).map((n, i) => ({
    id: 'r' + (i + 1),
    titulo: n.titulo, claves: n.claves || [], cuerpo: n.cuerpo, etiqueta: n.etiqueta,
    impacto: n.impacto || 'NEUTRO', equipo: n.equipo || '',
    jugadores: (n.jugadores || []).map(x => porNombre[normaliza_(x)]).filter(Boolean)
  }));

  const hoy = {
    actualizado: new Date().toISOString(),
    semana: s.semana, temporada: s.temporada, semanas: s.semanasHist,
    noticias: noticias,
    lesionados: s.lesionados,
    agregados: s.agregados,
    soltados: s.soltados,
    duelo: ia.duelo
  };
  publicarEnGitHub_('data/jugadores.json', JSON.stringify(s.jugadores));
  publicarEnGitHub_('data/hoy.json', JSON.stringify(hoy, null, 2));
}

function normaliza_(t) {
  return String(t || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z]/g, '');
}

/* ---------- 1. Correos del reportero ---------- */
function leerCorreos_(hoja) {
  const etiqueta = GmailApp.getUserLabelByName(CFG.ETIQUETA) || GmailApp.createLabel(CFG.ETIQUETA);
  const hilos = GmailApp.search('to:' + CFG.BUZON + ' -label:' + CFG.ETIQUETA + ' newer_than:2d', 0, 20);
  hilos.forEach(h => {
    h.getMessages().forEach(m => {
      hoja.appendRow([m.getDate(), 'reportero', 'dump', m.getPlainBody().slice(0, 45000), '']);
    });
    h.addLabel(etiqueta);
  });
}

/* ---------- 2. Noticias RSS ---------- */
function leerRSS_(hoja) {
  const vistos = new Set(hoja.getDataRange().getValues().map(r => String(r[3]).slice(0, 120)));
  CFG.RSS.forEach(url => {
    try {
      const xml = XmlService.parse(UrlFetchApp.fetch(url, { muteHttpExceptions: true }).getContentText());
      const items = xml.getRootElement().getChild('channel').getChildren('item').slice(0, 12);
      items.forEach(it => {
        const texto = it.getChildText('title') + ' — ' + (it.getChildText('description') || '').replace(/<[^>]+>/g, '');
        if (!vistos.has(texto.slice(0, 120))) hoja.appendRow([new Date(), url, 'rss', texto, '']);
      });
    } catch (e) { console.log('RSS falló: ' + url + ' ' + e); }
  });
}

/* ---------- 3. Sleeper (gratis, sin clave) ---------- */
function datosSleeper_() {
  const get = u => JSON.parse(UrlFetchApp.fetch(u, { muteHttpExceptions: true }).getContentText() || '{}');
  const estado = get('https://api.sleeper.app/v1/state/nfl');
  const temporada = estado.season, semana = estado.week;
  const todos = jugadoresCache_();

  // Puntos PPR de las últimas semanas
  const semanasHist = [];
  for (let w = Math.max(1, semana - CFG.SEMANAS_HIST + 1); w <= semana; w++) semanasHist.push(w);
  const stats = semanasHist.map(w => get('https://api.sleeper.app/v1/stats/nfl/regular/' + temporada + '/' + w));

  const add = get('https://api.sleeper.app/v1/players/nfl/trending/add?lookback_hours=24&limit=15');
  const drop = get('https://api.sleeper.app/v1/players/nfl/trending/drop?lookback_hours=24&limit=15');
  const addMap = {}, dropMap = {};
  (add || []).forEach(t => addMap[t.player_id] = t.count);
  (drop || []).forEach(t => dropMap[t.player_id] = t.count);

  // Jugadores con página: los mejor rankeados + cualquiera en tendencia
  const ids = Object.keys(todos)
    .filter(k => (todos[k].rank && todos[k].team) || addMap[k] || dropMap[k])
    .sort((a, b) => (todos[a].rank || 9999) - (todos[b].rank || 9999));
  const elegidos = new Set(ids.slice(0, CFG.TOP_JUGADORES));
  Object.keys(addMap).concat(Object.keys(dropMap)).forEach(k => { if (todos[k]) elegidos.add(k); });

  const jugadores = [...elegidos].map(k => {
    const p = todos[k];
    const hist = stats.map(st => (st && st[k] && st[k].pts_ppr != null) ? Math.round(st[k].pts_ppr * 10) / 10 : null);
    const jugados = hist.filter(x => x != null);
    return {
      id: k, n: p.n, pos: p.pos, team: p.team || 'FA', num: p.num, edad: p.edad, exp: p.exp,
      col: p.col, alt: p.alt, peso: p.peso, rank: p.rank,
      inj: p.inj || null, injParte: p.injParte || null, injNota: p.injNota || null,
      hist: hist,
      prom: jugados.length ? Math.round(jugados.reduce((a, b) => a + b, 0) / jugados.length * 10) / 10 : null,
      add: addMap[k] || 0, drop: dropMap[k] || 0
    };
  });

  const traduce = { Questionable: 'Duda', Doubtful: 'Duda', Out: 'Fuera', IR: 'Fuera', PUP: 'Fuera', Sus: 'Fuera' };
  const lesionados = jugadores
    .filter(j => j.inj && traduce[j.inj] && j.rank && j.rank < 250)
    .sort((a, b) => a.rank - b.rank).slice(0, 20)
    .map(j => ({ id: j.id, estatus: traduce[j.inj] }));
  const agregados = (add || []).map(t => t.player_id).filter(id => todos[id]);
  const soltados = (drop || []).map(t => t.player_id).filter(id => todos[id]);

  return { temporada, semana, semanasHist, jugadores, lesionados, agregados, soltados };
}

// La lista completa de Sleeper pesa ~5 MB: se guarda reducida en Drive una vez al día
function jugadoresCache_() {
  const props = PropertiesService.getScriptProperties();
  const hoy = Utilities.formatDate(new Date(), 'America/Monterrey', 'yyyy-MM-dd');
  const id = props.getProperty('CACHE_ID');
  if (id && props.getProperty('CACHE_FECHA') === hoy && props.getProperty('CACHE_V') === '3') {
    try { return JSON.parse(DriveApp.getFileById(id).getBlob().getDataAsString()); } catch (e) {}
  }
  const todos = JSON.parse(UrlFetchApp.fetch('https://api.sleeper.app/v1/players/nfl').getContentText());
  const mini = {};
  Object.keys(todos).forEach(k => {
    const p = todos[k];
    if (!p.active || !['QB', 'RB', 'WR', 'TE', 'K'].includes(p.position)) return;
    mini[k] = {
      n: p.full_name, pos: p.position, team: p.team, num: p.number, edad: p.age, exp: p.years_exp,
      col: p.college, alt: p.height, peso: p.weight, rank: p.search_rank && p.search_rank < 9999999 ? p.search_rank : null,
      inj: p.injury_status, injParte: p.injury_body_part, injNota: p.injury_notes
    };
  });
  const texto = JSON.stringify(mini);
  let fid = id;
  try { if (fid) DriveApp.getFileById(fid).setContent(texto); } catch (e) { fid = null; }
  if (!fid) fid = DriveApp.createFile('fx-jugadores-cache.json', texto).getId();
  props.setProperties({ CACHE_ID: fid, CACHE_FECHA: hoy, CACHE_V: '3' });
  return mini;
}

/* ---------- Notas de las últimas 24 h ---------- */
function notasRecientes_(hoja) {
  const limite = Date.now() - 24 * 3600 * 1000;
  return hoja.getDataRange().getValues().slice(1)
    .filter(r => new Date(r[0]).getTime() > limite)
    .map(r => '[' + r[2] + '] ' + r[3]).join('\n').slice(0, 60000);
}

/* ---------- 4. Gemini escribe ---------- */
function escribirConGemini_(notas, s) {
  const key = PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY');
  const porId = {}; s.jugadores.forEach(j => porId[j.id] = j);
  const nombres = ids => ids.slice(0, 15).map(id => porId[id] ? porId[id].n + ' (' + porId[id].pos + ')' : '').filter(Boolean);
  const prompt =
    'Eres el editor de Fantasy Expertos, un sitio mexicano de fantasy football. ' +
    'Con las notas de abajo (dump del reportero y titulares de medios) escribe en español de México, ' +
    'con tono experto, directo y energético. Escribe con tus propias palabras: no copies frases de las fuentes. ' +
    'Enfócate en lo que importa para alineaciones de fantasy. ' +
    'Responde SOLO JSON con esta forma: ' +
    '{"noticias":[{"titulo":"titular original y punchy, máximo 8 palabras",' +
    '"claves":["3 puntos clave de máximo 10 palabras cada uno"],' +
    '"cuerpo":"desglose propio de 60 a 90 palabras con el impacto en fantasy",' +
    '"etiqueta":"una de: LESIÓN, WAIVER, ARRANCA, BANCA, TENDENCIA",' +
    '"impacto":"SUBE, BAJA o NEUTRO según cómo afecta el valor en fantasy del jugador principal",' +
    '"equipo":"abreviatura NFL del equipo principal (ej. KC, PHI, DET)",' +
    '"jugadores":["nombre completo en inglés de cada jugador mencionado, el principal primero"]}] (exactamente 10 noticias),' +
    '"duelo":{"a":"jugador","b":"jugador","veredicto":"a quién arrancar y por qué, máximo 40 palabras"}}\n\n' +
    'Lesionados: ' + JSON.stringify(nombres(s.lesionados.map(x => x.id))) +
    '\nMás agregados: ' + JSON.stringify(nombres(s.agregados)) +
    '\nMás soltados: ' + JSON.stringify(nombres(s.soltados)) +
    '\n\nNOTAS:\n' + notas;
  const res = UrlFetchApp.fetch(
    'https://generativelanguage.googleapis.com/v1beta/models/' + CFG.MODELO + ':generateContent?key=' + key, {
      method: 'post', contentType: 'application/json', muteHttpExceptions: true,
      payload: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: 'application/json', temperature: 0.7, maxOutputTokens: 16000 }
      })
    });
  try {
    const partes = JSON.parse(res.getContentText()).candidates[0].content.parts;
    const texto = partes.map(x => x.text || '').join('');
    return JSON.parse(texto.slice(texto.indexOf('{'), texto.lastIndexOf('}') + 1));
  } catch (e) {
    console.log('Gemini falló: ' + res.getContentText());
    return { noticias: [], duelo: { a: '—', b: '—', veredicto: '' } };
  }
}

/* ---------- 5. Publicar en GitHub ---------- */
function publicarEnGitHub_(ruta, contenido) {
  const token = PropertiesService.getScriptProperties().getProperty('GITHUB_TOKEN');
  const url = 'https://api.github.com/repos/' + CFG.REPO + '/contents/' + ruta;
  const h = { Authorization: 'Bearer ' + token, Accept: 'application/vnd.github+json' };
  const actual = UrlFetchApp.fetch(url, { headers: h, muteHttpExceptions: true });
  const sha = actual.getResponseCode() === 200 ? JSON.parse(actual.getContentText()).sha : undefined;
  const r = UrlFetchApp.fetch(url, {
    method: 'put', headers: h, contentType: 'application/json', muteHttpExceptions: true,
    payload: JSON.stringify({
      message: 'Contenido automático ' + ruta + ' ' + new Date().toISOString(),
      content: Utilities.base64Encode(contenido, Utilities.Charset.UTF_8),
      sha: sha
    })
  });
  console.log('GitHub ' + ruta + ': ' + r.getResponseCode());
}

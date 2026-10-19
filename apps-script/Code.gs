/**
 * FANTASY EXPERTOS – Motor automático
 * Corre cada hora (activador) y:
 *  1. Lee los correos del reportero (fxnews@8creativo.info)
 *  2. Lee noticias de NFL por RSS
 *  3. Trae lesionados y "más agregados" de la API pública de Sleeper
 *  4. Gemini escribe reportajes propios en español
 *  5. Publica data/hoy.json en GitHub → la página se actualiza sola
 *
 * Claves (Configuración del proyecto → Propiedades de la secuencia de comandos):
 *  GEMINI_API_KEY, GITHUB_TOKEN
 */

const CFG = {
  SHEET_ID: '1OvwgryYyPr1Bul_sfomLaVWsx4jaghe8O6isGqHkMjo',
  BUZON: 'fxnews@8creativo.info',
  ETIQUETA: 'Fantasy-Dump',
  REPO: 'josecms11/fantasyexpertos',
  ARCHIVO: 'data/hoy.json',
  RSS: [
    'https://www.espn.com/espn/rss/nfl/news',
    'https://www.cbssports.com/rss/headlines/nfl/',
    'https://sports.yahoo.com/nfl/rss/'
  ],
  MODELO: 'gemini-2.5-flash'
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
  const sleeper = datosSleeper_();
  const notas = notasRecientes_(hoja);
  const ia = escribirConGemini_(notas, sleeper);
  const json = {
    actualizado: new Date().toISOString(),
    semana: sleeper.semana,
    noticias: ia.noticias,
    lesionados: sleeper.lesionados,
    waivers: sleeper.waivers,
    duelo: ia.duelo
  };
  publicarEnGitHub_(JSON.stringify(json, null, 2));
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
      const items = xml.getRootElement().getChild('channel').getChildren('item').slice(0, 10);
      items.forEach(it => {
        const texto = it.getChildText('title') + ' — ' + (it.getChildText('description') || '').replace(/<[^>]+>/g, '');
        if (!vistos.has(texto.slice(0, 120))) hoja.appendRow([new Date(), url, 'rss', texto, '']);
      });
    } catch (e) { console.log('RSS falló: ' + url + ' ' + e); }
  });
}

/* ---------- 3. Sleeper (gratis, sin clave) ---------- */
function datosSleeper_() {
  const get = u => JSON.parse(UrlFetchApp.fetch(u).getContentText());
  const estado = get('https://api.sleeper.app/v1/state/nfl');
  const jugadores = jugadoresCache_();
  const trending = get('https://api.sleeper.app/v1/players/nfl/trending/add?lookback_hours=24&limit=8');
  const waivers = trending.map(t => {
    const p = jugadores[t.player_id] || {};
    return { jugador: p.n || t.player_id, posicion: p.pos || '', agregados: t.count };
  });
  const traduce = { Questionable: 'Duda', Doubtful: 'Duda', Out: 'Fuera', IR: 'Fuera', PUP: 'Fuera' };
  const lesionados = Object.values(jugadores)
    .filter(p => p.inj && traduce[p.inj] && p.rank && p.rank < 200)
    .sort((a, b) => a.rank - b.rank).slice(0, 8)
    .map(p => ({ jugador: p.n, equipo: p.team || '', estatus: traduce[p.inj] }));
  return { semana: estado.week, lesionados, waivers };
}

// La lista completa de Sleeper pesa ~5 MB: se guarda reducida en Drive una vez al día
function jugadoresCache_() {
  const props = PropertiesService.getScriptProperties();
  const hoy = Utilities.formatDate(new Date(), 'America/Monterrey', 'yyyy-MM-dd');
  const id = props.getProperty('CACHE_ID');
  if (id && props.getProperty('CACHE_FECHA') === hoy) {
    return JSON.parse(DriveApp.getFileById(id).getBlob().getDataAsString());
  }
  const todos = JSON.parse(UrlFetchApp.fetch('https://api.sleeper.app/v1/players/nfl').getContentText());
  const mini = {};
  Object.keys(todos).forEach(k => {
    const p = todos[k];
    if (!p.active || !['QB', 'RB', 'WR', 'TE', 'K'].includes(p.position)) return;
    mini[k] = { n: p.full_name, pos: p.position, team: p.team, inj: p.injury_status, rank: p.search_rank };
  });
  const texto = JSON.stringify(mini);
  if (id) { try { DriveApp.getFileById(id).setContent(texto); } catch (e) { props.deleteProperty('CACHE_ID'); } }
  if (!props.getProperty('CACHE_ID')) props.setProperty('CACHE_ID', DriveApp.createFile('fx-jugadores-cache.json', texto).getId());
  props.setProperty('CACHE_FECHA', hoy);
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
function escribirConGemini_(notas, sleeper) {
  const key = PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY');
  const prompt =
    'Eres el editor de Fantasy Expertos, un sitio mexicano de fantasy football. ' +
    'Con las notas de abajo (dump del reportero y titulares de medios) escribe en español de México, ' +
    'con tono experto, directo y energético. Escribe con tus propias palabras: no copies frases de las fuentes. ' +
    'Enfócate en lo que importa para alineaciones de fantasy. ' +
    'Responde SOLO JSON con esta forma: ' +
    '{"noticias":["5 titulares-resumen originales de máximo 25 palabras"],' +
    '"duelo":{"a":"jugador","b":"jugador","veredicto":"a quién arrancar y por qué, máximo 40 palabras"}}\n\n' +
    'Lesionados: ' + JSON.stringify(sleeper.lesionados) + '\nMás agregados: ' + JSON.stringify(sleeper.waivers) +
    '\n\nNOTAS:\n' + notas;
  const res = UrlFetchApp.fetch(
    'https://generativelanguage.googleapis.com/v1beta/models/' + CFG.MODELO + ':generateContent?key=' + key, {
      method: 'post', contentType: 'application/json', muteHttpExceptions: true,
      payload: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: 'application/json', temperature: 0.7 }
      })
    });
  try {
    return JSON.parse(JSON.parse(res.getContentText()).candidates[0].content.parts[0].text);
  } catch (e) {
    console.log('Gemini falló: ' + res.getContentText());
    return { noticias: ['Actualizando el reporte de hoy…'], duelo: { a: '—', b: '—', veredicto: '' } };
  }
}

/* ---------- 5. Publicar en GitHub ---------- */
function publicarEnGitHub_(contenido) {
  const token = PropertiesService.getScriptProperties().getProperty('GITHUB_TOKEN');
  const url = 'https://api.github.com/repos/' + CFG.REPO + '/contents/' + CFG.ARCHIVO;
  const h = { Authorization: 'Bearer ' + token, Accept: 'application/vnd.github+json' };
  const actual = UrlFetchApp.fetch(url, { headers: h, muteHttpExceptions: true });
  const sha = actual.getResponseCode() === 200 ? JSON.parse(actual.getContentText()).sha : undefined;
  const r = UrlFetchApp.fetch(url, {
    method: 'put', headers: h, contentType: 'application/json', muteHttpExceptions: true,
    payload: JSON.stringify({
      message: 'Contenido automático ' + new Date().toISOString(),
      content: Utilities.base64Encode(contenido, Utilities.Charset.UTF_8),
      sha: sha
    })
  });
  console.log('GitHub: ' + r.getResponseCode());
}

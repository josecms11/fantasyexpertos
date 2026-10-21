/**
 * FANTASY EXPERTOS – Apps Script (buzón del reportero + newsletter semanal)
 *
 * 1) revisarBuzon: cada hora lee los correos que llegan a fxnews@8creativo.info y los manda a data/reportero.json en GitHub.
 * 2) enviarNewsletter: cada hora revisa si toca mandar "El resumen FX" (martes desde las 9:00, hora de Monterrey)
 *    y lo envía desde tu Workspace a todas las cuentas con el resumen activado. Si se acaba la cuota diaria de Gmail,
 *    continúa sola en la siguiente hora.
 *
 * Propiedades del script (Configuración del proyecto → Propiedades del script):
 *   GITHUB_TOKEN     → ya la tienes
 *   SUPABASE_SECRET  → la llave secreta de Supabase (empieza con sb_secret_)
 *   REPORTERO_DE     → (opcional) correos del reportero separados por coma; si existe, solo esos correos se procesan
 *   NEWSLETTER_DE    → (opcional) alias desde el que sale la newsletter, ej. resumen@8creativo.info (debe estar en Gmail → Enviar como)
 */
const CFG = {
  BUZON: 'fxnews@8creativo.info', ETIQUETA: 'Fantasy-Dump', REPO: 'josecms11/fantasyexpertos', ARCHIVO: 'data/reportero.json',
  SUPABASE: 'https://eafzqftobwrtqdnawncn.supabase.co',
  NEWSLETTER: 'https://raw.githubusercontent.com/josecms11/fantasyexpertos/main/data/v2/newsletter.json',
  DIA_ENVIO: 2, HORA_ENVIO: 9, ZONA: 'America/Monterrey', REMITENTE: 'Fantasy Expertos'
};
const prop = k => PropertiesService.getScriptProperties().getProperty(k);

function instalar() {
  ScriptApp.getProjectTriggers().forEach(t => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger('revisarBuzon').timeBased().everyHours(1).create();
  ScriptApp.newTrigger('enviarNewsletter').timeBased().everyHours(1).create();
  revisarBuzon();
  console.log('Listo: buzón y newsletter programados cada hora.');
}

/* ---------------- Buzón del reportero ---------------- */
function revisarBuzon() {
  const etiqueta = GmailApp.getUserLabelByName(CFG.ETIQUETA) || GmailApp.createLabel(CFG.ETIQUETA);
  const permitidos = (prop('REPORTERO_DE') || '').toLowerCase().split(',').map(s => s.trim()).filter(Boolean);
  const hilos = GmailApp.search('to:' + CFG.BUZON + ' -label:' + CFG.ETIQUETA + ' newer_than:7d', 0, 20);
  if (!hilos.length) { console.log('Sin correos nuevos del reportero'); return; }
  const nuevas = [];
  hilos.forEach(h => h.getMessages().forEach(m => {
    const de = (m.getFrom().match(/<([^>]+)>/) || [, m.getFrom()])[1].toLowerCase().trim();
    if (permitidos.length && !permitidos.includes(de)) { console.log('Ignorado (no es del reportero): ' + de); return; }
    nuevas.push({ fecha: m.getDate().toISOString(), asunto: m.getSubject(), texto: m.getPlainBody().slice(0, 20000), procesada: false });
  }));
  if (!nuevas.length) { hilos.forEach(x => x.addLabel(etiqueta)); return; }

  const url = 'https://api.github.com/repos/' + CFG.REPO + '/contents/' + CFG.ARCHIVO;
  const h = { Authorization: 'Bearer ' + prop('GITHUB_TOKEN'), Accept: 'application/vnd.github+json' };
  const actual = UrlFetchApp.fetch(url, { headers: h, muteHttpExceptions: true });
  let datos = { notas: [] }, sha;
  if (actual.getResponseCode() === 200) {
    const j = JSON.parse(actual.getContentText());
    sha = j.sha;
    datos = JSON.parse(Utilities.newBlob(Utilities.base64Decode(j.content.replace(/\n/g, ''))).getDataAsString());
  }
  datos.notas = nuevas.concat(datos.notas || []).slice(0, 200);
  const r = UrlFetchApp.fetch(url, {
    method: 'put', headers: h, contentType: 'application/json', muteHttpExceptions: true,
    payload: JSON.stringify({ message: 'Notas del reportero', sha: sha, content: Utilities.base64Encode(JSON.stringify(datos, null, 2), Utilities.Charset.UTF_8) })
  });
  console.log('GitHub: ' + r.getResponseCode() + ' · ' + nuevas.length + ' notas');
  if (r.getResponseCode() < 300) hilos.forEach(x => x.addLabel(etiqueta));
}

/* ---------------- Newsletter semanal ---------------- */
function leerNewsletter_() {
  const r = UrlFetchApp.fetch(CFG.NEWSLETTER + '?t=' + Date.now(), { muteHttpExceptions: true });
  if (r.getResponseCode() !== 200) throw new Error('No se pudo leer la newsletter: ' + r.getResponseCode());
  return JSON.parse(r.getContentText());
}
function listaEnvio_() {
  const k = prop('SUPABASE_SECRET');
  if (!k) throw new Error('Falta la propiedad SUPABASE_SECRET');
  const h = { apikey: k }; if (/^eyJ/.test(k)) h.Authorization = 'Bearer ' + k;
  const r = UrlFetchApp.fetch(CFG.SUPABASE + '/rest/v1/rpc/lista_envio', { method: 'post', headers: h, contentType: 'application/json', payload: '{}', muteHttpExceptions: true });
  if (r.getResponseCode() !== 200) throw new Error('Supabase ' + r.getResponseCode() + ': ' + r.getContentText().slice(0, 200));
  return JSON.parse(r.getContentText());
}
let _desde;
function desde_() {
  if (_desde !== undefined) return _desde;
  const a = (prop('NEWSLETTER_DE') || '').trim().toLowerCase();
  _desde = a && GmailApp.getAliases().map(x => x.toLowerCase()).includes(a) ? a : null;
  if (a && !_desde) console.log('Aviso: ' + a + ' no está en Gmail → Enviar como; se usa tu correo principal.');
  return _desde;
}
function manda_(nl, p) {
  const html = nl.html.split('{{NOMBRE}}').join(p.nombre || 'fan').split('{{BAJA}}').join(nl.baja + p.baja_token);
  const op = { htmlBody: html, name: CFG.REMITENTE }, d = desde_();
  if (d) { op.from = d; op.replyTo = d; }
  GmailApp.sendEmail(p.email, nl.asunto, 'El resumen FX de la semana ' + nl.semana + ': ' + nl.baja.replace('#/baja?t=', '') + '\nDarte de baja: ' + nl.baja + p.baja_token, op);
}
function enviarNewsletter() {
  const ahora = new Date(), dia = +Utilities.formatDate(ahora, CFG.ZONA, 'u'), hora = +Utilities.formatDate(ahora, CFG.ZONA, 'H');
  const props = PropertiesService.getScriptProperties();
  const prog = JSON.parse(props.getProperty('NL_PROGRESO') || '{}');
  const nl = leerNewsletter_(), clave = nl.temporada + '-' + nl.semana;
  const enCurso = prog.clave === clave && !prog.fin;
  if (!enCurso) {
    if (prog.clave === clave) { console.log('La semana ' + nl.semana + ' ya se envió.'); return; }
    if (dia !== CFG.DIA_ENVIO || hora < CFG.HORA_ENVIO) { console.log('Todavía no toca enviar (martes desde las ' + CFG.HORA_ENVIO + ':00).'); return; }
  }
  const lista = listaEnvio_();
  let i = enCurso ? prog.i || 0 : 0, enviados = 0;
  const cupo = Math.max(0, MailApp.getRemainingDailyQuota() - 5);
  while (i < lista.length && enviados < cupo) {
    try { manda_(nl, lista[i]); enviados++; } catch (e) { console.log('Error con ' + lista[i].email + ': ' + e.message); }
    i++;
  }
  const fin = i >= lista.length;
  props.setProperty('NL_PROGRESO', JSON.stringify({ clave: clave, i: i, fin: fin, total: lista.length }));
  console.log('Newsletter semana ' + nl.semana + ': ' + enviados + ' enviados (' + i + '/' + lista.length + ')' + (fin ? ' · terminado' : ' · continúa en la próxima hora'));
}
// Manda la newsletter de esta semana SOLO a ti, para revisarla.
function enviarPrueba() {
  const nl = leerNewsletter_(), yo = Session.getEffectiveUser().getEmail();
  manda_(nl, { email: yo, nombre: 'José', baja_token: '00000000-0000-0000-0000-000000000000' });
  console.log('Prueba enviada a ' + yo);
}

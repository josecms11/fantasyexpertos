/**
 * FANTASY EXPERTOS – Buzón del reportero (Apps Script)
 * Lo único que hace: cada hora revisa los correos que llegan a fxnews@8creativo.info
 * y los manda a data/reportero.json en GitHub. Todo lo demás corre solo en GitHub Actions.
 *
 * Propiedad necesaria: GITHUB_TOKEN
 */
const CFG = { BUZON: 'fxnews@8creativo.info', ETIQUETA: 'Fantasy-Dump', REPO: 'josecms11/fantasyexpertos', ARCHIVO: 'data/reportero.json' };

function instalar() {
  ScriptApp.getProjectTriggers().forEach(t => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger('revisarBuzon').timeBased().everyHours(1).create();
  revisarBuzon();
}

function revisarBuzon() {
  const etiqueta = GmailApp.getUserLabelByName(CFG.ETIQUETA) || GmailApp.createLabel(CFG.ETIQUETA);
  const hilos = GmailApp.search('to:' + CFG.BUZON + ' -label:' + CFG.ETIQUETA + ' newer_than:7d', 0, 20);
  if (!hilos.length) { console.log('Sin correos nuevos del reportero'); return; }
  const nuevas = [];
  hilos.forEach(h => h.getMessages().forEach(m => nuevas.push({
    fecha: m.getDate().toISOString(), asunto: m.getSubject(), texto: m.getPlainBody().slice(0, 20000), procesada: false
  })));

  const token = PropertiesService.getScriptProperties().getProperty('GITHUB_TOKEN');
  const url = 'https://api.github.com/repos/' + CFG.REPO + '/contents/' + CFG.ARCHIVO;
  const h = { Authorization: 'Bearer ' + token, Accept: 'application/vnd.github+json' };
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

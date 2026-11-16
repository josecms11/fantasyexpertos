// FANTASY EXPERTOS · Imágenes para compartir (og:image)
// Genera las tarjetas que aparecen al mandar un link por WhatsApp, X o Facebook.
// Solo reescribe una imagen si su contenido cambió (para no inflar el repositorio).
import fs from 'node:fs';
import crypto from 'node:crypto';

let Resvg, UPNG;
try { ({ Resvg } = await import('@resvg/resvg-js')); UPNG = (await import('upng-js')).default; } catch { console.log('Imágenes: faltan @resvg/resvg-js o upng-js, se omiten'); process.exit(0); }

const leer = (f, d) => { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch { return d; } };
const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const slug = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 70);
const FUENTES = ['barlow-condensed-latin-800-normal', 'barlow-latin-600-normal', 'press-start-2p-latin-400-normal'].map(f => 'scripts/fuentes/' + f + '.ttf');
const OUT = 'assets/og/', MAN = OUT + 'manifiesto.json', man = leer(MAN, {});
fs.mkdirSync(OUT + 'ss', { recursive: true });

const hoy = leer('data/v2/hoy.json', {}), jugadores = leer('data/v2/jugadores.json', []), cal = leer('data/v2/calendario.json', {}), modelo = leer('data/v2/modelo.json', { semanas: {} }), ss = leer('data/v2/startsit.json', { j: [] });
const sem = hoy.semana || '', temp = hoy.temporada || '';
const fueraJ = j => ['Out', 'IR', 'PUP', 'Sus', 'NA'].includes(j.inj);

const LOGO = (x, y, s) => `<g transform="translate(${x},${y}) scale(${s})"><polygon points="49,3.5 146.5,3.5 133.5,27.2 63.5,27.2 29,96.7 3.7,96.7" fill="#E8E8E8"/><polygon points="70.5,39.5 126.2,39.5 113,63 59.2,63" fill="#4A9A68"/></g>`;
function marco(cuerpo, pie) {
  let grid = ''; for (let x = 0; x <= 1200; x += 40) grid += `<rect x="${x}" y="0" width="1" height="630" fill="#163322"/>`; for (let y = 0; y <= 630; y += 40) grid += `<rect x="0" y="${y}" width="1200" height="1" fill="#163322"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
<rect width="1200" height="630" fill="#0A1A10"/><g shape-rendering="crispEdges">${grid}</g>
<rect x="0" y="0" width="1200" height="8" fill="#5BC489"/><rect x="0" y="622" width="1200" height="8" fill="#5BC489"/>
${LOGO(60, 44, .62)}<text x="168" y="78" font-family="Barlow Condensed" font-weight="800" font-size="40" fill="#E8E8E8" letter-spacing="1">FANTASY</text><text x="168" y="104" font-family="Barlow Condensed" font-weight="800" font-size="22" fill="#5BC489" letter-spacing="6">EXPERTOS</text>
${cuerpo}
<text x="60" y="590" font-family="Press Start 2P" font-size="14" fill="#8FB89A">${esc(pie || 'FANTASYEXPERTOS.APP')}</text>
<g transform="translate(905,566)"><rect width="235" height="34" rx="6" fill="none" stroke="#5BC489" stroke-width="2"/><text x="117" y="23" text-anchor="middle" font-family="Press Start 2P" font-size="11" fill="#5BC489">FX TECH ANALYZER</text></g>
</svg>`;
}
let escritas = 0;
function png(ruta, svg) {
  const h = crypto.createHash('md5').update(svg).digest('hex');
  if (man[ruta] === h && fs.existsSync(OUT + ruta)) return;
  const r = new Resvg(svg, { font: { fontFiles: FUENTES, loadSystemFonts: false, defaultFontFamily: 'Barlow' }, fitTo: { mode: 'width', value: 1200 } });
  const im = r.render(); fs.writeFileSync(OUT + ruta, Buffer.from(UPNG.encode([im.pixels.buffer.slice(im.pixels.byteOffset, im.pixels.byteOffset + im.pixels.byteLength)], im.width, im.height, 64))); man[ruta] = h; escritas++;
}
const titulo = (t, y = 250, size = 76, color = '#FFFFFF') => `<text x="60" y="${y}" font-family="Barlow Condensed" font-weight="800" font-size="${size}" fill="${color}">${esc(t)}</text>`;
const sub = (t, y) => `<text x="60" y="${y}" font-family="Barlow" font-weight="600" font-size="30" fill="#B9D3C1">${esc(t)}</text>`;

// Portada (es / en)
for (const [l, t1, t2, t3] of [['es', 'RANKINGS DE FANTASY FOOTBALL', 'Proyecciones propias, start/sit, waivers y trades.', 'Medimos nuestra precisión cada semana.'], ['en', 'FANTASY FOOTBALL RANKINGS', 'Our own projections, start/sit, waivers and trades.', 'We measure our accuracy every week.']])
  png(`fx${l === 'en' ? '-en' : ''}.png`, marco(`${titulo(t1, 270, 84)}${titulo(`${l === 'en' ? 'WEEK' : 'SEMANA'} ${sem} · ${temp}`, 350, 60, '#5BC489')}${sub(t2, 420)}${sub(t3, 462)}`));

// Rankings por posición (es / en): top 5 de la semana
const juega = j => j.team !== 'FA' && !fueraJ(j) && cal.cal && cal.cal[j.team] && cal.cal[j.team][sem];
for (const pos of ['QB', 'RB', 'WR', 'TE', 'K', 'DEF']) {
  const L = jugadores.filter(j => j.pos === pos && j.proy && j.proy[0] != null && juega(j)).sort((a, b) => b.proy[0] - a.proy[0]).slice(0, 5);
  if (!L.length) continue;
  for (const l of ['es', 'en']) {
    const filas = L.map((j, i) => { const y = 300 + i * 52; return `<text x="60" y="${y}" font-family="Barlow Condensed" font-weight="800" font-size="40" fill="#F2C94C">${i + 1}</text><text x="110" y="${y}" font-family="Barlow Condensed" font-weight="800" font-size="40" fill="#FFFFFF">${esc(j.n)}</text><text x="700" y="${y}" font-family="Barlow" font-weight="600" font-size="26" fill="#8FB89A">${esc(j.team)}</text><text x="1140" y="${y}" text-anchor="end" font-family="Barlow Condensed" font-weight="800" font-size="40" fill="#5BC489">${j.proy[0].toFixed(1)}</text>`; }).join('');
    png(`rankings-${pos.toLowerCase()}${l === 'en' ? '-en' : ''}.png`, marco(`${titulo(l === 'en' ? `WEEK ${sem} ${pos} RANKINGS` : `RANKINGS ${pos} · SEMANA ${sem}`, 220, 72)}<text x="1140" y="220" text-anchor="end" font-family="Press Start 2P" font-size="13" fill="#8FB89A">PPR</text>${filas}`));
  }
}

// Precisión (es / en)
{
  const S = Object.values(modelo.semanas || {}), gana = S.filter(x => x.maeFX <= x.maeRef).length, u = S[S.length - 1];
  for (const l of ['es', 'en']) {
    const en = l === 'en', k = (v, lab, x) => `<text x="${x}" y="410" font-family="Barlow Condensed" font-weight="800" font-size="110" fill="#5BC489">${esc(v)}</text><text x="${x}" y="455" font-family="Barlow" font-weight="600" font-size="24" fill="#B9D3C1">${esc(lab)}</text>`;
    png(`precision${en ? '-en' : ''}.png`, marco(`${titulo(en ? 'HOW ACCURATE ARE WE?' : '¿QUÉ TAN PRECISOS SOMOS?', 230, 76)}${sub(en ? 'Every projection vs what the player actually scored.' : 'Cada proyección contra lo que el jugador realmente hizo.', 280)}
      ${k(u ? u.maeFX.toFixed(2) : '–', en ? 'avg. error last week (pts)' : 'error promedio última semana (pts)', 60)}${k(`${gana}/${S.length}`, en ? 'weeks beating the reference' : 'semanas ganándole a la referencia', 640)}`));
  }
}

// Power Ranking de liga (es / en)
for (const l of ['es', 'en']) { const en = l === 'en';
  png(`liga${en ? '-en' : ''}.png`, marco(`${titulo(en ? 'YOUR LEAGUE' : 'POWER RANKING', 260, 96)}${titulo(en ? 'POWER RANKING' : 'DE TU LIGA', 350, 96, '#5BC489')}${sub(en ? 'Who runs your league this week? Paste your league link.' : '¿Quién manda en tu liga esta semana? Pega el link de tu liga.', 420)}${sub(en ? 'Free · FX Model' : 'Gratis · Modelo FX', 462)}`)); }

// Start/Sit por jugador: veredicto de la semana (sin cifras que cambien cada hora)
const VER = { start: ['START', '#5BC489'], flex: ['FLEX', '#F2C94C'], sit: ['SIT', '#E5735C'], out: ['OUT', '#E5735C'], bye: ['BYE', '#8FB89A'] };
const vivos = new Set();
for (const x of ss.j || []) {
  const [v, c] = VER[x.v] || VER.sit, r = cal.cal && cal.cal[x.team] && cal.cal[x.team][ss.semana], nombre = x.n.length > 22 ? x.n.split(' ').slice(-1)[0] : x.n;
  const f = `ss/${slug(x.n)}-${x.id}.png`; vivos.add(f);
  png(f, marco(`<text x="60" y="200" font-family="Press Start 2P" font-size="18" fill="#8FB89A">START / SIT · ${esc(x.pos)} · ${esc(x.team)}</text>
${titulo(nombre.toUpperCase(), 300, nombre.length > 16 ? 84 : 104)}
<rect x="60" y="345" width="${v.length * 62 + 60}" height="120" rx="12" fill="${c}"/><text x="${90}" y="440" font-family="Barlow Condensed" font-weight="800" font-size="112" fill="#0A1A10">${v}</text>
<text x="${v.length * 62 + 160}" y="395" font-family="Barlow Condensed" font-weight="800" font-size="44" fill="#FFFFFF">${r ? (r.home ? 'vs ' : '@ ') + esc(r.opp) : 'BYE'}</text>
<text x="${v.length * 62 + 160}" y="445" font-family="Barlow" font-weight="600" font-size="28" fill="#B9D3C1">Semana / Week ${esc(ss.semana)}</text>`, `FANTASYEXPERTOS.APP · S${ss.semana}`));
}
// Borra tarjetas de start/sit de semanas anteriores
for (const f of fs.readdirSync(OUT + 'ss')) if (!vivos.has('ss/' + f)) { fs.rmSync(OUT + 'ss/' + f); delete man['ss/' + f]; escritas++; }
fs.writeFileSync(MAN, JSON.stringify(man));
console.log('Imágenes para compartir:', escritas, 'cambiaron');

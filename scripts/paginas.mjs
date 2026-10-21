// FANTASY EXPERTOS · Páginas para Google (SEO)
// Genera una página real por jugador, noticia y equipo, más sitemap.xml y robots.txt.
// Cada página trae su título, descripción y el texto principal en el HTML (lo que Google lee);
// al abrirla, la app normal se encarga de mostrarla completa.
import fs from 'node:fs';

const leer = (f, d) => { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch { return d; } };
const dominio = fs.existsSync('CNAME') ? fs.readFileSync('CNAME', 'utf8').trim() : '';
const RAIZ = process.env.FX_RAIZ || (dominio ? `https://${dominio}/` : 'https://josecms11.github.io/fantasyexpertos/');
const SITIO = 'Fantasy Expertos';

const EQUIPOS = { ARI: 'Arizona Cardinals', ATL: 'Atlanta Falcons', BAL: 'Baltimore Ravens', BUF: 'Buffalo Bills', CAR: 'Carolina Panthers', CHI: 'Chicago Bears', CIN: 'Cincinnati Bengals', CLE: 'Cleveland Browns', DAL: 'Dallas Cowboys', DEN: 'Denver Broncos', DET: 'Detroit Lions', GB: 'Green Bay Packers', HOU: 'Houston Texans', IND: 'Indianapolis Colts', JAX: 'Jacksonville Jaguars', KC: 'Kansas City Chiefs', LV: 'Las Vegas Raiders', LAC: 'Los Angeles Chargers', LAR: 'Los Angeles Rams', MIA: 'Miami Dolphins', MIN: 'Minnesota Vikings', NE: 'New England Patriots', NO: 'New Orleans Saints', NYG: 'New York Giants', NYJ: 'New York Jets', PHI: 'Philadelphia Eagles', PIT: 'Pittsburgh Steelers', SF: 'San Francisco 49ers', SEA: 'Seattle Seahawks', TB: 'Tampa Bay Buccaneers', TEN: 'Tennessee Titans', WAS: 'Washington Commanders' };
const POSN = { QB: 'quarterback', RB: 'running back', WR: 'receptor', TE: 'ala cerrada', K: 'pateador' };

const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const slug = s => String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 70);
const r1 = v => Math.round(v * 10) / 10;
const corta = (s, n = 155) => { s = String(s || '').replace(/\s+/g, ' ').trim(); return s.length > n ? s.slice(0, n - 1).replace(/\s\S*$/, '') + '…' : s; };

const hoy = leer('data/v2/hoy.json', {});
const jugadores = leer('data/v2/jugadores.json', []).filter(j => j && j.n);
const archivo = leer('data/v2/archivo.json', []);
const temporada = hoy.temporada || new Date().getFullYear();
const semana = hoy.semana || '';

const plantilla = fs.readFileSync('index.html', 'utf8');
const urlJ = j => `jugador/${slug(j.n)}-${j.id}/`;
const urlN = n => `noticia/${slug(n.titulo)}-${String(n.id).replace(/\D/g, '').slice(-8)}/`;
const urlE = t => `equipo/${t.toLowerCase()}/`;

function pagina({ ruta, titulo, desc, ruteo, cuerpo, ld, tipo = 'website' }) {
  const url = RAIZ + ruta;
  const cabeza = `<base href="${RAIZ}">
<title>${esc(titulo)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${url}">
<meta property="og:type" content="${tipo}"><meta property="og:site_name" content="${SITIO}"><meta property="og:locale" content="es_MX">
<meta property="og:title" content="${esc(titulo)}"><meta property="og:description" content="${esc(desc)}"><meta property="og:url" content="${url}">
<meta name="twitter:card" content="summary">
${ld ? `<script type="application/ld+json">${JSON.stringify(ld).replace(/</g, '\\u003c')}</script>` : ''}
<script>window.FX_RUTA=${JSON.stringify(ruteo)}</script>`;
  return plantilla
    .replace(/<link rel="canonical"[^>]*>\n?/, '').replace(/<meta (property="og:|name="twitter:)[^\n]*\n?/g, '')
    .replace(/<title>[\s\S]*?<\/title>\s*<meta name="description"[^>]*>/, cabeza)
    .replace(/<main id="app">[\s\S]*?<\/main>/, `<main id="app"><div class="wrap seo">${cuerpo}</div></main>`);
}

const escritas = new Set();
let cambios = 0;
function escribe(ruta, html) {
  const f = ruta + 'index.html';
  escritas.add(ruta.split('/')[0] + '/' + ruta.split('/')[1]);
  if (fs.existsSync(f) && fs.readFileSync(f, 'utf8') === html) return;
  fs.mkdirSync(ruta, { recursive: true }); fs.writeFileSync(f, html); cambios++;
}

// ---------- Jugadores ----------
const notasDe = id => archivo.filter(n => (n.jugadores || []).map(String).includes(String(id))).slice(0, 6);
for (const j of jugadores) {
  const jugados = (j.log || []).filter(l => l.f);
  const tot = r1(jugados.reduce((a, l) => a + l.f[0], 0)), prom = jugados.length ? r1(tot / jugados.length) : 0;
  const eq = EQUIPOS[j.team] || 'Agente libre';
  const proy = j.proy && j.proy[0] != null ? `Proyección semana ${semana}: ${j.proy[0]} pts PPR.` : '';
  const est = j.inj ? `Estatus: ${j.inj}${j.injParte ? ' (' + j.injParte + ')' : ''}.` : '';
  const titulo = `${j.n} fantasy ${temporada}: stats, proyección y start/sit | ${SITIO}`;
  const desc = corta(`${j.n} (${j.pos}, ${eq}): ${tot} pts PPR en ${temporada}, promedio de ${prom} por juego. ${proy} ${est} Análisis de fantasy en español.`);
  const notas = notasDe(j.id);
  const cuerpo = `<h1>${esc(j.n)} · ${esc(j.pos)} · ${esc(eq)}</h1>
<p>${esc(j.n)} es ${POSN[j.pos] || j.pos} de ${esc(eq)}. En la temporada ${temporada} suma <b>${tot} puntos PPR</b> en ${jugados.length} juegos (${prom} por juego)${j.rank ? `, ranking ${j.rank} general` : ''}. ${esc(proy)} ${esc(est)}</p>
${jugados.length ? `<table><thead><tr><th>Semana</th><th>Rival</th><th>PPR</th><th>Half</th><th>STD</th></tr></thead><tbody>${jugados.map(l => `<tr><td>${l.w}</td><td>${l.opp ? (l.home ? 'vs ' : '@ ') + esc(l.opp) : ''}</td><td>${l.f[0]}</td><td>${l.f[1]}</td><td>${l.f[2]}</td></tr>`).join('')}</tbody></table>` : ''}
${notas.length ? `<h2>Noticias de ${esc(j.n)}</h2><ul>${notas.map(n => `<li><a href="${urlN(n)}">${esc(n.titulo)}</a></li>`).join('')}</ul>` : ''}
${EQUIPOS[j.team] ? `<p><a href="${urlE(j.team)}">Ver ${esc(eq)}</a></p>` : ''}`;
  escribe(urlJ(j), pagina({ ruta: urlJ(j), titulo, desc, ruteo: '#/jugador/' + j.id, cuerpo, tipo: 'profile',
    ld: { '@context': 'https://schema.org', '@type': 'ProfilePage', name: titulo, mainEntity: { '@type': 'Person', name: j.n, jobTitle: 'Jugador de fútbol americano', memberOf: EQUIPOS[j.team] ? { '@type': 'SportsTeam', name: eq } : undefined } } }));
}

// ---------- Noticias ----------
for (const n of archivo) {
  if (!n || !n.titulo || !n.id) continue;
  const titulo = `${n.titulo} | ${SITIO}`;
  const desc = corta(n.exclusivo ? (n.claves || []).join(' ') : (n.contexto || (n.claves || []).join(' ')));
  const fecha = n.fecha || new Date().toISOString();
  const rel = (n.jugadores || []).map(x => jugadores.find(j => String(j.id) === String(x) || j.n === x)).filter(Boolean);
  const cuerpo = `<article><p><small>${esc(n.exclusivo ? 'Premium FX' : (n.etiqueta || 'Noticia'))} · ${esc(fecha.slice(0, 10))}</small></p>
<h1>${esc(n.titulo)}</h1>
${(n.claves || []).length ? `<ul>${n.claves.map(c => `<li>${esc(c)}</li>`).join('')}</ul>` : ''}
${n.exclusivo ? '<p>Nota exclusiva de Fantasy Expertos.</p>' : `${n.contexto ? `<h2>Qué pasó</h2><p>${esc(n.contexto)}</p>` : ''}${n.fantasy ? `<h2>Impacto en fantasy</h2><p>${esc(n.fantasy)}</p>` : ''}${n.equipo_impacto ? `<h2>Qué cambia para el equipo</h2><p>${esc(n.equipo_impacto)}</p>` : ''}${n.accion ? `<p><b>Qué hacer:</b> ${esc(n.accion)}</p>` : ''}`}
${rel.length ? `<p>Jugadores: ${rel.map(j => `<a href="${urlJ(j)}">${esc(j.n)}</a>`).join(', ')}</p>` : ''}</article>`;
  escribe(urlN(n), pagina({ ruta: urlN(n), titulo, desc, ruteo: '#/noticia/' + n.id, cuerpo, tipo: 'article',
    ld: { '@context': 'https://schema.org', '@type': 'NewsArticle', headline: n.titulo.slice(0, 110), description: desc, datePublished: fecha, dateModified: fecha, inLanguage: 'es-MX', isAccessibleForFree: true,
      author: { '@type': 'Organization', name: SITIO, url: RAIZ }, publisher: { '@type': 'Organization', name: SITIO, url: RAIZ }, mainEntityOfPage: RAIZ + urlN(n) } }));
}

// ---------- Equipos ----------
for (const t of Object.keys(EQUIPOS)) {
  const plantel = jugadores.filter(j => j.team === t).sort((a, b) => (a.rank || 999) - (b.rank || 999));
  const titulo = `${EQUIPOS[t]} fantasy ${temporada}: jugadores, lesionados y calendario | ${SITIO}`;
  const desc = corta(`Todo de ${EQUIPOS[t]} para tu fantasy: ${plantel.slice(0, 4).map(j => j.n).join(', ')} y más. Stats, proyecciones, lesionados y calendario en español.`);
  const cuerpo = `<h1>${esc(EQUIPOS[t])} · fantasy ${temporada}</h1>
<p>Jugadores de fantasy de ${esc(EQUIPOS[t])}, ordenados por ranking.</p>
<ul>${plantel.map(j => `<li><a href="${urlJ(j)}">${esc(j.n)}</a> · ${esc(j.pos)}${j.inj ? ' · ' + esc(j.inj) : ''}</li>`).join('')}</ul>`;
  escribe(urlE(t), pagina({ ruta: urlE(t), titulo, desc, ruteo: '#/equipo/' + t, cuerpo,
    ld: { '@context': 'https://schema.org', '@type': 'SportsTeam', name: EQUIPOS[t], sport: 'American football' } }));
}

// ---------- Aviso de privacidad (página fija para Google y Stripe) ----------
escribe('privacidad/', pagina({ ruta: 'privacidad/', titulo: `Aviso de privacidad | ${SITIO}`, desc: 'Cómo Fantasy Expertos usa y protege los datos de tu cuenta, tus jugadores favoritos, el resumen semanal y los pagos de Premium.', ruteo: '#/privacidad',
  cuerpo: '<h1>Aviso de privacidad</h1><p>Fantasy Expertos usa tu correo, el nombre que elijas y los jugadores que sigues para darte acceso a tu cuenta, guardar tus favoritos y mandarte el resumen semanal si lo tienes activado. Los pagos de Premium los procesa Stripe; nunca vemos ni guardamos tu tarjeta. Puedes darte de baja o borrar tu cuenta cuando quieras desde Mi cuenta.</p>' }));

// Jugadores que ya no están en la lista: se borra su página (las noticias se conservan siempre)
if (fs.existsSync('jugador')) for (const d of fs.readdirSync('jugador')) if (!escritas.has('jugador/' + d)) { fs.rmSync('jugador/' + d, { recursive: true, force: true }); cambios++; }

// ---------- Sitemap y robots ----------
const urls = [['', 'hourly', '1.0'], ['privacidad/', 'yearly', '0.2'],
  ...archivo.filter(n => n && n.titulo && n.id).map(n => [urlN(n), 'weekly', '0.8', (n.fecha || '').slice(0, 10)]),
  ...jugadores.map(j => [urlJ(j), 'daily', '0.7']), ...Object.keys(EQUIPOS).map(t => [urlE(t), 'daily', '0.6'])];
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(([u, f, p, m]) => `<url><loc>${RAIZ}${u}</loc>${m ? `<lastmod>${m}</lastmod>` : ''}<changefreq>${f}</changefreq><priority>${p}</priority></url>`).join('\n')}\n</urlset>\n`;
const robots = `User-agent: *\nAllow: /\nDisallow: /apps-script/\nSitemap: ${RAIZ}sitemap.xml\n`;
for (const [f, c] of [['sitemap.xml', sitemap], ['robots.txt', robots]]) if (!fs.existsSync(f) || fs.readFileSync(f, 'utf8') !== c) { fs.writeFileSync(f, c); cambios++; }

console.log(`Páginas SEO: ${jugadores.length} jugadores, ${archivo.length} noticias, 32 equipos · ${cambios} archivos cambiaron · raíz ${RAIZ}`);

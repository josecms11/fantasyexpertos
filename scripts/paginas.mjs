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

const plantilla = fs.readFileSync('index.html', 'utf8').replace(/<link rel="alternate" hreflang[^\n]*\n/g, '').replace(/<script type="application\/ld\+json">[^\n]*<\/script>\n/, '');
const urlJ = j => `jugador/${slug(j.n)}-${j.id}/`;
const urlN = n => `noticia/${slug(n.titulo)}-${String(n.id).replace(/\D/g, '').slice(-8)}/`;
const urlNen = n => `en/noticia/${slug(n.en.titulo)}-${String(n.id).replace(/\D/g, '').slice(-8)}/`;
const refsN = (n, l) => (n.fuentes || []).length ? `<h2>${l === 'en' ? 'Sources' : 'Fuentes'}</h2><ul>${n.fuentes.map(f => `<li>${esc(f.m)}${f.t ? ': «' + esc(f.t) + '»' : ''}${f.u ? ` · <a href="${esc(f.u)}" rel="nofollow noopener" target="_blank">${l === 'en' ? 'Read the original report' : 'Ver reporte original'}</a>` : ''}</li>`).join('')}</ul><p><small>${l === 'en' ? 'Our own write-up and analysis based on the cited report.' : 'Redacción y análisis propios a partir del reporte citado.'}</small></p>` : '';
const urlE = t => `equipo/${t.toLowerCase()}/`;

const ogImg = (f, l) => fs.existsSync('assets/og/' + f) ? RAIZ + 'assets/og/' + f : RAIZ + 'assets/og/' + (l === 'en' ? 'fx-en.png' : 'fx.png');
function pagina({ ruta, titulo, desc, ruteo, cuerpo, ld, tipo = 'website', lang = 'es', alt = null, img = null, canon = null }) {
  const url = RAIZ + (canon || ruta), im = ogImg(img || '', lang);
  if (titulo.length > 65) titulo = titulo.replace(/ \| Fantasy Exper(tos|ts)$/, '');
  desc = corta(desc);
  const alterna = alt ? Object.entries(alt).map(([l, u]) => `<link rel="alternate" hreflang="${l}" href="${RAIZ + u}">`).join('') + `<link rel="alternate" hreflang="x-default" href="${RAIZ + (alt.en || alt.es)}">` : '';
  const cabeza = `<base href="${RAIZ}">
<title>${esc(titulo)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${url}">
${alterna}
<meta property="og:type" content="${tipo}"><meta property="og:site_name" content="${SITIO}"><meta property="og:locale" content="${lang === 'en' ? 'en_US' : 'es_MX'}">
<meta property="og:title" content="${esc(titulo)}"><meta property="og:description" content="${esc(desc)}"><meta property="og:url" content="${url}">
<meta property="og:image" content="${im}"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:image" content="${im}">
${ld ? `<script type="application/ld+json">${JSON.stringify(ld).replace(/</g, '\\u003c')}</script>` : ''}
<script>window.FX_RUTA=${JSON.stringify(ruteo)};window.FX_LANG=${JSON.stringify(lang)}</script>`;
  return plantilla.replace('<html lang="es">', `<html lang="${lang}">`)
    .replace(/<link rel="canonical"[^>]*>\n?/, '').replace(/<meta (property="og:|name="twitter:)[^\n]*\n?/g, '')
    .replace(/<title>[\s\S]*?<\/title>\s*<meta name="description"[^>]*>/, cabeza)
    .replace(/<main id="app">[\s\S]*?<\/main>/, `<main id="app"><div class="wrap seo">${cuerpo}</div></main>`);
}

const escritas = new Set(), escritasB = new Set();
let cambios = 0;
function escribe(ruta, html) {
  const f = ruta + 'index.html';
  escritas.add(ruta.split('/')[0] + '/' + ruta.split('/')[1]); if (/^(en\/)?blog\/./.test(ruta)) escritasB.add(ruta);
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
${rel.length ? `<p>Jugadores: ${rel.map(j => `<a href="${urlJ(j)}">${esc(j.n)}</a>`).join(', ')}</p>` : ''}
${refsN(n, 'es')}</article>`;
  const altN = n.en && n.en.titulo && !n.exclusivo ? { es: urlN(n), en: urlNen(n) } : null;
  if (altN) { const e = n.en, de = corta(e.contexto || (e.claves || []).join(' '));
    const ce = `<article><p><small>${esc(n.etiqueta || 'News')} · ${esc(fecha.slice(0, 10))}</small></p>
<h1>${esc(e.titulo)}</h1>
${(e.claves || []).length ? `<ul>${e.claves.map(c => `<li>${esc(c)}</li>`).join('')}</ul>` : ''}
${e.contexto ? `<h2>What happened</h2><p>${esc(e.contexto)}</p>` : ''}${e.fantasy ? `<h2>Fantasy impact</h2><p>${esc(e.fantasy)}</p>` : ''}${e.equipo_impacto ? `<h2>What changes for the team</h2><p>${esc(e.equipo_impacto)}</p>` : ''}${e.accion ? `<p><b>What to do:</b> ${esc(e.accion)}</p>` : ''}
${rel.length ? `<p>Players: ${rel.map(j => `<a href="${urlJ(j)}">${esc(j.n)}</a>`).join(', ')}</p>` : ''}
${refsN(n, 'en')}</article>`;
    escribe(altN.en, pagina({ ruta: altN.en, titulo: `${e.titulo} | Fantasy Experts`, desc: de, ruteo: '#/noticia/' + n.id, cuerpo: ce, tipo: 'article', lang: 'en', alt: altN,
      ld: { '@context': 'https://schema.org', '@type': 'NewsArticle', headline: e.titulo.slice(0, 110), description: de, datePublished: fecha, dateModified: fecha, inLanguage: 'en-US', isAccessibleForFree: true, isBasedOn: (n.fuentes || []).map(f => f.u).filter(Boolean),
        author: { '@type': 'Organization', name: SITIO, url: RAIZ }, publisher: { '@type': 'Organization', name: SITIO, url: RAIZ }, mainEntityOfPage: RAIZ + altN.en } })); }
  escribe(urlN(n), pagina({ ruta: urlN(n), titulo, desc, ruteo: '#/noticia/' + n.id, cuerpo, tipo: 'article', ...(altN ? { lang: 'es', alt: altN } : {}),
    ld: { '@context': 'https://schema.org', '@type': 'NewsArticle', headline: n.titulo.slice(0, 110), description: desc, datePublished: fecha, dateModified: fecha, inLanguage: 'es-MX', isAccessibleForFree: true, isBasedOn: (n.fuentes || []).map(f => f.u).filter(Boolean),
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


// ---------- Blog bilingüe (ES / EN) y rankings semanales del Modelo FX ----------
const blog = leer('data/v2/blog.json', []);
const cal = leer('data/v2/calendario.json', {});
const urlB = (a, l) => (l === 'en' ? 'en/blog/' : 'blog/') + a[l].slug + '/';
const TB = {
  es: { blog: 'Blog', sem: 'Semana', fantasy: 'Qué hacer en fantasy', faq: 'Preguntas frecuentes', fuentes: 'Reportes originales', ver: 'Ver reporte original', jug: 'Ficha completa de', titulo: 'Blog de fantasy football', desc: 'Respuestas claras a las preguntas de fantasy de cada semana: a quién arrancar, a quién agregar, lesiones y trades, con el Modelo FX de Fantasy Expertos.', rk: 'Rankings de la semana', mod: 'Proyección del Modelo FX, el sistema propio de Fantasy Expertos.', fecha: 'es-MX' },
  en: { blog: 'Blog', sem: 'Week', fantasy: 'Fantasy advice', faq: 'FAQ', fuentes: 'Original reports', ver: 'Read the original report', jug: 'Full profile of', titulo: 'Fantasy Football Blog', desc: 'Clear answers to every week\'s fantasy football questions: who to start, who to pick up, injuries and trades, powered by the FX Model from Fantasy Expertos.', rk: 'Weekly rankings', mod: 'Projection from the FX Model, Fantasy Expertos\' own system.', fecha: 'en-US' } };
const POSL = { es: { QB: 'QB', RB: 'RB', WR: 'WR', TE: 'TE', K: 'pateadores', DEF: 'defensivas' }, en: { QB: 'QB', RB: 'RB', WR: 'WR', TE: 'TE', K: 'Kicker', DEF: 'Defense (D/ST)' } };
const urlR = (pos, l) => l === 'en' ? `en/blog/week-${semana}-fantasy-${pos.toLowerCase()}-rankings-${temporada}/` : `blog/ranking-fantasy-${pos.toLowerCase()}-semana-${semana}-${temporada}/`;
const rkPos = ['QB', 'RB', 'WR', 'TE', 'K', 'DEF'];
const PN = { es: { QB: 'quarterbacks (QB)', RB: 'running backs (RB)', WR: 'receptores (WR)', TE: 'alas cerradas (TE)', K: 'pateadores (K)', DEF: 'defensivas (DEF)' }, en: { QB: 'quarterbacks (QB)', RB: 'running backs (RB)', WR: 'wide receivers (WR)', TE: 'tight ends (TE)', K: 'kickers (K)', DEF: 'defenses (DST)' } };
const urlRF = (pos, l) => (l === 'en' ? 'en/' : '') + 'rankings/' + (pos ? pos.toLowerCase() + '/' : '');
const fueraJ = j => ['Out', 'IR', 'PUP', 'Sus', 'NA'].includes(j.inj);
for (const a of blog) {
  if (!a || !a.es || !a.en || !a.es.slug || !a.en.slug) continue;
  const alt = { es: urlB(a, 'es'), en: urlB(a, 'en') }, j = jugadores.find(x => String(x.id) === String(a.jugador));
  for (const l of ['es', 'en']) {
    const x = a[l], T = TB[l], fecha = a.fecha || new Date().toISOString();
    const cuerpo = `<article class="blogart"><p><small>${T.blog} · ${T.sem} ${esc(a.semana)} · ${esc(new Date(fecha).toLocaleDateString(T.fecha, { day: 'numeric', month: 'long', year: 'numeric' }))}</small></p>
<h1>${esc(x.titulo)}</h1>
<p><b>${esc(x.respuesta)}</b></p>
${(x.secciones || []).map(sc => `<h2>${esc(sc.h2)}</h2><p>${esc(sc.texto)}</p>`).join('\n')}
${x.fantasy ? `<h2>${T.fantasy}</h2><p><b>${esc(x.fantasy.veredicto)}</b> · ${esc(x.fantasy.texto)}</p><p><small>${T.mod}</small></p>` : ''}
${(x.faq || []).length ? `<h2>${T.faq}</h2>${x.faq.map(f => `<h3>${esc(f.q)}</h3><p>${esc(f.a)}</p>`).join('')}` : ''}
${(a.fuentes || []).length ? `<h2>${T.fuentes}</h2><ul>${a.fuentes.map((f, i) => `<li><a href="${esc(f.u)}" rel="nofollow noopener" target="_blank">${T.ver} ${i + 1}</a></li>`).join('')}</ul>` : ''}
${j ? `<p><a href="${urlJ(j)}">${T.jug} ${esc(j.n)}</a></p>` : ''}</article>`;
    const ld = { '@context': 'https://schema.org', '@graph': [
      { '@type': 'BlogPosting', headline: x.titulo.slice(0, 110), description: corta(x.descripcion || x.respuesta), datePublished: fecha, dateModified: fecha, inLanguage: l === 'en' ? 'en-US' : 'es-MX', isAccessibleForFree: true, keywords: (x.palabras || []).join(', '),
        author: { '@type': 'Organization', name: SITIO, url: RAIZ }, publisher: { '@type': 'Organization', name: SITIO, url: RAIZ }, mainEntityOfPage: RAIZ + alt[l], about: j ? { '@type': 'Person', name: j.n } : undefined },
      ...((x.faq || []).length ? [{ '@type': 'FAQPage', mainEntity: x.faq.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) }] : []),
      { '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: SITIO, item: RAIZ }, { '@type': 'ListItem', position: 2, name: T.blog, item: RAIZ + (l === 'en' ? 'en/blog/' : 'blog/') }, { '@type': 'ListItem', position: 3, name: x.titulo }] }] };
    escribe(alt[l], pagina({ ruta: alt[l], titulo: `${x.titulo} | ${SITIO}`, desc: corta(x.descripcion || x.respuesta), ruteo: '#/blog/' + a.id, cuerpo, tipo: 'article', lang: l, alt, ld }));
  }
}
// Rankings semanales con el Modelo FX: la búsqueda más grande de cada semana ("week 8 qb rankings")
for (const pos of rkPos) {
  const L = jugadores.filter(j => j.pos === pos && j.proy && j.proy[0] != null && j.team !== 'FA' && !fueraJ(j) && cal.cal && cal.cal[j.team] && cal.cal[j.team][semana]).sort((a, b) => b.proy[0] - a.proy[0]).slice(0, pos === 'K' || pos === 'DEF' ? 20 : pos === 'QB' || pos === 'TE' ? 30 : 60);
  if (!L.length) continue;
  const alt = { es: urlR(pos, 'es'), en: urlR(pos, 'en') };
  for (const l of ['es', 'en']) {
    const T = TB[l], P = POSL[l][pos];
    const titulo = l === 'en' ? `Week ${semana} Fantasy ${P} Rankings ${temporada} (PPR, Half, Standard)` : `Ranking fantasy ${P} semana ${semana} ${temporada} (PPR, Half y STD)`;
    const desc = corta(l === 'en' ? `Our Week ${semana} ${P} rankings from the FX Model: ${L.slice(0, 3).map(j => j.n).join(', ')} lead the way. Projections in PPR, Half PPR and Standard with matchups.` : `Nuestro ranking de ${P} para la semana ${semana} con el Modelo FX: ${L.slice(0, 3).map(j => j.n).join(', ')} encabezan. Proyecciones PPR, Half y STD con rival.`);
    const fila = (j, i) => { const r = cal.cal[j.team][semana]; return `<tr><td>${i + 1}</td><td><a href="${urlJ(j)}">${esc(j.n)}</a></td><td>${esc(j.team)}</td><td>${r.home ? 'vs' : '@'} ${esc(r.opp)}</td><td>${j.proy[0]}</td><td>${j.proy[1]}</td><td>${j.proy[2]}</td><td>${esc(j.inj || '')}</td></tr>`; };
    const cuerpo = `<article class="blogart"><p><small>${T.rk} · ${T.sem} ${semana}</small></p><h1>${esc(titulo)}</h1>
<p>${l === 'en' ? `These are our Week ${semana} ${P} rankings, built with the FX Model: expected volume (targets, carries, passing yards) times efficiency regressed to the position average. Updated several times a day with injuries and the latest stats.` : `Este es nuestro ranking de ${P} para la semana ${semana}, hecho con el Modelo FX: el volumen esperado (targets, acarreos, yardas por pase) por la eficiencia regresada al promedio de la posición. Se actualiza varias veces al día con lesiones y estadísticas.`}</p>
<table><thead><tr><th>#</th><th>${l === 'en' ? 'Player' : 'Jugador'}</th><th>${l === 'en' ? 'Team' : 'Equipo'}</th><th>${l === 'en' ? 'Opp' : 'Rival'}</th><th>PPR</th><th>Half</th><th>STD</th><th>${l === 'en' ? 'Status' : 'Estatus'}</th></tr></thead><tbody>${L.map(fila).join('')}</tbody></table>
<p>${rkPos.filter(x => x !== pos).map(x => `<a href="${urlR(x, l)}">${l === 'en' ? `Week ${semana} ${POSL.en[x]} rankings` : `Ranking ${POSL.es[x]} semana ${semana}`}</a>`).join(' · ')}</p></article>`;
    escribe(alt[l], pagina({ ruta: alt[l], titulo: `${titulo} | ${SITIO}`, desc, ruteo: '#/posicion/' + pos, cuerpo, tipo: 'article', lang: l, alt: { es: urlRF(pos, 'es'), en: urlRF(pos, 'en') }, canon: urlRF(pos, l), img: `rankings-${pos.toLowerCase()}${l === 'en' ? '-en' : ''}.png`,
      ld: { '@context': 'https://schema.org', '@type': 'Article', headline: titulo.slice(0, 110), description: desc, dateModified: hoy.actualizado || new Date().toISOString(), inLanguage: l === 'en' ? 'en-US' : 'es-MX', author: { '@type': 'Organization', name: SITIO, url: RAIZ }, publisher: { '@type': 'Organization', name: SITIO, url: RAIZ } } }));
  }
}
// Páginas fijas de rankings (misma URL toda la temporada: acumulan autoridad en Google) y su portada
for (const pos of rkPos) {
  const L = jugadores.filter(j => j.pos === pos && j.proy && j.proy[0] != null && j.team !== 'FA' && !fueraJ(j) && cal.cal && cal.cal[j.team] && cal.cal[j.team][semana]).sort((a, b) => b.proy[0] - a.proy[0]).slice(0, pos === 'K' || pos === 'DEF' ? 24 : pos === 'QB' || pos === 'TE' ? 32 : 72);
  if (!L.length) continue;
  const alt = { es: urlRF(pos, 'es'), en: urlRF(pos, 'en') };
  for (const l of ['es', 'en']) {
    const N = PN[l][pos], en = l === 'en';
    const titulo = en ? `Week ${semana} Fantasy ${pos === 'DEF' ? 'DST' : pos} Rankings ${temporada} (PPR, Half, STD)` : `Rankings ${pos} Fantasy Football Semana ${semana} ${temporada} (PPR y Half)`;
    const desc = corta(en ? `Week ${semana} fantasy football ${N} rankings and projections from the FX Model, with matchup and injury status: ${L.slice(0, 3).map(j => j.n).join(', ')}. PPR, Half PPR and Standard, updated every day.` : `Rankings de ${N} de fantasy football para la semana ${semana} con proyecciones del Modelo FX, rival y estatus médico: ${L.slice(0, 3).map(j => j.n).join(', ')}. PPR, Half PPR y Standard, actualizados todos los días.`);
    const fila = (j, i) => { const r = cal.cal[j.team][semana]; return `<tr><td>${i + 1}</td><td><a href="${urlJ(j)}">${esc(j.n)}</a></td><td>${esc(j.team)}</td><td>${r.home ? 'vs' : '@'} ${esc(r.opp)}</td><td>${j.proy[0]}</td><td>${j.proy[1]}</td><td>${j.proy[2]}</td></tr>`; };
    const cuerpo = `<article class="blogart"><h1>${esc(titulo)}</h1><p>${en ? `Our ${N} rankings for week ${semana}, ordered by the FX Model projection. The model blends each player's volume and efficiency from this season and last, his opponent, his health and the market consensus, and we publish its accuracy every week.` : `Nuestros rankings de ${N} para la semana ${semana}, ordenados por la proyección del Modelo FX. El modelo combina el volumen y la eficiencia de cada jugador de esta temporada y la anterior, su rival, su salud y el consenso del mercado, y publicamos su precisión cada semana.`} <a href="${urlRF('', l) === 'rankings/' ? 'precision/' : 'en/precision/'}">${en ? 'See our accuracy' : 'Ver nuestra precisión'}</a>.</p>
<table><thead><tr><th>#</th><th>${en ? 'Player' : 'Jugador'}</th><th>${en ? 'Team' : 'Equipo'}</th><th>${en ? 'Opp' : 'Rival'}</th><th>PPR</th><th>Half</th><th>STD</th></tr></thead><tbody>${L.map(fila).join('')}</tbody></table>
<p>${rkPos.filter(x => x !== pos).map(x => `<a href="${urlRF(x, l)}">${en ? 'Rankings' : 'Rankings de'} ${PN[l][x]}</a>`).join(' · ')}</p></article>`;
    escribe(alt[l], pagina({ ruta: alt[l], titulo: `${titulo} | ${en ? 'Fantasy Experts' : SITIO}`, desc, ruteo: '#/posicion/' + pos, cuerpo, lang: l, alt, img: `rankings-${pos.toLowerCase()}${en ? '-en' : ''}.png`,
      ld: { '@context': 'https://schema.org', '@graph': [{ '@type': 'WebPage', name: titulo, description: desc, dateModified: hoy.actualizado || new Date().toISOString(), inLanguage: en ? 'en-US' : 'es-MX', publisher: { '@type': 'Organization', name: SITIO, url: RAIZ } },
        { '@type': 'ItemList', name: titulo, itemListElement: L.slice(0, 20).map((j, i) => ({ '@type': 'ListItem', position: i + 1, name: j.n, url: RAIZ + urlJ(j) })) },
        { '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: SITIO, item: RAIZ }, { '@type': 'ListItem', position: 2, name: 'Rankings', item: RAIZ + urlRF('', l) }, { '@type': 'ListItem', position: 3, name: N, item: RAIZ + alt[l] }] }] } }));
  }
}
for (const l of ['es', 'en']) {
  const en = l === 'en', alt = { es: urlRF('', 'es'), en: urlRF('', 'en') };
  const titulo = en ? `Fantasy Football Rankings ${temporada}: Week ${semana} Projections` : `Rankings de Fantasy Football ${temporada}: proyecciones de la semana ${semana}`;
  const desc = en ? `Week ${semana} fantasy football rankings by position (QB, RB, WR, TE, K, DST) with FX Model projections in PPR, Half PPR and Standard.` : `Rankings de fantasy football de la semana ${semana} por posición (QB, RB, WR, TE, K, DEF) con proyecciones del Modelo FX en PPR, Half PPR y Standard.`;
  escribe(alt[l], pagina({ ruta: alt[l], titulo: `${titulo} | ${en ? 'Fantasy Experts' : SITIO}`, desc, ruteo: '#/posicion/QB', lang: l, alt, cuerpo: `<h1>${esc(titulo)}</h1><p>${esc(desc)}</p><ul>${rkPos.map(x => `<li><a href="${urlRF(x, l)}">${en ? 'Rankings' : 'Rankings de'} ${PN[l][x]}</a></li>`).join('')}</ul>` }));
}
// Precisión del Modelo FX (transparencia: cuánto se equivoca cada semana contra la referencia del mercado)
{
  const M = leer('data/v2/modelo.json', { semanas: {} }), S = Object.entries(M.semanas || {}).sort((a, b) => +a[0] - +b[0]);
  const gana = S.filter(([, x]) => x.maeFX <= x.maeRef).length, prom = k => S.length ? (S.reduce((t, [, x]) => t + x[k] * x.n, 0) / S.reduce((t, [, x]) => t + x.n, 0)).toFixed(2) : '–';
  const u = S[S.length - 1], bt = M.params && M.params.mezErr && M.params.mezErr.total;
  for (const l of ['es', 'en']) {
    const en = l === 'en', alt = { es: 'precision/', en: 'en/precision/' };
    const titulo = en ? `Fantasy Football Projection Accuracy ${temporada}: FX Model vs the Market` : `Precisión de proyecciones de fantasy football ${temporada}: Modelo FX vs el mercado`;
    const desc = en ? `How accurate are our fantasy football projections? Week-by-week average error per player against a market reference projection. ${gana} of ${S.length} weeks won so far.` : `¿Qué tan precisas son nuestras proyecciones de fantasy football? Error promedio por jugador, semana a semana, contra una proyección de referencia del mercado. ${gana} de ${S.length} semanas ganadas.`;
    const filas = S.map(([w, x]) => { const d = +(x.maeRef - x.maeFX).toFixed(2); return `<tr><td>${w}</td><td>${esc(x.version || 'FX v3')}</td><td>${x.n}</td><td><b>${x.maeFX.toFixed(2)}</b></td><td>${x.maeRef.toFixed(2)}</td><td>${d > 0 ? '+' : ''}${d.toFixed(2)}</td><td>${x.maeFX <= x.maeRef ? (en ? 'FX Model' : 'Modelo FX') : (en ? 'Reference' : 'Referencia')}</td></tr>`; }).join('');
    const PP = ['QB', 'RB', 'WR', 'TE', 'K', 'DEF'], pp = u && u[1].porPos;
    const posT = pp ? `<h2>${en ? `Ranking order by position (week ${u[0]})` : `Orden por posición (semana ${u[0]})`}</h2><p>${en ? 'Rank correlation between our order and the real finish (1 = perfect order, 0 = random). This is what matters for start/sit decisions.' : 'Correlación entre nuestro orden y el resultado real (1 = orden perfecto, 0 = al azar). Es lo que importa para decidir a quién arrancar.'}</p>
<table><thead><tr><th>${en ? 'Position' : 'Posición'}</th><th>${en ? 'Players' : 'Jugadores'}</th><th>FX</th><th>${en ? 'Reference' : 'Referencia'}</th></tr></thead><tbody>${PP.filter(x => pp[x] && pp[x].spearmanFX != null).map(x => `<tr><td>${x}</td><td>${pp[x].n}</td><td><b>${pp[x].spearmanFX.toFixed(2)}</b></td><td>${pp[x].spearmanRef != null ? pp[x].spearmanRef.toFixed(2) : '–'}</td></tr>`).join('')}</tbody></table>` : '';
    const btT = bt ? `<h2>${en ? 'Current model (FX v4)' : 'Modelo actual (FX v4)'}</h2><p>${en ? `Since week 10 the FX Model combines its own projection with the market consensus, with a weight per position chosen by testing on the weeks already played. On those ${bt.n} player-weeks the combination has an average error of ${bt.mix} points, versus ${bt.ref} for the reference and ${bt.fx} for the FX projection alone. The table above will show whether it holds up week after week, without retouching past weeks.` : `Desde la semana 10 el Modelo FX combina su proyección propia con el consenso del mercado, con un peso por posición elegido a prueba contra las semanas ya jugadas. En esos ${bt.n} casos jugador-semana la combinación tiene un error promedio de ${bt.mix} puntos, contra ${bt.ref} de la referencia y ${bt.fx} de la proyección FX sola. La tabla de arriba mostrará si se sostiene semana a semana, sin retocar las semanas pasadas.`}</p>` : '';
    const cuerpo = `<article class="blogart"><h1>${esc(titulo)}</h1><p>${en ? 'Every week we compare each projection with what the player actually scored (PPR). Lower average error means more accurate projections. We publish every week, including the ones we lose.' : 'Cada semana comparamos cada proyección con lo que el jugador realmente hizo (PPR). Menor error promedio significa proyecciones más precisas. Publicamos todas las semanas, también las que perdemos.'}</p>
<ul><li>${en ? 'Weeks more accurate than the reference' : 'Semanas más precisos que la referencia'}: <b>${gana} / ${S.length}</b></li><li>${en ? 'Season average error, FX Model' : 'Error promedio de la temporada, Modelo FX'}: <b>${prom('maeFX')}</b> · ${en ? 'reference' : 'referencia'}: <b>${prom('maeRef')}</b></li>${u ? `<li>${en ? 'Last week' : 'Última semana'} (${u[0]}): FX <b>${u[1].maeFX.toFixed(2)}</b> · ${en ? 'reference' : 'referencia'} <b>${u[1].maeRef.toFixed(2)}</b></li>` : ''}</ul>
<table><thead><tr><th>${en ? 'Week' : 'Semana'}</th><th>${en ? 'Model' : 'Modelo'}</th><th>${en ? 'Players' : 'Jugadores'}</th><th>${en ? 'FX error' : 'Error FX'}</th><th>${en ? 'Reference error' : 'Error referencia'}</th><th>${en ? 'Difference' : 'Diferencia'}</th><th>${en ? 'More accurate' : 'Más preciso'}</th></tr></thead><tbody>${filas}</tbody></table>
${btT}${posT}
<h2>${en ? 'How we measure' : 'Cómo medimos'}</h2><ul><li>${en ? 'Error = absolute difference between projected and actual PPR points, averaged over every player with at least two prior games that week.' : 'Error = diferencia absoluta entre los puntos PPR proyectados y los reales, promediada sobre todos los jugadores con al menos dos partidos previos esa semana.'}</li><li>${en ? 'Each projection is rebuilt only with information available before kickoff.' : 'Cada proyección se reconstruye solo con la información disponible antes del partido.'}</li><li>${en ? 'The reference is the standard public projection used by fantasy league platforms.' : 'La referencia es la proyección pública estándar que usan las plataformas de ligas de fantasy.'}</li><li>${en ? 'A week is closed when its last game ends; closed weeks are never edited.' : 'Una semana se cierra cuando termina su último partido; las semanas cerradas no se editan.'}</li></ul>
<h2>${en ? 'For media and creators' : 'Para medios y creadores'}</h2><p>${en ? 'You can cite these numbers with a link to this page. Raw data:' : 'Puedes citar estas cifras con un enlace a esta página. Datos completos:'} <a href="data/v2/modelo.json">modelo.json</a> · <a href="${en ? 'en/creators/' : 'creadores/'}">${en ? 'Free rankings widget for your site' : 'Widget de rankings gratis para tu sitio'}</a></p>
<p><a href="${urlRF('', l)}">${en ? 'See this week\'s rankings' : 'Ver los rankings de la semana'}</a></p></article>`;
    escribe(alt[l], pagina({ ruta: alt[l], titulo: `${titulo} | ${en ? 'Fantasy Experts' : SITIO}`, desc, ruteo: '#/precision', cuerpo, lang: l, alt, img: `precision${en ? '-en' : ''}.png`,
      ld: { '@context': 'https://schema.org', '@type': 'Dataset', name: titulo, description: desc, creator: { '@type': 'Organization', name: SITIO, url: RAIZ }, url: RAIZ + alt[l], isAccessibleForFree: true, license: 'https://creativecommons.org/licenses/by/4.0/', distribution: { '@type': 'DataDownload', encodingFormat: 'application/json', contentUrl: RAIZ + 'data/v2/modelo.json' }, temporalCoverage: String(temporada) } }));
  }
}
// Power Ranking de liga (gratis, para comisionados) y página para creadores/medios
for (const l of ['es', 'en']) {
  const en = l === 'en', alt = { es: 'liga/', en: 'en/league/' };
  const titulo = en ? 'Fantasy Football League Power Rankings Generator (Free)' : 'Power Ranking de tu liga de fantasy football (gratis)';
  const desc = en ? 'Paste your Sleeper league link and get free power rankings for every team: weekly projection, rest-of-season strength, weak spots and win odds for every matchup.' : 'Pega el link de tu liga de Sleeper y obtén gratis el power ranking de todos los equipos: proyección de la semana, fuerza para el resto de la temporada, puntos débiles y probabilidad de cada duelo.';
  escribe(alt[l], pagina({ ruta: alt[l], titulo: `${titulo} | ${en ? 'Fantasy Experts' : SITIO}`, desc, ruteo: '#/liga', lang: l, alt, img: `liga${en ? '-en' : ''}.png`,
    cuerpo: `<h1>${esc(titulo)}</h1><p>${esc(desc)}</p><h2>${en ? 'How it works' : 'Cómo funciona'}</h2><ol><li>${en ? 'Paste your league link or ID, or your Sleeper username.' : 'Pega el link o ID de tu liga, o tu usuario de Sleeper.'}</li><li>${en ? 'The FX Model projects every roster\'s optimal lineup and rest-of-season value.' : 'El Modelo FX proyecta la alineación óptima y el valor de resto de temporada de cada plantel.'}</li><li>${en ? 'Share the ranking with your league in one tap.' : 'Comparte el ranking con tu liga en un toque.'}</li></ol>`,
    ld: { '@context': 'https://schema.org', '@type': 'WebApplication', name: titulo, applicationCategory: 'SportsApplication', operatingSystem: 'Web', offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' }, url: RAIZ + alt[l] } }));
}
for (const l of ['es', 'en']) {
  const en = l === 'en', alt = { es: 'creadores/', en: 'en/creators/' };
  const titulo = en ? 'Free Fantasy Football Rankings Widget for Your Site' : 'Widget gratis de rankings de fantasy football para tu sitio';
  const desc = en ? 'Embed our weekly fantasy football rankings on your site, blog or stream for free. Updated every day with FX Model projections. Partner program for creators.' : 'Pon nuestros rankings semanales de fantasy football en tu sitio, blog o stream gratis. Se actualizan solos con el Modelo FX. Programa para creadores de contenido.';
  const code = p => esc(`<iframe src="${RAIZ}widget/?pos=${p}&lang=${l}" width="100%" height="560" style="border:0;max-width:420px" loading="lazy" title="${en ? `Fantasy ${p} rankings` : `Rankings de fantasy ${p}`}"></iframe>\n<p><a href="${RAIZ}${en ? 'en/' : ''}rankings/${p.toLowerCase()}/">${en ? `Fantasy ${p} rankings` : `Rankings de fantasy ${p}`}</a> ${en ? 'by' : 'por'} Fantasy Expertos</p>`);
  escribe(alt[l], pagina({ ruta: alt[l], titulo: `${titulo} | ${en ? 'Fantasy Experts' : SITIO}`, desc, ruteo: '#/', lang: l, alt,
    cuerpo: `<article class="blogart"><h1>${esc(titulo)}</h1><p>${esc(desc)}</p>
<h2>${en ? 'Embed code' : 'Código para pegar'}</h2><p>${en ? 'Copy and paste. Change pos= to QB, RB, WR, TE, K or DEF.' : 'Copia y pega. Cambia pos= por QB, RB, WR, TE, K o DEF.'}</p><pre><code>${code('RB')}</code></pre>
<iframe src="widget/?pos=RB&amp;lang=${l}" width="100%" height="560" style="border:0;max-width:420px" loading="lazy" title="Widget"></iframe>
<h2>${en ? 'Creator program' : 'Programa para creadores'}</h2><p>${en ? 'Podcast, YouTube, stream or blog about fantasy football? We give you FX PRO for free and data for your shows (start/sit, accuracy, power rankings) in exchange for mentioning and linking Fantasy Expertos.' : '¿Tienes podcast, canal, stream o blog de fantasy football? Te damos FX PRO gratis y datos para tus programas (start/sit, precisión, power rankings) a cambio de mencionar y enlazar a Fantasy Expertos.'}</p>
<p>${en ? 'Write to us on' : 'Escríbenos por'} <a href="https://www.instagram.com/fantasy.expertos" rel="noopener" target="_blank">Instagram</a>.</p>
<h2>${en ? 'Cite our data' : 'Cita nuestros datos'}</h2><p>${en ? 'Our accuracy numbers are public and updated every week:' : 'Nuestras cifras de precisión son públicas y se actualizan cada semana:'} <a href="${en ? 'en/' : ''}precision/">${en ? 'projection accuracy' : 'precisión de proyecciones'}</a>.</p></article>` }));
}
// Portada en inglés
escribe('en/', pagina({ ruta: 'en/', titulo: `Fantasy Football Rankings ${temporada} & Start/Sit | Fantasy Experts`, desc: 'Weekly fantasy football rankings and start/sit from the FX Model, with accuracy published every week. Waivers, injuries, trade analyzer. PPR, Half and STD.', ruteo: '#/', lang: 'en', alt: { es: '', en: 'en/' }, img: 'fx-en.png',
  cuerpo: `<h1>Fantasy Football Rankings ${temporada}, Projections and Start/Sit</h1><p>Fantasy Experts is the fantasy football platform with its own projections: the FX Model analyzes every NFL player's volume, efficiency, opponent and health, and we publish its accuracy every week.</p><ul>${rkPos.map(x => `<li><a href="${urlRF(x, 'en')}">Rankings: ${PN.en[x]}</a></li>`).join('')}<li><a href="en/precision/">Projection accuracy</a></li><li><a href="en/blog/">Blog</a></li></ul>` }));
// Start/Sit jugador por jugador: una página por jugador relevante cada semana (ES/EN), hecha solo con datos del Modelo FX
const SS = [];
{
  const CORTE = { QB: [12, 20], RB: [24, 40], WR: [30, 50], TE: [10, 18] }, CUANTOS = { QB: 32, RB: 60, WR: 80, TE: 32 };
  const POSE = { es: { QB: 'QB', RB: 'RB', WR: 'WR', TE: 'TE' }, en: { QB: 'QB', RB: 'RB', WR: 'WR', TE: 'TE' } };
  for (const pos of Object.keys(CUANTOS)) {
    const L = jugadores.filter(j => j.pos === pos && j.proy && j.proy[0] != null && j.team !== 'FA' && cal.cal && cal.cal[j.team]).sort((a, b) => b.proy[0] - a.proy[0]).slice(0, CUANTOS[pos]);
    const jugando = L.filter(j => cal.cal[j.team][semana] && !fueraJ(j));
    for (const j of L) {
      const r = cal.cal[j.team][semana], rk = jugando.indexOf(j) + 1, d = r && cal.dvp && cal.dvp[r.opp] && cal.dvp[r.opp][pos];
      const ver = !r ? 'bye' : fueraJ(j) ? 'out' : rk && rk <= CORTE[pos][0] ? 'start' : rk && rk <= CORTE[pos][1] ? 'flex' : 'sit';
      const jg = (j.log || []).filter(l => l.f && l.f[0] != null), prom = jg.length ? r1(jg.reduce((a, l) => a + l.f[0], 0) / jg.length) : null, u3 = jg.slice(-3), p3 = u3.length ? r1(u3.reduce((a, l) => a + l.f[0], 0) / u3.length) : null;
      const alt = { es: `blog/arrancar-${slug(j.n)}-semana-${semana}-${temporada}/`, en: `en/blog/start-${slug(j.n)}-week-${semana}-${temporada}/` };
      SS.push({ id: j.id, n: j.n, pos, team: j.team, v: ver, p: j.proy[0], es: alt.es, en: alt.en });
      for (const l of ['es', 'en']) {
        const en = l === 'en', eq = EQUIPOS[j.team] || j.team, riv = r ? `${r.home ? 'vs' : '@'} ${EQUIPOS[r.opp] || r.opp}` : '';
        const titulo = en ? `Should you start ${j.n} in Week ${semana}? Fantasy projection and verdict` : `¿Arrancar a ${j.n} en la semana ${semana}? Proyección y veredicto de fantasy`;
        const resp = { start: en ? `Yes. ${j.n} is the ${pos}${rk} of the week in our FX Model: start him with confidence.` : `Sí. ${j.n} es el ${pos}${rk} de la semana en el Modelo FX: arráncalo con confianza.`,
          flex: en ? `He's a FLEX option. ${j.n} ranks ${pos}${rk} this week in the FX Model: start him if you need depth at ${pos} or FLEX.` : `Es opción de FLEX. ${j.n} es el ${pos}${rk} de la semana en el Modelo FX: arráncalo si te falta profundidad en ${pos} o en el FLEX.`,
          sit: en ? `Bench him if you have better options. ${j.n} ranks ${pos}${rk} this week in the FX Model.` : `Mejor en la banca si tienes otra opción. ${j.n} es el ${pos}${rk} de la semana en el Modelo FX.`,
          out: en ? `No. ${j.n} is listed as ${j.inj} on the official injury report: do not start him.` : `No. ${j.n} aparece como ${j.inj} en el reporte oficial de lesiones: no lo alinees.`,
          bye: en ? `No. The ${eq} are on bye in week ${semana}.` : `No. ${eq} descansa en la semana ${semana}.` }[ver];
        const mu = d ? (d.rank <= 10 ? (en ? 'a favorable matchup' : 'un matchup favorable') : d.rank >= 23 ? (en ? 'a tough matchup' : 'un matchup difícil') : (en ? 'a neutral matchup' : 'un matchup neutral')) : '';
        const secc = [
          r && ver !== 'out' ? [en ? 'FX Model projection' : 'Proyección del Modelo FX', en ? `${j.proy[0]} PPR points (${j.proy[1]} Half PPR, ${j.proy[2]} Standard) ${riv}.` : `${j.proy[0]} puntos PPR (${j.proy[1]} Half PPR, ${j.proy[2]} Standard) ${riv}.`] : null,
          d ? [en ? 'Matchup' : 'Matchup', en ? `${EQUIPOS[r.opp] || r.opp} allow ${d.prom} fantasy points per game to ${pos}s: ${mu}.` : `${EQUIPOS[r.opp] || r.opp} permite ${d.prom} puntos de fantasy por partido a los ${pos}: ${mu}.`] : null,
          prom != null ? [en ? 'Recent form' : 'Forma reciente', en ? `${prom} PPR points per game this season; ${p3} over his last ${u3.length} games.` : `${prom} puntos PPR por partido en la temporada; ${p3} en sus últimos ${u3.length} partidos.`] : null,
          [en ? 'Injury status' : 'Estatus médico', j.inj ? (en ? `Listed as ${j.inj} on the official report.` : `Aparece como ${j.inj} en el reporte oficial.`) : (en ? 'No injury designation.' : 'Sin designación de lesión.')]].filter(Boolean);
        const faq = [[en ? `Is ${j.n} a must-start in week ${semana}?` : `¿${j.n} es titular obligado en la semana ${semana}?`, resp], [en ? `How many points will ${j.n} score in week ${semana}?` : `¿Cuántos puntos hará ${j.n} en la semana ${semana}?`, r && ver !== 'out' ? (en ? `The FX Model projects ${j.proy[0]} PPR points.` : `El Modelo FX proyecta ${j.proy[0]} puntos PPR.`) : resp]];
        const cuerpo = `<article class="blogart"><p><small>START / SIT · ${en ? 'Week' : 'Semana'} ${semana} · ${esc(pos)} · ${esc(eq)}</small></p><h1>${esc(titulo)}</h1><p><b>${esc(resp)}</b></p>
${secc.map(([h, t]) => `<h2>${esc(h)}</h2><p>${esc(t)}</p>`).join('')}
<h2>${en ? 'FAQ' : 'Preguntas frecuentes'}</h2>${faq.map(([q, a]) => `<h3>${esc(q)}</h3><p>${esc(a)}</p>`).join('')}
<p><a href="${urlJ(j)}">${en ? 'Full profile of' : 'Ficha completa de'} ${esc(j.n)}</a> · <a href="${en ? 'en/' : ''}rankings/${pos.toLowerCase()}/">${en ? `Week ${semana} ${pos} rankings` : `Rankings ${pos} semana ${semana}`}</a></p></article>`;
        escribe(alt[l], pagina({ ruta: alt[l], titulo: `${titulo} | ${en ? 'Fantasy Experts' : SITIO}`, desc: corta(resp + ' ' + secc.map(x => x[1]).join(' ')), ruteo: '#/jugador/' + j.id, cuerpo, tipo: 'article', lang: l, alt, img: `ss/${slug(j.n)}-${j.id}.png`,
          ld: { '@context': 'https://schema.org', '@graph': [{ '@type': 'Article', headline: titulo.slice(0, 110), inLanguage: en ? 'en-US' : 'es-MX', dateModified: hoy.actualizado || new Date().toISOString(), author: { '@type': 'Organization', name: SITIO, url: RAIZ }, publisher: { '@type': 'Organization', name: SITIO, url: RAIZ }, about: { '@type': 'Person', name: j.n } },
            { '@type': 'FAQPage', mainEntity: faq.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) }] } }));
      }
    }
  }
  fs.writeFileSync('data/v2/startsit.json', JSON.stringify({ semana, temporada, j: SS }));
}
// Portadas del blog
for (const l of ['es', 'en']) {
  const T = TB[l], ruta = l === 'en' ? 'en/blog/' : 'blog/';
  const cuerpo = `<h1>${T.titulo}</h1><p>${T.desc}</p>
<h2>${T.rk}</h2><ul>${rkPos.map(x => `<li><a href="${urlRF(x, l)}">${l === 'en' ? `Week ${semana} ${POSL.en[x]} rankings` : `Ranking ${POSL.es[x]} semana ${semana}`}</a></li>`).join('')}</ul>
<ul>${blog.filter(a => a[l] && a[l].slug).slice(0, 80).map(a => `<li><a href="${urlB(a, l)}">${esc(a[l].titulo)}</a> · ${T.sem} ${esc(a.semana)}</li>`).join('')}</ul>
<h2>${l === 'en' ? `Start/Sit week ${semana}: every player` : `Start/Sit semana ${semana}: jugador por jugador`}</h2><ul>${SS.map(x => `<li><a href="${x[l]}">${l === 'en' ? `Should you start ${esc(x.n)}?` : `¿Arrancar a ${esc(x.n)}?`}</a> · ${x.pos} ${x.team}</li>`).join('')}</ul>`;
  escribe(ruta, pagina({ ruta, titulo: `${T.titulo} | ${SITIO}`, desc: T.desc, ruteo: '#/blog', cuerpo, lang: l, alt: { es: 'blog/', en: 'en/blog/' },
    ld: { '@context': 'https://schema.org', '@type': 'Blog', name: `${SITIO} · ${T.blog}`, url: RAIZ + ruta, inLanguage: l === 'en' ? 'en-US' : 'es-MX' } }));
}
// Blog y rankings que ya no existen: se borran sus páginas
for (const base of ['blog', 'en/blog']) if (fs.existsSync(base)) for (const d of fs.readdirSync(base)) { const r = base + '/' + d + '/'; if (fs.statSync(base + '/' + d).isDirectory() && !escritasB.has(r)) { fs.rmSync(base + '/' + d, { recursive: true, force: true }); cambios++; } }

// ---------- Widget para incrustar en otros sitios (cada uno nos deja un enlace) ----------
{
  const W = { semana, temporada, act: hoy.actualizado || null, pos: {} };
  for (const pos of rkPos) W.pos[pos] = jugadores.filter(j => j.pos === pos && j.proy && j.proy[0] != null && j.team !== 'FA' && !fueraJ(j) && cal.cal && cal.cal[j.team] && cal.cal[j.team][semana]).sort((a, b) => b.proy[0] - a.proy[0]).slice(0, 25)
    .map(j => { const r = cal.cal[j.team][semana]; return [j.n, j.team, (r.home ? 'vs ' : '@ ') + r.opp, j.proy, urlJ(j)]; });
  const wj = JSON.stringify(W); if (!fs.existsSync('data/v2/widget.json') || fs.readFileSync('data/v2/widget.json', 'utf8') !== wj) { fs.writeFileSync('data/v2/widget.json', wj); cambios++; }
  const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,follow"><title>Rankings · Fantasy Expertos</title>
<style>*{box-sizing:border-box}body{margin:0;font:14px/1.35 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;background:#0A1A10;color:#E8F2EA}.w{border:1px solid #1f4a30;border-radius:12px;overflow:hidden}
.h{display:flex;align-items:center;gap:10px;padding:12px 14px;background:#0f2417;border-bottom:1px solid #1f4a30}.h b{font-size:16px;letter-spacing:.3px}.h small{display:block;color:#8FB89A;font-size:11px}.h svg{flex:none}
.t{display:flex;gap:4px;padding:8px 10px;flex-wrap:wrap;border-bottom:1px solid #1f4a30}.t button{font:inherit;font-size:12px;font-weight:700;background:none;border:1px solid #2b5c3d;color:#B9D3C1;border-radius:7px;padding:4px 9px;cursor:pointer}.t button.on{background:#5BC489;color:#0A1A10;border-color:#5BC489}
ol{list-style:none;margin:0;padding:0;max-height:380px;overflow:auto}li{display:grid;grid-template-columns:26px 1fr auto;gap:8px;align-items:center;padding:7px 14px;border-bottom:1px solid #132e1e}li i{font-style:normal;color:#F2C94C;font-weight:800}li a{color:#fff;text-decoration:none;font-weight:600}li a:hover{text-decoration:underline}li small{display:block;color:#8FB89A;font-size:11px;font-weight:400}li em{font-style:normal;font-weight:800;color:#5BC489}
.f{display:flex;justify-content:space-between;gap:8px;padding:10px 14px;font-size:12px;background:#0f2417}.f a{color:#5BC489;font-weight:700;text-decoration:none}</style></head>
<body><div class="w"><div class="h"><svg width="34" height="23" viewBox="20 55 150 100" aria-hidden="true"><polygon points="69,58.5 166.5,58.5 153.5,82.2 83.5,82.2 49,151.7 23.7,151.7" fill="#E8E8E8"/><polygon points="90.5,94.5 146.2,94.5 133,118 79.2,118" fill="#4A9A68"/></svg><div><b id="ti">Rankings</b><small id="st"></small></div></div><div class="t" id="tb"></div><ol id="ls"></ol>
<div class="f"><span id="fm"></span><a id="vm" target="_blank" rel="noopener">fantasyexpertos.app ›</a></div></div>
<script>
const q=new URLSearchParams(location.search),EN=q.get('lang')==='en';let pos=(q.get('pos')||'RB').toUpperCase(),fmt=Math.max(0,['ppr','half','std'].indexOf((q.get('fmt')||'ppr').toLowerCase())),D=null;
const R='${RAIZ}',e=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function pinta(){if(!D)return;const L=D.pos[pos]||[];document.getElementById('ti').textContent=(EN?'Week '+D.semana+' '+pos+' rankings':'Rankings '+pos+' · semana '+D.semana);document.getElementById('st').textContent=(EN?'FX Model projection · ':'Proyección Modelo FX · ')+['PPR','Half PPR','STD'][fmt];
document.getElementById('tb').innerHTML=Object.keys(D.pos).map(p=>'<button class="'+(p===pos?'on':'')+'" data-p="'+p+'">'+p+'</button>').join('');
document.getElementById('ls').innerHTML=L.map((j,i)=>'<li><i>'+(i+1)+'</i><span><a href="'+R+j[4]+'" target="_blank" rel="noopener">'+e(j[0])+'</a><small>'+e(j[1])+' '+e(j[2])+'</small></span><em>'+(j[3][fmt]??j[3][0]).toFixed(1)+'</em></li>').join('');
document.getElementById('fm').textContent=EN?'Updated daily':'Se actualiza a diario';const vm=document.getElementById('vm');vm.href=R+(EN?'en/':'')+'rankings/'+pos.toLowerCase()+'/';vm.textContent=(EN?'Full ranking':'Ranking completo')+' ›';}
document.getElementById('tb').onclick=ev=>{const b=ev.target.closest('button');if(b){pos=b.dataset.p;pinta();}};
fetch(R+'data/v2/widget.json?v='+Math.floor(Date.now()/36e5)).then(r=>r.json()).then(d=>{D=d;if(!D.pos[pos])pos='RB';pinta();});
</script></body></html>`;
  escribe('widget/', html);
}
// ---------- Portada: top 10 por posición en el HTML (Google lo lee sin esperar a la app) ----------
{
  const bloque = '<!--RK-->' + ['QB', 'RB', 'WR', 'TE'].map(pos => { const L = jugadores.filter(j => j.pos === pos && j.proy && j.proy[0] != null && j.team !== 'FA' && !fueraJ(j) && cal.cal && cal.cal[j.team] && cal.cal[j.team][semana]).sort((a, b) => b.proy[0] - a.proy[0]).slice(0, 10);
    return L.length ? `<h2>Top 10 ${pos} semana ${semana}</h2><ol>${L.map(j => `<li><a href="${urlJ(j)}">${esc(j.n)}</a> (${esc(j.team)}) · ${j.proy[0]} pts PPR</li>`).join('')}</ol><p><a href="${urlRF(pos, 'es')}">Ranking completo de ${PN.es[pos]}</a></p>` : ''; }).join('') + '<!--/RK-->';
  const ix = fs.readFileSync('index.html', 'utf8'), nx = ix.replace(/<!--RK-->[\s\S]*?<!--\/RK-->/, bloque);
  if (nx !== ix) { fs.writeFileSync('index.html', nx); cambios++; }
}
// ---------- Sitemap y robots ----------
const urls = [['', 'hourly', '1.0', null, { es: '', en: 'en/' }], ['privacidad/', 'yearly', '0.2'], ['blog/', 'daily', '0.8', null, { es: 'blog/', en: 'en/blog/' }], ['en/blog/', 'daily', '0.8', null, { es: 'blog/', en: 'en/blog/' }],
  ...blog.filter(a => a.es && a.en && a.es.slug && a.en.slug).flatMap(a => { const alt = { es: urlB(a, 'es'), en: urlB(a, 'en') }; return [[alt.es, 'weekly', '0.9', (a.fecha || '').slice(0, 10), alt], [alt.en, 'weekly', '0.9', (a.fecha || '').slice(0, 10), alt]]; }),
  ...archivo.filter(n => n && n.titulo && n.id).flatMap(n => { const f = (n.fecha || '').slice(0, 10); if (!(n.en && n.en.titulo && !n.exclusivo)) return [[urlN(n), 'weekly', '0.8', f]]; const alt = { es: urlN(n), en: urlNen(n) }; return [[alt.es, 'weekly', '0.8', f, alt], [alt.en, 'weekly', '0.8', f, alt]]; }),
  ['en/', 'hourly', '1.0', null, { es: '', en: 'en/' }], ...['', ...rkPos].flatMap(x => { const alt = { es: urlRF(x, 'es'), en: urlRF(x, 'en') }; return [[alt.es, 'daily', '0.95', null, alt], [alt.en, 'daily', '0.95', null, alt]]; }),
  ['precision/', 'weekly', '0.8', null, { es: 'precision/', en: 'en/precision/' }], ['liga/', 'weekly', '0.9', null, { es: 'liga/', en: 'en/league/' }], ['en/league/', 'weekly', '0.9', null, { es: 'liga/', en: 'en/league/' }], ['creadores/', 'monthly', '0.5', null, { es: 'creadores/', en: 'en/creators/' }], ['en/creators/', 'monthly', '0.5', null, { es: 'creadores/', en: 'en/creators/' }], ['en/precision/', 'weekly', '0.8', null, { es: 'precision/', en: 'en/precision/' }],
  ...SS.flatMap(x => { const alt = { es: x.es, en: x.en }; return [[x.es, 'daily', '0.8', null, alt], [x.en, 'daily', '0.8', null, alt]]; }),
  ...jugadores.map(j => [urlJ(j), 'daily', '0.7']), ...Object.keys(EQUIPOS).map(t => [urlE(t), 'daily', '0.6'])];
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urls.filter(([u]) => !/^(en\/)?blog\/.+/.test(u) || escritasB.has(u)).map(([u, f, p, m, alt]) => `<url><loc>${RAIZ}${u}</loc>${alt ? Object.entries(alt).map(([l, x]) => `<xhtml:link rel="alternate" hreflang="${l}" href="${RAIZ}${x}"/>`).join('') : ''}${m ? `<lastmod>${m}</lastmod>` : ''}<changefreq>${f}</changefreq><priority>${p}</priority></url>`).join('\n')}\n</urlset>\n`;
const robots = `User-agent: *\nAllow: /\nDisallow: /apps-script/\nSitemap: ${RAIZ}sitemap.xml\n`;
for (const [f, c] of [['sitemap.xml', sitemap], ['robots.txt', robots]]) if (!fs.existsSync(f) || fs.readFileSync(f, 'utf8') !== c) { fs.writeFileSync(f, c); cambios++; }

console.log(`Páginas SEO: ${jugadores.length} jugadores, ${archivo.length} noticias, 32 equipos · ${cambios} archivos cambiaron · raíz ${RAIZ}`);

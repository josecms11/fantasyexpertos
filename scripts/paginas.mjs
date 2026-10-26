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

function pagina({ ruta, titulo, desc, ruteo, cuerpo, ld, tipo = 'website', lang = 'es', alt = null }) {
  const url = RAIZ + ruta;
  const alterna = alt ? Object.entries(alt).map(([l, u]) => `<link rel="alternate" hreflang="${l}" href="${RAIZ + u}">`).join('') + `<link rel="alternate" hreflang="x-default" href="${RAIZ + (alt.en || alt.es)}">` : '';
  const cabeza = `<base href="${RAIZ}">
<title>${esc(titulo)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${url}">
${alterna}
<meta property="og:type" content="${tipo}"><meta property="og:site_name" content="${SITIO}"><meta property="og:locale" content="${lang === 'en' ? 'en_US' : 'es_MX'}">
<meta property="og:title" content="${esc(titulo)}"><meta property="og:description" content="${esc(desc)}"><meta property="og:url" content="${url}">
<meta name="twitter:card" content="summary">
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
    escribe(alt[l], pagina({ ruta: alt[l], titulo: `${titulo} | ${SITIO}`, desc, ruteo: '#/posicion/' + pos, cuerpo, tipo: 'article', lang: l, alt,
      ld: { '@context': 'https://schema.org', '@type': 'Article', headline: titulo.slice(0, 110), description: desc, dateModified: hoy.actualizado || new Date().toISOString(), inLanguage: l === 'en' ? 'en-US' : 'es-MX', author: { '@type': 'Organization', name: SITIO, url: RAIZ }, publisher: { '@type': 'Organization', name: SITIO, url: RAIZ } } }));
  }
}
// Páginas fijas de rankings (misma URL toda la temporada: acumulan autoridad en Google) y su portada
const PN = { es: { QB: 'quarterbacks (QB)', RB: 'running backs (RB)', WR: 'receptores (WR)', TE: 'alas cerradas (TE)', K: 'pateadores (K)', DEF: 'defensivas (DEF)' }, en: { QB: 'quarterbacks (QB)', RB: 'running backs (RB)', WR: 'wide receivers (WR)', TE: 'tight ends (TE)', K: 'kickers (K)', DEF: 'defenses (DST)' } };
const urlRF = (pos, l) => (l === 'en' ? 'en/' : '') + 'rankings/' + (pos ? pos.toLowerCase() + '/' : '');
for (const pos of rkPos) {
  const L = jugadores.filter(j => j.pos === pos && j.proy && j.proy[0] != null && j.team !== 'FA' && !fueraJ(j) && cal.cal && cal.cal[j.team] && cal.cal[j.team][semana]).sort((a, b) => b.proy[0] - a.proy[0]).slice(0, pos === 'K' || pos === 'DEF' ? 24 : pos === 'QB' || pos === 'TE' ? 32 : 72);
  if (!L.length) continue;
  const alt = { es: urlRF(pos, 'es'), en: urlRF(pos, 'en') };
  for (const l of ['es', 'en']) {
    const N = PN[l][pos], en = l === 'en';
    const titulo = en ? `Fantasy Football Rankings ${temporada}: ${N} · Week ${semana} PPR, Half PPR & Standard` : `Rankings de Fantasy Football ${temporada}: ${N} · Semana ${semana} PPR, Half y Standard`;
    const desc = corta(en ? `Week ${semana} fantasy football ${N} rankings and projections from the FX Model, with matchup and injury status: ${L.slice(0, 3).map(j => j.n).join(', ')}. PPR, Half PPR and Standard, updated every day.` : `Rankings de ${N} de fantasy football para la semana ${semana} con proyecciones del Modelo FX, rival y estatus médico: ${L.slice(0, 3).map(j => j.n).join(', ')}. PPR, Half PPR y Standard, actualizados todos los días.`);
    const fila = (j, i) => { const r = cal.cal[j.team][semana]; return `<tr><td>${i + 1}</td><td><a href="${urlJ(j)}">${esc(j.n)}</a></td><td>${esc(j.team)}</td><td>${r.home ? 'vs' : '@'} ${esc(r.opp)}</td><td>${j.proy[0]}</td><td>${j.proy[1]}</td><td>${j.proy[2]}</td></tr>`; };
    const cuerpo = `<article class="blogart"><h1>${esc(titulo)}</h1><p>${en ? `Our ${N} rankings for week ${semana}, ordered by the FX Model projection. The model blends each player's volume and efficiency from this season and last, his opponent and his health, and we publish its accuracy every week.` : `Nuestros rankings de ${N} para la semana ${semana}, ordenados por la proyección del Modelo FX. El modelo combina el volumen y la eficiencia de cada jugador de esta temporada y la anterior, su rival y su salud, y publicamos su precisión cada semana.`} <a href="${urlRF('', l) === 'rankings/' ? 'precision/' : 'en/precision/'}">${en ? 'See our accuracy' : 'Ver nuestra precisión'}</a>.</p>
<table><thead><tr><th>#</th><th>${en ? 'Player' : 'Jugador'}</th><th>${en ? 'Team' : 'Equipo'}</th><th>${en ? 'Opp' : 'Rival'}</th><th>PPR</th><th>Half</th><th>STD</th></tr></thead><tbody>${L.map(fila).join('')}</tbody></table>
<p>${rkPos.filter(x => x !== pos).map(x => `<a href="${urlRF(x, l)}">${en ? 'Rankings' : 'Rankings de'} ${PN[l][x]}</a>`).join(' · ')}</p></article>`;
    escribe(alt[l], pagina({ ruta: alt[l], titulo: `${titulo} | ${en ? 'Fantasy Experts' : SITIO}`, desc, ruteo: '#/posicion/' + pos, cuerpo, lang: l, alt,
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
  for (const l of ['es', 'en']) {
    const en = l === 'en', alt = { es: 'precision/', en: 'en/precision/' };
    const titulo = en ? `Fantasy Football Projection Accuracy ${temporada}: FX Model vs the Market` : `Precisión de proyecciones de fantasy football ${temporada}: Modelo FX vs el mercado`;
    const desc = en ? 'How accurate are our fantasy football projections? Average error per player every week, compared with a market reference projection.' : '¿Qué tan precisas son nuestras proyecciones de fantasy football? Error promedio por jugador cada semana, comparado contra una proyección de referencia del mercado.';
    const filas = S.map(([w, x]) => `<tr><td>${w}</td><td>${x.n}</td><td>${x.maeFX}</td><td>${x.maeRef}</td><td>${x.maeFX <= x.maeRef ? (en ? 'FX Model' : 'Modelo FX') : (en ? 'Reference' : 'Referencia')}</td></tr>`).join('');
    const cuerpo = `<article class="blogart"><h1>${esc(titulo)}</h1><p>${en ? 'Every week we compare each projection with what the player actually scored (PPR). Lower average error means more accurate projections. The model recalibrates itself every 12 hours against the weeks already played.' : 'Cada semana comparamos cada proyección con lo que el jugador realmente hizo (PPR). Menor error promedio significa proyecciones más precisas. El modelo se recalibra solo cada 12 horas contra las semanas ya jugadas.'}</p>
<table><thead><tr><th>${en ? 'Week' : 'Semana'}</th><th>${en ? 'Players' : 'Jugadores'}</th><th>${en ? 'FX Model error' : 'Error Modelo FX'}</th><th>${en ? 'Reference error' : 'Error referencia'}</th><th>${en ? 'More accurate' : 'Más preciso'}</th></tr></thead><tbody>${filas}</tbody></table>
<p><a href="${urlRF('', l)}">${en ? 'See this week\'s rankings' : 'Ver los rankings de la semana'}</a></p></article>`;
    escribe(alt[l], pagina({ ruta: alt[l], titulo: `${titulo} | ${en ? 'Fantasy Experts' : SITIO}`, desc, ruteo: '#/precision', cuerpo, lang: l, alt, ld: { '@context': 'https://schema.org', '@type': 'Dataset', name: titulo, description: desc, creator: { '@type': 'Organization', name: SITIO, url: RAIZ }, url: RAIZ + alt[l] } }));
  }
}
// Portada en inglés
escribe('en/', pagina({ ruta: 'en/', titulo: `Fantasy Experts: Fantasy Football Rankings ${temporada}, Projections & Start/Sit`, desc: 'Week-by-week fantasy football rankings, FX Model projections with accuracy measured every week, start/sit, waivers, injuries, trade analyzer and news. PPR, Half PPR and Standard.', ruteo: '#/', lang: 'en', alt: { es: '', en: 'en/' },
  cuerpo: `<h1>Fantasy Football Rankings ${temporada}, Projections and Start/Sit</h1><p>Fantasy Experts is the fantasy football platform with its own projections: the FX Model analyzes every NFL player's volume, efficiency, opponent and health, and we publish its accuracy every week.</p><ul>${rkPos.map(x => `<li><a href="${urlRF(x, 'en')}">Rankings: ${PN.en[x]}</a></li>`).join('')}<li><a href="en/precision/">Projection accuracy</a></li><li><a href="en/blog/">Blog</a></li></ul>` }));
// Portadas del blog
for (const l of ['es', 'en']) {
  const T = TB[l], ruta = l === 'en' ? 'en/blog/' : 'blog/';
  const cuerpo = `<h1>${T.titulo}</h1><p>${T.desc}</p>
<h2>${T.rk}</h2><ul>${rkPos.map(x => `<li><a href="${urlR(x, l)}">${l === 'en' ? `Week ${semana} ${POSL.en[x]} rankings` : `Ranking ${POSL.es[x]} semana ${semana}`}</a></li>`).join('')}</ul>
<ul>${blog.filter(a => a[l] && a[l].slug).slice(0, 80).map(a => `<li><a href="${urlB(a, l)}">${esc(a[l].titulo)}</a> · ${T.sem} ${esc(a.semana)}</li>`).join('')}</ul>`;
  escribe(ruta, pagina({ ruta, titulo: `${T.titulo} | ${SITIO}`, desc: T.desc, ruteo: '#/blog', cuerpo, lang: l, alt: { es: 'blog/', en: 'en/blog/' },
    ld: { '@context': 'https://schema.org', '@type': 'Blog', name: `${SITIO} · ${T.blog}`, url: RAIZ + ruta, inLanguage: l === 'en' ? 'en-US' : 'es-MX' } }));
}
// Blog y rankings que ya no existen: se borran sus páginas
for (const base of ['blog', 'en/blog']) if (fs.existsSync(base)) for (const d of fs.readdirSync(base)) { const r = base + '/' + d + '/'; if (fs.statSync(base + '/' + d).isDirectory() && !escritasB.has(r)) { fs.rmSync(base + '/' + d, { recursive: true, force: true }); cambios++; } }

// ---------- Sitemap y robots ----------
const urls = [['', 'hourly', '1.0', null, { es: '', en: 'en/' }], ['privacidad/', 'yearly', '0.2'], ['blog/', 'daily', '0.8', null, { es: 'blog/', en: 'en/blog/' }], ['en/blog/', 'daily', '0.8', null, { es: 'blog/', en: 'en/blog/' }],
  ...blog.filter(a => a.es && a.en && a.es.slug && a.en.slug).flatMap(a => { const alt = { es: urlB(a, 'es'), en: urlB(a, 'en') }; return [[alt.es, 'weekly', '0.9', (a.fecha || '').slice(0, 10), alt], [alt.en, 'weekly', '0.9', (a.fecha || '').slice(0, 10), alt]]; }),
  ...rkPos.flatMap(x => { const alt = { es: urlR(x, 'es'), en: urlR(x, 'en') }; return [[alt.es, 'daily', '0.9', null, alt], [alt.en, 'daily', '0.9', null, alt]]; }),
  ...archivo.filter(n => n && n.titulo && n.id).flatMap(n => { const f = (n.fecha || '').slice(0, 10); if (!(n.en && n.en.titulo && !n.exclusivo)) return [[urlN(n), 'weekly', '0.8', f]]; const alt = { es: urlN(n), en: urlNen(n) }; return [[alt.es, 'weekly', '0.8', f, alt], [alt.en, 'weekly', '0.8', f, alt]]; }),
  ['en/', 'hourly', '1.0', null, { es: '', en: 'en/' }], ...['', ...rkPos].flatMap(x => { const alt = { es: urlRF(x, 'es'), en: urlRF(x, 'en') }; return [[alt.es, 'daily', '0.95', null, alt], [alt.en, 'daily', '0.95', null, alt]]; }),
  ['precision/', 'weekly', '0.8', null, { es: 'precision/', en: 'en/precision/' }], ['en/precision/', 'weekly', '0.8', null, { es: 'precision/', en: 'en/precision/' }],
  ...jugadores.map(j => [urlJ(j), 'daily', '0.7']), ...Object.keys(EQUIPOS).map(t => [urlE(t), 'daily', '0.6'])];
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urls.filter(([u]) => !/^(en\/)?blog\/.+/.test(u) || escritasB.has(u)).map(([u, f, p, m, alt]) => `<url><loc>${RAIZ}${u}</loc>${alt ? Object.entries(alt).map(([l, x]) => `<xhtml:link rel="alternate" hreflang="${l}" href="${RAIZ}${x}"/>`).join('') : ''}${m ? `<lastmod>${m}</lastmod>` : ''}<changefreq>${f}</changefreq><priority>${p}</priority></url>`).join('\n')}\n</urlset>\n`;
const robots = `User-agent: *\nAllow: /\nDisallow: /apps-script/\nSitemap: ${RAIZ}sitemap.xml\n`;
for (const [f, c] of [['sitemap.xml', sitemap], ['robots.txt', robots]]) if (!fs.existsSync(f) || fs.readFileSync(f, 'utf8') !== c) { fs.writeFileSync(f, c); cambios++; }

console.log(`Páginas SEO: ${jugadores.length} jugadores, ${archivo.length} noticias, 32 equipos · ${cambios} archivos cambiaron · raíz ${RAIZ}`);

// FANTASY EXPERTOS · Newsletter semanal
// Arma el correo "El resumen FX" de la semana en curso (HTML listo para Gmail) en data/v2/newsletter.json.
// El envío lo hace el Apps Script de José desde su Workspace (apps-script/Code.gs → enviarNewsletter).
import fs from 'node:fs';

const leer = (f, d) => { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch { return d; } };
const dominio = fs.existsSync('CNAME') ? fs.readFileSync('CNAME', 'utf8').trim() : '';
const RAIZ = process.env.FX_RAIZ || (dominio ? `https://${dominio}/` : 'https://josecms11.github.io/fantasyexpertos/');
const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const slug = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 70);
const urlJ = j => `${RAIZ}jugador/${slug(j.n)}-${j.id}/`;
const urlN = n => `${RAIZ}noticia/${slug(n.titulo)}-${String(n.id).replace(/\D/g, '').slice(-8)}/`;
const n1 = v => v == null ? '–' : (Math.round(v * 10) / 10).toFixed(1);

const hoy = leer('data/v2/hoy.json', {}), cal = leer('data/v2/calendario.json', {}), archivo = leer('data/v2/archivo.json', []);
const P = leer('data/v2/jugadores.json', []).filter(j => j && j.n), J = Object.fromEntries(P.map(j => [j.id, j]));
const w = cal.semana || hoy.semana;
if (!w || !P.length) { console.log('Newsletter: sin datos todavía'); process.exit(0); }
const rival = t => { const r = cal.cal && cal.cal[t] && cal.cal[t][w]; return r ? `${r.home ? 'vs' : '@'} ${r.opp}` : null; };
const sano = j => !['Out', 'IR', 'PUP', 'Sus', 'NA', 'Doubtful'].includes(j.inj);
const juega = j => j.team !== 'FA' && sano(j) && rival(j.team);

// Contenido
const starts = [['QB', 3], ['RB', 3], ['WR', 3], ['TE', 2]].map(([pos, k]) => [pos, P.filter(j => j.pos === pos && juega(j) && j.proy).sort((a, b) => b.proy[0] - a.proy[0]).slice(0, k)]);
const waivers = (hoy.agregados || []).map(id => J[id]).filter(j => j && sano(j) && j.team !== 'FA').slice(0, 5);
const lesion = (hoy.lesionados || []).map(x => J[x.id] && { j: J[x.id], st: x.estatus }).filter(Boolean).slice(0, 6);
const notas = archivo.filter(n => !n.vencida && !n.exclusivo && n.titulo && Date.now() - Date.parse(n.fecha || 0) < 7 * 864e5).slice(0, 3);
const exclusiva = archivo.find(n => n.exclusivo && Date.now() - Date.parse(n.fecha || 0) < 10 * 864e5);
const duelo = hoy.duelo && hoy.duelo.veredicto ? hoy.duelo : null;

// Estilos en línea (Gmail no lee hojas de estilo)
const C = { bg: '#09100C', card: '#0F1813', line: '#1E2D24', text: '#EEF3EF', soft: '#BCCBC1', mute: '#829689', acc: '#5BC489', bad: '#F2786A', gold: '#FFD45C' };
const fuente = "font-family:'Barlow','Helvetica Neue',Arial,sans-serif";
const h2 = t => `<tr><td style="padding:26px 24px 8px;${fuente};font-size:20px;font-weight:800;letter-spacing:.04em;color:${C.acc}">${t}</td></tr>`;
const fila = (izq, der, url) => `<tr><td style="padding:9px 24px;border-top:1px solid ${C.line}"><a href="${url}" style="text-decoration:none;color:${C.text};${fuente};font-size:16px;font-weight:600">${izq}</a><span style="float:right;${fuente};font-size:15px;color:${C.soft}">${der}</span></td></tr>`;
const boton = (t, url) => `<a href="${url}" style="display:inline-block;padding:12px 22px;border-radius:999px;background:${C.acc};color:#06140C;text-decoration:none;${fuente};font-weight:800;font-size:15px;letter-spacing:.04em">${t}</a>`;

const cuerpo = `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>El resumen FX · Semana ${w}</title></head>
<body style="margin:0;padding:0;background:${C.bg}">
<div style="display:none;max-height:0;overflow:hidden">Start/Sit, waivers y lesionados para la semana ${w}.</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.bg}"><tr><td align="center" style="padding:20px 10px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:${C.card};border-radius:18px;border:1px solid ${C.line}">
<tr><td style="padding:24px 24px 6px"><a href="${RAIZ}" style="text-decoration:none"><img src="${RAIZ}assets/icons/icon-192.png" width="44" height="44" alt="Fantasy Expertos" style="vertical-align:middle;border-radius:10px;border:0"><span style="vertical-align:middle;margin-left:10px;${fuente};font-size:20px;font-weight:800;color:${C.text};letter-spacing:.04em">FANTASY <span style="color:${C.acc}">EXPERTOS</span></span></a></td></tr>
<tr><td style="padding:14px 24px 0;${fuente};font-size:30px;line-height:1.15;font-weight:800;color:${C.text}">El resumen FX · Semana ${w}</td></tr>
<tr><td style="padding:8px 24px 0;${fuente};font-size:16px;line-height:1.5;color:${C.soft}">Hola {{NOMBRE}}, esto es lo que necesitas para armar tu alineación de la semana ${w}.</td></tr>
${h2('★ A QUIÉN ARRANCAR')}
${starts.map(([pos, L]) => L.map((j, i) => fila(`<span style="color:${C.acc}">${pos}${i + 1}</span> &nbsp;${esc(j.n)}`, `${esc(j.team)} ${esc(rival(j.team))} · ${n1(j.proy[0])} pts`, urlJ(j))).join('')).join('')}
${duelo ? `<tr><td style="padding:14px 24px 0"><div style="padding:14px 16px;border-radius:12px;border:1px solid #2E6B47;background:#11231A;${fuente};font-size:15px;line-height:1.5;color:${C.soft}"><b style="color:${C.acc}">DUELO DE LA SEMANA · ${esc(duelo.a)} vs ${esc(duelo.b)}</b><br>${esc(duelo.veredicto)}</div></td></tr>` : ''}
${waivers.length ? h2('▲ LOS MÁS AGREGADOS EN LIGAS') + waivers.map(j => fila(esc(j.n), `${esc(j.pos)} · ${esc(j.team)}`, urlJ(j))).join('') : ''}
${lesion.length ? h2('✚ REPORTE MÉDICO') + lesion.map(x => fila(esc(x.j.n), `<span style="color:${x.st === 'Fuera' ? C.bad : C.gold}">${esc(String(x.st || '').toUpperCase())}</span> · ${esc(x.j.pos)} ${esc(x.j.team)}`, urlJ(x.j))).join('') : ''}
${notas.length ? h2('▣ LO QUE TIENES QUE SABER') + notas.map(n => `<tr><td style="padding:10px 24px;border-top:1px solid ${C.line}"><a href="${urlN(n)}" style="text-decoration:none;${fuente};font-size:17px;font-weight:700;color:${C.text}">${esc(n.titulo)}</a>${n.accion ? `<div style="${fuente};font-size:14px;color:${C.soft};margin-top:4px">${esc(n.accion)}</div>` : ''}</td></tr>`).join('') : ''}
${exclusiva ? `<tr><td style="padding:22px 24px 0"><div style="padding:16px;border-radius:12px;border:1px solid #6B5A1E;background:#1E1A0C"><div style="${fuente};font-size:13px;font-weight:800;letter-spacing:.08em;color:${C.gold}">★ EXCLUSIVO FX</div><a href="${urlN(exclusiva)}" style="display:block;margin-top:6px;text-decoration:none;${fuente};font-size:18px;font-weight:700;color:${C.text}">${esc(exclusiva.titulo)}</a></div></td></tr>` : ''}
<tr><td align="center" style="padding:28px 24px">${boton('VER RANKINGS COMPLETOS', RAIZ + '#/posicion/RB')}</td></tr>
<tr><td style="padding:18px 24px 24px;border-top:1px solid ${C.line};${fuente};font-size:12px;line-height:1.6;color:${C.mute}">Recibes este correo porque tienes cuenta en Fantasy Expertos con el resumen semanal activado.<br><a href="{{BAJA}}" style="color:${C.soft}">Darme de baja</a> · <a href="${RAIZ}#/cuenta" style="color:${C.soft}">Mi cuenta</a> · <a href="${RAIZ}#/privacidad" style="color:${C.soft}">Aviso de privacidad</a><br>Sitio independiente. No afiliado a ninguna liga ni equipo profesional.</td></tr>
</table></td></tr></table></body></html>`;

const asunto = `El resumen FX · Semana ${w}: a quién arrancar, waivers y lesionados`;
const salida = { semana: w, temporada: hoy.temporada, asunto, html: cuerpo, baja: RAIZ + '#/baja?t=' };
const f = 'data/v2/newsletter.json', prev = leer(f, null);
if (!prev || prev.html !== cuerpo || prev.asunto !== asunto) { fs.writeFileSync(f, JSON.stringify(salida)); console.log('Newsletter: semana', w, 'actualizada'); }
else console.log('Newsletter: sin cambios');
if (process.env.FX_PREVIEW) fs.writeFileSync(process.env.FX_PREVIEW, cuerpo);

# Fantasy Expertos

Plataforma de fantasy football (español e inglés) que se actualiza sola. Sitio estático en GitHub Pages (`fantasyexpertos.app`), datos generados por un motor en GitHub Actions, cuentas y Premium en Supabase, pagos con Stripe.

## Cómo fluye el dato

1. **Motor** (`scripts/motor.mjs`, cron en `.github/workflows/motor.yml`): descarga estadísticas, calendario, lesiones y noticias; calcula el **Modelo FX** (proyecciones propias); escribe notas y artículos del blog con IA; guarda todo en `data/v2/*.json`.
2. **Páginas para Google** (`scripts/paginas.mjs`): genera HTML estático por jugador, noticia, equipo, artículo del blog (ES y EN, con `hreflang`) y rankings semanales; `sitemap.xml` y `robots.txt`.
3. **Newsletter** (`scripts/newsletter.mjs` → `data/v2/newsletter.json`; lo envía `apps-script/Code.gs` desde Workspace).
4. **App** (`index.html`, `assets/app.js`, `assets/app.css`): SPA que lee `data/v2/*.json`; marcadores en vivo directo desde el navegador.

## Modelo FX (proyecciones propias)

`proyFX()` en `scripts/motor.mjs`: volumen esperado (targets, acarreos, yardas de pase, ponderado por recencia) × eficiencia del jugador regresada a la media de su posición (TD con regresión fuerte). K y DEF: promedio ponderado con regresión. Cada semana terminada se mide su error contra el resultado real en `data/v2/modelo.json`.

## Correr a mano

```
GEMINI_API_KEY=... SUPABASE_SECRET=... node scripts/motor.mjs   # datos, modelo, notas, blog
node scripts/paginas.mjs                                        # páginas SEO
node scripts/newsletter.mjs                                     # newsletter
```
Node 20, sin dependencias externas. `FX_BLOG=1` fuerza artículos de blog en esa corrida.

## Base de datos (Supabase)

SQL en `supabase/` en orden: `esquema.sql`, `paso2.sql` … `paso5.sql` (se corren en el SQL Editor). Edge Function de pagos: `supabase/functions/stripe-webhook/`.

## Secretos (nunca en el repo)

GitHub → Secrets: `GEMINI_API_KEY`, `SUPABASE_SECRET`. Apps Script → Propiedades: `SUPABASE_SECRET`, `NEWSLETTER_DE`, `REPORTERO_DE`. Supabase → Edge Functions → Secrets: `STRIPE_WEBHOOK_SECRET`.

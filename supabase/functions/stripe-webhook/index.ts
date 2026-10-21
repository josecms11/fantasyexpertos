// FANTASY EXPERTOS · stripe-webhook (Supabase Edge Function)
// Stripe avisa aquí cada pago; esta función activa o quita el Premium en el perfil del usuario.
// Secretos necesarios (Edge Functions → Secrets): STRIPE_WEBHOOK_SECRET
// SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY ya vienen incluidos en Supabase.
// Importante: en la configuración de la función, "Verify JWT" debe estar APAGADO (Stripe no manda sesión).

const FIN_TEMPORADA = '2027-02-28T23:59:59Z'; // el pase de temporada dura hasta después del Super Bowl
const SB = Deno.env.get('SUPABASE_URL')!;
// Llave de servidor: primero las llaves nuevas (sb_secret_…); si no existen, la llave clásica service_role.
const KEY = (() => { try { const k = Object.values(JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS') || '{}'))[0]; if (k) return String(k); } catch (_) { /* sigue */ } return Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''; })();
const SECRETO = (Deno.env.get('STRIPE_WEBHOOK_SECRET') || '').trim();

const hex = (b: ArrayBuffer) => [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join('');
async function firmaValida(cuerpo: string, cabecera: string | null) {
  if (!cabecera || !SECRETO) return false;
  const partes = Object.fromEntries(cabecera.split(',').map(p => p.split('=') as [string, string]).filter(p => p.length === 2));
  const firmas = cabecera.split(',').filter(p => p.startsWith('v1=')).map(p => p.slice(3));
  const t = partes['t']; if (!t || !firmas.length) return false;
  if (Math.abs(Date.now() / 1000 - Number(t)) > 600) return false; // máximo 10 min de diferencia
  const llave = await crypto.subtle.importKey('raw', new TextEncoder().encode(SECRETO), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const calc = hex(await crypto.subtle.sign('HMAC', llave, new TextEncoder().encode(`${t}.${cuerpo}`)));
  return firmas.some(f => f.length === calc.length && [...f].every((c, i) => c === calc[i]));
}
const h: Record<string, string> = { apikey: KEY, 'Content-Type': 'application/json', Prefer: 'return=minimal' };
if (KEY.startsWith('eyJ')) h.Authorization = `Bearer ${KEY}`;
const actualiza = async (filtro: string, datos: Record<string, unknown>) => {
  const r = await fetch(`${SB}/rest/v1/perfiles?${filtro}`, { method: 'PATCH', headers: h, body: JSON.stringify(datos) });
  if (!r.ok) throw new Error(`Supabase ${r.status}: ${(await r.text()).slice(0, 200)}`);
};
const iso = (s?: number) => s ? new Date(s * 1000).toISOString() : null;
const masDias = (d: number) => new Date(Date.now() + d * 864e5).toISOString();

Deno.serve(async req => {
  if (req.method !== 'POST') return new Response('ok');
  const cuerpo = await req.text();
  if (!(await firmaValida(cuerpo, req.headers.get('stripe-signature')))) return new Response('firma inválida', { status: 400 });
  const ev = JSON.parse(cuerpo), o = ev.data?.object || {};
  try {
    if (ev.type === 'checkout.session.completed') {
      const uid = o.client_reference_id;
      if (!uid || !/^[0-9a-f-]{36}$/i.test(uid)) return new Response('sin usuario', { status: 200 });
      const mensual = o.mode === 'subscription';
      await actualiza(`id=eq.${uid}`, { premium: true, premium_tipo: mensual ? 'mensual' : 'temporada', stripe_customer: o.customer || null,
        premium_hasta: mensual ? masDias(33) : FIN_TEMPORADA });
    } else if (ev.type === 'invoice.paid' && o.customer && (o.subscription || o.parent?.subscription_details?.subscription)) {
      const fin = o.lines?.data?.[0]?.period?.end;
      await actualiza(`stripe_customer=eq.${encodeURIComponent(o.customer)}`, { premium: true, premium_tipo: 'mensual', premium_hasta: fin ? new Date((fin + 2 * 86400) * 1000).toISOString() : masDias(33) });
    } else if (ev.type === 'customer.subscription.deleted' && o.customer) {
      const fin = o.items?.data?.[0]?.current_period_end ?? o.current_period_end ?? o.ended_at;
      await actualiza(`stripe_customer=eq.${encodeURIComponent(o.customer)}&premium_tipo=eq.mensual`, { premium_hasta: iso(fin) || new Date().toISOString() });
    }
  } catch (e) { console.error(e); return new Response('error', { status: 500 }); }
  return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json' } });
});

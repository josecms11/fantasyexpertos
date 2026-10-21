-- FANTASY EXPERTOS · Parte 4: Premium FX (bóveda de exclusivas + estado de pago)
-- Pegar completo en Supabase → SQL Editor → New query → Run. Se puede correr más de una vez.

-- Datos de pago en el perfil (solo los cambia el sistema de pagos, nunca el usuario)
alter table public.perfiles add column if not exists premium_tipo text;          -- 'mensual' | 'temporada'
alter table public.perfiles add column if not exists stripe_customer text;
create index if not exists perfiles_stripe_customer on public.perfiles (stripe_customer);

-- ¿El usuario que pregunta es Premium hoy?
create or replace function public.es_premium() returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce((select p.premium and (p.premium_hasta is null or p.premium_hasta > now())
                   from public.perfiles p where p.id = auth.uid()), false);
$$;
revoke all on function public.es_premium() from public, anon;
grant execute on function public.es_premium() to authenticated;

-- Bóveda: la nota exclusiva completa (el sitio público solo tiene titular y avance)
create table if not exists public.exclusivos (
  id text primary key,
  fecha timestamptz not null default now(),
  semana int,
  titulo text,
  nota jsonb not null
);
alter table public.exclusivos enable row level security;
grant select on public.exclusivos to authenticated;
drop policy if exists "exclusivos: solo premium" on public.exclusivos;
create policy "exclusivos: solo premium" on public.exclusivos for select to authenticated using ((select public.es_premium()));

-- Permisos para el sistema (motor de GitHub y pagos de Stripe usan la llave secreta)
grant select, insert, update on public.exclusivos to service_role;
grant select, update on public.perfiles to service_role;

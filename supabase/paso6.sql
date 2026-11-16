-- FANTASY EXPERTOS · Parte 6: códigos de PRO gratis (creadores, socios, regalos)
-- Pegar completo en Supabase → SQL Editor → New query → Run. Se puede correr más de una vez.
create table if not exists public.codigos_pro (
  codigo text primary key,
  nota text,                                   -- para quién es (ej. 'Estadio Fantasy')
  hasta timestamptz not null default '2027-02-28T23:59:59Z',
  usos_max int not null default 1,
  usos int not null default 0,
  usado_por uuid[] not null default '{}',
  creado timestamptz not null default now()
);
alter table public.codigos_pro enable row level security;
revoke all on public.codigos_pro from anon, authenticated;

-- El usuario con sesión canjea un código: si es válido, su cuenta queda PRO hasta la fecha del código
create or replace function public.canjear_codigo(c text) returns text
language plpgsql security definer set search_path = public as $$
declare k public.codigos_pro; yo uuid := auth.uid();
begin
  if yo is null then return 'sin_sesion'; end if;
  select * into k from public.codigos_pro where codigo = upper(trim(c)) for update;
  if not found then return 'no_existe'; end if;
  if yo = any(k.usado_por) then return 'ya_usado'; end if;
  if k.usos >= k.usos_max or k.hasta < now() then return 'agotado'; end if;
  update public.codigos_pro set usos = usos + 1, usado_por = array_append(usado_por, yo) where codigo = k.codigo;
  update public.perfiles set premium = true, premium_tipo = 'creador',
    premium_hasta = greatest(coalesce(premium_hasta, now()), k.hasta) where id = yo;
  return 'ok';
end $$;
revoke all on function public.canjear_codigo(text) from public, anon;
grant execute on function public.canjear_codigo(text) to authenticated;

-- 20 códigos listos para repartir (uno por creador, un solo uso, PRO hasta el fin de la temporada)
insert into public.codigos_pro (codigo, nota)
select 'FX-' || upper(substr(md5(random()::text || g::text), 1, 6)), 'creador'
from generate_series(1, 20) g
where (select count(*) from public.codigos_pro) = 0;

-- Para verlos: select codigo, nota, usos from public.codigos_pro order by creado;

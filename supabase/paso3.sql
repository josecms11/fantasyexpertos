-- FANTASY EXPERTOS · Parte 3: envío de la newsletter y baja con un clic
-- Pegar completo en Supabase → SQL Editor → New query → Run. Se puede correr más de una vez.

-- Cada perfil tiene un código secreto para darse de baja desde el correo sin entrar a su cuenta
alter table public.perfiles add column if not exists baja_token uuid not null default gen_random_uuid();

-- Darse de baja con el código del correo (funciona sin iniciar sesión, solo con el código correcto)
create or replace function public.darse_de_baja(token uuid) returns boolean
language plpgsql security definer set search_path = '' as $$
declare n int;
begin
  update public.perfiles set newsletter = false where baja_token = token;
  get diagnostics n = row_count;
  return n > 0;
end; $$;
revoke all on function public.darse_de_baja(uuid) from public;
grant execute on function public.darse_de_baja(uuid) to anon, authenticated;

-- Lista de envío para el Apps Script (solo se puede leer con la llave secreta, nunca desde el sitio)
create or replace function public.lista_envio() returns table (email text, nombre text, baja_token uuid)
language sql security definer set search_path = '' as $$
  select p.email, p.nombre, p.baja_token from public.perfiles p where p.newsletter and p.email is not null;
$$;
revoke all on function public.lista_envio() from public, anon, authenticated;
grant execute on function public.lista_envio() to service_role;

-- FANTASY EXPERTOS · Parte 2: una sola cuenta = usuario + newsletter
-- Pegar completo en Supabase → SQL Editor → New query → Run. Se puede correr más de una vez.

-- El perfil guarda el correo, si quiere el resumen semanal y cuándo aceptó el aviso de privacidad
alter table public.perfiles add column if not exists email text;
alter table public.perfiles add column if not exists newsletter boolean not null default true;
alter table public.perfiles add column if not exists acepto_aviso timestamptz;

-- El usuario puede cambiar su nombre y darse de baja de la newsletter (nada más)
revoke update on public.perfiles from authenticated;
grant update (nombre, newsletter) on public.perfiles to authenticated;

-- Al registrarse (correo o Google) se crea su perfil con su consentimiento
create or replace function public.nuevo_perfil() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.perfiles (id, nombre, email, newsletter, acepto_aviso)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)),
    new.email,
    coalesce((new.raw_user_meta_data ->> 'newsletter')::boolean, true),
    now()
  )
  on conflict (id) do nothing;
  return new;
end; $$;

-- Perfiles que ya existían: completar su correo
update public.perfiles p set email = u.email from auth.users u where u.id = p.id and p.email is null;

-- Borrar mi cuenta (derecho de cancelación): cada usuario solo puede borrar la suya
create or replace function public.eliminar_mi_cuenta() returns void
language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'sin sesión'; end if;
  delete from auth.users where id = auth.uid();
end; $$;
revoke all on function public.eliminar_mi_cuenta() from public, anon;
grant execute on function public.eliminar_mi_cuenta() to authenticated;

-- Lista de la newsletter para ti (se consulta desde el panel de Supabase, nunca desde el sitio)
create or replace view public.lista_newsletter with (security_invoker = true) as
  select email, nombre, creado from public.perfiles where newsletter and email is not null
  union
  select email, null, creado from public.suscriptores;
revoke all on public.lista_newsletter from anon, authenticated;

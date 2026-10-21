-- FANTASY EXPERTOS · Base de datos (Supabase)
-- Pegar completo en Supabase → SQL Editor → New query → Run. Se puede correr más de una vez sin problema.

-- 1) Perfil de cada usuario (se crea solo al registrarse)
create table if not exists public.perfiles (
  id uuid primary key references auth.users (id) on delete cascade,
  nombre text,
  sleeper text,                       -- usuario de Sleeper para "Mi liga"
  premium boolean not null default false,
  premium_hasta timestamptz,
  creado timestamptz not null default now()
);

-- 2) Mis jugadores (favoritos)
create table if not exists public.favoritos (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  jugador text not null,
  creado timestamptz not null default now(),
  primary key (user_id, jugador)
);

-- 3) Correos para la newsletter (nadie desde el sitio puede leerlos, solo agregarlos)
create table if not exists public.suscriptores (
  email text primary key check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' and length(email) < 200),
  fuente text,
  creado timestamptz not null default now()
);

-- 4) Reportes de error en notas
create table if not exists public.reportes (
  id uuid primary key default gen_random_uuid(),
  nota text,
  jugador text,
  mensaje text check (length(mensaje) < 1000),
  user_id uuid default auth.uid(),
  creado timestamptz not null default now()
);

-- Seguridad: cada tabla cerrada por defecto
alter table public.perfiles enable row level security;
alter table public.favoritos enable row level security;
alter table public.suscriptores enable row level security;
alter table public.reportes enable row level security;

-- Permisos mínimos para el sitio (el usuario nunca puede darse premium a sí mismo)
grant usage on schema public to anon, authenticated;
grant select on public.perfiles to authenticated;
grant update (nombre, sleeper) on public.perfiles to authenticated;
grant select, insert, delete on public.favoritos to authenticated;
grant insert on public.suscriptores to anon, authenticated;
grant insert on public.reportes to anon, authenticated;

-- Reglas: cada quien solo ve y cambia lo suyo
drop policy if exists "perfil propio: ver" on public.perfiles;
create policy "perfil propio: ver" on public.perfiles for select to authenticated using (id = (select auth.uid()));
drop policy if exists "perfil propio: editar" on public.perfiles;
create policy "perfil propio: editar" on public.perfiles for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));

drop policy if exists "favoritos propios: ver" on public.favoritos;
create policy "favoritos propios: ver" on public.favoritos for select to authenticated using (user_id = (select auth.uid()));
drop policy if exists "favoritos propios: agregar" on public.favoritos;
create policy "favoritos propios: agregar" on public.favoritos for insert to authenticated with check (user_id = (select auth.uid()));
drop policy if exists "favoritos propios: quitar" on public.favoritos;
create policy "favoritos propios: quitar" on public.favoritos for delete to authenticated using (user_id = (select auth.uid()));

drop policy if exists "newsletter: suscribirse" on public.suscriptores;
create policy "newsletter: suscribirse" on public.suscriptores for insert to anon, authenticated with check (true);

drop policy if exists "reportes: enviar" on public.reportes;
create policy "reportes: enviar" on public.reportes for insert to anon, authenticated with check (user_id is null or user_id = (select auth.uid()));

-- Al registrarse alguien, se le crea su perfil
create or replace function public.nuevo_perfil() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.perfiles (id, nombre)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end; $$;
drop trigger if exists al_registrarse on auth.users;
create trigger al_registrarse after insert on auth.users for each row execute function public.nuevo_perfil();

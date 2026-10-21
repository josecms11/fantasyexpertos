-- FANTASY EXPERTOS · Parte 5: los correos del reportero se guardan en privado (nunca en el sitio público)
-- Pegar completo en Supabase → SQL Editor → New query → Run. Se puede correr más de una vez.
create table if not exists public.reportero (
  id uuid primary key default gen_random_uuid(),
  fecha timestamptz not null default now(),
  asunto text,
  texto text,
  procesada boolean not null default false,
  notas int,
  creado timestamptz not null default now()
);
alter table public.reportero enable row level security;
revoke all on public.reportero from anon, authenticated;
grant select, insert, update on public.reportero to service_role;

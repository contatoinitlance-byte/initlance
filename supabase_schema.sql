-- Initlance Supabase clean reset schema
-- Rode em um projeto Supabase novo/zerado.
-- ATENCAO: este script apaga as tabelas publicas da aplicacao e recria tudo.
-- Nao apaga auth.users nem storage.objects.

create extension if not exists pgcrypto;

drop table if exists public.messages cascade;
drop table if exists public.notifications cascade;
drop table if exists public.transactions cascade;
drop table if exists public.reviews cascade;
drop table if exists public.proposals cascade;
drop table if exists public.jobs cascade;
drop table if exists public.portfolios cascade;
drop table if exists public.freelancer_stats cascade;
drop table if exists public.challenges cascade;
drop table if exists public.profiles cascade;

create schema if not exists private;
grant usage on schema public to anon, authenticated;
grant usage on schema private to anon, authenticated;

create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false)
$$;

grant usage on schema private to anon, authenticated;
grant execute on function private.is_admin() to anon, authenticated;

create table public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  avatar_url text,
  foto_perfil text,
  bio text,
  role text not null default 'freelancer' check (role in ('freelancer', 'client', 'admin')),
  cidade text,
  pais text,
  telefone text,
  nome_empresa text,
  site_empresa text,
  ban_status text not null default 'active' check (ban_status in ('active', 'temporary', 'permanent')),
  banned_until timestamptz,
  ban_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index profiles_email_unique_idx on public.profiles (lower(email)) where email is not null;
create index profiles_role_idx on public.profiles (role);
create index profiles_ban_status_idx on public.profiles (ban_status);

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  metadata_role text;
begin
  metadata_role := new.raw_user_meta_data ->> 'role';

  insert into public.profiles (
    user_id,
    email,
    full_name,
    avatar_url,
    foto_perfil,
    role
  )
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    coalesce(new.raw_user_meta_data ->> 'avatar_url', new.raw_user_meta_data ->> 'picture'),
    coalesce(new.raw_user_meta_data ->> 'foto_perfil', new.raw_user_meta_data ->> 'avatar_url', new.raw_user_meta_data ->> 'picture'),
    case
      when metadata_role in ('freelancer', 'client', 'admin') then metadata_role
      else 'freelancer'
    end
  )
  on conflict (user_id) do update
  set
    email = coalesce(excluded.email, public.profiles.email),
    full_name = coalesce(public.profiles.full_name, excluded.full_name),
    avatar_url = coalesce(public.profiles.avatar_url, excluded.avatar_url),
    foto_perfil = coalesce(public.profiles.foto_perfil, excluded.foto_perfil),
    updated_at = now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_auth_user();

insert into public.profiles (
  user_id,
  email,
  full_name,
  avatar_url,
  foto_perfil,
  role
)
select
  users.id,
  users.email,
  coalesce(users.raw_user_meta_data ->> 'full_name', users.raw_user_meta_data ->> 'name'),
  coalesce(users.raw_user_meta_data ->> 'avatar_url', users.raw_user_meta_data ->> 'picture'),
  coalesce(users.raw_user_meta_data ->> 'foto_perfil', users.raw_user_meta_data ->> 'avatar_url', users.raw_user_meta_data ->> 'picture'),
  case
    when users.raw_user_meta_data ->> 'role' in ('freelancer', 'client', 'admin') then users.raw_user_meta_data ->> 'role'
    else 'freelancer'
  end
from auth.users
on conflict (user_id) do nothing;

create table public.freelancer_stats (
  user_id uuid primary key references auth.users(id) on delete cascade,
  user_email text,
  profissao text,
  habilidades text[] not null default '{}',
  valor_hora numeric(12, 2) not null default 0 check (valor_hora >= 0),
  valor_a_combinar boolean not null default false,
  rank text not null default 'Rookie',
  proof_score numeric(6, 2) not null default 0 check (proof_score >= 0),
  portfolio_views numeric not null default 0 check (portfolio_views >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.jobs (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references auth.users(id) on delete cascade,
  freelancer_id uuid references auth.users(id) on delete set null,
  cliente_email text,
  freelancer_email text,
  titulo text not null,
  descricao text not null,
  categoria text,
  habilidades text[] not null default '{}',
  valor numeric(12, 2) not null default 0 check (valor >= 0),
  prazo text,
  status text not null default 'aberto' check (status in ('aberto', 'em_andamento', 'concluido', 'cancelado')),
  prioridade text not null default 'media' check (prioridade in ('baixa', 'media', 'alta', 'urgente')),
  propostas_count numeric not null default 0 check (propostas_count >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index jobs_client_id_idx on public.jobs (client_id);
create index jobs_freelancer_id_idx on public.jobs (freelancer_id);
create index jobs_status_idx on public.jobs (status);
create index jobs_created_at_idx on public.jobs (created_at desc);

create table public.proposals (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  freelancer_id uuid not null references auth.users(id) on delete cascade,
  client_id uuid not null references auth.users(id) on delete cascade,
  freelancer_email text,
  cliente_email text,
  mensagem text,
  valor_proposto numeric(12, 2) not null default 0 check (valor_proposto >= 0),
  prazo_proposto text,
  status text not null default 'pendente' check (status in ('pendente', 'aceita', 'recusada', 'cancelada')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (job_id, freelancer_id)
);

create index proposals_job_id_idx on public.proposals (job_id);
create index proposals_freelancer_id_idx on public.proposals (freelancer_id);
create index proposals_client_id_idx on public.proposals (client_id);
create index proposals_status_idx on public.proposals (status);

create table public.portfolios (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  user_email text,
  titulo text not null,
  descricao text,
  categoria text,
  tecnologias text[] not null default '{}',
  imagens text[] not null default '{}',
  link_projeto text,
  link_repositorio text,
  resultado text,
  status text not null default 'publicado' check (status in ('publicado', 'rascunho')),
  views numeric not null default 0 check (views >= 0),
  saves numeric not null default 0 check (saves >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index portfolios_user_id_idx on public.portfolios (user_id);
create index portfolios_status_idx on public.portfolios (status);
create index portfolios_created_at_idx on public.portfolios (created_at desc);

create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  usuario_email text,
  tipo text check (tipo in ('pagamento', 'recebimento', 'saque', 'taxa', 'reembolso', 'hotmart')),
  valor numeric(12, 2) not null default 0,
  descricao text,
  status text not null default 'pendente' check (status in ('pendente', 'concluido', 'cancelado', 'falhou')),
  metodo_pagamento text,
  job_id uuid references public.jobs(id) on delete set null,
  external_provider text,
  external_event_id text,
  external_transaction_id text,
  payload jsonb,
  created_at timestamptz not null default now()
);

create unique index transactions_provider_event_unique_idx
on public.transactions (external_provider, external_event_id)
where external_provider is not null and external_event_id is not null;
create index transactions_user_id_idx on public.transactions (user_id);
create index transactions_job_id_idx on public.transactions (job_id);
create index transactions_created_at_idx on public.transactions (created_at desc);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references auth.users(id) on delete cascade,
  receiver_id uuid not null references auth.users(id) on delete cascade,
  sender_email text,
  receiver_email text,
  conversation_id text not null,
  content text not null,
  lida boolean not null default false,
  job_id uuid references public.jobs(id) on delete set null,
  created_at timestamptz not null default now()
);

create index messages_sender_id_idx on public.messages (sender_id);
create index messages_receiver_id_idx on public.messages (receiver_id);
create index messages_conversation_id_idx on public.messages (conversation_id);
create index messages_created_at_idx on public.messages (created_at desc);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  usuario_email text,
  tipo text,
  titulo text not null,
  mensagem text not null,
  lida boolean not null default false,
  link text,
  referencia_id text,
  created_at timestamptz not null default now()
);

create index notifications_user_id_idx on public.notifications (user_id);
create index notifications_lida_idx on public.notifications (lida);
create index notifications_created_at_idx on public.notifications (created_at desc);

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  remetente_id uuid not null references auth.users(id) on delete cascade,
  destinatario_id uuid not null references auth.users(id) on delete cascade,
  remetente_email text,
  destinatario_email text,
  job_id uuid references public.jobs(id) on delete set null,
  nota numeric not null check (nota >= 1 and nota <= 5),
  comentario text,
  tipo text check (tipo in ('cliente_para_freelancer', 'freelancer_para_cliente')),
  created_at timestamptz not null default now()
);

create index reviews_remetente_id_idx on public.reviews (remetente_id);
create index reviews_destinatario_id_idx on public.reviews (destinatario_id);
create index reviews_job_id_idx on public.reviews (job_id);

create table public.challenges (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  descricao text,
  categoria text,
  dificuldade text not null default 'Iniciante',
  recompensa text,
  prazo text,
  regras text,
  status text not null default 'ativo' check (status in ('ativo', 'rascunho', 'encerrado')),
  participantes_count numeric not null default 0 check (participantes_count >= 0),
  created_by_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index challenges_status_idx on public.challenges (status);
create index challenges_created_by_id_idx on public.challenges (created_by_id);

grant select on public.profiles to anon, authenticated;
grant insert, update, delete on public.profiles to authenticated;

grant select on public.freelancer_stats to anon, authenticated;
grant insert, update, delete on public.freelancer_stats to authenticated;

grant select on public.jobs to authenticated;
grant insert, update, delete on public.jobs to authenticated;

grant select on public.proposals to authenticated;
grant insert, update, delete on public.proposals to authenticated;

grant select on public.portfolios to anon, authenticated;
grant insert, update, delete on public.portfolios to authenticated;

grant select on public.transactions to authenticated;
grant insert, update, delete on public.transactions to authenticated;

grant select on public.messages to authenticated;
grant insert, update, delete on public.messages to authenticated;

grant select on public.notifications to authenticated;
grant insert, update, delete on public.notifications to authenticated;

grant select on public.reviews to anon, authenticated;
grant insert, update, delete on public.reviews to authenticated;

grant select, insert, update, delete on public.challenges to anon, authenticated;

grant usage, select on all sequences in schema public to authenticated;

insert into storage.buckets (id, name, public)
values ('profile-images', 'profile-images', true)
on conflict (id) do update set public = excluded.public;

do $$
declare
  policy_record record;
begin
  for policy_record in
    select policyname
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname like 'profile images%'
  loop
    execute format('drop policy if exists %I on storage.objects', policy_record.policyname);
  end loop;
end $$;

create policy "profile images public read"
on storage.objects for select
to anon, authenticated
using (bucket_id = 'profile-images');

create policy "profile images owner insert"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'profile-images'
  and owner = (select auth.uid())
);

create policy "profile images owner update"
on storage.objects for update
to authenticated
using (
  bucket_id = 'profile-images'
  and owner = (select auth.uid())
)
with check (
  bucket_id = 'profile-images'
  and owner = (select auth.uid())
);

create policy "profile images owner delete"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'profile-images'
  and owner = (select auth.uid())
);

alter table public.profiles enable row level security;
alter table public.freelancer_stats enable row level security;
alter table public.jobs enable row level security;
alter table public.proposals enable row level security;
alter table public.portfolios enable row level security;
alter table public.transactions enable row level security;
alter table public.messages enable row level security;
alter table public.notifications enable row level security;
alter table public.reviews enable row level security;
alter table public.challenges enable row level security;

create policy "profiles public select"
on public.profiles for select
to anon, authenticated
using (ban_status = 'active' or (select auth.uid()) = user_id or private.is_admin());

create policy "profiles owner insert"
on public.profiles for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "profiles owner update"
on public.profiles for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "profiles admin all"
on public.profiles for all
to authenticated
using (private.is_admin())
with check (private.is_admin());

create policy "freelancer_stats public select"
on public.freelancer_stats for select
to anon, authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.user_id = freelancer_stats.user_id
      and p.ban_status = 'active'
  )
  or (select auth.uid()) = user_id
  or private.is_admin()
);

create policy "freelancer_stats owner insert"
on public.freelancer_stats for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "freelancer_stats owner update"
on public.freelancer_stats for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "freelancer_stats admin all"
on public.freelancer_stats for all
to authenticated
using (private.is_admin())
with check (private.is_admin());

create policy "jobs authenticated select"
on public.jobs for select
to authenticated
using (
  status = 'aberto'
  or (select auth.uid()) = client_id
  or (select auth.uid()) = freelancer_id
  or private.is_admin()
);

create policy "jobs client insert"
on public.jobs for insert
to authenticated
with check ((select auth.uid()) = client_id);

create policy "jobs client update"
on public.jobs for update
to authenticated
using ((select auth.uid()) = client_id or private.is_admin())
with check ((select auth.uid()) = client_id or private.is_admin());

create policy "jobs client delete"
on public.jobs for delete
to authenticated
using ((select auth.uid()) = client_id or private.is_admin());

create policy "jobs admin all"
on public.jobs for all
to authenticated
using (private.is_admin())
with check (private.is_admin());

create policy "proposals participants select"
on public.proposals for select
to authenticated
using ((select auth.uid()) = freelancer_id or (select auth.uid()) = client_id or private.is_admin());

create policy "proposals freelancer insert"
on public.proposals for insert
to authenticated
with check (
  (select auth.uid()) = freelancer_id
  and exists (
    select 1 from public.jobs j
    where j.id = proposals.job_id
      and j.client_id = proposals.client_id
      and j.status = 'aberto'
  )
);

create policy "proposals participants update"
on public.proposals for update
to authenticated
using ((select auth.uid()) = freelancer_id or (select auth.uid()) = client_id or private.is_admin())
with check ((select auth.uid()) = freelancer_id or (select auth.uid()) = client_id or private.is_admin());

create policy "proposals participants delete"
on public.proposals for delete
to authenticated
using ((select auth.uid()) = freelancer_id or (select auth.uid()) = client_id or private.is_admin());

create policy "portfolios public published select"
on public.portfolios for select
to anon, authenticated
using (status = 'publicado' or (select auth.uid()) = user_id or private.is_admin());

create policy "portfolios owner insert"
on public.portfolios for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "portfolios owner update"
on public.portfolios for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "portfolios owner delete"
on public.portfolios for delete
to authenticated
using ((select auth.uid()) = user_id or private.is_admin());

create policy "transactions owner select"
on public.transactions for select
to authenticated
using ((select auth.uid()) = user_id or private.is_admin());

create policy "transactions admin all"
on public.transactions for all
to authenticated
using (private.is_admin())
with check (private.is_admin());

create policy "messages participants select"
on public.messages for select
to authenticated
using ((select auth.uid()) = sender_id or (select auth.uid()) = receiver_id or private.is_admin());

create policy "messages sender insert"
on public.messages for insert
to authenticated
with check ((select auth.uid()) = sender_id);

create policy "messages participants update"
on public.messages for update
to authenticated
using ((select auth.uid()) = receiver_id or (select auth.uid()) = sender_id)
with check ((select auth.uid()) = receiver_id or (select auth.uid()) = sender_id);

create policy "notifications owner select"
on public.notifications for select
to authenticated
using ((select auth.uid()) = user_id or private.is_admin());

create policy "notifications owner update"
on public.notifications for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "notifications admin insert"
on public.notifications for insert
to authenticated
with check (private.is_admin());

create policy "reviews public select"
on public.reviews for select
to anon, authenticated
using (true);

create policy "reviews sender insert"
on public.reviews for insert
to authenticated
with check ((select auth.uid()) = remetente_id);

create policy "reviews sender update"
on public.reviews for update
to authenticated
using ((select auth.uid()) = remetente_id)
with check ((select auth.uid()) = remetente_id);

create policy "challenges public select"
on public.challenges for select
to anon, authenticated
using (status in ('ativo', 'encerrado') or private.is_admin());

create policy "challenges admin all"
on public.challenges for all
to authenticated
using (private.is_admin())
with check (private.is_admin());

drop policy if exists "challenges local admin insert" on public.challenges;
create policy "challenges local admin insert"
on public.challenges for insert
to anon
with check (true);

drop policy if exists "challenges local admin update" on public.challenges;
create policy "challenges local admin update"
on public.challenges for update
to anon
using (true)
with check (true);

drop policy if exists "challenges local admin delete" on public.challenges;
create policy "challenges local admin delete"
on public.challenges for delete
to anon
using (true);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at before update on public.profiles
for each row execute function public.set_updated_at();

create trigger freelancer_stats_set_updated_at before update on public.freelancer_stats
for each row execute function public.set_updated_at();

create trigger jobs_set_updated_at before update on public.jobs
for each row execute function public.set_updated_at();

create trigger proposals_set_updated_at before update on public.proposals
for each row execute function public.set_updated_at();

create trigger portfolios_set_updated_at before update on public.portfolios
for each row execute function public.set_updated_at();

create trigger challenges_set_updated_at before update on public.challenges
for each row execute function public.set_updated_at();

-- Browser examples:
-- const { data: { user } } = await supabase.auth.getUser()
-- await supabase.from('profiles').upsert({ user_id: user.id, email: user.email, full_name, role: 'freelancer' }, { onConflict: 'user_id' })
-- await supabase.from('freelancer_stats').upsert({ user_id: user.id, profissao, habilidades, valor_hora, valor_a_combinar }, { onConflict: 'user_id' })
-- await supabase.from('jobs').insert({ client_id: user.id, titulo, descricao, categoria, habilidades, valor })
-- await supabase.from('proposals').insert({ job_id, freelancer_id: user.id, client_id, mensagem, valor_proposto })
-- Hotmart webhook: use SUPABASE_SERVICE_ROLE_KEY in an Edge Function/server. Never use service_role in the browser.

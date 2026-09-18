-- Schema inicial: um portfólio por usuário autenticado, com projetos,
-- experiências e links como tabelas filhas. Leitura pública, escrita
-- restrita ao dono via RLS.

create extension if not exists "uuid-ossp";
create extension if not exists moddatetime schema extensions;

create table public.portfolios (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  username text not null unique,
  nome text not null default '',
  breve_descricao text not null default '',
  descricao text not null default '',
  localizacao text not null default '',
  email_publico text not null default '',
  foto_url text,
  foto_path text,
  background_url text,
  background_path text,
  habilidades text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint username_format check (username ~ '^[a-z0-9][a-z0-9-]{1,30}[a-z0-9]$')
);

create table public.links (
  id uuid primary key default gen_random_uuid(),
  portfolio_id uuid not null references public.portfolios(id) on delete cascade,
  nome text not null,
  url text not null,
  ordem int not null,
  unique (portfolio_id, ordem) deferrable initially deferred
);

create table public.projetos (
  id uuid primary key default gen_random_uuid(),
  portfolio_id uuid not null references public.portfolios(id) on delete cascade,
  ordem int not null,
  nome text not null,
  descricao text not null default '',
  link_do_projeto text not null default '',
  link_do_repositorio text not null default '',
  link_youtube text not null default '',
  imagem_url text,
  imagem_path text,
  tecnologias text[] not null default '{}',
  unique (portfolio_id, ordem) deferrable initially deferred
);

create table public.experiencias (
  id uuid primary key default gen_random_uuid(),
  portfolio_id uuid not null references public.portfolios(id) on delete cascade,
  ordem int not null,
  nome text not null,
  empresa text not null,
  descricao text not null default '',
  data_inicio date not null,
  data_fim date,
  atual boolean not null default false,
  unique (portfolio_id, ordem) deferrable initially deferred,
  constraint atual_or_data_fim check (atual = true or data_fim is not null)
);

create index links_portfolio_id_idx on public.links (portfolio_id);
create index projetos_portfolio_id_idx on public.projetos (portfolio_id);
create index experiencias_portfolio_id_idx on public.experiencias (portfolio_id);

create trigger set_updated_at
  before update on public.portfolios
  for each row execute function extensions.moddatetime(updated_at);

-- RLS --------------------------------------------------------------------

alter table public.portfolios enable row level security;
alter table public.links enable row level security;
alter table public.projetos enable row level security;
alter table public.experiencias enable row level security;

create policy "portfolios_public_select" on public.portfolios
  for select using (true);

create policy "portfolios_owner_write" on public.portfolios
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "links_public_select" on public.links
  for select using (true);

create policy "links_owner_write" on public.links
  for all using (
    exists (select 1 from public.portfolios p where p.id = links.portfolio_id and p.user_id = auth.uid())
  ) with check (
    exists (select 1 from public.portfolios p where p.id = links.portfolio_id and p.user_id = auth.uid())
  );

create policy "projetos_public_select" on public.projetos
  for select using (true);

create policy "projetos_owner_write" on public.projetos
  for all using (
    exists (select 1 from public.portfolios p where p.id = projetos.portfolio_id and p.user_id = auth.uid())
  ) with check (
    exists (select 1 from public.portfolios p where p.id = projetos.portfolio_id and p.user_id = auth.uid())
  );

create policy "experiencias_public_select" on public.experiencias
  for select using (true);

create policy "experiencias_owner_write" on public.experiencias
  for all using (
    exists (select 1 from public.portfolios p where p.id = experiencias.portfolio_id and p.user_id = auth.uid())
  ) with check (
    exists (select 1 from public.portfolios p where p.id = experiencias.portfolio_id and p.user_id = auth.uid())
  );

-- Formação acadêmica: mesmo padrão de public.experiencias (tabela filha de
-- portfolios, ordenável, com período opcional em andamento via `atual`).
create table public.formacoes_academicas (
  id uuid primary key default gen_random_uuid(),
  portfolio_id uuid not null references public.portfolios(id) on delete cascade,
  ordem int not null,
  curso text not null,
  instituicao text not null,
  descricao text not null default '',
  data_inicio date not null,
  data_fim date,
  atual boolean not null default false,
  unique (portfolio_id, ordem) deferrable initially deferred,
  constraint formacoes_atual_or_data_fim check (atual = true or data_fim is not null)
);

create index formacoes_academicas_portfolio_id_idx on public.formacoes_academicas (portfolio_id);

alter table public.formacoes_academicas enable row level security;

create policy "formacoes_academicas_public_select" on public.formacoes_academicas
  for select using (true);

create policy "formacoes_academicas_owner_write" on public.formacoes_academicas
  for all using (
    exists (select 1 from public.portfolios p where p.id = formacoes_academicas.portfolio_id and p.user_id = auth.uid())
  ) with check (
    exists (select 1 from public.portfolios p where p.id = formacoes_academicas.portfolio_id and p.user_id = auth.uid())
  );

-- Duas mudanças de modelo pedidas depois de usar o app de verdade:
--
-- 1) Projeto passa a ter uma lista de links livre (nome + url, quantos o
--    usuário quiser) em vez de 3 colunas fixas (link_do_projeto,
--    link_do_repositorio, link_youtube) — mesma ideia que já existia pros
--    links de contato do portfólio, só que replicada aqui.
--
-- 2) email_publico vira email_contato: deixa de ser um campo "permanente"
--    mostrado sempre no topo do card de contato (o usuário decide se quer
--    mostrar um e-mail publicamente adicionando-o como um link comum) e
--    passa a significar especificamente "para onde mandar as mensagens do
--    formulário de contato" — pode ser um endereço diferente do que
--    aparece publicamente, ou do e-mail da conta.

alter table public.portfolios rename column email_publico to email_contato;

create table public.projeto_links (
  id uuid primary key default gen_random_uuid(),
  projeto_id uuid not null references public.projetos(id) on delete cascade,
  nome text not null,
  url text not null,
  ordem int not null,
  unique (projeto_id, ordem) deferrable initially deferred
);

create index projeto_links_projeto_id_idx on public.projeto_links (projeto_id);

alter table public.projeto_links enable row level security;

create policy "projeto_links_public_select" on public.projeto_links
  for select using (true);

create policy "projeto_links_owner_write" on public.projeto_links
  for all using (
    exists (
      select 1 from public.projetos pr
      join public.portfolios p on p.id = pr.portfolio_id
      where pr.id = projeto_links.projeto_id and p.user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.projetos pr
      join public.portfolios p on p.id = pr.portfolio_id
      where pr.id = projeto_links.projeto_id and p.user_id = auth.uid()
    )
  );

-- Migra os 3 links fixos que já existiam em cada projeto pra linhas na nova
-- tabela antes de derrubar as colunas, pra não perder dado de quem já usa o app.
insert into public.projeto_links (projeto_id, nome, url, ordem)
select id, 'Ver projeto', link_do_projeto, 0 from public.projetos where coalesce(link_do_projeto, '') <> '';

insert into public.projeto_links (projeto_id, nome, url, ordem)
select id, 'Repositório', link_do_repositorio, 1 from public.projetos where coalesce(link_do_repositorio, '') <> '';

insert into public.projeto_links (projeto_id, nome, url, ordem)
select id, 'YouTube', link_youtube, 2 from public.projetos where coalesce(link_youtube, '') <> '';

alter table public.projetos drop column link_do_projeto;
alter table public.projetos drop column link_do_repositorio;
alter table public.projetos drop column link_youtube;

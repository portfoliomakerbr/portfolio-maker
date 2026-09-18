-- Bucket "portfolios": fotos de perfil e imagens de fundo. Leitura pública,
-- escrita restrita a um prefixo de path igual ao uid do usuário autenticado
-- (ex.: "<uid>/foto-169...jpg"), garantindo que cada usuário só possa
-- escrever/apagar dentro da sua própria pasta.

insert into storage.buckets (id, name, public)
values ('portfolios', 'portfolios', true)
on conflict (id) do nothing;

create policy "portfolios_bucket_public_read" on storage.objects
  for select using (bucket_id = 'portfolios');

create policy "portfolios_bucket_owner_insert" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'portfolios'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "portfolios_bucket_owner_update" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'portfolios'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "portfolios_bucket_owner_delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'portfolios'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

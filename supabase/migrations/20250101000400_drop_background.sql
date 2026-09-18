-- A funcionalidade de imagem de fundo (banner) foi removida do produto —
-- causava mais problema visual (nome sobrepondo o banner) do que valor.
alter table public.portfolios
  drop column background_url,
  drop column background_path;

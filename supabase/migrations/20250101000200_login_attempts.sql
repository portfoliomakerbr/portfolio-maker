-- Bookkeeping de tentativas de login por e-mail, usada pela edge function
-- `login` para implementar bloqueio temporário por força bruta (o Supabase
-- Auth não tem isso nativo — só rate limit genérico de requisições).
-- Sem policies de select/insert/update: só a edge function toca aqui, usando
-- a service-role key (não existe usuário autenticado ainda nesse momento do
-- fluxo, então RLS por auth.uid() não se aplica).

create table public.login_attempts (
  email text primary key,
  failed_count int not null default 0,
  locked_until timestamptz,
  last_attempt_at timestamptz not null default now()
);

alter table public.login_attempts enable row level security;

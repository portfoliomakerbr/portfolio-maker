# PortfolioMaker · Vue + Supabase

O **PortfolioMaker** é uma aplicação web para criação, gerenciamento e publicação de portfólios profissionais. O frontend é desenvolvido com **Vue 3** e o backend utiliza **Supabase**, aproveitando **Postgres, Auth, Storage e Edge Functions**, sem a necessidade de um servidor próprio.

> Documentação técnica sobre estrutura do código, composables do Vue, schema do banco, Edge Functions e auto-ping: veja **[ARCHITECTURE.md](./ARCHITECTURE.md)**.

## Casos de uso

* **Visualizar portfólios públicos** — navegar pela galeria e acessar portfólios através do username.
* **Consultar perfil profissional** — visualizar informações pessoais, skills, links, experiências profissionais e projetos.
* **Exportar portfólio em PDF** — gerar uma versão para impressão diretamente pelo navegador.
* **Criar e gerenciar conta** — cadastro, login e recuperação de senha utilizando o Supabase Auth.
* **Criar e editar portfólio** — cadastrar nome, descrição, localização, foto de perfil e imagem de fundo.
* **Gerenciar informações profissionais** — adicionar e reordenar skills, links, experiências profissionais e projetos.
* **Publicar portfólio personalizado** — cada usuário possui um único portfólio identificado por um `username` exclusivo, utilizado na URL pública.

## Rodando localmente

### Pré-requisitos

* Node 20+
* Uma conta e um projeto no [Supabase](https://supabase.com)
* [Supabase CLI](https://supabase.com/docs/guides/cli) instalada (`npm install -g supabase`) — necessária para aplicar as migrations e publicar as Edge Functions.

### 1. Variáveis de ambiente

Copie `.env.example` para `.env.local`:

```bash
cp .env.example .env.local
```

Preencha as credenciais do seu projeto Supabase:

```env
VITE_SUPABASE_URL=https://SEU-PROJETO.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxxxxxxxxxxxxxxxxxxxxxxx
```

### 2. Banco de dados e Storage

Com a Supabase CLI logada e o projeto linkado:

```bash
supabase link --project-ref SEU-PROJETO-REF
supabase db push
```

Isso configura:

* Tabelas `portfolios`, `projetos`, `experiencias` e `links`;
* Políticas de segurança utilizando **Row Level Security (RLS)**;
* Bucket de Storage `portfolios`;
* Policies para gerenciamento dos arquivos.

As configurações ficam em `supabase/migrations/`.

### 3. Edge Functions

Publique as Edge Functions:

```bash
supabase functions deploy portfolio-save
supabase functions deploy ping
```

### 4. Frontend

Instale as dependências e inicie o ambiente de desenvolvimento:

```bash
npm install
npm run dev
```

A aplicação estará disponível em:

```text
http://localhost:5173
```

### 5. Auto-ping (opcional)

O workflow `.github/workflows/keep-alive.yml` pode ser utilizado para evitar que o projeto Supabase gratuito seja pausado por inatividade.

Depois de publicar a função `ping`, configure a URL como secret do repositório no GitHub:

**Settings → Secrets and variables → Actions → New repository secret**

Nome:

```text
SUPABASE_PING_URL
```

Valor:

```text
https://SEU-PROJETO.supabase.co/functions/v1/ping
```

A justificativa e os detalhes dessa estratégia estão documentados em [ARCHITECTURE.md](./ARCHITECTURE.md#auto-ping).

## Build de produção

Para gerar o build de produção:

```bash
npm run build
```

## Arquitetura

Para conhecer a estrutura de pastas, organização dos composables, modelo de dados, políticas de segurança, Edge Functions e estratégia de auto-ping, consulte **[ARCHITECTURE.md](./ARCHITECTURE.md)**.

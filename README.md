# PortfolioMaker · Vue + Supabase

O **PortfolioMaker** é uma aplicação web para criação, gerenciamento e publicação de portfólios profissionais. O frontend é desenvolvido com **Vue 3** e o backend utiliza **Supabase**, aproveitando **Postgres, Auth, Storage e Edge Functions**, sem a necessidade de um servidor próprio.

> Documentação técnica sobre estrutura do código, composables do Vue, schema do banco, Edge Functions e auto-ping: veja **[ARCHITECTURE.md](./ARCHITECTURE.md)**.

Repositório: [github.com/portfoliomakerbr/portfolio-maker](https://github.com/portfoliomakerbr/portfolio-maker)

## Casos de uso

* **Visualizar portfólios públicos** — navegar pela galeria e acessar portfólios através do username.
* **Consultar perfil profissional** — visualizar informações pessoais, skills, links, experiências profissionais e projetos.
* **Baixar o portfólio** — botão "Baixar" na página pública gera um arquivo de verdade em PDF ou Word, pronto pra anexar num currículo.
* **Criar e gerenciar conta** — cadastro, login (com e-mail/senha ou com Google) e recuperação de senha utilizando o Supabase Auth.
* **Proteção contra força bruta no login** — depois de tentativas erradas seguidas, a conta é bloqueada temporariamente; a tela mostra quantas tentativas restam e, se bloqueada, quanto tempo falta.
* **Criar e editar portfólio** — cadastrar nome, descrição, localização e foto de perfil.
* **Ícones automáticos** — habilidades, tecnologias dos projetos e links reconhecidos (java, vue, postgres, linkedin, github...) ganham ícone sozinhos.
* **Entrar em contato** — visitantes podem copiar seu e-mail/links ou mandar uma mensagem direto pra sua caixa de entrada, sem expor seu e-mail publicamente num formulário de terceiros.
* **Gerenciar informações profissionais** — adicionar e reordenar skills, links, formação acadêmica, experiências profissionais e projetos.
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

* Tabelas `portfolios`, `projetos`, `experiencias`, `formacoes_academicas` e `links`;
* Políticas de segurança utilizando **Row Level Security (RLS)**;
* Bucket de Storage `portfolios`;
* Policies para gerenciamento dos arquivos.

As configurações ficam em `supabase/migrations/`.

### 3. Edge Functions

Publique as Edge Functions (`ping` e `login` precisam de `--no-verify-jwt`, porque são chamadas sem o usuário estar autenticado):

```bash
supabase functions deploy portfolio-save
supabase functions deploy ping --no-verify-jwt
supabase functions deploy login --no-verify-jwt
```

### 4. Login com Google (opcional)

1. No [Google Cloud Console](https://console.cloud.google.com/apis/credentials), crie (ou reutilize) um OAuth Client ID do tipo "Web application" e adicione, em **Authorized redirect URIs**:
   ```text
   https://SEU-PROJETO.supabase.co/auth/v1/callback
   ```
2. No dashboard do Supabase: **Authentication → Providers → Google** → cole o Client ID e o Client Secret, e habilite.

### 5. E-mails via SMTP customizado (opcional, recomendado)

O mailer padrão do Supabase é limitado (poucos e-mails por hora, sem garantia de entrega). Para produção, configure um provedor de SMTP próprio (ex.: [Resend](https://resend.com)) em **Authentication → Emails → SMTP Settings**: host, porta, usuário e senha (API key) do provedor, e um remetente verificado no seu domínio.

### 6. Formulário de contato (opcional)

O botão "Entre em contato" da página pública manda a mensagem direto pro e-mail do dono do portfólio via [EmailJS](https://www.emailjs.com) — sem backend próprio pra isso, tudo do navegador do visitante.

1. Crie uma conta gratuita em emailjs.com.
2. **Email Services** → adicione seu provedor (Gmail, Outlook, SMTP próprio...).
3. **Email Templates** → crie um template com as variáveis `{{from_name}}`, `{{from_email}}`, `{{message}}`, `{{portfolio_owner}}`, `{{portfolio_username}}` (o destinatário fica fixo na config do serviço/template — é assim que o EmailJS evita abuso).
4. **Account → General** → copie a Public Key.
5. Preencha em `.env.local`:
   ```
   VITE_EMAILJS_SERVICE_ID=service_xxxxxxx
   VITE_EMAILJS_TEMPLATE_ID=template_xxxxxxx
   VITE_EMAILJS_PUBLIC_KEY=xxxxxxxxxxxxxxxx
   ```

Sem essas variáveis, o formulário aparece na página mas mostra "não configurado" em vez de quebrar.

### 7. Frontend

Instale as dependências e inicie o ambiente de desenvolvimento:

```bash
npm install
npm run dev
```

A aplicação estará disponível em:

```text
http://localhost:5173
```

### 8. Auto-ping (opcional)

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

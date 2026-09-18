# Arquitetura

> Documentação técnica. Para o que o app faz e como rodar localmente, veja **[README.md](./README.md)**.

## Estrutura de pastas

```
src/
├── lib/supabase.ts          # instância única do client Supabase
├── types/portfolio.ts       # Portfolio, Projeto, Experiencia, LinkItem
├── composables/              # ver seção "Composables" abaixo
├── components/
│   ├── layout/                # AppHeader, AppFooter
│   ├── portfolio/              # editores e cards de exibição
│   └── ui/                     # ModalTeleport, ConfirmDialog
├── views/                     # uma por rota
└── router/index.ts

supabase/
├── migrations/                # schema + policies, versionadas
└── functions/
    ├── portfolio-save/         # upsert do portfólio
    ├── login/                   # login com bloqueio por tentativas erradas
    └── ping/                   # alvo do auto-ping
```

Sem Pinia: o único estado realmente global do app é a sessão de autenticação, e ela já é bem servida por `provide/inject` (ver tabela abaixo) — adicionar uma lib de store pra isso seria peso morto num app deste tamanho, e a proposta aqui é justamente mostrar a Composition API "pura" fazendo esse trabalho.

## Composables — diversidade de hooks do Vue

Vue não tem hooks no sentido do React (funções que só podem rodar dentro de function components) nem services injetáveis como Angular — tem **composables**: funções normais que usam as primitivas de reatividade (`ref`, `reactive`, `computed`, `watch`...) e podem ser chamadas de qualquer `<script setup>`. Cada composable abaixo foi escolhido pra mostrar uma primitiva diferente presa a uma necessidade real da tela, não como exemplo didático solto:

| Arquivo | Primitiva(s) | Por quê / onde é usado |
|---|---|---|
| [`useAuth.ts`](./src/composables/useAuth.ts) | `provide`/`inject`, `onMounted`/`onUnmounted` | Sessão global. `provideAuth()` roda **uma vez** em `App.vue` e assina `onAuthStateChange` uma única vez; qualquer componente pega a sessão via `inject` (`useAuth()`) sem re-assinar o listener. |
| [`LoginView.vue`](./src/views/LoginView.vue) | `computed`, `setInterval`/`onUnmounted` | Contagem regressiva do bloqueio temporário — `lockedForSeconds` decrementa a cada segundo e `lockedMinutesLabel` (computed) formata `MM:SS`; o timer é limpo em `onUnmounted` pra não vazar entre navegações. |
| [`usePortfolio.ts`](./src/composables/usePortfolio.ts) | `ref`, `computed` | Busca pública por username; `isOwnPortfolio` é `computed` a partir do `user_id` do portfólio carregado vs. o usuário logado (injetado de `useAuth`), pra decidir se mostra o botão "Editar". |
| [`usePortfolioForm.ts`](./src/composables/usePortfolioForm.ts) | `reactive`, **`computed` writable** | O formulário inteiro é um `reactive()` (lido/gravado como unidade). `habilidadesText` é um computed com `get`/`set`: a UI edita skills como texto livre separado por vírgula, mas o modelo real é `string[]` — o `set` faz o parse/trim/dedupe na volta. |
| [`useOrdenableList.ts`](./src/composables/useOrdenableList.ts) | composable genérico reutilizável | Mover item ↑/↓ e renumerar `ordem` — mesma regra usada por `ProjetosEditor` e `ExperienciasEditor`, extraída uma vez em vez de duplicada. |
| [`useImageUpload.ts`](./src/composables/useImageUpload.ts) | `watch` (dependência **explícita**) | Ao trocar a foto/banner, o callback precisa do *path anterior* (pra apagar o arquivo velho do Storage) — isso vem naturalmente do parâmetro de `watch(selectedFile, (file) => ...)`. Contraste direto com `useDraft` abaixo. |
| [`useDraft.ts`](./src/composables/useDraft.ts) | `watchEffect` (dependências **implícitas**) | Autosave do formulário de edição em `localStorage`. Aqui não importa *qual* campo mudou, só que *algo* mudou — é o caso de uso onde `watchEffect` (rastreamento automático) é mais direto que `watch` (que exigiria listar cada campo). |
| [`useConfirmDialog.ts`](./src/composables/useConfirmDialog.ts) + [`ModalTeleport.vue`](./src/components/ui/ModalTeleport.vue) | `Teleport` | Diálogo de confirmação ("Remover este projeto?"). Os cards de edição usam `overflow: hidden` pra recortar preview de imagem — um modal renderizado *dentro* deles ficaria cortado, então `Teleport to="body"` tira o modal desse fluxo DOM mantendo a reatividade do componente que o abriu. |
| [`ImageUploader.vue`](./src/components/portfolio/ImageUploader.vue) | template ref + `defineExpose` | `useTemplateRef` no `<input type="file">` escondido, pra disparar o seletor de arquivo a partir de um botão estilizado (`fileInput.value?.click()`). `defineExpose({ reset })` deixa o formulário pai limpar o uploader após salvar, sem precisar de mais um par prop/emit pra um estado puramente imperativo. |
| [`ProjetoCard.vue`](./src/components/portfolio/ProjetoCard.vue), [`ExperienciaCard.vue`](./src/components/portfolio/ExperienciaCard.vue), [`SkillsEditor.vue`](./src/components/portfolio/SkillsEditor.vue), [`LinksEditor.vue`](./src/components/portfolio/LinksEditor.vue) | `defineModel()` | Two-way binding de cada linha editável de volta pro array no componente pai — `defineModel()` (Vue 3.4+) substitui o par manual `props.modelValue` + `emit('update:modelValue')`. |
| Guarda de rota em [`EditPortfolioView.vue`](./src/views/EditPortfolioView.vue) | `nextTick()` | Quando o `portfolio-save` rejeita por username inválido/duplicado, o código espera `nextTick()` antes de focar e rolar até o campo — garante que o DOM já reflete a mensagem de erro (que muda o layout) antes de calcular a posição do scroll. |

## Backend (Supabase)

### Schema

Uma tabela `portfolios` (1:1 com `auth.users` via `user_id unique`) e quatro tabelas filhas (`projetos`, `experiencias`, `formacoes_academicas`, `links`) com `ON DELETE CASCADE` e `unique(portfolio_id, ordem)`. Essa constraint é **`deferrable initially deferred`**: sem isso, uma reordenação que grava várias linhas em sequência poderia violar a unicidade num estado intermediário. Na prática, a escrita real das listas acontece via delete-and-reinsert dentro da edge function `portfolio-save` (não via updates sequenciais do client), então a constraint deferrable é uma rede de segurança, não o mecanismo principal.

Colunas de imagem guardam `*_url` **e** `*_path` — o `path` é necessário pra apagar/substituir o arquivo antigo no Storage do Supabase (o Cloudinary do backend antigo não precisava disso porque tinha API própria de gestão de assets).

Ver [`supabase/migrations/20250101000000_init_schema.sql`](./supabase/migrations/20250101000000_init_schema.sql).

### RLS (Row Level Security)

Leitura pública (`using (true)`) nas 4 tabelas — qualquer visitante pode ver qualquer portfólio, é o comportamento desejado (portfólios são públicos por natureza). Escrita restrita ao dono: `auth.uid() = user_id` em `portfolios`, e nas tabelas filhas via `exists (select 1 from portfolios where ... and user_id = auth.uid())`.

### Storage

Bucket `portfolios`, leitura pública, escrita restrita por prefixo de path: cada usuário só pode gravar/apagar dentro de `{auth.uid()}/...` (`supabase/migrations/20250101000100_storage_policies.sql`). O upload acontece direto do client pro Storage (`useImageUpload.ts`) — não passa por edge function, porque RLS por path-prefix já resolve a autorização sem precisar de lógica de servidor.

### Auth

Supabase Auth nativo (`signUp`, `signInWithPassword` via a function `login`, `signInWithOAuth('google')`, `resetPasswordForEmail`, `updateUser`) — substitui o JWT customizado e os três provedores de e-mail (JavaMail/Brevo/Make) do backend Java antigo. O fluxo de recovery-link (clicar no e-mail e cair em `/reset-password` já autenticado) e o fluxo de OAuth (voltar do Google já autenticado) são tratados automaticamente pelo `supabase-js` via `detectSessionInUrl: true` (padrão).

**Login com Google**: habilitado via config de Auth do projeto (`external_google_enabled`, `external_google_client_id`, `external_google_secret` — configurados fora do repo, via dashboard/Management API, nunca commitados). O Client ID/Secret do Google precisa ter `https://<projeto>.supabase.co/auth/v1/callback` na lista de *Authorized redirect URIs* no Google Cloud Console.

**E-mails via SMTP customizado**: o mailer padrão do Supabase tem um limite baixo de envios/hora (pensado pra evitar abuso da infra compartilhada deles) e pouca garantia de deliverability. Configuramos um provedor de SMTP próprio (ex.: Resend) nas configs de Auth (`smtp_host`, `smtp_user`, `smtp_pass`, etc.) — também fora do repo.

### Por que só 3 edge functions

O design inicial cogitou 4 (`portfolio-save`, `portfolio-get`, `portfolios-list`, `ping`), mas `portfolio-get` e `portfolios-list` foram descartadas: uma leitura pública com

```ts
supabase.from('portfolios').select('*, projetos(*), experiencias(*), formacoes_academicas(*), links(*)').eq('username', username)
```

já resolve o join em 1 round-trip sob RLS, sem nenhuma lógica de negócio — criar uma function só pra isso seria um hop de rede a mais sem ganho nenhum, o oposto de "backend enxuto". Ficaram as que genuinamente precisam de servidor:

- **`portfolio-save`** (autenticada): identifica o chamador via `supabase.auth.getUser(jwt)`, valida username (formato + lista de rotas reservadas do Vue Router, que o banco não conhece) e unicidade, faz upsert do portfólio e substitui (delete + reinsert) `projetos`/`experiencias`/`formacoes_academicas`/`links`. Usa um client Supabase autenticado com o **JWT do chamador**, não a service-role key — a RLS continua sendo a linha de defesa real; a function só adiciona validação que a RLS não expressa.
- **`login`** (pública, `--no-verify-jwt`): ver seção "Bloqueio de login" abaixo.
- **`ping`** (pública, `--no-verify-jwt`): handler trivial, alvo do workflow de keep-alive.

`login` e `ping` precisam do deploy com `--no-verify-jwt` porque são chamadas por quem **ainda não tem sessão** (ou, no caso do `ping`, nenhum cliente Supabase envolvido — é um `curl` puro do GitHub Actions) — sem essa flag, o gateway do Supabase rejeita a requisição por falta de um JWT válido antes mesmo dela chegar no código da function.

### Bloqueio de login por tentativas erradas

O Supabase Auth não tem "N tentativas erradas → bloqueia por X minutos" nativo — só rate limit genérico de requisições por hora (`rate_limit_email_sent` etc., configurável em Authentication → Rate Limits ou via Management API). Pra dar essa proteção por conta (e mostrar ao usuário quantas tentativas restam / quanto tempo falta), o login passa pela edge function [`login`](./supabase/functions/login/index.ts), apoiada na tabela `public.login_attempts` (sem policies de RLS — só a function, com a service-role key, toca nela; não existe usuário autenticado nesse ponto do fluxo):

- **5 tentativas erradas** → bloqueio de **15 minutos** (`locked_until` na tabela).
- Se a última tentativa foi há mais de **15 minutos**, o contador de erros reseta sozinho antes de processar a nova tentativa (é o "tempo pra resetar a contagem" que a UI menciona).
- A senha em si continua sendo validada pelo Supabase Auth (`auth.signInWithPassword`, com a anon key) — a function só decide *se* deixa tentar, nunca reimplementa verificação de senha.
- Em caso de sucesso, a function devolve `access_token`/`refresh_token` e o frontend aplica a sessão via `supabase.auth.setSession(...)` (`useAuth.ts`).

## Auto-ping

Projetos gratuitos do Supabase pausam após ~7 dias sem nenhuma requisição de API. A estratégia, em [`.github/workflows/keep-alive.yml`](./.github/workflows/keep-alive.yml):

- `cron: '0 0 */2 * *'` — a cada 2 dias. Bem abaixo da janela de 7 dias (margem para um run perdido) e longe de ser um ping diário/horário desnecessário — o objetivo é eficiência, não máxima frequência.
- `workflow_dispatch` habilitado pra disparo manual/teste.
- O job faz `curl` na function `ping` **e também commita um `last-ping.txt`** a cada execução.

Esse commit existe por causa de uma pegadinha real do GitHub Actions: **workflows agendados são desabilitados automaticamente depois de 60 dias sem nenhum commit no repositório** (não 60 dias sem o workflow rodar — sem atividade no repo mesmo). Um repositório de portfólio pessoal facilmente fica meses sem push depois de "pronto", o que silenciosamente desligaria o auto-ping e deixaria o Supabase pausar de novo. Commitar um timestamp a cada execução do próprio workflow conta como atividade no repo e fecha esse loop sem depender de lembrar de mexer no código manualmente.

## Fluxo de salvamento

`EditPortfolioView.vue` mantém **um único formulário** (`usePortfolioForm`) cobrindo identidade, skills, imagens, links, projetos e experiências, com **um botão salvar** que chama `portfolio-save` uma vez com o payload inteiro — espelhando a semântica de upsert único que o backend antigo também tinha (`POST /portfolios/save` recebia o documento completo). Evita bugs de salvamento parcial que uma tela dividida em sub-rotas por seção introduziria.

#!/usr/bin/env node
// Teste de ponta a ponta do fluxo de autenticação, batendo direto nas APIs
// reais do Supabase (não mocks) — prova que cadastro, login (certo e
// errado), bloqueio por tentativas e recuperação de senha funcionam de
// verdade em produção. Não depende de acesso a e-mail: usa a Admin API do
// Supabase pra confirmar/inspecionar a conta de teste diretamente.
//
// Uso:
//   SUPABASE_URL=https://xxx.supabase.co \
//   SUPABASE_ANON_KEY=... \
//   SUPABASE_SERVICE_ROLE_KEY=... \
//   node scripts/test-auth.mjs
//
// As três variáveis também podem vir de um .env.test (gitignored) na raiz.

import { readFileSync, existsSync } from 'node:fs'

function loadDotEnvTest() {
  const path = new URL('../.env.test', import.meta.url)
  if (!existsSync(path)) return
  for (const line of readFileSync(path, 'utf-8').split('\n')) {
    const match = line.match(/^([A-Z_]+)=(.*)$/)
    if (match && !process.env[match[1]]) process.env[match[1]] = match[2].trim()
  }
}
loadDotEnvTest()

const SUPABASE_URL = process.env.SUPABASE_URL
const ANON_KEY = process.env.SUPABASE_ANON_KEY
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !ANON_KEY || !SERVICE_ROLE_KEY) {
  console.error('Faltam SUPABASE_URL / SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY (env ou .env.test).')
  process.exit(1)
}

// resend.dev é o domínio de sandbox do Resend (nosso provedor de SMTP) —
// aceita envio de verdade sem cair em caixa de ninguém, ao contrário de
// domínios reservados tipo example.com, que o Resend rejeita de propósito
// (550 "Invalid `to` field") por serem só placeholders de documentação, não
// endereços reais. Usar example.com aqui faria o teste de recuperação de
// senha "passar" por engano (o Supabase só tenta enviar de verdade pra
// e-mails de contas reais — para endereços inexistentes ele finge sucesso
// sem tocar no SMTP, então o teste não provaria nada).
const testEmail = `delivered+teste-auth-${Date.now()}@resend.dev`
const testPassword = 'SenhaCorreta123!'
const wrongPassword = 'SenhaErrada999!'

let passed = 0
let failed = 0

function check(label, condition, detail = '') {
  if (condition) {
    passed++
    console.log(`  ok  - ${label}`)
  } else {
    failed++
    console.log(`FALHOU - ${label}${detail ? ` (${detail})` : ''}`)
  }
}

async function adminFetch(path, opts = {}) {
  return fetch(`${SUPABASE_URL}${path}`, {
    ...opts,
    headers: {
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      apikey: SERVICE_ROLE_KEY,
      'Content-Type': 'application/json',
      ...opts.headers,
    },
  })
}

async function anonFetch(path, opts = {}) {
  return fetch(`${SUPABASE_URL}${path}`, {
    ...opts,
    headers: {
      apikey: ANON_KEY,
      'Content-Type': 'application/json',
      ...opts.headers,
    },
  })
}

async function login(email, password) {
  const res = await anonFetch('/functions/v1/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
  return { status: res.status, body: await res.json() }
}

async function main() {
  console.log(`\nConta de teste: ${testEmail}\n`)

  // 1. Cadastro público (mesmo caminho que o formulário de signup usa).
  const signupRes = await anonFetch('/auth/v1/signup', {
    method: 'POST',
    body: JSON.stringify({ email: testEmail, password: testPassword }),
  })
  const signupBody = await signupRes.json()
  check('cadastro retorna 200', signupRes.status === 200, `status ${signupRes.status}`)
  check('cadastro cria o usuário', Boolean(signupBody.id ?? signupBody.user?.id))

  // 2. Confirmação automática — sem isso, login nunca funciona mesmo com a
  // senha certa (foi exatamente o bug relatado: SMTP não entregava o
  // e-mail de confirmação, então email_confirmed_at ficava nulo pra sempre).
  const usersRes = await adminFetch(`/auth/v1/admin/users?email=${encodeURIComponent(testEmail)}`)
  const usersBody = await usersRes.json()
  const createdUser = (usersBody.users ?? []).find((u) => u.email === testEmail)
  check('usuário existe na base', Boolean(createdUser))
  check(
    'e-mail confirmado automaticamente (mailer_autoconfirm)',
    Boolean(createdUser?.email_confirmed_at),
    `email_confirmed_at: ${createdUser?.email_confirmed_at}`,
  )

  // 3. Login com a senha certa precisa funcionar de primeira.
  const goodLogin = await login(testEmail, testPassword)
  check('login com senha certa retorna 200', goodLogin.status === 200, `status ${goodLogin.status}`)
  check('login com senha certa devolve access_token', Boolean(goodLogin.body?.session?.access_token))

  // 4. Login com senha errada: não trava a conta, só desconta uma tentativa.
  const badLogin = await login(testEmail, wrongPassword)
  check('senha errada retorna 401', badLogin.status === 401, `status ${badLogin.status}`)
  check(
    'senha errada informa tentativas restantes (4)',
    badLogin.body?.remainingAttempts === 4,
    `remainingAttempts: ${badLogin.body?.remainingAttempts}`,
  )

  // 5. Mais 4 erros (total 5) deve bloquear temporariamente.
  let lastAttempt
  for (let i = 0; i < 4; i++) {
    lastAttempt = await login(testEmail, wrongPassword)
  }
  check('5ª tentativa errada bloqueia a conta (423)', lastAttempt.status === 423, `status ${lastAttempt.status}`)
  check('bloqueio informa tempo restante em segundos', typeof lastAttempt.body?.lockedForSeconds === 'number')

  // 6. Mesmo com a senha CERTA, login não passa enquanto bloqueado.
  const lockedGoodLogin = await login(testEmail, testPassword)
  check(
    'login correto ainda é recusado durante o bloqueio',
    lockedGoodLogin.status === 423,
    `status ${lockedGoodLogin.status}`,
  )

  // 7. Recuperação de senha: a API precisa aceitar a requisição (não dá pra
  // verificar a entrega do e-mail em si sem acesso à caixa de entrada, mas
  // uma resposta que não seja 200 já indicaria problema na configuração).
  const recoverRes = await anonFetch('/auth/v1/recover', {
    method: 'POST',
    body: JSON.stringify({ email: testEmail }),
  })
  check('pedido de recuperação de senha aceito (200)', recoverRes.status === 200, `status ${recoverRes.status}`)

  // Limpeza: remove o usuário e o registro de tentativas de login criados pro teste.
  if (createdUser) {
    await adminFetch(`/auth/v1/admin/users/${createdUser.id}`, { method: 'DELETE' })
  }
  await fetch(`${SUPABASE_URL}/rest/v1/login_attempts?email=eq.${encodeURIComponent(testEmail)}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${SERVICE_ROLE_KEY}`, apikey: SERVICE_ROLE_KEY },
  })

  console.log(`\n${passed} passaram, ${failed} falharam.\n`)
  process.exit(failed > 0 ? 1 : 0)
}

main().catch((err) => {
  console.error('Erro inesperado rodando os testes:', err)
  process.exit(1)
})

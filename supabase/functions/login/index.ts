// Edge function: login com bloqueio temporário por tentativas erradas.
// O Supabase Auth não tem "N tentativas erradas -> bloqueia por X minutos"
// nativo (só rate limit genérico de requisições/hora), então essa lógica
// vive aqui, apoiada na tabela public.login_attempts (service role, sem RLS
// pública — não existe sessão de usuário antes do login acontecer).
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { handlePreflight, jsonResponse } from '../_shared/cors.ts'

const MAX_ATTEMPTS = 5
const LOCKOUT_MINUTES = 15
const RESET_MINUTES = 15

function adminClient() {
  return createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
}

function anonClient() {
  return createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!)
}

interface AttemptRow {
  email: string
  failed_count: number
  locked_until: string | null
  last_attempt_at: string
}

Deno.serve(async (req) => {
  const preflight = handlePreflight(req)
  if (preflight) return preflight

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Método não permitido.' }, 405)
  }

  const { email: rawEmail, password } = await req.json()
  const email = (rawEmail ?? '').trim().toLowerCase()

  if (!email || !password) {
    return jsonResponse({ error: 'E-mail e senha são obrigatórios.' }, 400)
  }

  const admin = adminClient()
  const now = new Date()

  const { data: existing } = await admin
    .from('login_attempts')
    .select('*')
    .eq('email', email)
    .maybeSingle<AttemptRow>()

  // Se o bloqueio ainda está ativo, nem tenta autenticar — só informa quanto falta.
  if (existing?.locked_until && new Date(existing.locked_until) > now) {
    const lockedForSeconds = Math.ceil((new Date(existing.locked_until).getTime() - now.getTime()) / 1000)
    return jsonResponse(
      {
        error: 'locked',
        message: `Muitas tentativas erradas. Tente novamente em ${Math.ceil(lockedForSeconds / 60)} min.`,
        locked: true,
        lockedForSeconds,
        remainingAttempts: 0,
      },
      423,
    )
  }

  // Sem bloqueio ativo: se a última tentativa foi há mais que RESET_MINUTES,
  // o contador de erros reseta sozinho (é o "tempo pra resetar a contagem").
  const lastAttemptAgeMinutes = existing
    ? (now.getTime() - new Date(existing.last_attempt_at).getTime()) / 60000
    : Infinity
  const currentFailedCount = existing && lastAttemptAgeMinutes < RESET_MINUTES ? existing.failed_count : 0

  const { error: authError, data: authData } = await anonClient().auth.signInWithPassword({ email, password })

  // E-mail nunca confirmado não é "senha errada" — é um estado totalmente
  // diferente (a conta existe, a senha pode até estar certa, mas o Supabase
  // recusa a sessão até o e-mail ser confirmado). Tratar isso como tentativa
  // errada penalizaria injustamente quem simplesmente ainda não confirmou
  // (ou cujo e-mail de confirmação nunca chegou) — por isso não conta pro
  // contador de bloqueio, e a mensagem é específica.
  if (authError?.code === 'email_not_confirmed') {
    return jsonResponse(
      {
        error: 'email_not_confirmed',
        message: 'Confirme seu e-mail antes de entrar — verifique sua caixa de entrada (e o spam).',
        locked: false,
      },
      401,
    )
  }

  if (!authError && authData.session) {
    // Login certo: zera o contador.
    await admin.from('login_attempts').upsert({
      email,
      failed_count: 0,
      locked_until: null,
      last_attempt_at: now.toISOString(),
    })

    return jsonResponse({
      session: {
        access_token: authData.session.access_token,
        refresh_token: authData.session.refresh_token,
      },
    })
  }

  // Login errado: incrementa e, se bateu o máximo, bloqueia.
  const newFailedCount = currentFailedCount + 1
  const willLock = newFailedCount >= MAX_ATTEMPTS
  const lockedUntil = willLock ? new Date(now.getTime() + LOCKOUT_MINUTES * 60_000) : null

  await admin.from('login_attempts').upsert({
    email,
    failed_count: willLock ? 0 : newFailedCount,
    locked_until: lockedUntil?.toISOString() ?? null,
    last_attempt_at: now.toISOString(),
  })

  if (willLock) {
    return jsonResponse(
      {
        error: 'locked',
        message: `Muitas tentativas erradas. Tente novamente em ${LOCKOUT_MINUTES} min.`,
        locked: true,
        lockedForSeconds: LOCKOUT_MINUTES * 60,
        remainingAttempts: 0,
      },
      423,
    )
  }

  return jsonResponse(
    {
      error: 'invalid_credentials',
      message: 'E-mail ou senha incorretos.',
      locked: false,
      remainingAttempts: MAX_ATTEMPTS - newFailedCount,
      resetInSeconds: RESET_MINUTES * 60,
    },
    401,
  )
})

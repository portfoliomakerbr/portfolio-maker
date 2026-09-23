// Edge function: exclui permanentemente a conta do usuário e tudo que
// depende dela (portfólio, projetos, experiências, formações e links vêm
// junto via ON DELETE CASCADE a partir de auth.users). Precisa da
// service-role key (supabaseClients.ts só expõe um client autenticado como
// o próprio usuário, que nunca teria permissão pra apagar seu próprio
// registro em auth.users nem os arquivos de outra pessoa) — por isso vive
// numa function separada, não é algo que dê pra fazer direto do cliente.
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { handlePreflight, jsonResponse } from '../_shared/cors.ts'
import { getCallerOrThrow } from '../_shared/supabaseClients.ts'

function adminClient() {
  return createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
}

Deno.serve(async (req) => {
  const preflight = handlePreflight(req)
  if (preflight) return preflight

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Método não permitido.' }, 405)
  }

  try {
    const { client, user } = await getCallerOrThrow(req.headers.get('Authorization'))
    const body = await req.json().catch(() => ({}))
    const confirmUsername = ((body as { username?: string }).username ?? '').trim().toLowerCase()

    const { data: portfolio, error: portfolioError } = await client
      .from('portfolios')
      .select('username')
      .eq('user_id', user.id)
      .maybeSingle()

    if (portfolioError) {
      return jsonResponse({ error: portfolioError.message }, 500)
    }
    if (!portfolio) {
      return jsonResponse(
        { error: 'Você ainda não tem um portfólio salvo — não há dados pra excluir.' },
        400,
      )
    }
    if (confirmUsername !== portfolio.username) {
      return jsonResponse({ error: 'O username digitado não confere com o do seu portfólio.' }, 400)
    }

    const admin = adminClient()

    // Apaga os arquivos do Storage (foto de perfil, imagens de projeto) antes
    // de apagar o usuário: depois que a conta some, ninguém mais teria
    // permissão (RLS) pra limpar essa pasta, e ela ficaria órfã pra sempre.
    const { data: files } = await admin.storage.from('portfolios').list(user.id)
    if (files && files.length) {
      await admin.storage.from('portfolios').remove(files.map((f) => `${user.id}/${f.name}`))
    }

    // Apaga o usuário — o portfólio e tudo que depende dele (links, projetos,
    // experiências, formações) some junto via ON DELETE CASCADE, já que a
    // FK de portfolios.user_id aponta pra auth.users com essa regra.
    const { error: deleteUserError } = await admin.auth.admin.deleteUser(user.id)
    if (deleteUserError) {
      return jsonResponse({ error: deleteUserError.message }, 500)
    }

    return jsonResponse({ ok: true })
  } catch (err) {
    if (err instanceof Response) return err
    const message = err instanceof Error ? err.message : 'Erro inesperado.'
    return jsonResponse({ error: message }, 500)
  }
})

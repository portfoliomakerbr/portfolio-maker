import { createClient } from 'jsr:@supabase/supabase-js@2'

/**
 * Cliente Supabase autenticado com o JWT de quem chamou a function (não a
 * service-role key). Assim, as políticas de RLS continuam sendo a real linha
 * de defesa das escritas — a function só adiciona validação de negócio
 * (uniqueness de username, renumeração de `ordem`), não bypassa segurança.
 */
export function createUserClient(authHeader: string) {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } },
  )
}

export async function getCallerOrThrow(authHeader: string | null) {
  if (!authHeader) {
    throw new Response(JSON.stringify({ error: 'Não autenticado.' }), { status: 401 })
  }
  const client = createUserClient(authHeader)
  const {
    data: { user },
    error,
  } = await client.auth.getUser()

  if (error || !user) {
    throw new Response(JSON.stringify({ error: 'Sessão inválida ou expirada.' }), { status: 401 })
  }
  return { client, user }
}

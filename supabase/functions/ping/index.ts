// Alvo do workflow de keep-alive (.github/workflows/keep-alive.yml). Pública,
// sem lógica de negócio nenhuma — só precisa existir pra gerar uma requisição
// real contra o projeto Supabase e evitar a pausa por inatividade de 7 dias.
import { handlePreflight, jsonResponse } from '../_shared/cors.ts'

Deno.serve((req) => {
  const preflight = handlePreflight(req)
  if (preflight) return preflight

  return jsonResponse({ status: 'ok', timestamp: new Date().toISOString() })
})

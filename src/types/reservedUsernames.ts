// Rotas do Vue Router que colidiriam com /:username caso alguém cadastrasse
// um desses nomes de usuário. Mantido em sincronia manual com o mesmo array
// dentro de supabase/functions/portfolio-save/index.ts (a validação real e
// definitiva acontece lá; esta lista só existe para feedback imediato no formulário).
export const RESERVED_USERNAMES = [
  'login',
  'signup',
  'cadastro',
  'edit',
  'gallery',
  'forgot-password',
  'reset-password',
  'admin',
  'api',
  'ping',
]

export function isUsernameReservada(username: string): boolean {
  return RESERVED_USERNAMES.includes(username.toLowerCase())
}

// Mensagem específica por tipo de problema (tamanho, caractere inválido,
// hífen nas pontas, reservado) em vez de um "username inválido" genérico que
// não diz qual das quatro regras foi quebrada.
export function validateUsername(username: string): string | null {
  const value = username.trim().toLowerCase()
  if (value.length < 3) return 'Username muito curto (mínimo 3 caracteres).'
  if (value.length > 32) return 'Username muito longo (máximo 32 caracteres).'
  if (!/^[a-z0-9-]+$/.test(value)) return 'Username só pode conter letras, números e hífen.'
  if (value.startsWith('-') || value.endsWith('-')) return 'Username não pode começar nem terminar com hífen.'
  if (isUsernameReservada(value)) return 'Esse username já é usado por uma página do site — escolha outro.'
  return null
}

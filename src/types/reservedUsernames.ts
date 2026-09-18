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

const USERNAME_REGEX = /^[a-z0-9][a-z0-9-]{1,30}[a-z0-9]$/

export function isUsernameValida(username: string): boolean {
  return USERNAME_REGEX.test(username) && !isUsernameReservada(username)
}

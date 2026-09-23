const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// O banco guarda o link exatamente como o usuário digitou — nunca com
// "mailto:" na frente. Decidir se é um e-mail é só uma questão de exibição
// (ícone/href), recalculada toda vez que o link é usado, nunca persistida.
//
// Salvar já normalizado (com "mailto:" prefixado) foi tentado antes e causou
// um bug real: "mailto:fulano@x.com" também bate nesse mesmo regex de e-mail
// (o prefixo "mailto:" não tem espaço nem "@", então passa como parte do
// usuário do endereço) — cada save reconhecia o valor já salvo como "ainda
// não é mailto:" e empilhava mais um prefixo, indefinidamente.
export function isEmailAddress(value: string): boolean {
  return EMAIL_REGEX.test(value.trim())
}

export function linkHref(url: string): string {
  const trimmed = url.trim()
  return isEmailAddress(trimmed) ? `mailto:${trimmed}` : trimmed
}

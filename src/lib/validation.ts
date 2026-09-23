import type { LinkItem } from '../types/portfolio'

// Uma linha de link (contato ou projeto) só é inválida quando um dos dois
// campos foi preenchido e o outro não — linha totalmente vazia é ignorada
// (não vira link ao salvar) e linha totalmente preenchida é válida.
export function linkRowError(link: LinkItem): string | null {
  const hasNome = !!link.nome.trim()
  const hasUrl = !!link.url.trim()
  if (hasNome && !hasUrl) return 'Preencha o link.'
  if (hasUrl && !hasNome) return 'Preencha o nome do link.'
  return null
}

export function linksHaveError(links: LinkItem[]): boolean {
  return links.some((l) => linkRowError(l) !== null)
}

// Edge function: upsert completo de um portfólio (dados + projetos +
// experiências + links). É a única escrita que precisa de lógica no servidor
// (validação de username, renumeração de ordem, substituição transacional-ish
// das listas filhas) — leituras públicas não passam por aqui, vão direto pro
// Postgrest sob RLS (ver ARCHITECTURE.md).
import { handlePreflight, jsonResponse } from '../_shared/cors.ts'
import { getCallerOrThrow } from '../_shared/supabaseClients.ts'

const RESERVED_USERNAMES = [
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

// Mesma regra usada no cliente (src/types/reservedUsernames.ts) — mensagens
// específicas por tipo de problema, não uma genérica só pra "formato inválido".
function validateUsername(username: string): string | null {
  if (username.length < 3) return 'Username muito curto (mínimo 3 caracteres).'
  if (username.length > 32) return 'Username muito longo (máximo 32 caracteres).'
  if (!/^[a-z0-9-]+$/.test(username)) return 'Username só pode conter letras, números e hífen.'
  if (username.startsWith('-') || username.endsWith('-')) return 'Username não pode começar nem terminar com hífen.'
  return null
}

interface LinkInput {
  nome: string
  url: string
  ordem?: number
}

interface ProjetoInput {
  ordem?: number
  nome: string
  descricao: string
  links: LinkInput[]
  imagemUrl: string | null
  imagemPath: string | null
  tecnologias: string[]
}

interface ExperienciaInput {
  ordem?: number
  nome: string
  empresa: string
  descricao: string
  dataInicio: string
  dataFim: string | null
  atual: boolean
}

interface FormacaoAcademicaInput {
  ordem?: number
  curso: string
  instituicao: string
  descricao: string
  dataInicio: string
  dataFim: string | null
  atual: boolean
}

interface PortfolioInput {
  username: string
  nome: string
  breveDescricao: string
  descricao: string
  localizacao: string
  emailContato: string
  fotoUrl: string | null
  fotoPath: string | null
  habilidades: string[]
  links: LinkInput[]
  projetos: ProjetoInput[]
  experiencias: ExperienciaInput[]
  formacoesAcademicas: FormacaoAcademicaInput[]
}

Deno.serve(async (req) => {
  const preflight = handlePreflight(req)
  if (preflight) return preflight

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Método não permitido.' }, 405)
  }

  try {
    const { client, user } = await getCallerOrThrow(req.headers.get('Authorization'))
    const body = (await req.json()) as PortfolioInput

    const username = (body.username ?? '').trim().toLowerCase()
    const usernameError = validateUsername(username)
    if (usernameError) {
      return jsonResponse({ error: usernameError }, 400)
    }
    if (RESERVED_USERNAMES.includes(username)) {
      return jsonResponse({ error: 'Esse username já é usado por uma página do site — escolha outro.' }, 400)
    }

    const { data: existing, error: conflictError } = await client
      .from('portfolios')
      .select('id, user_id')
      .eq('username', username)
      .maybeSingle()

    if (conflictError) {
      return jsonResponse({ error: conflictError.message }, 500)
    }
    if (existing && existing.user_id !== user.id) {
      return jsonResponse({ error: 'Esse username já está em uso.' }, 409)
    }

    const portfolioPayload = {
      user_id: user.id,
      username,
      nome: body.nome ?? '',
      breve_descricao: body.breveDescricao ?? '',
      descricao: body.descricao ?? '',
      localizacao: body.localizacao ?? '',
      email_contato: body.emailContato ?? '',
      foto_url: body.fotoUrl ?? null,
      foto_path: body.fotoPath ?? null,
      habilidades: body.habilidades ?? [],
    }

    const { data: portfolio, error: upsertError } = await client
      .from('portfolios')
      .upsert(portfolioPayload, { onConflict: 'user_id' })
      .select('id')
      .single()

    if (upsertError) {
      return jsonResponse({ error: upsertError.message }, 500)
    }

    const portfolioId = portfolio.id as string

    const replaceChildren = async (
      table: 'links' | 'experiencias' | 'formacoes_academicas',
      rows: Record<string, unknown>[],
    ) => {
      const { error: deleteError } = await client.from(table).delete().eq('portfolio_id', portfolioId)
      if (deleteError) throw deleteError

      if (rows.length === 0) return

      const { error: insertError } = await client
        .from(table)
        .insert(rows.map((row, index) => ({ ...row, portfolio_id: portfolioId, ordem: index })))
      if (insertError) throw insertError
    }

    await replaceChildren(
      'links',
      (body.links ?? [])
        .filter((l) => l.nome.trim() && l.url.trim())
        .map((l) => ({ nome: l.nome.trim(), url: l.url.trim() })),
    )

    // Projetos não usam o helper genérico acima: cada um precisa do próprio id
    // de volta pra popular seus links filhos (tabela projeto_links), então o
    // insert tem que ser feito linha a linha em vez de um bulk insert único.
    const replaceProjetos = async (projetos: ProjetoInput[]) => {
      const { error: deleteError } = await client.from('projetos').delete().eq('portfolio_id', portfolioId)
      if (deleteError) throw deleteError

      for (const [index, p] of projetos.entries()) {
        const { data: inserted, error: insertError } = await client
          .from('projetos')
          .insert({
            portfolio_id: portfolioId,
            ordem: index,
            nome: p.nome,
            descricao: p.descricao,
            imagem_url: p.imagemUrl,
            imagem_path: p.imagemPath,
            tecnologias: p.tecnologias ?? [],
          })
          .select('id')
          .single()
        if (insertError) throw insertError

        const links = (p.links ?? [])
          .filter((l) => l.nome.trim() && l.url.trim())
          .map((l, linkIndex) => ({
            projeto_id: inserted.id as string,
            nome: l.nome.trim(),
            url: l.url.trim(),
            ordem: linkIndex,
          }))

        if (links.length) {
          const { error: linksError } = await client.from('projeto_links').insert(links)
          if (linksError) throw linksError
        }
      }
    }

    await replaceProjetos(body.projetos ?? [])

    await replaceChildren(
      'experiencias',
      (body.experiencias ?? []).map((e) => ({
        nome: e.nome,
        empresa: e.empresa,
        descricao: e.descricao,
        data_inicio: e.dataInicio,
        data_fim: e.atual ? null : e.dataFim,
        atual: e.atual,
      })),
    )

    await replaceChildren(
      'formacoes_academicas',
      (body.formacoesAcademicas ?? []).map((f) => ({
        curso: f.curso,
        instituicao: f.instituicao,
        descricao: f.descricao,
        data_inicio: f.dataInicio,
        data_fim: f.atual ? null : f.dataFim,
        atual: f.atual,
      })),
    )

    return jsonResponse({ id: portfolioId, username })
  } catch (err) {
    if (err instanceof Response) return err
    const message = err instanceof Error ? err.message : 'Erro inesperado.'
    return jsonResponse({ error: message }, 500)
  }
})

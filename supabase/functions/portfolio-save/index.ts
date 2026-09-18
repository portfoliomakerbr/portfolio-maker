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

const USERNAME_REGEX = /^[a-z0-9][a-z0-9-]{1,30}[a-z0-9]$/

interface LinkInput {
  nome: string
  url: string
  ordem?: number
}

interface ProjetoInput {
  ordem?: number
  nome: string
  descricao: string
  linkDoProjeto: string
  linkDoRepositorio: string
  linkYoutube: string
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
  emailPublico: string
  fotoUrl: string | null
  fotoPath: string | null
  backgroundUrl: string | null
  backgroundPath: string | null
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
    if (!USERNAME_REGEX.test(username)) {
      return jsonResponse(
        { error: 'Username inválido: use letras minúsculas, números e hífen (3 a 32 caracteres).' },
        400,
      )
    }
    if (RESERVED_USERNAMES.includes(username)) {
      return jsonResponse({ error: 'Username reservado, escolha outro.' }, 400)
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
      email_publico: body.emailPublico ?? '',
      foto_url: body.fotoUrl ?? null,
      foto_path: body.fotoPath ?? null,
      background_url: body.backgroundUrl ?? null,
      background_path: body.backgroundPath ?? null,
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
      table: 'links' | 'projetos' | 'experiencias' | 'formacoes_academicas',
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
      (body.links ?? []).map((l) => ({ nome: l.nome, url: l.url })),
    )

    await replaceChildren(
      'projetos',
      (body.projetos ?? []).map((p) => ({
        nome: p.nome,
        descricao: p.descricao,
        link_do_projeto: p.linkDoProjeto,
        link_do_repositorio: p.linkDoRepositorio,
        link_youtube: p.linkYoutube,
        imagem_url: p.imagemUrl,
        imagem_path: p.imagemPath,
        tecnologias: p.tecnologias ?? [],
      })),
    )

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

import { computed, ref } from 'vue'
import { supabase } from '../lib/supabase'
import type { Portfolio } from '../types/portfolio'
import { useAuth } from './useAuth'

interface PortfolioRow {
  id: string
  user_id: string
  username: string
  nome: string
  breve_descricao: string
  descricao: string
  localizacao: string
  email_publico: string
  foto_url: string | null
  foto_path: string | null
  background_url: string | null
  background_path: string | null
  habilidades: string[]
  created_at: string
  updated_at: string
  projetos: {
    id: string
    ordem: number
    nome: string
    descricao: string
    link_do_projeto: string
    link_do_repositorio: string
    link_youtube: string
    imagem_url: string | null
    imagem_path: string | null
    tecnologias: string[]
  }[]
  experiencias: {
    id: string
    ordem: number
    nome: string
    empresa: string
    descricao: string
    data_inicio: string
    data_fim: string | null
    atual: boolean
  }[]
  links: { id: string; nome: string; url: string; ordem: number }[]
  formacoes_academicas: {
    id: string
    ordem: number
    curso: string
    instituicao: string
    descricao: string
    data_inicio: string
    data_fim: string | null
    atual: boolean
  }[]
}

function mapRow(row: PortfolioRow): Portfolio {
  return {
    id: row.id,
    userId: row.user_id,
    username: row.username,
    nome: row.nome,
    breveDescricao: row.breve_descricao,
    descricao: row.descricao,
    localizacao: row.localizacao,
    emailPublico: row.email_publico,
    fotoUrl: row.foto_url,
    fotoPath: row.foto_path,
    backgroundUrl: row.background_url,
    backgroundPath: row.background_path,
    habilidades: row.habilidades ?? [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    links: [...row.links]
      .sort((a, b) => a.ordem - b.ordem)
      .map((l) => ({ id: l.id, nome: l.nome, url: l.url, ordem: l.ordem })),
    projetos: [...row.projetos]
      .sort((a, b) => a.ordem - b.ordem)
      .map((p) => ({
        id: p.id,
        ordem: p.ordem,
        nome: p.nome,
        descricao: p.descricao,
        linkDoProjeto: p.link_do_projeto,
        linkDoRepositorio: p.link_do_repositorio,
        linkYoutube: p.link_youtube,
        imagemUrl: p.imagem_url,
        imagemPath: p.imagem_path,
        tecnologias: p.tecnologias ?? [],
      })),
    experiencias: [...row.experiencias]
      .sort((a, b) => a.ordem - b.ordem)
      .map((e) => ({
        id: e.id,
        ordem: e.ordem,
        nome: e.nome,
        empresa: e.empresa,
        descricao: e.descricao,
        dataInicio: e.data_inicio,
        dataFim: e.data_fim,
        atual: e.atual,
      })),
    formacoesAcademicas: [...row.formacoes_academicas]
      .sort((a, b) => a.ordem - b.ordem)
      .map((f) => ({
        id: f.id,
        ordem: f.ordem,
        curso: f.curso,
        instituicao: f.instituicao,
        descricao: f.descricao,
        dataInicio: f.data_inicio,
        dataFim: f.data_fim,
        atual: f.atual,
      })),
  }
}

const SELECT_COLUMNS = '*, projetos(*), experiencias(*), links(*), formacoes_academicas(*)'

/**
 * Busca pública de um portfólio por username (RLS permite leitura para
 * qualquer visitante). Não precisa de edge function: um único select do
 * Postgrest com resources aninhados já resolve o join em 1 round-trip.
 */
export function usePortfolio() {
  const auth = useAuth()
  const portfolio = ref<Portfolio | null>(null)
  const loading = ref(false)
  const notFound = ref(false)
  const error = ref<string | null>(null)

  const isOwnPortfolio = computed(() => {
    if (!portfolio.value || !auth.user.value) return false
    return portfolio.value.userId === auth.user.value.id
  })

  async function fetchByUsername(username: string) {
    loading.value = true
    notFound.value = false
    error.value = null
    portfolio.value = null

    const { data, error: fetchError } = await supabase
      .from('portfolios')
      .select(SELECT_COLUMNS)
      .eq('username', username)
      .maybeSingle<PortfolioRow>()

    loading.value = false

    if (fetchError) {
      error.value = fetchError.message
      return
    }
    if (!data) {
      notFound.value = true
      return
    }
    portfolio.value = mapRow(data)
  }

  async function fetchOwn() {
    if (!auth.user.value) return
    loading.value = true
    error.value = null

    const { data, error: fetchError } = await supabase
      .from('portfolios')
      .select(SELECT_COLUMNS)
      .eq('user_id', auth.user.value.id)
      .maybeSingle<PortfolioRow>()

    loading.value = false

    if (fetchError) {
      error.value = fetchError.message
      return
    }
    portfolio.value = data ? mapRow(data) : null
  }

  return { portfolio, loading, notFound, error, isOwnPortfolio, fetchByUsername, fetchOwn }
}

export interface GalleryItem {
  username: string
  nome: string
  breveDescricao: string
  fotoUrl: string | null
  localizacao: string
}

export function useGallery() {
  const items = ref<GalleryItem[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchAll(excludeUsername?: string) {
    loading.value = true
    error.value = null

    let query = supabase
      .from('portfolios')
      .select('username, nome, breve_descricao, foto_url, localizacao')
      .order('created_at', { ascending: false })

    if (excludeUsername) {
      query = query.neq('username', excludeUsername)
    }

    const { data, error: fetchError } = await query
    loading.value = false

    if (fetchError) {
      error.value = fetchError.message
      return
    }

    items.value = (data ?? []).map((row) => ({
      username: row.username,
      nome: row.nome,
      breveDescricao: row.breve_descricao,
      fotoUrl: row.foto_url,
      localizacao: row.localizacao,
    }))
  }

  return { items, loading, error, fetchAll }
}

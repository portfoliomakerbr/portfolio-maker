export interface LinkItem {
  id?: string
  nome: string
  url: string
  ordem: number
}

export interface Projeto {
  id?: string
  ordem: number
  nome: string
  descricao: string
  linkDoProjeto: string
  linkDoRepositorio: string
  linkYoutube: string
  imagemUrl: string | null
  imagemPath: string | null
  tecnologias: string[]
}

export interface Experiencia {
  id?: string
  ordem: number
  nome: string
  empresa: string
  descricao: string
  dataInicio: string
  dataFim: string | null
  atual: boolean
}

export interface Portfolio {
  id: string
  userId: string
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
  links: LinkItem[]
  projetos: Projeto[]
  experiencias: Experiencia[]
  createdAt: string
  updatedAt: string
}

export interface PortfolioListItem {
  username: string
  nome: string
  breveDescricao: string
  fotoUrl: string | null
  localizacao: string
}

export type PortfolioFormInput = Omit<
  Portfolio,
  'id' | 'userId' | 'createdAt' | 'updatedAt'
>

export function criarPortfolioFormInput(username: string): PortfolioFormInput {
  return {
    username,
    nome: '',
    breveDescricao: '',
    descricao: '',
    localizacao: '',
    emailPublico: '',
    fotoUrl: null,
    fotoPath: null,
    backgroundUrl: null,
    backgroundPath: null,
    habilidades: [],
    links: [],
    projetos: [],
    experiencias: [],
  }
}

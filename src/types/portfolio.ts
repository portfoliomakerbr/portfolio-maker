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
  links: LinkItem[]
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

export interface FormacaoAcademica {
  id?: string
  ordem: number
  curso: string
  instituicao: string
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
  // Não aparece publicamente — só define pra onde vão as mensagens do
  // formulário de contato. Pode ser diferente do e-mail da conta e de
  // qualquer e-mail que o usuário decida deixar público como um link comum.
  emailContato: string
  fotoUrl: string | null
  fotoPath: string | null
  habilidades: string[]
  links: LinkItem[]
  projetos: Projeto[]
  experiencias: Experiencia[]
  formacoesAcademicas: FormacaoAcademica[]
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
    emailContato: '',
    fotoUrl: null,
    fotoPath: null,
    habilidades: [],
    links: [],
    projetos: [],
    experiencias: [],
    formacoesAcademicas: [],
  }
}

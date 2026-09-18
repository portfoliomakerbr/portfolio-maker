import { reactive, ref } from 'vue'
import { supabase } from '../lib/supabase'
import { criarPortfolioFormInput, type PortfolioFormInput } from '../types/portfolio'

/**
 * Estado do formulário de edição de portfólio. Usa reactive() (em vez de vários
 * ref() soltos) porque o objeto inteiro é lido/gravado como unidade ao carregar
 * dados existentes ou montar o payload de salvamento.
 */
export function usePortfolioForm(username: string) {
  const form = reactive<PortfolioFormInput>(criarPortfolioFormInput(username))
  const saving = ref(false)
  const saveError = ref<string | null>(null)

  function loadFrom(input: PortfolioFormInput) {
    Object.assign(form, input)
  }

  async function save() {
    saving.value = true
    saveError.value = null

    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      saving.value = false
      saveError.value = 'Sessão expirada. Faça login novamente.'
      return { error: saveError.value }
    }

    const { data, error } = await supabase.functions.invoke('portfolio-save', {
      body: form,
      headers: { Authorization: `Bearer ${session.access_token}` },
    })

    saving.value = false

    if (error) {
      saveError.value = error.message
      return { error: error.message }
    }

    return { error: null, data }
  }

  return { form, saving, saveError, loadFrom, save }
}

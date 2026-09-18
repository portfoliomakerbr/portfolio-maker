import { computed, reactive, ref } from 'vue'
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

  // Computed writable: a UI edita skills como texto livre separado por vírgula
  // (melhor UX para digitar tags do que um input por skill), mas o modelo de
  // dados real é string[]. O get/set aqui faz essa ponte nos dois sentidos.
  const habilidadesText = computed<string>({
    get() {
      return form.habilidades.join(', ')
    },
    set(value: string) {
      form.habilidades = Array.from(
        new Set(
          value
            .split(',')
            .map((s) => s.trim().toLowerCase())
            .filter(Boolean),
        ),
      )
    },
  })

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

  return { form, habilidadesText, saving, saveError, loadFrom, save }
}

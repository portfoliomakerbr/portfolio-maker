import { reactive } from 'vue'

interface ConfirmState {
  isOpen: boolean
  title: string
  message: string
  resolve: ((value: boolean) => void) | null
}

// Estado singleton em nível de módulo (não provide/inject): existe exatamente
// uma instância do diálogo de confirmação no app inteiro (renderizada uma vez
// em App.vue via <ConfirmDialog/>), então compartilhar o estado por import é
// mais simples que plumbing via injection para um único consumidor "global".
const state = reactive<ConfirmState>({
  isOpen: false,
  title: '',
  message: '',
  resolve: null,
})

export function useConfirmDialog() {
  function confirm(message: string, title = 'Confirmar'): Promise<boolean> {
    state.isOpen = true
    state.title = title
    state.message = message
    return new Promise((resolve) => {
      state.resolve = resolve
    })
  }

  function respond(value: boolean) {
    state.isOpen = false
    state.resolve?.(value)
    state.resolve = null
  }

  return { state, confirm, respond }
}

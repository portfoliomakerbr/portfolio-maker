import { onMounted, ref, watchEffect } from 'vue'

/**
 * Autosave de rascunho no localStorage. Usa watchEffect() (dependências
 * implícitas) de propósito, em contraste direto com useImageUpload.ts (que usa
 * watch() com dependência explícita): aqui queremos disparar sempre que
 * QUALQUER campo lido dentro do effect mudar, sem ter que listar cada um —
 * é exatamente o caso de uso que watchEffect resolve melhor que watch.
 */
export function useDraft<T extends object>(key: string, source: () => T, debounceMs = 800) {
  let timer: ReturnType<typeof setTimeout> | null = null
  const restored = ref(false)

  watchEffect(() => {
    const snapshot = JSON.stringify(source())
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      localStorage.setItem(key, snapshot)
    }, debounceMs)
  })

  function loadDraft(): T | null {
    try {
      const raw = localStorage.getItem(key)
      return raw ? (JSON.parse(raw) as T) : null
    } catch {
      return null
    }
  }

  function clearDraft() {
    localStorage.removeItem(key)
  }

  onMounted(() => {
    restored.value = localStorage.getItem(key) !== null
  })

  return { loadDraft, clearDraft, restored }
}

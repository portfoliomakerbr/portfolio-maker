import { onMounted, ref, watchEffect } from 'vue'

interface StoredDraft<T> {
  owner: string
  data: T
}

/**
 * Autosave de rascunho no localStorage. Usa watchEffect() (dependências
 * implícitas) de propósito, em contraste direto com useImageUpload.ts (que usa
 * watch() com dependência explícita): aqui queremos disparar sempre que
 * QUALQUER campo lido dentro do effect mudar, sem ter que listar cada um —
 * é exatamente o caso de uso que watchEffect resolve melhor que watch.
 *
 * `ownerId` marca de quem é o rascunho (id do usuário logado). localStorage
 * é por origem, não por conta — sem isso, um rascunho salvo por uma conta
 * "vazava" pro formulário vazio de outra conta testada na mesma aba/
 * navegador (mesmo sem nenhum dado do servidor exposto, só o autosave local).
 */
export function useDraft<T extends object>(key: string, source: () => T, ownerId: () => string | null, debounceMs = 800) {
  let timer: ReturnType<typeof setTimeout> | null = null
  const restored = ref(false)

  watchEffect(() => {
    const owner = ownerId()
    const snapshot = source()
    if (timer) clearTimeout(timer)
    if (!owner) return

    timer = setTimeout(() => {
      const stored: StoredDraft<T> = { owner, data: snapshot }
      localStorage.setItem(key, JSON.stringify(stored))
    }, debounceMs)
  })

  function loadDraft(): T | null {
    try {
      const raw = localStorage.getItem(key)
      if (!raw) return null
      const parsed = JSON.parse(raw) as StoredDraft<T>
      if (parsed.owner !== ownerId()) return null
      return parsed.data
    } catch {
      return null
    }
  }

  function clearDraft() {
    localStorage.removeItem(key)
  }

  onMounted(() => {
    try {
      const raw = localStorage.getItem(key)
      const parsed = raw ? (JSON.parse(raw) as StoredDraft<T>) : null
      restored.value = parsed !== null && parsed.owner === ownerId()
    } catch {
      restored.value = false
    }
  })

  return { loadDraft, clearDraft, restored }
}

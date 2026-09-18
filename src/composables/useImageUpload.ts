import { ref, watch } from 'vue'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

interface UploadResult {
  url: string
  path: string
}

/**
 * Upload de foto de perfil para o Storage. Usa watch() (dependência explícita
 * em `selectedFile`), não watchEffect(): o callback precisa do path do
 * arquivo ANTERIOR (para apagá-lo do Storage ao trocar de imagem), e watch()
 * dá acesso a esse valor através do parâmetro do próprio ref observado — não
 * faria sentido reescrever isso com rastreamento implícito de dependências.
 */
export function useImageUpload(previousPath: () => string | null, folder: 'foto') {
  const auth = useAuth()
  const selectedFile = ref<File | null>(null)
  const uploading = ref(false)
  const uploadError = ref<string | null>(null)
  const result = ref<UploadResult | null>(null)

  watch(selectedFile, async (file) => {
    if (!file || !auth.user.value) return

    uploading.value = true
    uploadError.value = null

    const oldPath = previousPath()
    const extension = file.name.split('.').pop() ?? 'jpg'
    const path = `${auth.user.value.id}/${folder}-${Date.now()}.${extension}`

    const { error: uploadErr } = await supabase.storage.from('portfolios').upload(path, file, {
      cacheControl: '3600',
      upsert: false,
    })

    if (uploadErr) {
      uploading.value = false
      uploadError.value = uploadErr.message
      return
    }

    const { data: publicUrlData } = supabase.storage.from('portfolios').getPublicUrl(path)
    result.value = { url: publicUrlData.publicUrl, path }

    if (oldPath) {
      await supabase.storage.from('portfolios').remove([oldPath])
    }

    uploading.value = false
  })

  function reset() {
    selectedFile.value = null
    result.value = null
    uploadError.value = null
  }

  return { selectedFile, uploading, uploadError, result, reset }
}

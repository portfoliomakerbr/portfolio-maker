<script setup lang="ts">
import { ref, useTemplateRef, watch } from 'vue'
import { useImageUpload } from '../../composables/useImageUpload'

const props = defineProps<{
  label: string
  currentUrl: string | null
  currentPath: string | null
  folder: 'foto' | 'background'
}>()

const emit = defineEmits<{ uploaded: [{ url: string; path: string }] }>()

const fileInput = useTemplateRef<HTMLInputElement>('fileInput')
const { selectedFile, uploading, uploadError, result, reset } = useImageUpload(
  () => props.currentPath,
  props.folder,
)

watch(result, (value) => {
  if (value) emit('uploaded', value)
})

function triggerPicker() {
  // Ref de template no <input type="file"> escondido: dispara o clique
  // programaticamente a partir de um botão estilizado, já que inputs de
  // arquivo nativos não são estilizáveis de forma consistente entre browsers.
  fileInput.value?.click()
}

function onFileChange(event: Event) {
  const target = event.target as HTMLInputElement
  selectedFile.value = target.files?.[0] ?? null
}

// Exposto ao pai (EditPortfolioView) para limpar o estado do uploader depois
// de um salvamento bem-sucedido, sem precisar de mais um par prop/emit só
// pra isso — é estado puramente imperativo/local do componente.
defineExpose({ reset })

const previewUrl = ref<string | null>(null)
watch(selectedFile, (file) => {
  previewUrl.value = file ? URL.createObjectURL(file) : null
})
</script>

<template>
  <div class="field">
    <label>{{ label }}</label>
    <div class="uploader">
      <img
        v-if="previewUrl || currentUrl"
        :src="previewUrl || currentUrl!"
        :alt="label"
        class="preview"
      />
      <div v-else class="preview preview-empty">sem imagem</div>

      <div class="actions">
        <button type="button" class="btn btn-secondary" :disabled="uploading" @click="triggerPicker">
          {{ uploading ? 'Enviando...' : 'Escolher imagem' }}
        </button>
        <input
          ref="fileInput"
          type="file"
          accept="image/*"
          class="hidden-input"
          @change="onFileChange"
        />
      </div>
    </div>
    <span v-if="uploadError" class="error-text">{{ uploadError }}</span>
  </div>
</template>

<style scoped>
.uploader {
  display: flex;
  align-items: center;
  gap: var(--space-4);
}

.preview {
  width: 88px;
  height: 88px;
  border-radius: var(--radius-md);
  object-fit: cover;
  border: 1px solid var(--color-border);
}

.preview-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  color: var(--color-text-muted);
  background: var(--color-accent-soft);
  text-align: center;
  padding: var(--space-2);
}

.hidden-input {
  display: none;
}
</style>

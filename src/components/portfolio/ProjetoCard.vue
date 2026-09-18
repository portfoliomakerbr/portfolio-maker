<script setup lang="ts">
import type { Projeto } from '../../types/portfolio'
import { useConfirmDialog } from '../../composables/useConfirmDialog'

// defineModel(): two-way binding da linha inteira do projeto de volta pro
// array no componente pai (ProjetosEditor) — o v-model aqui evita ter que
// declarar props+emit('update:modelValue') manualmente para cada campo.
const projeto = defineModel<Projeto>({ required: true })

defineProps<{ index: number; isFirst: boolean; isLast: boolean }>()
const emit = defineEmits<{ moveUp: []; moveDown: []; remove: [] }>()

const { confirm } = useConfirmDialog()

async function handleRemove() {
  const ok = await confirm(`Remover o projeto "${projeto.value.nome || 'sem nome'}"?`, 'Remover projeto')
  if (ok) emit('remove')
}

function tecnologiasText(): string {
  return projeto.value.tecnologias.join(', ')
}

function setTecnologias(value: string) {
  projeto.value.tecnologias = value
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
}
</script>

<template>
  <div class="card projeto-card">
    <div class="row-header">
      <strong>Projeto {{ index + 1 }}</strong>
      <div class="row-actions">
        <button type="button" class="btn btn-icon" :disabled="isFirst" @click="emit('moveUp')">↑</button>
        <button type="button" class="btn btn-icon" :disabled="isLast" @click="emit('moveDown')">↓</button>
        <button type="button" class="btn btn-danger" @click="handleRemove">Remover</button>
      </div>
    </div>

    <div class="field">
      <label>Nome</label>
      <input v-model="projeto.nome" class="input" placeholder="Nome do projeto" />
    </div>

    <div class="field">
      <label>Descrição</label>
      <textarea v-model="projeto.descricao" class="input" rows="3" />
    </div>

    <div class="grid-2">
      <div class="field">
        <label>Link do projeto</label>
        <input v-model="projeto.linkDoProjeto" class="input" placeholder="https://..." />
      </div>
      <div class="field">
        <label>Repositório</label>
        <input v-model="projeto.linkDoRepositorio" class="input" placeholder="https://github.com/..." />
      </div>
    </div>

    <div class="field">
      <label>YouTube (opcional)</label>
      <input v-model="projeto.linkYoutube" class="input" placeholder="https://youtube.com/..." />
    </div>

    <div class="field">
      <label>Tecnologias (separadas por vírgula)</label>
      <input
        :value="tecnologiasText()"
        class="input"
        placeholder="vue, typescript, supabase"
        @input="setTecnologias(($event.target as HTMLInputElement).value)"
      />
    </div>
  </div>
</template>

<style scoped>
.projeto-card {
  margin-bottom: var(--space-4);
}

.row-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-4);
}

.row-actions {
  display: flex;
  gap: var(--space-2);
}

.grid-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-4);
}

@media (max-width: 560px) {
  .grid-2 {
    grid-template-columns: 1fr;
  }
}
</style>

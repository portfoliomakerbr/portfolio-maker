<script setup lang="ts">
import { watch } from 'vue'
import type { FormacaoAcademica } from '../../types/portfolio'
import { useConfirmDialog } from '../../composables/useConfirmDialog'

const formacao = defineModel<FormacaoAcademica>({ required: true })

defineProps<{ index: number; isFirst: boolean; isLast: boolean }>()
const emit = defineEmits<{ moveUp: []; moveDown: []; remove: [] }>()

const { confirm } = useConfirmDialog()

async function handleRemove() {
  const ok = await confirm(
    `Remover a formação em "${formacao.value.instituicao || 'sem nome'}"?`,
    'Remover formação acadêmica',
  )
  if (ok) emit('remove')
}

watch(
  () => formacao.value.atual,
  (atual) => {
    if (atual) formacao.value.dataFim = null
  },
)
</script>

<template>
  <div class="card formacao-card">
    <div class="row-header">
      <strong>Formação {{ index + 1 }}</strong>
      <div class="row-actions">
        <button type="button" class="btn btn-icon" :disabled="isFirst" @click="emit('moveUp')">↑</button>
        <button type="button" class="btn btn-icon" :disabled="isLast" @click="emit('moveDown')">↓</button>
        <button type="button" class="btn btn-danger" @click="handleRemove">Remover</button>
      </div>
    </div>

    <div class="grid-2">
      <div class="field">
        <label>Curso</label>
        <input v-model="formacao.curso" class="input" placeholder="Análise e Desenvolvimento de Sistemas" />
      </div>
      <div class="field">
        <label>Instituição</label>
        <input v-model="formacao.instituicao" class="input" placeholder="FATEC" />
      </div>
    </div>

    <div class="field">
      <label>Descrição (opcional)</label>
      <textarea v-model="formacao.descricao" class="input" rows="3" />
    </div>

    <div class="grid-2">
      <div class="field">
        <label>Início</label>
        <input v-model="formacao.dataInicio" class="input" type="date" />
      </div>
      <div class="field">
        <label>Término</label>
        <input
          v-model="formacao.dataFim"
          class="input"
          type="date"
          :disabled="formacao.atual"
        />
      </div>
    </div>

    <label class="checkbox">
      <input v-model="formacao.atual" type="checkbox" />
      Cursando atualmente
    </label>
  </div>
</template>

<style scoped>
.formacao-card {
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

.checkbox {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: 0.9rem;
  cursor: pointer;
}

@media (max-width: 560px) {
  .grid-2 {
    grid-template-columns: 1fr;
  }
}
</style>

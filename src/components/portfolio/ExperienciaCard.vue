<script setup lang="ts">
import { watch } from 'vue'
import type { Experiencia } from '../../types/portfolio'
import { useConfirmDialog } from '../../composables/useConfirmDialog'

const experiencia = defineModel<Experiencia>({ required: true })

defineProps<{ index: number; isFirst: boolean; isLast: boolean }>()
const emit = defineEmits<{ moveUp: []; moveDown: []; remove: [] }>()

const { confirm } = useConfirmDialog()

async function handleRemove() {
  const ok = await confirm(
    `Remover a experiência em "${experiencia.value.empresa || 'sem nome'}"?`,
    'Remover experiência',
  )
  if (ok) emit('remove')
}

// Cargo atual não deve ter data de término preenchida — mantém os dois campos
// consistentes automaticamente quando o usuário marca/desmarca o checkbox.
watch(
  () => experiencia.value.atual,
  (atual) => {
    if (atual) experiencia.value.dataFim = null
  },
)
</script>

<template>
  <div class="card experiencia-card">
    <div class="row-header">
      <strong>Experiência {{ index + 1 }}</strong>
      <div class="row-actions">
        <button type="button" class="btn btn-icon" :disabled="isFirst" @click="emit('moveUp')">↑</button>
        <button type="button" class="btn btn-icon" :disabled="isLast" @click="emit('moveDown')">↓</button>
        <button type="button" class="btn btn-danger" @click="handleRemove">Remover</button>
      </div>
    </div>

    <div class="grid-2">
      <div class="field">
        <label>Cargo</label>
        <input v-model="experiencia.nome" class="input" placeholder="Desenvolvedor de software" />
      </div>
      <div class="field">
        <label>Empresa</label>
        <input v-model="experiencia.empresa" class="input" placeholder="Nome da empresa" />
      </div>
    </div>

    <div class="field">
      <label>Descrição</label>
      <textarea v-model="experiencia.descricao" class="input" rows="3" />
    </div>

    <div class="grid-2">
      <div class="field">
        <label>Início</label>
        <input v-model="experiencia.dataInicio" class="input" type="date" />
      </div>
      <div class="field">
        <label>Término</label>
        <input
          v-model="experiencia.dataFim"
          class="input"
          type="date"
          :disabled="experiencia.atual"
        />
      </div>
    </div>

    <label class="checkbox">
      <input v-model="experiencia.atual" type="checkbox" />
      Trabalho atual
    </label>
  </div>
</template>

<style scoped>
.experiencia-card {
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

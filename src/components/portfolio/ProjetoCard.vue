<script setup lang="ts">
import type { LinkItem, Projeto } from '../../types/portfolio'
import { useConfirmDialog } from '../../composables/useConfirmDialog'
import { linkRowError } from '../../lib/validation'
import TagInput from '../ui/TagInput.vue'
import { SKILL_SLUGS } from '../../lib/icons'

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

// Links livres por projeto (site, repositório, vídeo, etc.) — sem limite de
// quantidade e sem campos fixos, mesmo padrão usado nos links de contato.
function addLink() {
  projeto.value.links = [...projeto.value.links, { nome: '', url: '', ordem: projeto.value.links.length }]
}

function removeLink(link: LinkItem) {
  projeto.value.links = projeto.value.links.filter((l) => l !== link)
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

    <div class="field">
      <label>Links (site, repositório, vídeo, etc.)</label>
      <div v-if="projeto.links.length" class="links-list">
        <div v-for="(link, linkIndex) in projeto.links" :key="linkIndex" class="link-row">
          <input v-model="link.nome" class="input" placeholder="Nome (ex.: Ver projeto)" />
          <input v-model="link.url" class="input" placeholder="https://..." />
          <button type="button" class="btn btn-icon" @click="removeLink(link)" aria-label="Remover link">✕</button>
          <span v-if="linkRowError(link)" class="error-text link-row-error">{{ linkRowError(link) }}</span>
        </div>
      </div>
      <button type="button" class="btn btn-secondary" @click="addLink">+ Adicionar link</button>
    </div>

    <div class="field">
      <label>Tecnologias</label>
      <TagInput v-model="projeto.tecnologias" placeholder="digite e pressione Enter" :suggestions="SKILL_SLUGS" />
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

.links-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  margin-bottom: var(--space-3);
}

.link-row {
  display: grid;
  grid-template-columns: 1fr 2fr auto;
  gap: var(--space-2);
}

.link-row-error {
  grid-column: 1 / -1;
}

@media (max-width: 560px) {
  .link-row {
    grid-template-columns: 1fr;
  }
}
</style>

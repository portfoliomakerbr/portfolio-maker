<script setup lang="ts">
import type { LinkItem } from '../../types/portfolio'
import { useOrdenableList } from '../../composables/useOrdenableList'

const links = defineModel<LinkItem[]>({ required: true })
const { adicionar, remover } = useOrdenableList(links)

function addLink() {
  adicionar({ nome: '', url: '', ordem: 0 })
}
</script>

<template>
  <div>
    <div v-for="(link, index) in links" :key="index" class="link-row">
      <input v-model="link.nome" class="input" placeholder="linkedin" />
      <input v-model="link.url" class="input" placeholder="https://..." />
      <button type="button" class="btn btn-icon" @click="remover(index)" aria-label="Remover link">✕</button>
    </div>
    <button type="button" class="btn btn-secondary" @click="addLink">+ Adicionar link</button>
  </div>
</template>

<style scoped>
.link-row {
  display: grid;
  grid-template-columns: 1fr 2fr auto;
  gap: var(--space-2);
  margin-bottom: var(--space-2);
}
</style>

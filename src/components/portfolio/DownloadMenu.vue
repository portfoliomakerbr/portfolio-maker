<script setup lang="ts">
import { onMounted, onUnmounted, ref, useTemplateRef } from 'vue'
import type { Portfolio } from '../../types/portfolio'
import { exportPortfolioPdf, exportPortfolioWord } from '../../lib/exportPortfolio'

const props = defineProps<{ portfolio: Portfolio }>()

const open = ref(false)
const menuRoot = useTemplateRef<HTMLElement>('menuRoot')

function toggle() {
  open.value = !open.value
}

async function downloadPdf() {
  open.value = false
  await exportPortfolioPdf(props.portfolio)
}

function downloadWord() {
  exportPortfolioWord(props.portfolio)
  open.value = false
}

// Fecha o menu ao clicar fora dele — listener global registrado só enquanto
// o componente existe (onMounted/onUnmounted em par), padrão comum pra
// dropdowns que não usam um <dialog> nativo.
function onClickOutside(event: MouseEvent) {
  if (open.value && menuRoot.value && !menuRoot.value.contains(event.target as Node)) {
    open.value = false
  }
}

onMounted(() => document.addEventListener('click', onClickOutside))
onUnmounted(() => document.removeEventListener('click', onClickOutside))
</script>

<template>
  <div ref="menuRoot" class="download-menu">
    <button type="button" class="btn btn-secondary" @click="toggle">Baixar ⌄</button>
    <div v-if="open" class="menu">
      <button type="button" class="menu-item" @click="downloadPdf">📄 PDF</button>
      <button type="button" class="menu-item" @click="downloadWord">📝 Word</button>
    </div>
  </div>
</template>

<style scoped>
.download-menu {
  position: relative;
}

.menu {
  position: absolute;
  right: 0;
  top: calc(100% + var(--space-2));
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-md);
  min-width: 140px;
  overflow: hidden;
  z-index: 15;
}

.menu-item {
  display: block;
  width: 100%;
  text-align: left;
  padding: var(--space-3) var(--space-4);
  background: none;
  border: none;
  color: var(--color-text);
  font-size: 0.9rem;
  cursor: pointer;
}

.menu-item:hover {
  background: var(--color-accent-soft);
  color: var(--color-accent);
}
</style>

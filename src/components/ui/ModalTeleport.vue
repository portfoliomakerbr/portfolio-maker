<script setup lang="ts">
// Teleport pro final do <body>: os cards de edição de projeto/experiência usam
// overflow:hidden (pra recortar preview de imagem com border-radius), então um
// modal posicionado dentro dessa árvore ficaria clipado. Teleport tira o modal
// do fluxo do DOM local mantendo o estado/reatividade do componente pai.
defineProps<{ open: boolean }>()
</script>

<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div v-if="open" class="modal-backdrop">
        <div class="modal-panel" role="dialog" aria-modal="true">
          <slot />
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-4);
  z-index: 100;
}

.modal-panel {
  background: var(--color-surface);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  padding: var(--space-5);
  max-width: 420px;
  width: 100%;
}

.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.15s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}
</style>

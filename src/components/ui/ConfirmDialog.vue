<script setup lang="ts">
import { useConfirmDialog } from '../../composables/useConfirmDialog'
import ModalTeleport from './ModalTeleport.vue'

const { state, respond } = useConfirmDialog()
</script>

<template>
  <ModalTeleport :open="state.isOpen">
    <h3>{{ state.title }}</h3>
    <p class="muted" style="margin: var(--space-3) 0 var(--space-5)">{{ state.message }}</p>
    <div class="modal-actions">
      <button class="btn btn-secondary" @click="respond(false)">Cancelar</button>
      <button class="btn btn-danger" @click="respond(true)">Confirmar</button>
    </div>
  </ModalTeleport>
</template>

<style scoped>
.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-3);
}
</style>

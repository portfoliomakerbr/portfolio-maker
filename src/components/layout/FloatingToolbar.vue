<script setup lang="ts"></script>

<template>
  <div class="floating-toolbar no-print">
    <slot />
  </div>
</template>

<style scoped>
.floating-toolbar {
  position: sticky;
  /* --app-header-height é medida de verdade em AppHeader.vue (ResizeObserver)
     porque a altura do header varia demais entre telas — a nav quebra em
     várias linhas no mobile, principalmente autenticado com o badge de
     e-mail. Um valor fixo aqui fazia a barra flutuante sobrepor o header
     sempre que ele crescia além do que foi chutado. O fallback de 64px só
     cobre o instante antes do primeiro ResizeObserver rodar. */
  top: calc(var(--app-header-height, 64px) + var(--space-3));
  z-index: 15;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: var(--space-3);
  margin-bottom: var(--space-4);
}

@media (max-width: 560px) {
  .floating-toolbar {
    justify-content: flex-start;
  }

  .floating-toolbar > :deep(*) {
    flex: 1 1 auto;
  }
}
</style>

<script setup lang="ts"></script>

<template>
  <!-- sticky (não fixed): ocupa espaço no fluxo normal do topo da página e
       só "gruda" quando o usuário rola além dela — assim tanto a view do
       portfólio (Editar portfólio / Baixar) quanto a de edição (Voltar /
       Salvar) conseguem usar o mesmo componente sem sobrepor o conteúdo
       logo abaixo, o que aconteceria com position: fixed puro. -->
  <div class="floating-toolbar no-print">
    <slot />
  </div>
</template>

<style scoped>
.floating-toolbar {
  position: sticky;
  top: calc(var(--space-3) + 64px);
  z-index: 15;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: var(--space-3);
  margin-bottom: var(--space-4);
}
</style>

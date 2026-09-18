<script setup lang="ts">
// v-model liga direto na computed writable `habilidadesText` de usePortfolioForm
// (string separada por vírgula <-> string[] no modelo de dados real).
const text = defineModel<string>({ required: true })
</script>

<template>
  <div class="field">
    <label>Habilidades (separadas por vírgula)</label>
    <input v-model="text" class="input" placeholder="java, spring, vue, postgres" />
    <p class="muted hint">Ex.: java, spring, vue, postgres</p>
  </div>
</template>

<style scoped>
.hint {
  font-size: 0.8rem;
}
</style>

<script setup lang="ts">
import TagInput from '../ui/TagInput.vue'
import { SKILL_SLUGS } from '../../lib/icons'

const skills = defineModel<string[]>({ required: true })
</script>

<template>
  <div class="field">
    <label>Habilidades</label>
    <TagInput v-model="skills" placeholder="digite e pressione Enter" :suggestions="SKILL_SLUGS" />
    <p class="muted hint">Nomes reconhecidos (java, vue, postgres...) ganham ícone automaticamente.</p>
  </div>
</template>

<style scoped>
.hint {
  font-size: 0.8rem;
}
</style>

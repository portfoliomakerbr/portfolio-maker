<script setup lang="ts">
import { ref } from 'vue'
import { isKnownSkill, skillIconUrl } from '../../lib/icons'

const props = withDefaults(
  defineProps<{
    placeholder?: string
    suggestions?: readonly string[]
    showIcons?: boolean
  }>(),
  { showIcons: true },
)

const tags = defineModel<string[]>({ required: true })
const draft = ref('')
const listId = `tag-suggestions-${Math.random().toString(36).slice(2)}`

function addTag() {
  const value = draft.value.trim().toLowerCase()
  if (!value) return
  if (!tags.value.includes(value)) {
    tags.value = [...tags.value, value]
  }
  draft.value = ''
}

function removeTag(index: number) {
  tags.value = tags.value.filter((_, i) => i !== index)
}

// Enter adiciona a tag em vez de vírgula — sem isso, digitar "vue, react"
// como texto livre engolia vírgulas/espaços digitados no meio (ver histórico
// do bug em ProjetoCard.vue). Backspace com o campo vazio remove a última
// tag, atalho comum em inputs desse tipo (Gmail, GitHub Issues, etc.).
function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Enter') {
    event.preventDefault()
    addTag()
  } else if (event.key === 'Backspace' && draft.value === '' && tags.value.length > 0) {
    removeTag(tags.value.length - 1)
  }
}
</script>

<template>
  <div class="tag-input">
    <span v-for="(tag, index) in tags" :key="tag" class="tag tag-removable">
      <img
        v-if="props.showIcons && isKnownSkill(tag)"
        :src="skillIconUrl(tag)"
        :alt="tag"
        class="tag-icon"
      />
      {{ tag }}
      <button type="button" class="tag-remove" :aria-label="`Remover ${tag}`" @click="removeTag(index)">
        ×
      </button>
    </span>

    <input
      v-model="draft"
      class="input tag-draft"
      :list="suggestions ? listId : undefined"
      :placeholder="placeholder ?? 'Digite e pressione Enter'"
      @keydown="onKeydown"
      @blur="addTag"
    />
    <datalist v-if="suggestions" :id="listId">
      <option v-for="s in suggestions" :key="s" :value="s" />
    </datalist>
  </div>
</template>

<style scoped>
.tag-input {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-2);
}

.tag-removable {
  padding-right: var(--space-1);
}

.tag-icon {
  width: 16px;
  height: 16px;
}

.tag-remove {
  background: none;
  border: none;
  color: inherit;
  cursor: pointer;
  font-size: 1rem;
  line-height: 1;
  padding: 0 0 0 var(--space-1);
}

.tag-draft {
  flex: 1;
  min-width: 160px;
}
</style>

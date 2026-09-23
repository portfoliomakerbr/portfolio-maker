<script setup lang="ts">
import { onUnmounted, ref, useTemplateRef } from 'vue'
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

// Reordenar arrastando: Pointer Events (não HTML5 Drag and Drop) porque
// funcionam igual pra mouse e toque com um único caminho de código — a API
// nativa de drag-and-drop do HTML5 simplesmente não dispara em telas de
// toque sem gambiarra extra, e este app é usado do celular também.
//
// Em vez de manter um índice/ref por chip (mais estado pra ficar dessincronizado
// conforme tags são adicionadas/removidas durante o drag), cada pointermove
// consulta o DOM na hora (querySelectorAll('.tag')) pra achar sobre qual chip
// o ponteiro está — a lista é pequena o bastante (dezenas de tags no máximo)
// pra isso não pesar.
const containerRef = useTemplateRef<HTMLElement>('container')
const draggingIndex = ref<number | null>(null)
let activePointerId: number | null = null

function stopListening() {
  window.removeEventListener('pointermove', onPointerMove)
  window.removeEventListener('pointerup', endDrag)
  window.removeEventListener('pointercancel', endDrag)
}

function startDrag(event: PointerEvent, index: number) {
  if (event.button !== 0 && event.pointerType === 'mouse') return
  if ((event.target as HTMLElement).closest('.tag-remove')) return

  // Se um drag anterior nunca recebeu um pointerup/pointercancel com o
  // pointerId certo (ex.: perdido pelo navegador), os listeners globais
  // ficariam pendurados pra sempre e um novo drag passaria a rodar em cima
  // do estado velho — força a limpeza antes de começar um novo.
  stopListening()

  activePointerId = event.pointerId
  draggingIndex.value = index
  window.addEventListener('pointermove', onPointerMove)
  window.addEventListener('pointerup', endDrag)
  window.addEventListener('pointercancel', endDrag)
}

function onPointerMove(event: PointerEvent) {
  if (event.pointerId !== activePointerId || draggingIndex.value === null) return
  event.preventDefault()

  const from = draggingIndex.value
  const chips = Array.from(containerRef.value?.querySelectorAll<HTMLElement>('.tag') ?? [])

  for (let i = 0; i < chips.length; i++) {
    if (i === from) continue
    const rect = chips[i].getBoundingClientRect()
    const over =
      event.clientX >= rect.left && event.clientX <= rect.right && event.clientY >= rect.top && event.clientY <= rect.bottom
    if (over) {
      const copy = [...tags.value]
      const [moved] = copy.splice(from, 1)
      copy.splice(i, 0, moved)
      tags.value = copy
      draggingIndex.value = i
      break
    }
  }
}

function endDrag(event: PointerEvent) {
  if (event.pointerId !== activePointerId) return
  activePointerId = null
  draggingIndex.value = null
  stopListening()
}

onUnmounted(stopListening)
</script>

<template>
  <div ref="container" class="tag-input">
    <span
      v-for="(tag, index) in tags"
      :key="tag"
      class="tag tag-removable"
      :class="{ dragging: draggingIndex === index }"
      @pointerdown="startDrag($event, index)"
    >
      <span class="tag-handle" aria-hidden="true">⠿</span>
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
  cursor: grab;
  touch-action: none;
  user-select: none;
}

.tag-removable.dragging {
  cursor: grabbing;
  opacity: 0.5;
}

.tag-handle {
  color: var(--color-text-muted);
  font-size: 0.7rem;
  letter-spacing: -1px;
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

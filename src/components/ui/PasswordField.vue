<script setup lang="ts">
import { ref } from 'vue'

withDefaults(
  defineProps<{
    label?: string
    autocomplete?: string
    required?: boolean
    minlength?: number
    disabled?: boolean
  }>(),
  { required: false },
)

const model = defineModel<string>({ default: '' })

const visible = ref(false)
const blinking = ref(false)

// Pisca o ícone ao trocar de estado (scaleY rápido no SVG via classe
// temporária) — feedback visual de que o clique registrou, não só texto
// mudando de "Mostrar" pra "Esconder".
function toggle() {
  visible.value = !visible.value
  blinking.value = true
  window.setTimeout(() => {
    blinking.value = false
  }, 320)
}
</script>

<template>
  <div class="field">
    <label v-if="label">{{ label }}</label>
    <div class="password-field">
      <input
        v-model="model"
        class="input"
        :type="visible ? 'text' : 'password'"
        :autocomplete="autocomplete"
        :required="required"
        :minlength="minlength"
        :disabled="disabled"
      />
      <button
        type="button"
        class="eye-btn"
        :class="{ blink: blinking }"
        :disabled="disabled"
        :aria-label="visible ? 'Esconder senha' : 'Mostrar senha'"
        :aria-pressed="visible"
        @click="toggle"
      >
        <svg viewBox="0 0 24 16" class="eye-svg" aria-hidden="true">
          <path
            class="eye-outline"
            d="M1 8C3.5 3 7.5 1 12 1s8.5 2 11 7c-2.5 5-6.5 7-11 7S3.5 13 1 8Z"
          />
          <circle v-if="visible" cx="12" cy="8" r="3" class="eye-pupil" />
          <line v-else x1="3" y1="13.5" x2="21" y2="2.5" class="eye-slash" />
        </svg>
      </button>
    </div>
  </div>
</template>

<style scoped>
.password-field {
  position: relative;
}

.password-field .input {
  padding-right: 2.75rem;
}

.eye-btn {
  position: absolute;
  top: 50%;
  right: var(--space-2);
  transform: translateY(-50%);
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 0;
  background: transparent;
  color: var(--color-text-muted);
  cursor: pointer;
  padding: 0;
}

.eye-btn:hover {
  color: var(--color-accent);
}

.eye-btn:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.eye-svg {
  width: 22px;
  height: 15px;
  transform-origin: center;
}

.eye-outline {
  fill: none;
  stroke: currentColor;
  stroke-width: 1.6;
  stroke-linejoin: round;
}

.eye-pupil {
  fill: currentColor;
}

.eye-slash {
  stroke: currentColor;
  stroke-width: 1.6;
  stroke-linecap: round;
}

@keyframes eye-blink {
  0%,
  100% {
    transform: scaleY(1);
  }
  50% {
    transform: scaleY(0.1);
  }
}

.eye-btn.blink .eye-svg {
  animation: eye-blink 0.32s ease;
}
</style>

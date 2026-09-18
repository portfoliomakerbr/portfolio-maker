<script setup lang="ts">
import { computed, onUnmounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuth } from '../composables/useAuth'

const route = useRoute()
const router = useRouter()
const { signIn, signInWithGoogle } = useAuth()

const email = ref('')
const password = ref('')
const error = ref<string | null>(null)
const loading = ref(false)
const remainingAttempts = ref<number | null>(null)
const resetInSeconds = ref<number | null>(null)

// Contagem regressiva do bloqueio temporário. Timer local simples (setInterval
// + limpeza em onUnmounted) — não precisa de composable próprio pra um estado
// que só essa tela usa.
const lockedForSeconds = ref<number | null>(null)
let countdownTimer: ReturnType<typeof setInterval> | null = null

const lockedMinutesLabel = computed(() => {
  if (lockedForSeconds.value === null) return ''
  const minutes = Math.floor(lockedForSeconds.value / 60)
  const seconds = lockedForSeconds.value % 60
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
})

function startCountdown(seconds: number) {
  lockedForSeconds.value = seconds
  if (countdownTimer) clearInterval(countdownTimer)
  countdownTimer = setInterval(() => {
    if (lockedForSeconds.value === null) return
    lockedForSeconds.value -= 1
    if (lockedForSeconds.value <= 0) {
      lockedForSeconds.value = null
      if (countdownTimer) clearInterval(countdownTimer)
    }
  }, 1000)
}

onUnmounted(() => {
  if (countdownTimer) clearInterval(countdownTimer)
})

async function handleSubmit() {
  loading.value = true
  error.value = null
  remainingAttempts.value = null
  resetInSeconds.value = null

  const result = await signIn(email.value, password.value)
  loading.value = false

  if (result.error) {
    error.value = result.error
    if (result.locked && result.lockedForSeconds) {
      startCountdown(result.lockedForSeconds)
    } else {
      remainingAttempts.value = result.remainingAttempts ?? null
      resetInSeconds.value = result.resetInSeconds ?? null
    }
    return
  }

  const redirect = (route.query.redirect as string) || '/edit'
  router.push(redirect)
}

async function handleGoogle() {
  error.value = null
  const { error: googleError } = await signInWithGoogle()
  if (googleError) error.value = googleError
}
</script>

<template>
  <div class="page narrow">
    <h1>Entrar</h1>
    <form class="card" @submit.prevent="handleSubmit">
      <div class="field">
        <label>E-mail</label>
        <input v-model="email" class="input" type="email" required autocomplete="email" />
      </div>
      <div class="field">
        <label>Senha</label>
        <input
          v-model="password"
          class="input"
          type="password"
          required
          autocomplete="current-password"
          :disabled="lockedForSeconds !== null"
        />
      </div>

      <p v-if="error" class="error-text">{{ error }}</p>

      <p v-if="lockedForSeconds !== null" class="error-text">
        Tente novamente em <strong>{{ lockedMinutesLabel }}</strong>.
      </p>
      <p v-else-if="remainingAttempts !== null" class="muted attempts-hint">
        Resta{{ remainingAttempts === 1 ? '' : 'm' }} <strong>{{ remainingAttempts }}</strong>
        tentativa{{ remainingAttempts === 1 ? '' : 's' }} antes do bloqueio temporário.
        <span v-if="resetInSeconds">A contagem reseta sozinha após {{ Math.round(resetInSeconds / 60) }} min sem tentativas.</span>
      </p>

      <button class="btn btn-primary" type="submit" :disabled="loading || lockedForSeconds !== null">
        {{ loading ? 'Entrando...' : 'Entrar' }}
      </button>

      <button type="button" class="btn btn-secondary google-btn" @click="handleGoogle">
        Entrar com Google
      </button>

      <p class="links-row muted">
        <router-link to="/forgot-password">Esqueci minha senha</router-link>
        ·
        <router-link to="/signup">Criar conta</router-link>
      </p>
    </form>
  </div>
</template>

<style scoped>
.narrow {
  max-width: 420px;
}

.google-btn {
  width: 100%;
  justify-content: center;
  margin-top: var(--space-3);
}

.attempts-hint {
  font-size: 0.85rem;
}

.links-row {
  margin-top: var(--space-4);
  display: flex;
  gap: var(--space-2);
  font-size: 0.85rem;
}
</style>

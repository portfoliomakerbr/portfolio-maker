<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '../composables/useAuth'

const router = useRouter()
const { signUp, signInWithGoogle } = useAuth()

const email = ref('')
const password = ref('')
const error = ref<string | null>(null)
const loading = ref(false)
const done = ref(false)

async function handleSubmit() {
  loading.value = true
  error.value = null
  const { error: signUpError } = await signUp(email.value, password.value)
  loading.value = false

  if (signUpError) {
    error.value = signUpError
    return
  }
  done.value = true
}

async function handleGoogle() {
  error.value = null
  const { error: googleError } = await signInWithGoogle()
  if (googleError) error.value = googleError
}
</script>

<template>
  <div class="page narrow">
    <h1>Criar conta</h1>

    <div v-if="done" class="card">
      <p>Conta criada! Confirme seu e-mail (se a confirmação estiver ativada no projeto) e depois faça login.</p>
      <button class="btn btn-primary" @click="router.push('/login')">Ir para login</button>
    </div>

    <form v-else class="card" @submit.prevent="handleSubmit">
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
          minlength="6"
          autocomplete="new-password"
        />
      </div>
      <p v-if="error" class="error-text">{{ error }}</p>
      <button class="btn btn-primary" type="submit" :disabled="loading">
        {{ loading ? 'Criando...' : 'Criar conta' }}
      </button>

      <button type="button" class="btn btn-secondary google-btn" @click="handleGoogle">
        Criar conta com Google
      </button>
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
</style>

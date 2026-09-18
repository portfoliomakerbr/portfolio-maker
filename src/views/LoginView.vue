<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuth } from '../composables/useAuth'

const route = useRoute()
const router = useRouter()
const { signIn } = useAuth()

const email = ref('')
const password = ref('')
const error = ref<string | null>(null)
const loading = ref(false)

async function handleSubmit() {
  loading.value = true
  error.value = null
  const { error: signInError } = await signIn(email.value, password.value)
  loading.value = false

  if (signInError) {
    error.value = signInError
    return
  }

  const redirect = (route.query.redirect as string) || '/edit'
  router.push(redirect)
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
        <input v-model="password" class="input" type="password" required autocomplete="current-password" />
      </div>
      <p v-if="error" class="error-text">{{ error }}</p>
      <button class="btn btn-primary" type="submit" :disabled="loading">
        {{ loading ? 'Entrando...' : 'Entrar' }}
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

.links-row {
  margin-top: var(--space-4);
  display: flex;
  gap: var(--space-2);
  font-size: 0.85rem;
}
</style>

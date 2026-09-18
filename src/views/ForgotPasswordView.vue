<script setup lang="ts">
import { ref } from 'vue'
import { useAuth } from '../composables/useAuth'

const { requestPasswordReset } = useAuth()
const email = ref('')
const error = ref<string | null>(null)
const sent = ref(false)
const loading = ref(false)

async function handleSubmit() {
  loading.value = true
  error.value = null
  const { error: requestError } = await requestPasswordReset(email.value)
  loading.value = false

  if (requestError) {
    error.value = requestError
    return
  }
  sent.value = true
}
</script>

<template>
  <div class="page narrow">
    <h1>Esqueci minha senha</h1>

    <div v-if="sent" class="card">
      <p>Se esse e-mail estiver cadastrado, você vai receber um link para redefinir a senha.</p>
    </div>

    <form v-else class="card" @submit.prevent="handleSubmit">
      <div class="field">
        <label>E-mail</label>
        <input v-model="email" class="input" type="email" required autocomplete="email" />
      </div>
      <p v-if="error" class="error-text">{{ error }}</p>
      <button class="btn btn-primary" type="submit" :disabled="loading">
        {{ loading ? 'Enviando...' : 'Enviar link' }}
      </button>
    </form>
  </div>
</template>

<style scoped>
.narrow {
  max-width: 420px;
}
</style>

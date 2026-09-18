<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '../composables/useAuth'
import PasswordField from '../components/ui/PasswordField.vue'

const router = useRouter()
const { updatePassword } = useAuth()

const password = ref('')
const error = ref<string | null>(null)
const done = ref(false)
const loading = ref(false)

async function handleSubmit() {
  loading.value = true
  error.value = null
  const { error: updateError } = await updatePassword(password.value)
  loading.value = false

  if (updateError) {
    error.value = updateError
    return
  }
  done.value = true
  setTimeout(() => router.push('/login'), 1500)
}
</script>

<template>
  <div class="page narrow">
    <h1>Nova senha</h1>

    <div v-if="done" class="card">
      <p>Senha atualizada! Redirecionando para o login...</p>
    </div>

    <form v-else class="card" @submit.prevent="handleSubmit">
      <PasswordField v-model="password" label="Nova senha" required :minlength="6" autocomplete="new-password" />
      <p v-if="error" class="error-text">{{ error }}</p>
      <button class="btn btn-primary" type="submit" :disabled="loading">
        {{ loading ? 'Salvando...' : 'Salvar nova senha' }}
      </button>
    </form>
  </div>
</template>

<style scoped>
.narrow {
  max-width: 420px;
}
</style>

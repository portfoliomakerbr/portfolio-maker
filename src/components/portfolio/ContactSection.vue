<script setup lang="ts">
import { reactive, ref } from 'vue'
import type { Portfolio } from '../../types/portfolio'
import { faviconUrl } from '../../lib/icons'
import { isContactFormConfigured, sendContactMessage } from '../../lib/emailjs'

const props = defineProps<{ portfolio: Portfolio }>()

const copiedKey = ref<string | null>(null)
let copiedTimer: ReturnType<typeof setTimeout> | null = null

async function copy(key: string, value: string) {
  try {
    await navigator.clipboard.writeText(value)
    copiedKey.value = key
    if (copiedTimer) clearTimeout(copiedTimer)
    copiedTimer = setTimeout(() => {
      copiedKey.value = null
    }, 1500)
  } catch {
    // Sem permissão de clipboard (ex.: contexto não-seguro) — sem feedback,
    // mas também sem quebrar a página por causa de um botão de copiar.
  }
}

const form = reactive({ nome: '', email: '', mensagem: '' })
const sending = ref(false)
const sent = ref(false)
const sendError = ref<string | null>(null)

async function handleSubmit() {
  sending.value = true
  sendError.value = null

  try {
    await sendContactMessage({
      fromName: form.nome,
      fromEmail: form.email,
      message: form.mensagem,
      portfolioOwnerName: props.portfolio.nome,
      portfolioOwnerEmail: props.portfolio.emailContato,
      portfolioUsername: props.portfolio.username,
    })
    sent.value = true
    form.nome = ''
    form.email = ''
    form.mensagem = ''
  } catch (err) {
    sendError.value = err instanceof Error ? err.message : 'Não foi possível enviar a mensagem.'
  } finally {
    sending.value = false
  }
}
</script>

<template>
  <section class="section">
    <h2>Entre em contato</h2>

    <div class="contact-grid" :class="{ 'single-column': !portfolio.links.length || !portfolio.emailContato }">
      <div v-if="portfolio.links.length" class="contact-cards">
        <div v-for="link in portfolio.links" :key="link.id ?? link.nome" class="card contact-card">
          <div class="contact-card-info">
            <img v-if="faviconUrl(link.url)" :src="faviconUrl(link.url)!" :alt="link.nome" class="contact-icon" />
            <a :href="link.url" target="_blank" rel="noopener" class="contact-link">{{ link.url }}</a>
          </div>
          <span v-if="copiedKey === link.nome" class="copied-label">Copiado!</span>
          <button type="button" class="btn btn-icon" @click="copy(link.nome, link.url)">
            {{ copiedKey === link.nome ? '✓' : '📋' }}
          </button>
        </div>
      </div>

      <form v-if="portfolio.emailContato" class="card contact-form" @submit.prevent="handleSubmit">
        <template v-if="!isContactFormConfigured">
          <p class="muted">Formulário de mensagens ainda não configurado.</p>
        </template>

        <template v-else-if="sent">
          <p>Mensagem enviada! {{ portfolio.nome.split(' ')[0] }} vai receber por e-mail.</p>
          <button type="button" class="btn btn-secondary" @click="sent = false">Enviar outra mensagem</button>
        </template>

        <template v-else>
          <h3>Envie uma mensagem</h3>
          <div class="field">
            <label>Seu nome</label>
            <input v-model="form.nome" class="input" required />
          </div>
          <div class="field">
            <label>Seu e-mail</label>
            <input v-model="form.email" class="input" type="email" required />
          </div>
          <div class="field">
            <label>Mensagem</label>
            <textarea v-model="form.mensagem" class="input" rows="4" required />
          </div>
          <p v-if="sendError" class="error-text">{{ sendError }}</p>
          <button class="btn btn-primary" type="submit" :disabled="sending">
            {{ sending ? 'Enviando...' : 'Enviar mensagem' }}
          </button>
        </template>
      </form>
    </div>
  </section>
</template>

<style scoped>
.contact-grid {
  display: grid;
  grid-template-columns: 1fr 1.3fr;
  gap: var(--space-4);
  align-items: start;
}

.contact-grid.single-column {
  grid-template-columns: 1fr;
}

.contact-cards {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.contact-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  transition: transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease;
}

.contact-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
  border-color: var(--color-accent);
}

.copied-label {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--color-success);
  white-space: nowrap;
}

.contact-card-info {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  min-width: 0;
}

.contact-card-info strong,
.contact-card-info a {
  overflow-wrap: anywhere;
}

.contact-icon {
  width: 24px;
  height: 24px;
  flex-shrink: 0;
}

.contact-link {
  font-weight: 600;
  font-size: 0.9rem;
}

.contact-form {
  display: flex;
  flex-direction: column;
}

.contact-form h3 {
  margin: 0 0 var(--space-4);
}

@media (max-width: 720px) {
  .contact-grid {
    grid-template-columns: 1fr;
  }
}
</style>

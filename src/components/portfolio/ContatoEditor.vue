<script setup lang="ts">
import type { LinkItem } from '../../types/portfolio'
import { linkRowError } from '../../lib/validation'

const emailContato = defineModel<string>('emailContato', { required: true })
const links = defineModel<LinkItem[]>('links', { required: true })

// Lista totalmente livre: sem LinkedIn/GitHub/e-mail fixados como campos
// "permanentes" — começa vazia e o usuário adiciona o que quiser, na ordem
// que quiser. O ícone de cada link é resolvido a partir do próprio domínio
// da URL (ver lib/icons.ts), não de um nome reconhecido.
function addLink() {
  links.value = [...links.value, { nome: '', url: '', ordem: links.value.length }]
}

function removeLink(link: LinkItem) {
  links.value = links.value.filter((l) => l !== link)
}
</script>

<template>
  <div class="contato-editor">
    <div class="field">
      <label>E-mail para receber mensagens</label>
      <input
        v-model="emailContato"
        class="input"
        type="email"
        placeholder="onde você quer receber as mensagens do formulário de contato"
      />
      <span class="field-hint">
        Não aparece publicamente. Se ficar em branco, o formulário de contato não é exibido no seu portfólio.
      </span>
    </div>

    <div v-if="links.length" class="outros">
      <div v-for="(link, index) in links" :key="index" class="link-row">
        <input v-model="link.nome" class="input" placeholder="Nome (ex.: LinkedIn, Instagram)" />
        <input v-model="link.url" class="input" placeholder="https://... ou seu@email.com" />
        <button type="button" class="btn btn-icon" @click="removeLink(link)" aria-label="Remover link">✕</button>
        <span v-if="linkRowError(link)" class="error-text link-row-error">{{ linkRowError(link) }}</span>
      </div>
    </div>

    <button type="button" class="btn btn-secondary" @click="addLink">+ Adicionar link</button>
    <span class="field-hint">
      Pode ser uma URL (LinkedIn, GitHub, Instagram...) ou um e-mail (ex.: seu@gmail.com) — este aparece
      publicamente, diferente do e-mail de recebimento de mensagens acima.
    </span>
  </div>
</template>

<style scoped>
.field-hint {
  display: block;
  font-size: 0.8rem;
  color: var(--color-text-muted);
  margin-top: var(--space-2);
}

.outros {
  margin: var(--space-4) 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.link-row {
  display: grid;
  grid-template-columns: 1fr 2fr auto;
  gap: var(--space-2);
}

.link-row-error {
  grid-column: 1 / -1;
}

@media (max-width: 560px) {
  .link-row {
    grid-template-columns: 1fr;
  }
}
</style>

<script setup lang="ts">
import { computed } from 'vue'
import type { LinkItem } from '../../types/portfolio'
import { linkIconUrl } from '../../lib/icons'

const email = defineModel<string>('email', { required: true })
const links = defineModel<LinkItem[]>('links', { required: true })

// LinkedIn e GitHub são casos especiais dentro do mesmo array `links` (não
// viram colunas próprias no banco — continuam sendo um LinkItem normal com
// nome fixo), mas a UI trata como campo dedicado. O computed writable faz
// essa ponte: ler procura o link pelo nome, escrever cria/atualiza/remove
// o item correspondente no array conforme o campo fica vazio ou não.
function namedLinkUrl(nome: string) {
  return computed<string>({
    get() {
      return links.value.find((l) => l.nome.toLowerCase() === nome)?.url ?? ''
    },
    set(value: string) {
      const existing = links.value.find((l) => l.nome.toLowerCase() === nome)
      if (existing) {
        if (value.trim()) {
          existing.url = value
        } else {
          links.value = links.value.filter((l) => l !== existing)
        }
      } else if (value.trim()) {
        links.value = [...links.value, { nome, url: value, ordem: links.value.length }]
      }
    },
  })
}

const linkedinUrl = namedLinkUrl('linkedin')
const githubUrl = namedLinkUrl('github')

// Links extras (qualquer coisa além de LinkedIn/GitHub): instagram, site
// pessoal, YouTube etc. — lista livre com nome + url, adicionada via "+".
const outros = computed(() => links.value.filter((l) => !['linkedin', 'github'].includes(l.nome.toLowerCase())))

function addOutro() {
  links.value = [...links.value, { nome: '', url: '', ordem: links.value.length }]
}

function removeOutro(link: LinkItem) {
  links.value = links.value.filter((l) => l !== link)
}
</script>

<template>
  <div class="contato-editor">
    <div class="field">
      <label>E-mail</label>
      <input v-model="email" class="input" type="email" placeholder="seu@email.com" />
    </div>

    <div class="field">
      <label>
        <img :src="linkIconUrl('linkedin')!" alt="" class="field-icon" />
        LinkedIn
      </label>
      <input v-model="linkedinUrl" class="input" placeholder="https://linkedin.com/in/seu-usuario" />
    </div>

    <div class="field">
      <label>
        <img :src="linkIconUrl('github')!" alt="" class="field-icon" />
        GitHub
      </label>
      <input v-model="githubUrl" class="input" placeholder="https://github.com/seu-usuario" />
    </div>

    <div v-if="outros.length" class="outros">
      <div v-for="link in outros" :key="link.id ?? link.nome" class="link-row">
        <input v-model="link.nome" class="input" placeholder="instagram" />
        <input v-model="link.url" class="input" placeholder="https://..." />
        <button type="button" class="btn btn-icon" @click="removeOutro(link)" aria-label="Remover link">✕</button>
      </div>
    </div>

    <button type="button" class="btn btn-secondary" @click="addOutro">+ Adicionar outro link</button>
  </div>
</template>

<style scoped>
.field-icon {
  width: 14px;
  height: 14px;
  vertical-align: -2px;
  margin-right: var(--space-1);
}

.outros {
  margin: var(--space-4) 0;
}

.link-row {
  display: grid;
  grid-template-columns: 1fr 2fr auto;
  gap: var(--space-2);
  margin-bottom: var(--space-2);
}
</style>

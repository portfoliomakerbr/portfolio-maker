<script setup lang="ts">
import { computed, nextTick, onMounted, ref, useTemplateRef } from 'vue'
import { useRouter } from 'vue-router'
import { usePortfolio } from '../composables/usePortfolio'
import { usePortfolioForm } from '../composables/usePortfolioForm'
import { useDraft } from '../composables/useDraft'
import { isUsernameValida } from '../types/reservedUsernames'
import type { PortfolioFormInput } from '../types/portfolio'
import SkillsEditor from '../components/portfolio/SkillsEditor.vue'
import LinksEditor from '../components/portfolio/LinksEditor.vue'
import ProjetosEditor from '../components/portfolio/ProjetosEditor.vue'
import ExperienciasEditor from '../components/portfolio/ExperienciasEditor.vue'
import ImageUploader from '../components/portfolio/ImageUploader.vue'

const router = useRouter()
const { portfolio, loading, fetchOwn } = usePortfolio()
const { form, habilidadesText, saving, saveError, loadFrom, save } = usePortfolioForm('')
const { loadDraft, clearDraft, restored } = useDraft('portfolio-edit-draft', () => form)

const usernameInput = useTemplateRef<HTMLInputElement>('usernameInput')
const usernameError = computed(() => {
  if (!form.username) return null
  return isUsernameValida(form.username) ? null : 'Username inválido ou reservado (use apenas letras, números e hífen).'
})
const successMessage = ref<string | null>(null)

onMounted(async () => {
  await fetchOwn()
  if (portfolio.value) {
    loadFrom({
      username: portfolio.value.username,
      nome: portfolio.value.nome,
      breveDescricao: portfolio.value.breveDescricao,
      descricao: portfolio.value.descricao,
      localizacao: portfolio.value.localizacao,
      emailPublico: portfolio.value.emailPublico,
      fotoUrl: portfolio.value.fotoUrl,
      fotoPath: portfolio.value.fotoPath,
      backgroundUrl: portfolio.value.backgroundUrl,
      backgroundPath: portfolio.value.backgroundPath,
      habilidades: portfolio.value.habilidades,
      links: portfolio.value.links,
      projetos: portfolio.value.projetos,
      experiencias: portfolio.value.experiencias,
    })
  } else {
    const draft = loadDraft()
    if (draft) loadFrom(draft as PortfolioFormInput)
  }
})

function onFotoUploaded(result: { url: string; path: string }) {
  form.fotoUrl = result.url
  form.fotoPath = result.path
}

function onBackgroundUploaded(result: { url: string; path: string }) {
  form.backgroundUrl = result.url
  form.backgroundPath = result.path
}

async function handleSave() {
  successMessage.value = null
  const { error } = await save()

  if (error) {
    // Se o erro veio da validação de username (duplicado/reservado/inválido),
    // leva o usuário direto pro campo depois que a mensagem de erro já foi
    // renderizada no DOM — nextTick garante que o layout já mudou (mensagem
    // de erro ocupando espaço) antes de calcular o scroll/foco.
    if (error.toLowerCase().includes('username')) {
      await nextTick()
      usernameInput.value?.focus()
      usernameInput.value?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
    return
  }

  clearDraft()
  successMessage.value = 'Portfólio salvo!'
  router.push(`/${form.username}`)
}
</script>

<template>
  <div class="page">
    <h1>Editar portfólio</h1>
    <p v-if="restored && !portfolio" class="muted">Restauramos um rascunho salvo automaticamente no seu navegador.</p>

    <p v-if="loading" class="muted">Carregando...</p>

    <form v-else class="edit-form" @submit.prevent="handleSave">
      <section class="card">
        <h2>Identidade</h2>

        <div class="field">
          <label>Username (usado na URL pública)</label>
          <input
            ref="usernameInput"
            v-model="form.username"
            class="input"
            placeholder="seu-nome"
            required
          />
          <span v-if="usernameError" class="error-text">{{ usernameError }}</span>
        </div>

        <div class="grid-2">
          <div class="field">
            <label>Nome</label>
            <input v-model="form.nome" class="input" required />
          </div>
          <div class="field">
            <label>Localização</label>
            <input v-model="form.localizacao" class="input" />
          </div>
        </div>

        <div class="field">
          <label>Breve descrição</label>
          <input v-model="form.breveDescricao" class="input" placeholder="Desenvolvedor de software" />
        </div>

        <div class="field">
          <label>Descrição</label>
          <textarea v-model="form.descricao" class="input" rows="4" />
        </div>

        <div class="field">
          <label>E-mail público</label>
          <input v-model="form.emailPublico" class="input" type="email" />
        </div>

        <SkillsEditor v-model="habilidadesText" />

        <div class="grid-2">
          <ImageUploader
            label="Foto de perfil"
            :current-url="form.fotoUrl"
            :current-path="form.fotoPath"
            folder="foto"
            @uploaded="onFotoUploaded"
          />
          <ImageUploader
            label="Imagem de fundo"
            :current-url="form.backgroundUrl"
            :current-path="form.backgroundPath"
            folder="background"
            @uploaded="onBackgroundUploaded"
          />
        </div>
      </section>

      <section class="card">
        <h2>Links</h2>
        <LinksEditor v-model="form.links" />
      </section>

      <section class="card">
        <ProjetosEditor v-model="form.projetos" />
      </section>

      <section class="card">
        <ExperienciasEditor v-model="form.experiencias" />
      </section>

      <p v-if="saveError" class="error-text">{{ saveError }}</p>
      <p v-if="successMessage" class="success-text">{{ successMessage }}</p>

      <button class="btn btn-primary" type="submit" :disabled="saving || !!usernameError">
        {{ saving ? 'Salvando...' : 'Salvar portfólio' }}
      </button>
    </form>
  </div>
</template>

<style scoped>
.edit-form section {
  margin-bottom: var(--space-5);
}

.grid-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-4);
}

.success-text {
  color: var(--color-success);
}

@media (max-width: 560px) {
  .grid-2 {
    grid-template-columns: 1fr;
  }
}
</style>

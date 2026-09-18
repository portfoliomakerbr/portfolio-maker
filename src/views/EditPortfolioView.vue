<script setup lang="ts">
import { computed, nextTick, onMounted, ref, useTemplateRef } from 'vue'
import { useRouter } from 'vue-router'
import { usePortfolio } from '../composables/usePortfolio'
import { usePortfolioForm } from '../composables/usePortfolioForm'
import { useDraft } from '../composables/useDraft'
import { useConfirmDialog } from '../composables/useConfirmDialog'
import { isUsernameValida } from '../types/reservedUsernames'
import type { PortfolioFormInput } from '../types/portfolio'
import SkillsEditor from '../components/portfolio/SkillsEditor.vue'
import ContatoEditor from '../components/portfolio/ContatoEditor.vue'
import ProjetosEditor from '../components/portfolio/ProjetosEditor.vue'
import ExperienciasEditor from '../components/portfolio/ExperienciasEditor.vue'
import FormacoesEditor from '../components/portfolio/FormacoesEditor.vue'
import ImageUploader from '../components/portfolio/ImageUploader.vue'

const router = useRouter()
const { portfolio, loading, fetchOwn } = usePortfolio()
const { form, saving, saveError, loadFrom, save } = usePortfolioForm('')
const { loadDraft, clearDraft, restored } = useDraft('portfolio-edit-draft', () => form)
const { confirm } = useConfirmDialog()

// Snapshot do formulário assim que carrega, pra comparar contra o estado
// atual e saber se há alterações não salvas (botão "Cancelar alterações").
// JSON.stringify é comparação rasa o bastante pra esse formulário (mesmo
// padrão já usado em useDraft.ts) — não precisa de um deep-equal dedicado.
const originalSnapshot = ref('')
const isDirty = computed(() => JSON.stringify(form) !== originalSnapshot.value)

function snapshotForm() {
  originalSnapshot.value = JSON.stringify(form)
}

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
      habilidades: portfolio.value.habilidades,
      links: portfolio.value.links,
      projetos: portfolio.value.projetos,
      experiencias: portfolio.value.experiencias,
      formacoesAcademicas: portfolio.value.formacoesAcademicas,
    })
  } else {
    const draft = loadDraft()
    if (draft) loadFrom(draft as PortfolioFormInput)
  }
  snapshotForm()
})

function onFotoUploaded(result: { url: string; path: string }) {
  form.fotoUrl = result.url
  form.fotoPath = result.path
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
  snapshotForm()
  successMessage.value = 'Portfólio salvo!'
  router.push(`/${form.username}`)
}

async function handleCancel() {
  if (!isDirty.value) {
    // Nada pra cancelar: o botão não fica desabilitado nesse caso, só muda
    // de função — vira um jeito rápido de sair da edição e ver como o
    // portfólio está publicado, sem exigir um "tem certeza?" pra nada.
    router.push(portfolio.value ? `/${portfolio.value.username}` : '/')
    return
  }

  const ok = await confirm('Você quer cancelar mesmo? As alterações feitas agora serão perdidas.', 'Cancelar alterações')
  if (!ok) return

  loadFrom(JSON.parse(originalSnapshot.value) as PortfolioFormInput)
  clearDraft()
  saveError.value = null
  successMessage.value = null
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

        <SkillsEditor v-model="form.habilidades" />

        <ImageUploader
          label="Foto de perfil"
          :current-url="form.fotoUrl"
          :current-path="form.fotoPath"
          folder="foto"
          @uploaded="onFotoUploaded"
        />
      </section>

      <section class="card">
        <h2>Contato</h2>
        <ContatoEditor v-model:email="form.emailPublico" v-model:links="form.links" />
      </section>

      <section class="card">
        <ProjetosEditor v-model="form.projetos" />
      </section>

      <section class="card">
        <FormacoesEditor v-model="form.formacoesAcademicas" />
      </section>

      <section class="card">
        <ExperienciasEditor v-model="form.experiencias" />
      </section>

      <p v-if="saveError" class="error-text">{{ saveError }}</p>

      <div class="action-bar no-print">
        <p v-if="successMessage" class="success-text">{{ successMessage }}</p>
        <div class="action-bar-buttons">
          <button type="button" class="btn btn-secondary" @click="handleCancel">
            {{ isDirty ? 'Cancelar alterações' : 'Voltar ao portfólio' }}
          </button>
          <button class="btn btn-primary" type="submit" :disabled="saving || !!usernameError || !isDirty">
            {{ saving ? 'Salvando...' : 'Salvar portfólio' }}
          </button>
        </div>
      </div>
    </form>
  </div>
</template>

<style scoped>
.edit-form {
  /* Espaço reservado pra barra fixa não cobrir o final do formulário. */
  padding-bottom: 88px;
}

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
  margin: 0;
}

/* Fixa embaixo da viewport (não do formulário) — o botão salvar/cancelar
   fica sempre acessível sem precisar rolar até o fim, principal pedido
   por trás dessa mudança. Ancorada no canto inferior ESQUERDO (não uma barra
   full-width) de propósito: o selo "Powered by Netlify" do plano grátis vive
   fixo no canto inferior direito e não tem como ser removido por CSS nosso
   (é injetado pela própria plataforma) — então em vez de brigar com ele,
   o painel de ações nem chega perto dali. */
.action-bar {
  position: fixed;
  left: var(--space-4);
  bottom: var(--space-4);
  z-index: 20;
  max-width: calc(100vw - var(--space-4) * 2);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  padding: var(--space-3) var(--space-4);
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-3);
}

.action-bar-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
}

@media (max-width: 560px) {
  .grid-2 {
    grid-template-columns: 1fr;
  }

  .edit-form {
    padding-bottom: 140px;
  }

  .action-bar {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>

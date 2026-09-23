<script setup lang="ts">
import { computed, nextTick, onMounted, ref, useTemplateRef } from 'vue'
import { useRouter } from 'vue-router'
import { usePortfolio } from '../composables/usePortfolio'
import { usePortfolioForm } from '../composables/usePortfolioForm'
import { useDraft } from '../composables/useDraft'
import { useConfirmDialog } from '../composables/useConfirmDialog'
import { useAuth } from '../composables/useAuth'
import { supabase } from '../lib/supabase'
import { validateUsername } from '../types/reservedUsernames'
import { linksHaveError } from '../lib/validation'
import type { PortfolioFormInput } from '../types/portfolio'
import SkillsEditor from '../components/portfolio/SkillsEditor.vue'
import ContatoEditor from '../components/portfolio/ContatoEditor.vue'
import ProjetosEditor from '../components/portfolio/ProjetosEditor.vue'
import ExperienciasEditor from '../components/portfolio/ExperienciasEditor.vue'
import FormacoesEditor from '../components/portfolio/FormacoesEditor.vue'
import ImageUploader from '../components/portfolio/ImageUploader.vue'
import FloatingToolbar from '../components/layout/FloatingToolbar.vue'
import ModalTeleport from '../components/ui/ModalTeleport.vue'

const router = useRouter()
const { portfolio, loading, fetchOwn } = usePortfolio()
const { form, saving, saveError, loadFrom, save } = usePortfolioForm('')
const { loadDraft, clearDraft, restored } = useDraft('portfolio-edit-draft', () => form)
const { confirm } = useConfirmDialog()
const { signOut } = useAuth()

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
  return validateUsername(form.username)
})

// Mesma técnica do usernameError: bloqueia o salvamento (em vez de deixar
// salvar um link quebrado) quando alguma linha de link tem só o nome ou só
// a URL preenchidos — dos contatos e de cada projeto.
const linksError = computed(() => linksHaveError(form.links))
const projetosLinksError = computed(() => form.projetos.some((p) => linksHaveError(p.links)))
const hasBlockingError = computed(() => !!usernameError.value || linksError.value || projetosLinksError.value)

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
      emailContato: portfolio.value.emailContato,
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

// Zona de risco: exclusão de conta. Só faz sentido (e só fica visível no
// template) quando já existe um portfólio salvo — se o usuário nunca chegou
// a preencher username/nome e salvar, não há conta "completa" pra apagar.
const deleteModalOpen = ref(false)
const deleteConfirmInput = ref('')
const deleting = ref(false)
const deleteError = ref<string | null>(null)

const deleteConfirmMatches = computed(
  () => !!portfolio.value && deleteConfirmInput.value.trim().toLowerCase() === portfolio.value.username,
)

function openDeleteModal() {
  deleteConfirmInput.value = ''
  deleteError.value = null
  deleteModalOpen.value = true
}

function closeDeleteModal() {
  if (deleting.value) return
  deleteModalOpen.value = false
}

async function handleDeleteAccount() {
  if (!portfolio.value || !deleteConfirmMatches.value) return

  deleting.value = true
  deleteError.value = null

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    deleting.value = false
    deleteError.value = 'Sessão expirada. Faça login novamente.'
    return
  }

  const { error } = await supabase.functions.invoke('delete-account', {
    body: { username: deleteConfirmInput.value.trim() },
    headers: { Authorization: `Bearer ${session.access_token}` },
  })

  deleting.value = false

  if (error) {
    deleteError.value = error.message
    return
  }

  clearDraft()
  deleteModalOpen.value = false
  // O token de acesso já foi revogado no servidor — isso só limpa o estado
  // local (localStorage/cookies) pra a UI refletir "deslogado" imediatamente.
  try {
    await signOut()
  } catch {
    // Não é fatal: a conta já foi excluída de qualquer forma.
  }
  router.push('/')
}
</script>

<template>
  <div class="page">
    <FloatingToolbar>
      <p v-if="successMessage" class="success-text">{{ successMessage }}</p>
      <button type="button" class="btn btn-secondary" @click="handleCancel">
        {{ isDirty ? 'Cancelar alterações' : 'Voltar ao portfólio' }}
      </button>
      <button class="btn btn-primary" type="submit" form="edit-form" :disabled="saving || hasBlockingError || !isDirty">
        {{ saving ? 'Salvando...' : 'Salvar portfólio' }}
      </button>
    </FloatingToolbar>

    <h1>Editar portfólio</h1>
    <p v-if="restored && !portfolio" class="muted">Restauramos um rascunho salvo automaticamente no seu navegador.</p>

    <p v-if="loading" class="muted">Carregando...</p>

    <form v-else id="edit-form" class="edit-form" @submit.prevent="handleSave">
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
        <ContatoEditor v-model:email-contato="form.emailContato" v-model:links="form.links" />
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

      <section v-if="portfolio" class="card danger-zone">
        <h2>Zona de risco</h2>
        <p class="muted">
          Exclui permanentemente sua conta e todo o conteúdo do seu portfólio (projetos, experiências, formações,
          links e imagens enviadas). Não tem como desfazer.
        </p>
        <button type="button" class="btn btn-danger" @click="openDeleteModal">Excluir conta e portfólio</button>
      </section>

      <p v-if="saveError" class="error-text">{{ saveError }}</p>
    </form>

    <ModalTeleport :open="deleteModalOpen">
      <h3>Excluir conta e portfólio</h3>
      <p class="muted" style="margin: var(--space-3) 0 var(--space-4)">
        Essa ação é permanente: apaga sua conta, seu portfólio e tudo que ele contém. Pra confirmar, digite o
        username <strong>{{ portfolio?.username }}</strong> abaixo.
      </p>
      <div class="field">
        <label>Username do portfólio</label>
        <input v-model="deleteConfirmInput" class="input" :placeholder="portfolio?.username" autocomplete="off" />
      </div>
      <p v-if="deleteError" class="error-text">{{ deleteError }}</p>
      <div class="modal-actions">
        <button type="button" class="btn btn-secondary" :disabled="deleting" @click="closeDeleteModal">
          Cancelar
        </button>
        <button
          type="button"
          class="btn btn-danger"
          :disabled="!deleteConfirmMatches || deleting"
          @click="handleDeleteAccount"
        >
          {{ deleting ? 'Excluindo...' : 'Excluir permanentemente' }}
        </button>
      </div>
    </ModalTeleport>
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
  margin: 0;
  font-size: 0.85rem;
}

.danger-zone {
  border-color: var(--color-danger);
}

.danger-zone h2 {
  color: var(--color-danger);
  margin-top: 0;
}

.danger-zone p {
  margin-bottom: var(--space-4);
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-3);
}

@media (max-width: 560px) {
  .grid-2 {
    grid-template-columns: 1fr;
  }
}
</style>

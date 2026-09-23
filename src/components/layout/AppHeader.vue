<script setup lang="ts">
import { watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '../../composables/useAuth'
import { usePortfolio } from '../../composables/usePortfolio'
import { useConfirmDialog } from '../../composables/useConfirmDialog'

const router = useRouter()
const { isAuthenticated, user, signOut } = useAuth()
const { portfolio, fetchOwn } = usePortfolio()
const { confirm } = useConfirmDialog()

// O header é montado uma vez só (fica fora do router-view), então precisa
// reagir a login/logout pra saber o username do próprio portfólio — não dá
// pra confiar em onMounted sozinho, já que a sessão resolve de forma
// assíncrona depois que o header já existe.
watch(
  isAuthenticated,
  (value) => {
    if (value) fetchOwn()
  },
  { immediate: true },
)

async function handleSignOut() {
  const ok = await confirm('Deseja mesmo sair da conta?', 'Sair da conta')
  if (!ok) return

  await signOut()
  router.push({ name: 'gallery' })
}
</script>

<template>
  <header class="header">
    <div class="header-inner">
      <router-link to="/" class="brand">PortfolioMaker </router-link>
      <nav class="nav">
        <router-link to="/">Galeria</router-link>
        <template v-if="isAuthenticated">
          <router-link :to="portfolio ? `/${portfolio.username}` : '/edit'">Meu portfólio</router-link>
          <span v-if="user?.email" class="user-email" :title="user.email">
            <span class="user-email-dot" aria-hidden="true"></span>
            {{ user.email }}
          </span>
          <button class="btn btn-secondary" @click="handleSignOut">Sair</button>
        </template>
        <template v-else>
          <router-link to="/login">Entrar</router-link>
          <router-link class="btn btn-primary" to="/signup">Criar conta</router-link>
        </template>
      </nav>
    </div>
  </header>
</template>

<style scoped>
.header {
  border-bottom: 1px solid var(--color-border);
  background: var(--color-surface);
  position: sticky;
  top: 0;
  z-index: 10;
}

.header-inner {
  max-width: var(--max-width);
  margin: 0 auto;
  padding: var(--space-3) var(--space-4);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
}

.brand {
  font-weight: 700;
  font-size: 1.1rem;
  color: var(--color-text);
}

.brand-tag {
  color: var(--color-accent);
}

.nav {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  flex-wrap: wrap;
}

.nav a {
  color: var(--color-text-muted);
  font-weight: 500;
}

.nav a.router-link-active {
  color: var(--color-text);
  position: relative;
}

.nav a.router-link-active::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: -6px;
  height: 2px;
  border-radius: 999px;
  background: var(--color-accent);
}

.nav a.btn-primary {
  color: white;
}

/* Não é um link do switch galeria/portfólio nem é clicável — separado do
   restante da nav por uma borda e um badge, pra não parecer mais uma opção
   de navegação. */
.user-email {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  color: var(--color-text-muted);
  font-size: 0.8rem;
  max-width: 180px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  cursor: default;
  padding: var(--space-1) var(--space-3);
  margin-left: var(--space-2);
  border: 1px solid var(--color-border);
  border-radius: 999px;
  background: var(--color-bg);
}

.user-email-dot {
  flex-shrink: 0;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--color-success);
}
</style>

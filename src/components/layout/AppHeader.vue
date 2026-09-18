<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useAuth } from '../../composables/useAuth'

const router = useRouter()
const { isAuthenticated, signOut } = useAuth()

async function handleSignOut() {
  await signOut()
  router.push({ name: 'gallery' })
}
</script>

<template>
  <header class="header">
    <div class="header-inner">
      <router-link to="/" class="brand">PortfolioMaker <span class="brand-tag">Vue</span></router-link>
      <nav class="nav">
        <router-link to="/">Galeria</router-link>
        <template v-if="isAuthenticated">
          <router-link to="/edit">Meu portfólio</router-link>
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
}
</style>

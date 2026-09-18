<script setup lang="ts">
import type { Portfolio } from '../../types/portfolio'

defineProps<{ portfolio: Portfolio }>()
</script>

<template>
  <div class="portfolio-header">
    <div v-if="portfolio.backgroundUrl" class="background" :style="{ backgroundImage: `url(${portfolio.backgroundUrl})` }" />
    <div class="background background-placeholder" v-else />

    <div class="identity">
      <img v-if="portfolio.fotoUrl" :src="portfolio.fotoUrl" :alt="portfolio.nome" class="avatar" />
      <div v-else class="avatar avatar-placeholder">{{ portfolio.nome.charAt(0).toUpperCase() }}</div>

      <div>
        <h1>{{ portfolio.nome }}</h1>
        <p class="muted">{{ portfolio.breveDescricao }}</p>
        <p v-if="portfolio.localizacao" class="muted local">📍 {{ portfolio.localizacao }}</p>
      </div>
    </div>

    <p v-if="portfolio.descricao" class="descricao">{{ portfolio.descricao }}</p>

    <div v-if="portfolio.habilidades.length" class="skills">
      <span v-for="skill in portfolio.habilidades" :key="skill" class="tag">{{ skill }}</span>
    </div>

    <div v-if="portfolio.links.length" class="links">
      <a v-for="link in portfolio.links" :key="link.id ?? link.nome" :href="link.url" target="_blank" rel="noopener">
        {{ link.nome }}
      </a>
    </div>
  </div>
</template>

<style scoped>
.portfolio-header {
  position: relative;
}

.background {
  height: 160px;
  border-radius: var(--radius-lg);
  background-size: cover;
  background-position: center;
  margin-bottom: -40px;
}

.background-placeholder {
  background: linear-gradient(120deg, var(--color-accent-soft), var(--color-border));
}

.identity {
  display: flex;
  align-items: flex-end;
  gap: var(--space-4);
  padding: 0 var(--space-4);
}

.avatar {
  width: 96px;
  height: 96px;
  border-radius: 50%;
  object-fit: cover;
  border: 4px solid var(--color-bg);
}

.avatar-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-accent-soft);
  color: var(--color-accent);
  font-weight: 700;
  font-size: 2rem;
}

.local {
  font-size: 0.85rem;
}

.descricao {
  margin: var(--space-5) var(--space-4) 0;
  white-space: pre-line;
}

.skills,
.links {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  margin: var(--space-4) var(--space-4) 0;
}

.links a {
  font-weight: 600;
}
</style>

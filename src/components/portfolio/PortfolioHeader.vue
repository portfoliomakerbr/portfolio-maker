<script setup lang="ts">
import type { Portfolio } from '../../types/portfolio'
import { isKnownSkill, linkIconUrl, skillIconUrl } from '../../lib/icons'

defineProps<{ portfolio: Portfolio }>()
</script>

<template>
  <div class="card portfolio-header">
    <div class="identity">
      <img v-if="portfolio.fotoUrl" :src="portfolio.fotoUrl" :alt="portfolio.nome" class="avatar" />
      <div v-else class="avatar avatar-placeholder">{{ portfolio.nome.charAt(0).toUpperCase() }}</div>

      <div class="identity-text">
        <h1>{{ portfolio.nome }}</h1>
        <p class="muted">{{ portfolio.breveDescricao }}</p>
        <p v-if="portfolio.localizacao" class="muted local">📍 {{ portfolio.localizacao }}</p>
      </div>
    </div>

    <p v-if="portfolio.descricao" class="descricao">{{ portfolio.descricao }}</p>

    <div v-if="portfolio.habilidades.length" class="skills">
      <span v-for="skill in portfolio.habilidades" :key="skill" class="tag">
        <img v-if="isKnownSkill(skill)" :src="skillIconUrl(skill)" :alt="skill" class="tag-icon" />
        {{ skill }}
      </span>
    </div>

    <div v-if="portfolio.links.length" class="links">
      <a
        v-for="link in portfolio.links"
        :key="link.id ?? link.nome"
        class="link-chip"
        :href="link.url"
        target="_blank"
        rel="noopener"
      >
        <img v-if="linkIconUrl(link.nome)" :src="linkIconUrl(link.nome)!" :alt="link.nome" class="link-icon" />
        <span class="link-url">{{ link.url }}</span>
      </a>
    </div>
  </div>
</template>

<style scoped>
.identity {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  flex-wrap: wrap;
}

.identity-text {
  min-width: 0;
}

.identity-text h1 {
  overflow-wrap: anywhere;
}

.avatar {
  width: 96px;
  height: 96px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid var(--color-border);
  flex-shrink: 0;
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
  margin: var(--space-5) 0 0;
  white-space: pre-line;
}

.skills {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  margin: var(--space-4) 0 0;
}

.tag-icon {
  width: 16px;
  height: 16px;
}

.links {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  margin: var(--space-4) 0 0;
  padding-top: var(--space-4);
  border-top: 1px solid var(--color-border);
}

.link-chip {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  max-width: 100%;
  font-weight: 600;
  font-size: 0.9rem;
  color: var(--color-text);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: var(--space-2) var(--space-3);
  text-decoration: none;
}

.link-chip:hover {
  border-color: var(--color-accent);
  color: var(--color-accent);
  text-decoration: none;
}

.link-icon {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}

.link-url {
  min-width: 0;
  max-width: 220px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (max-width: 480px) {
  .identity {
    flex-direction: column;
    text-align: center;
  }
}
</style>

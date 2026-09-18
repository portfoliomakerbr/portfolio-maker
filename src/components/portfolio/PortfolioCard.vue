<script setup lang="ts">
import type { GalleryItem } from '../../composables/usePortfolio'

defineProps<{ item: GalleryItem }>()
</script>

<template>
  <router-link :to="`/${item.username}`" class="card portfolio-card">
    <img
      v-if="item.fotoUrl"
      :src="item.fotoUrl"
      :alt="item.nome"
      class="avatar"
    />
    <div v-else class="avatar avatar-placeholder">{{ item.nome.charAt(0).toUpperCase() }}</div>
    <div>
      <h3>{{ item.nome }}</h3>
      <p class="muted breve">{{ item.breveDescricao }}</p>
      <p v-if="item.localizacao" class="muted local">{{ item.localizacao }}</p>
    </div>
  </router-link>
</template>

<style scoped>
.portfolio-card {
  color: inherit;
  text-decoration: none;
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.portfolio-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
  text-decoration: none;
}

.avatar {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  object-fit: cover;
}

.avatar-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-accent-soft);
  color: var(--color-accent);
  font-weight: 700;
  font-size: 1.25rem;
}

.breve {
  margin: var(--space-1) 0;
  font-size: 0.9rem;
}

.local {
  font-size: 0.8rem;
}
</style>

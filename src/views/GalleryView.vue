<script setup lang="ts">
import { onMounted } from 'vue'
import { useGallery } from '../composables/usePortfolio'
import PortfolioCard from '../components/portfolio/PortfolioCard.vue'

const { items, loading, error, fetchAll } = useGallery()

onMounted(() => {
  fetchAll()
})
</script>

<template>
  <div class="page">
    <h1>Portfólios</h1>
    <p class="muted">Conheça quem já construiu o portfólio por aqui.</p>

    <p v-if="loading" class="muted">Carregando...</p>
    <p v-else-if="error" class="error-text">{{ error }}</p>
    <p v-else-if="items.length === 0" class="muted">Nenhum portfólio publicado ainda.</p>

    <div v-else class="grid-gallery">
      <PortfolioCard v-for="item in items" :key="item.username" :item="item" />
    </div>
  </div>
</template>

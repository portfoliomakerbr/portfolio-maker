<script setup lang="ts">
import AppHeader from './components/layout/AppHeader.vue'
import AppFooter from './components/layout/AppFooter.vue'
import ConfirmDialog from './components/ui/ConfirmDialog.vue'
import { provideAuth } from './composables/useAuth'

provideAuth()
</script>

<template>
  <AppHeader class="no-print" />
  <router-view />
  <AppFooter class="no-print" />
  <ConfirmDialog />
</template>

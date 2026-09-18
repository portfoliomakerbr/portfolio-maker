<script setup lang="ts">
import type { Experiencia } from '../../types/portfolio'
import { useOrdenableList } from '../../composables/useOrdenableList'
import ExperienciaCard from './ExperienciaCard.vue'

const experiencias = defineModel<Experiencia[]>({ required: true })
const { mover, adicionar, remover } = useOrdenableList(experiencias)

function addExperiencia() {
  adicionar({
    ordem: 0,
    nome: '',
    empresa: '',
    descricao: '',
    dataInicio: '',
    dataFim: null,
    atual: false,
  })
}
</script>

<template>
  <section>
    <h2>Experiência profissional</h2>
    <p class="muted">Onde você já trabalhou — aparece em ordem cronológica reversa na sua página pública.</p>

    <ExperienciaCard
      v-for="(_experiencia, index) in experiencias"
      :key="index"
      v-model="experiencias[index]"
      :index="index"
      :is-first="index === 0"
      :is-last="index === experiencias.length - 1"
      @move-up="mover(index, -1)"
      @move-down="mover(index, 1)"
      @remove="remover(index)"
    />

    <button type="button" class="btn btn-secondary" @click="addExperiencia">+ Adicionar experiência</button>
  </section>
</template>

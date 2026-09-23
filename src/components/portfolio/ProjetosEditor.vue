<script setup lang="ts">
import type { Projeto } from '../../types/portfolio'
import { useOrdenableList } from '../../composables/useOrdenableList'
import ProjetoCard from './ProjetoCard.vue'

const projetos = defineModel<Projeto[]>({ required: true })
const { mover, adicionar, remover } = useOrdenableList(projetos)

function addProjeto() {
  adicionar({
    ordem: 0,
    nome: '',
    descricao: '',
    links: [],
    imagemUrl: null,
    imagemPath: null,
    tecnologias: [],
  })
}
</script>

<template>
  <section>
    <h2>Projetos</h2>
    <p class="muted">Os projetos aparecem na sua página pública na ordem definida aqui.</p>

    <ProjetoCard
      v-for="(_projeto, index) in projetos"
      :key="index"
      v-model="projetos[index]"
      :index="index"
      :is-first="index === 0"
      :is-last="index === projetos.length - 1"
      @move-up="mover(index, -1)"
      @move-down="mover(index, 1)"
      @remove="remover(index)"
    />

    <button type="button" class="btn btn-secondary" @click="addProjeto">+ Adicionar projeto</button>
  </section>
</template>

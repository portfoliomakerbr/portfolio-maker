<script setup lang="ts">
import type { FormacaoAcademica } from '../../types/portfolio'
import { useOrdenableList } from '../../composables/useOrdenableList'
import FormacaoCard from './FormacaoCard.vue'

const formacoes = defineModel<FormacaoAcademica[]>({ required: true })
const { mover, adicionar, remover } = useOrdenableList(formacoes)

function addFormacao() {
  adicionar({
    ordem: 0,
    curso: '',
    instituicao: '',
    descricao: '',
    dataInicio: '',
    dataFim: null,
    atual: false,
  })
}
</script>

<template>
  <section>
    <h2>Formação acadêmica</h2>
    <p class="muted">Cursos, faculdades e certificações — aparece na sua página pública nessa ordem.</p>

    <FormacaoCard
      v-for="(_formacao, index) in formacoes"
      :key="index"
      v-model="formacoes[index]"
      :index="index"
      :is-first="index === 0"
      :is-last="index === formacoes.length - 1"
      @move-up="mover(index, -1)"
      @move-down="mover(index, 1)"
      @remove="remover(index)"
    />

    <button type="button" class="btn btn-secondary" @click="addFormacao">+ Adicionar formação</button>
  </section>
</template>

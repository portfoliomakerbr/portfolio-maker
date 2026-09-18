import type { Ref } from 'vue'

interface Ordenavel {
  ordem: number
}

/**
 * Lógica de reordenação compartilhada por ProjetosEditor e ExperienciasEditor:
 * mover um item pra cima/baixo e renumerar `ordem` sequencialmente. É a mesma
 * regra nos dois casos, então vive uma vez aqui em vez de duplicada em cada
 * componente.
 */
export function useOrdenableList<T extends Ordenavel>(list: Ref<T[]>) {
  function renumerar() {
    list.value.forEach((item, index) => {
      item.ordem = index
    })
  }

  function mover(index: number, direcao: -1 | 1) {
    const destino = index + direcao
    if (destino < 0 || destino >= list.value.length) return
    const copia = [...list.value]
    const [item] = copia.splice(index, 1)
    copia.splice(destino, 0, item)
    list.value = copia
    renumerar()
  }

  function adicionar(item: T) {
    list.value = [...list.value, { ...item, ordem: list.value.length }]
  }

  function remover(index: number) {
    const copia = [...list.value]
    copia.splice(index, 1)
    list.value = copia
    renumerar()
  }

  return { mover, adicionar, remover, renumerar }
}

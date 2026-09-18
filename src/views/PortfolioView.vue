<script setup lang="ts">
import { onMounted, watch } from 'vue'
import { usePortfolio } from '../composables/usePortfolio'
import PortfolioHeader from '../components/portfolio/PortfolioHeader.vue'

const props = defineProps<{ username: string }>()
const { portfolio, loading, notFound, error, isOwnPortfolio, fetchByUsername } = usePortfolio()

onMounted(() => fetchByUsername(props.username))
watch(() => props.username, (value) => fetchByUsername(value))

function formatarData(data: string | null): string {
  if (!data) return 'atual'
  const [ano, mes] = data.split('-')
  return `${mes}/${ano}`
}

function exportarPdf() {
  window.print()
}
</script>

<template>
  <div class="page">
    <p v-if="loading" class="muted">Carregando...</p>

    <div v-else-if="notFound" class="card">
      <h2>Portfólio não encontrado</h2>
      <p class="muted">Não existe nenhum portfólio com o username "{{ username }}".</p>
      <router-link to="/" class="btn btn-secondary">Voltar para a galeria</router-link>
    </div>

    <p v-else-if="error" class="error-text">{{ error }}</p>

    <template v-else-if="portfolio">
      <div class="actions no-print">
        <router-link v-if="isOwnPortfolio" to="/edit" class="btn btn-secondary">Editar portfólio</router-link>
        <button class="btn btn-secondary" @click="exportarPdf">Exportar PDF</button>
      </div>

      <PortfolioHeader :portfolio="portfolio" />

      <section v-if="portfolio.experiencias.length" class="section">
        <h2>Experiência profissional</h2>
        <div v-for="exp in portfolio.experiencias" :key="exp.id" class="card experiencia-item">
          <div class="experiencia-head">
            <strong>{{ exp.nome }}</strong>
            <span class="muted">{{ exp.empresa }}</span>
            <span class="muted periodo">{{ formatarData(exp.dataInicio) }} — {{ formatarData(exp.dataFim) }}</span>
          </div>
          <p v-if="exp.descricao" class="descricao">{{ exp.descricao }}</p>
        </div>
      </section>

      <section v-if="portfolio.projetos.length" class="section">
        <h2>Projetos</h2>
        <div class="grid-gallery">
          <div v-for="proj in portfolio.projetos" :key="proj.id" class="card projeto-item">
            <img v-if="proj.imagemUrl" :src="proj.imagemUrl" :alt="proj.nome" class="projeto-img" />
            <h3>{{ proj.nome }}</h3>
            <p class="muted descricao">{{ proj.descricao }}</p>
            <div class="skills">
              <span v-for="tec in proj.tecnologias" :key="tec" class="tag">{{ tec }}</span>
            </div>
            <div class="links-row">
              <a v-if="proj.linkDoProjeto" class="link-btn" :href="proj.linkDoProjeto" target="_blank" rel="noopener">
                🌐 Ver projeto
              </a>
              <a v-if="proj.linkDoRepositorio" class="link-btn" :href="proj.linkDoRepositorio" target="_blank" rel="noopener">
                📦 Repositório
              </a>
              <a v-if="proj.linkYoutube" class="link-btn" :href="proj.linkYoutube" target="_blank" rel="noopener">
                ▶️ YouTube
              </a>
            </div>
          </div>
        </div>
      </section>
    </template>
  </div>
</template>

<style scoped>
.actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-3);
  margin-bottom: var(--space-4);
}

.section {
  margin-top: var(--space-8);
}

.experiencia-item {
  margin-bottom: var(--space-3);
}

.experiencia-head {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  align-items: baseline;
}

.periodo {
  margin-left: auto;
  font-size: 0.85rem;
}

.descricao {
  white-space: pre-line;
  margin: var(--space-2) 0 0;
}

.projeto-img {
  width: 100%;
  height: 140px;
  object-fit: cover;
  border-radius: var(--radius-md);
  margin-bottom: var(--space-3);
}

.skills {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  margin: var(--space-3) 0;
}

/* Separado visualmente das tags de tecnologia (pill, preenchida, cor de
   destaque) por um divisor + forma retangular com borda: são ações
   ("ir para"), não atributos do projeto, e precisam parecer clicáveis de
   um jeito diferente das tags pra não serem confundidos com elas. */
.links-row {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  margin-top: var(--space-4);
  padding-top: var(--space-3);
  border-top: 1px solid var(--color-border);
}

.link-btn {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--color-text);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: var(--space-1) var(--space-3);
  text-decoration: none;
}

.link-btn:hover {
  border-color: var(--color-accent);
  color: var(--color-accent);
  text-decoration: none;
}
</style>

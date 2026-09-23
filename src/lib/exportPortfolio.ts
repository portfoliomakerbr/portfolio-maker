import type { Portfolio } from '../types/portfolio'
import { linkHref } from './links'

function formatarPeriodo(inicio: string, fim: string | null): string {
  const formatar = (d: string) => {
    const [ano, mes] = d.split('-')
    return `${mes}/${ano}`
  }
  return `${formatar(inicio)} — ${fim ? formatar(fim) : 'atual'}`
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

// Gera o PDF lendo os dados do portfólio direto (não é uma "foto" da tela via
// html2canvas): texto de verdade, selecionável, arquivo pequeno, e sempre em
// fundo claro/legível independente do tema escuro do site. Em troca, o
// layout é escrito manualmente com jsPDF — cada seção controla sua própria
// posição vertical e pula de página quando não cabe mais.
export async function exportPortfolioPdf(portfolio: Portfolio) {
  // Import dinâmico: jsPDF é uma lib pesada usada só nesse botão — não faz
  // sentido inflar o bundle principal com ela pra quem nunca clica em
  // "Baixar". Isolar num chunk à parte também evita um bug de memória do
  // bundler (Rolldown) ao processar o pacote inteiro junto com o resto do app.
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const marginX = 48
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const contentWidth = pageWidth - marginX * 2
  let y = 56

  function ensureSpace(height: number) {
    if (y + height > pageHeight - 48) {
      doc.addPage()
      y = 56
    }
  }

  function heading(text: string) {
    ensureSpace(28)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(13)
    doc.setTextColor(30, 30, 35)
    doc.text(text, marginX, y)
    y += 8
    doc.setDrawColor(220, 220, 225)
    doc.line(marginX, y, pageWidth - marginX, y)
    y += 18
  }

  function paragraph(text: string, opts: { size?: number; bold?: boolean; color?: number[]; gap?: number } = {}) {
    if (!text) return
    doc.setFont('helvetica', opts.bold ? 'bold' : 'normal')
    doc.setFontSize(opts.size ?? 10.5)
    const [r, g, b] = opts.color ?? [50, 50, 55]
    doc.setTextColor(r, g, b)
    const lines = doc.splitTextToSize(text, contentWidth) as string[]
    ensureSpace(lines.length * 14)
    doc.text(lines, marginX, y)
    y += lines.length * 14 + (opts.gap ?? 6)
  }

  // Só a URL fica azul (clicável de verdade no PDF); o nome do link ("Ver
  // projeto", "Repositório", "linkedin"...) fica preto, igual ao resto do
  // texto — dois doc.text() na mesma linha em vez de um só, porque o jsPDF
  // não tem "cor por trecho" dentro de uma única chamada de texto.
  function linkSegment(nome: string, url: string, x: number, yPos: number, size: number): number {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(size)
    doc.setTextColor(50, 50, 55)
    const label = `${nome}: `
    doc.text(label, x, yPos)
    const labelWidth = doc.getTextWidth(label)

    doc.setTextColor(79, 70, 229)
    doc.text(url, x + labelWidth, yPos)

    return labelWidth + doc.getTextWidth(url)
  }

  // Uma linha por link (Formação/Experiência/seção "Links" do topo).
  function linkList(links: { nome: string; url: string }[], size = 9.5, gap = 6) {
    if (!links.length) return
    for (const l of links) {
      ensureSpace(14)
      linkSegment(l.nome, l.url, marginX, y, size)
      y += 14
    }
    y += gap
  }

  // Vários links lado a lado na mesma linha, quebrando pra próxima quando não
  // couber mais — usado nos links de projeto (Ver projeto, Repositório...).
  function linkRow(links: { nome: string; url: string }[], size = 9.5, gap = 14) {
    if (!links.length) return
    ensureSpace(14)
    let x = marginX
    for (const l of links) {
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(size)
      const width = doc.getTextWidth(`${l.nome}: ${l.url}`)
      if (x !== marginX && x + width > pageWidth - marginX) {
        y += 14
        ensureSpace(14)
        x = marginX
      }
      x += linkSegment(l.nome, l.url, x, y, size) + gap
    }
    y += 14 + 8
  }

  // Cabeçalho
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(20)
  doc.setTextColor(20, 20, 25)
  doc.text(portfolio.nome, marginX, y)
  y += 22

  const infoLine = [portfolio.breveDescricao, portfolio.localizacao].filter(Boolean).join('  ·  ')
  paragraph(infoLine, { size: 10.5, color: [110, 110, 118], gap: 14 })

  paragraph(portfolio.descricao, { gap: 14 })

  if (portfolio.habilidades.length) {
    heading('Habilidades')
    paragraph(portfolio.habilidades.join(', '), { gap: 16 })
  }

  if (portfolio.formacoesAcademicas.length) {
    heading('Formação acadêmica')
    for (const f of portfolio.formacoesAcademicas) {
      paragraph(`${f.curso} — ${f.instituicao}`, { bold: true, gap: 2 })
      paragraph(formatarPeriodo(f.dataInicio, f.dataFim), { size: 9.5, color: [130, 130, 138], gap: 2 })
      paragraph(f.descricao, { gap: 12 })
    }
  }

  if (portfolio.experiencias.length) {
    heading('Experiência profissional')
    for (const e of portfolio.experiencias) {
      paragraph(`${e.nome} — ${e.empresa}`, { bold: true, gap: 2 })
      paragraph(formatarPeriodo(e.dataInicio, e.dataFim), { size: 9.5, color: [130, 130, 138], gap: 2 })
      paragraph(e.descricao, { gap: 12 })
    }
  }

  if (portfolio.projetos.length) {
    heading('Projetos')
    for (const p of portfolio.projetos) {
      paragraph(p.nome, { bold: true, gap: 2 })
      paragraph(p.descricao, { gap: 2 })
      if (p.tecnologias.length) {
        paragraph(`Tecnologias: ${p.tecnologias.join(', ')}`, { size: 9.5, color: [130, 130, 138], gap: 2 })
      }
      linkRow(p.links)
    }
  }

  if (portfolio.links.length) {
    heading('Links')
    linkList(portfolio.links, 9.5, 0)
  }

  doc.save(`portfolio-${portfolio.username}.pdf`)
}

// Word não lê PDF nem um formato binário próprio aqui — o truque padrão pra
// gerar um .doc sem biblioteca pesada é salvar HTML com a declaração de
// namespace do Word (xmlns:w) e o MIME type application/msword: o Word
// reconhece e abre normalmente, com formatação básica preservada.
export function exportPortfolioWord(portfolio: Portfolio) {
  const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  const nl2br = (s: string) => esc(s).replace(/\n/g, '<br>')

  const formacoes = portfolio.formacoesAcademicas
    .map(
      (f) => `
        <h3>${esc(f.curso)} — ${esc(f.instituicao)}</h3>
        <p class="muted">${formatarPeriodo(f.dataInicio, f.dataFim)}</p>
        <p>${nl2br(f.descricao)}</p>`,
    )
    .join('')

  const experiencias = portfolio.experiencias
    .map(
      (e) => `
        <h3>${esc(e.nome)} — ${esc(e.empresa)}</h3>
        <p class="muted">${formatarPeriodo(e.dataInicio, e.dataFim)}</p>
        <p>${nl2br(e.descricao)}</p>`,
    )
    .join('')

  const projetos = portfolio.projetos
    .map((p) => {
      return `
        <h3>${esc(p.nome)}</h3>
        <p>${nl2br(p.descricao)}</p>
        ${p.tecnologias.length ? `<p class="muted">Tecnologias: ${esc(p.tecnologias.join(', '))}</p>` : ''}
        ${p.links.length ? `<p>${p.links.map((l) => `${esc(l.nome)}: <a href="${esc(linkHref(l.url))}">${esc(l.url)}</a>`).join('<br>')}</p>` : ''}`
    })
    .join('')

  const links = portfolio.links.length
    ? `<h2>Links</h2><p>${portfolio.links.map((l) => `${esc(l.nome)}: <a href="${esc(linkHref(l.url))}">${esc(l.url)}</a>`).join('<br>')}</p>`
    : ''

  const html = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta charset="utf-8">
      <title>${esc(portfolio.nome)}</title>
      <style>
        body { font-family: Calibri, Arial, sans-serif; color: #1c1c1f; }
        h1 { font-size: 22pt; margin-bottom: 2pt; }
        h2 { font-size: 14pt; border-bottom: 1px solid #ccc; padding-bottom: 4pt; margin-top: 20pt; }
        h3 { font-size: 11.5pt; margin-bottom: 0; }
        p { font-size: 10.5pt; line-height: 1.4; margin-top: 2pt; }
        .muted { color: #6b6b75; font-size: 9.5pt; }
      </style>
    </head>
    <body>
      <h1>${esc(portfolio.nome)}</h1>
      <p class="muted">${[portfolio.breveDescricao, portfolio.localizacao].filter(Boolean).map(esc).join(' &middot; ')}</p>
      <p>${nl2br(portfolio.descricao)}</p>
      ${portfolio.habilidades.length ? `<h2>Habilidades</h2><p>${esc(portfolio.habilidades.join(', '))}</p>` : ''}
      ${formacoes ? `<h2>Formação acadêmica</h2>${formacoes}` : ''}
      ${experiencias ? `<h2>Experiência profissional</h2>${experiencias}` : ''}
      ${projetos ? `<h2>Projetos</h2>${projetos}` : ''}
      ${links}
    </body>
    </html>`

  // Extensão .doc, não .docx: o conteúdo é HTML disfarçado (via xmlns:w e o
  // mimetype application/msword), truque que só funciona com a extensão
  // antiga — o Word trata .docx como um zip OOXML de verdade e acusa
  // "conteúdo ilegível" ao abrir HTML puro com essa extensão.
  const blob = new Blob(['﻿', html], { type: 'application/msword' })
  downloadBlob(blob, `portfolio-${portfolio.username}.doc`)
}

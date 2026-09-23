// Ícones de tecnologia via skillicons.dev — mesma API pública usada no
// PortfolioMaker antigo (Angular): sem chave, sem custo, cobre centenas de
// stacks. Lista de slugs portada de portfolio-maker-frontend/src/app/models/others/languages.ts.
// `theme=light` é o parâmetro que a própria API expõe pra inverter ícones que
// por padrão são pretos/escuros (github, apple, vercel...) pra branco — sem
// isso, esses ícones ficavam quase invisíveis no fundo escuro do app.
import { isEmailAddress } from './links'

const SKILL_ICON_BASE = 'https://skillicons.dev/icons?theme=light&i='

export const SKILL_SLUGS = [
  'ableton', 'activitypub', 'actix', 'adonis', 'ae', 'aiscript', 'alpinejs', 'anaconda',
  'androidstudio', 'angular', 'ansible', 'apollo', 'apple', 'appwrite', 'arch', 'arduino',
  'astro', 'atom', 'au', 'autocad', 'aws', 'azul', 'azure', 'babel', 'bash', 'bevy',
  'bitbucket', 'blender', 'bootstrap', 'bsd', 'bun', 'c', 'cs', 'cpp', 'crystal', 'cassandra',
  'clion', 'clojure', 'cloudflare', 'cmake', 'codepen', 'coffeescript', 'css', 'cypress', 'd3',
  'dart', 'debian', 'deno', 'devto', 'discord', 'discordjs', 'django', 'docker', 'dotnet',
  'dynamodb', 'eclipse', 'elasticsearch', 'electron', 'elixir', 'elysia', 'emacs', 'ember',
  'emotion', 'express', 'fastapi', 'fediverse', 'figma', 'firebase', 'flask', 'flutter',
  'forth', 'fortran', 'gamemakerstudio', 'gatsby', 'gcp', 'git', 'github', 'githubactions',
  'gitlab', 'gmail', 'gherkin', 'go', 'gradle', 'godot', 'grafana', 'graphql', 'gtk', 'gulp',
  'haskell', 'haxe', 'haxeflixel', 'heroku', 'hibernate', 'html', 'htmx', 'idea', 'ai',
  'instagram', 'ipfs', 'java', 'js', 'javascript', 'jenkins', 'jest', 'jquery', 'kafka', 'kali',
  'kotlin', 'ktor', 'kubernetes', 'laravel', 'latex', 'less', 'linkedin', 'linux', 'lit', 'lua',
  'md', 'mastodon', 'materialui', 'matlab', 'maven', 'mint', 'mongodb', 'mysql', 'neovim',
  'nestjs', 'netlify', 'nextjs', 'nginx', 'nim', 'nix', 'nodejs', 'notion', 'npm', 'nuxtjs',
  'obsidian', 'ocaml', 'octave', 'opencv', 'openshift', 'openstack', 'p5js', 'perl', 'ps',
  'php', 'phpstorm', 'pinia', 'planetscale', 'pnpm', 'postgres', 'postman', 'powershell',
  'pr', 'prisma', 'processing', 'prometheus', 'pug', 'pycharm', 'py', 'python', 'pytorch',
  'qt', 'r', 'rabbitmq', 'rails', 'raspberrypi', 'react', 'reactivex', 'redhat', 'redis',
  'redux', 'regex', 'remix', 'replit', 'rider', 'robloxstudio', 'rocket', 'rollupjs', 'ros',
  'ruby', 'rust', 'sass', 'spring', 'sqlite', 'stackoverflow', 'styledcomponents', 'sublime',
  'supabase', 'scala', 'sklearn', 'selenium', 'sentry', 'sequelize', 'solidity', 'solidjs',
  'svelte', 'svg', 'swift', 'symfony', 'tailwind', 'tauri', 'tensorflow', 'terraform',
  'threejs', 'twitter', 'ts', 'typescript', 'ubuntu', 'unity', 'unreal', 'v', 'vala', 'vercel',
  'vim', 'visualstudio', 'vite', 'vitest', 'vscode', 'vscodium', 'vue', 'vuetify', 'wasm',
  'webflow', 'webpack', 'webstorm', 'windicss', 'windows', 'wordpress', 'workers', 'yarn',
  'zig',
] as const

const SKILL_SLUG_SET = new Set<string>(SKILL_SLUGS)

export function isKnownSkill(slug: string): boolean {
  return SKILL_SLUG_SET.has(slug.toLowerCase())
}

export function skillIconUrl(slug: string): string {
  return `${SKILL_ICON_BASE}${slug.toLowerCase()}`
}

// Ícone genérico pra links "mailto:" — um endereço de e-mail não tem domínio
// de site, então o favicon do Google (abaixo) não tem o que buscar. SVG
// inline em vez de outro serviço externo: é só um envelope, não vale mais
// uma dependência de rede pra isso.
const MAIL_ICON = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">' +
    '<rect width="32" height="32" rx="6" fill="#ffffff"/>' +
    '<path d="M6 10a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V10z" fill="#e4e4e7"/>' +
    '<path d="M6.5 9.5l9.5 7 9.5-7" stroke="#6b6b75" stroke-width="1.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/>' +
    '</svg>',
)}`

// Ícones de link (contato/projeto): em vez de manter uma lista fixa de
// plataformas conhecidas (o usuário agora pode cadastrar qualquer link, não
// só LinkedIn/GitHub/Instagram...), busca o favicon de verdade do site via
// o serviço público do Google — funciona pra qualquer domínio, sem precisar
// reconhecer o nome que o usuário digitou.
export function faviconUrl(url: string, size = 32): string | null {
  if (isEmailAddress(url)) return MAIL_ICON
  try {
    const parsed = new URL(url)
    if (parsed.protocol === 'mailto:') return MAIL_ICON
    return `https://www.google.com/s2/favicons?sz=${size}&domain=${parsed.hostname}`
  } catch {
    return null
  }
}

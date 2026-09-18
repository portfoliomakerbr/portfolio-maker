// Ícones de tecnologia via skillicons.dev — mesma API pública usada no
// PortfolioMaker antigo (Angular): sem chave, sem custo, cobre centenas de
// stacks. Lista de slugs portada de portfolio-maker-frontend/src/app/models/others/languages.ts.
// `theme=light` é o parâmetro que a própria API expõe pra inverter ícones que
// por padrão são pretos/escuros (github, apple, vercel...) pra branco — sem
// isso, esses ícones ficavam quase invisíveis no fundo escuro do app.
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

// Ícones de link (redes sociais/contato): tentamos primeiro Simple Icons via
// CDN (cor de marca exata), mas o slug "linkedin" foi removido de lá (pedido
// de takedown da própria LinkedIn — retorna 404 mesmo sendo um serviço bem
// conhecido). skillicons.dev também cobre ícones sociais, então unificamos
// tudo nessa única API — mesma origem já usada pras tecnologias, um problema
// a menos de CORS/disponibilidade, e o `theme=light` resolve o contraste no
// fundo escuro pros ícones que são pretos por padrão (github, x, tiktok...).
const LINK_SLUGS: Record<string, string> = {
  linkedin: 'linkedin',
  github: 'github',
  instagram: 'instagram',
  youtube: 'youtube',
  twitter: 'twitter',
  x: 'twitter',
  facebook: 'facebook',
  tiktok: 'tiktok',
  whatsapp: 'whatsapp',
  telegram: 'telegram',
  gmail: 'gmail',
  email: 'gmail',
  discord: 'discord',
  twitch: 'twitch',
  dribbble: 'dribbble',
  behance: 'behance',
  medium: 'medium',
  devto: 'devto',
  stackoverflow: 'stackoverflow',
}

export function linkIconUrl(nome: string): string | null {
  const slug = LINK_SLUGS[nome.trim().toLowerCase()]
  if (!slug) return null
  return skillIconUrl(slug)
}

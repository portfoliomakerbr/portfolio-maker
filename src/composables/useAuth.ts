import { computed, inject, onMounted, onUnmounted, provide, ref, type InjectionKey, type Ref } from 'vue'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

export interface LoginResult {
  error: string | null
  locked?: boolean
  lockedForSeconds?: number
  remainingAttempts?: number
  resetInSeconds?: number
}

interface AuthContext {
  session: Ref<Session | null>
  user: Ref<User | null>
  isAuthenticated: Ref<boolean>
  loading: Ref<boolean>
  signIn: (email: string, password: string) => Promise<LoginResult>
  signInWithGoogle: () => Promise<{ error: string | null }>
  signUp: (email: string, password: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  requestPasswordReset: (email: string) => Promise<{ error: string | null }>
  updatePassword: (password: string) => Promise<{ error: string | null }>
}

const AUTH_KEY: InjectionKey<AuthContext> = Symbol('auth')

/**
 * Cria o estado de sessão. Chamado uma única vez em App.vue e disponibilizado
 * via provide/inject para o resto da árvore — evita N subscriptions
 * independentes a onAuthStateChange (uma por componente que precisasse de auth).
 */
export function provideAuth(): AuthContext {
  const session = ref<Session | null>(null)
  const loading = ref(true)
  const user = computed(() => session.value?.user ?? null)
  const isAuthenticated = computed(() => session.value !== null)

  let unsubscribe: (() => void) | null = null

  onMounted(async () => {
    const { data } = await supabase.auth.getSession()
    session.value = data.session
    loading.value = false

    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      session.value = newSession
    })
    unsubscribe = () => sub.subscription.unsubscribe()
  })

  onUnmounted(() => {
    unsubscribe?.()
  })

  // Não usa supabase.auth.signInWithPassword() direto: passa pela edge
  // function `login`, que aplica o bloqueio temporário por tentativas erradas
  // (recurso que o Supabase Auth não tem nativo). Em caso de sucesso, a
  // function devolve os tokens e a sessão é aplicada aqui via setSession().
  async function signIn(email: string, password: string): Promise<LoginResult> {
    const { data, error } = await supabase.functions.invoke('login', {
      body: { email, password },
    })

    if (error) {
      const body = (error as { context?: { json: () => Promise<Record<string, unknown>> } }).context
      const payload = body ? await body.json().catch(() => null) : null

      return {
        error: (payload?.message as string) ?? 'Não foi possível entrar.',
        locked: Boolean(payload?.locked),
        lockedForSeconds: payload?.lockedForSeconds as number | undefined,
        remainingAttempts: payload?.remainingAttempts as number | undefined,
        resetInSeconds: payload?.resetInSeconds as number | undefined,
      }
    }

    await supabase.auth.setSession({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
    })

    return { error: null }
  }

  async function signInWithGoogle() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/edit`,
        // Sem isso o Google pula a tela de escolha de conta sempre que já
        // existe uma sessão Google ativa no navegador (comum quando a mesma
        // pessoa usa várias contas/projetos com o mesmo Client ID) — força
        // o seletor a aparecer toda vez em vez de logar direto na última usada.
        queryParams: { prompt: 'select_account' },
      },
    })
    return { error: error?.message ?? null }
  }

  async function signUp(email: string, password: string) {
    const { error } = await supabase.auth.signUp({ email, password })
    return { error: error?.message ?? null }
  }

  async function signOut() {
    await supabase.auth.signOut()
  }

  async function requestPasswordReset(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    return { error: error?.message ?? null }
  }

  async function updatePassword(password: string) {
    const { error } = await supabase.auth.updateUser({ password })
    return { error: error?.message ?? null }
  }

  const context: AuthContext = {
    session,
    user,
    isAuthenticated,
    loading,
    signIn,
    signInWithGoogle,
    signUp,
    signOut,
    requestPasswordReset,
    updatePassword,
  }

  provide(AUTH_KEY, context)
  return context
}

export function useAuth(): AuthContext {
  const context = inject(AUTH_KEY)
  if (!context) {
    throw new Error('useAuth() precisa ser usado dentro da árvore de App.vue (provideAuth não foi chamado).')
  }
  return context
}

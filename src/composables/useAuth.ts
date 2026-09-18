import { computed, inject, onMounted, onUnmounted, provide, ref, type InjectionKey, type Ref } from 'vue'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

interface AuthContext {
  session: Ref<Session | null>
  user: Ref<User | null>
  isAuthenticated: Ref<boolean>
  loading: Ref<boolean>
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
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

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
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

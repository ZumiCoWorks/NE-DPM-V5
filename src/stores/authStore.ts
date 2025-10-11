import { create } from 'zustand'
import { supabase, type User } from '../lib/supabase'

type AuthState = {
  user: User | null
  loading: boolean
  error: string | null
  initialize: () => Promise<void>
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  signUp: (
    email: string,
    password: string,
    fullName: string,
    organization?: string
  ) => Promise<{ success: boolean; error?: string }>
  signOut: () => Promise<{ success: boolean; error?: string }>
  updateProfile: (
    updates: Partial<Pick<User, 'full_name' | 'organization'>>
  ) => Promise<{ success: boolean; error?: string }>
  getToken: () => Promise<string | null>
}

// Toggle mock auth via env, default true for demo
const USE_MOCK_AUTH = (import.meta as any)?.env?.VITE_USE_MOCK_AUTH !== 'false'

const mockProfile: User = {
  id: 'mock-user-id',
  email: 'demo@naveaze.com',
  full_name: 'Demo User',
  role: 'organizer',
  organization: 'NavEaze Demo',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  loading: true,
  error: null,

  initialize: async () => {
    set({ loading: true, error: null })
    try {
      if (USE_MOCK_AUTH) {
        // Start unauthenticated in mock mode until user signs in
        set({ user: null, loading: false, error: null })
        return
      }

      const { data: { session }, error } = await supabase.auth.getSession()
      if (error) {
        set({ user: null, loading: false, error: error.message })
        return
      }
      if (session?.user) {
        // TODO: fetch real profile from DB if needed
        set({ user: mockProfile, loading: false, error: null })
      } else {
        set({ user: null, loading: false, error: null })
      }
    } catch (e) {
      set({ user: null, loading: false, error: 'Failed to initialize auth' })
    }
  },

  signIn: async (email: string, password: string) => {
    set({ loading: true, error: null })
    try {
      if (USE_MOCK_AUTH) {
        await new Promise((r) => setTimeout(r, 400))
        set({ user: { ...mockProfile, email }, loading: false, error: null })
        return { success: true }
      }

      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw new Error(error.message)

      // TODO: fetch real profile by data.user.id
      set({ user: { ...mockProfile, email: data.user?.email || email }, loading: false, error: null })
      return { success: true }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Sign in failed'
      set({ loading: false, error: msg })
      return { success: false, error: msg }
    }
  },

  signUp: async (email, password, fullName, organization) => {
    set({ loading: true, error: null })
    try {
      if (USE_MOCK_AUTH) {
        await new Promise((r) => setTimeout(r, 500))
        const newUser: User = {
          id: 'mock-user-id',
          email,
          full_name: fullName,
          role: 'organizer',
          organization,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
        set({ user: newUser, loading: false, error: null })
        return { success: true }
      }

      const { data, error } = await supabase.auth.signUp({ email, password })
      if (error) throw new Error(error.message)
      const newUser: User = {
        id: data.user?.id || 'user-id',
        email,
        full_name: fullName,
        role: 'organizer',
        organization,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      set({ user: newUser, loading: false, error: null })
      return { success: true }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Sign up failed'
      set({ loading: false, error: msg })
      return { success: false, error: msg }
    }
  },

  signOut: async () => {
    set({ loading: true, error: null })
    try {
      if (!USE_MOCK_AUTH) {
        const { error } = await supabase.auth.signOut()
        if (error) throw new Error(error.message)
      } else {
        await new Promise((r) => setTimeout(r, 200))
      }
      set({ user: null, loading: false, error: null })
      return { success: true }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Sign out failed'
      set({ loading: false, error: msg })
      return { success: false, error: msg }
    }
  },

  updateProfile: async (updates) => {
    const { user } = get()
    if (!user) return { success: false, error: 'No user logged in' }
    set({ loading: true, error: null })
    try {
      if (!USE_MOCK_AUTH) {
        const { error } = await supabase
          .from('users')
          .update({ ...updates, updated_at: new Date().toISOString() })
          .eq('id', user.id)
        if (error) throw new Error(error.message)
      } else {
        await new Promise((r) => setTimeout(r, 300))
      }
      const updated: User = { ...user, ...updates, updated_at: new Date().toISOString() } as User
      set({ user: updated, loading: false, error: null })
      return { success: true }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Update failed'
      set({ loading: false, error: msg })
      return { success: false, error: msg }
    }
  },

  getToken: async () => {
    if (USE_MOCK_AUTH) return 'mock-token'
    const { data: { session } } = await supabase.auth.getSession()
    return session?.access_token || null
  },
}))

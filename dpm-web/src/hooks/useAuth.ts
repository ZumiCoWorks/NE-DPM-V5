import { useEffect } from 'react'
import { useAuthStore } from '../stores/authStore'
import { supabase } from '../lib/supabase'

export const getAccessToken = async (): Promise<string | null> => {
  if (!supabase) return null
  const { data: { session } } = await supabase.auth.getSession()
  return session?.access_token || null
}

export const useAuth = () => {
  const { user, loading, error, initialize, signIn, signUp, signOut, updateProfile, getToken } = useAuthStore()

  useEffect(() => {
    // initialize auth state on first use
    initialize()
    // no cleanup needed; store persists in memory
  }, [initialize])

  return {
    user,
    loading,
    error,
    signIn,
    signUp,
    signOut,
    updateProfile,
    getToken,
  }
}

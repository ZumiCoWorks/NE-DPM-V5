import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
const demoMode = (import.meta as { env: Record<string, string> }).env.VITE_DEMO_MODE === 'true'
import type { Session, User } from '@supabase/auth-js'

// Define a more complete user profile type
// Lightweight user profile used across the app to avoid strict coupling
// with Supabase's types while we stabilize the schema.
export interface UserProfile {
  id: string
  email?: string
  role?: string
  full_name?: string
  created_at?: string
  [key: string]: unknown
}

export interface AuthContextType {
  user: UserProfile | null
  session: Session | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  register: (email: string, password: string, fullName: string) => Promise<void>
  updateProfile: (updates: Partial<Pick<UserProfile, 'full_name' | 'email'>> & Record<string, unknown>) => Promise<void>
  updateUserRole: (role: 'admin' | 'attendee' | 'sponsor' | 'staff') => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  // Helper function to get user profile and set role
  const getProfileAndSetUser = async (authUser: User) => {
    try {
      if (!supabase) {
        // In demo or missing client, just set minimal user fields
        setUser({ id: authUser.id, email: authUser.email ?? undefined })
        return
      }
      const { data, error } = await supabase
        .from('profiles')
        .select('id, role, email')
        .eq('id', authUser.id)
        .maybeSingle()
      const profile = (data as { role?: string; email?: string } | null)

      if (profile) {
        const full_name = authUser.email?.split('@')[0] || 'User'
        setUser({ id: authUser.id, email: profile.email ?? authUser.email ?? undefined, role: profile.role, full_name })
      } else {
        // No profile, just set the user.
        // The ProtectedRoute will force role selection.
        setUser({ id: authUser.id, email: authUser.email ?? undefined })
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
      setUser({ id: authUser.id, email: authUser.email ?? undefined }) // Still set the user
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setLoading(true)
    if (demoMode) {
      setSession(null)
      setUser({ id: 'demo-user', email: 'demo@example.com', role: 'admin', full_name: 'Demo Admin' })
      setLoading(false)
      return
    }

    if (!supabase) {
      setSession(null)
      setLoading(false)
      return
    }
    supabase.auth.getSession().then(({ data }: { data: { session: Session | null } }) => {
      const session = data.session
      setSession(session)
      const currentUser = session?.user ?? null
      if (currentUser) {
        getProfileAndSetUser(currentUser)
      } else {
        setLoading(false)
      }

      const { data: authListener } = supabase.auth.onAuthStateChange(
        async (_event: string, session: Session | null) => {
          setLoading(true)
          setSession(session)
          const newCurrentUser = session?.user ?? null

          if (newCurrentUser) {
            await getProfileAndSetUser(newCurrentUser)
          } else {
            setUser(null)
          }
          setLoading(false)
        }
      )

      return () => {
        authListener.subscription.unsubscribe()
      }
    })
  }, [])

  const login = async (email: string, password: string) => {
    if (!supabase) throw new Error('Supabase not initialized')
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw error
    // onAuthStateChange will handle setting the user
  }

  const register = async (email: string, password: string, fullName: string) => {
    if (!supabase) throw new Error('Supabase not initialized')
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName, // Store name in auth.users table
        },
      },
    })
    if (error) throw error
    // onAuthStateChange will handle setting the user
  }
  
  const logout = async () => {
    if (!supabase) return
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    // onAuthStateChange will handle setting user to null
  }

  // Function to set role *after* signup (for RoleSelectorPage)
  const updateUserRole = async (role: 'admin' | 'attendee' | 'sponsor' | 'staff') => {
    if (!user) throw new Error("No user logged in")
    if (demoMode) {
      const full_name = user.full_name || user.email?.split('@')[0] || 'User'
      setUser({ ...user, role, full_name })
      return
    }
    // Prefer backend in development to bypass RLS issues
    const apiBase = (import.meta as { env: Record<string, string> }).env.VITE_API_URL || '/api'
    if ((import.meta as { env: Record<string, string> }).env.MODE !== 'production') {
      let accessToken: string | null = null
      for (let i = 0; i < 3; i++) {
        const { data: { session } } = await supabase.auth.getSession()
        accessToken = session?.access_token || null
        if (accessToken) break
        await new Promise(resolve => setTimeout(resolve, 400))
      }
      const res = await fetch(`${apiBase}/auth/set-role`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}) },
        body: JSON.stringify({ role }),
        credentials: 'include',
      })
      if (!res.ok) {
        const j = await res.json().catch(()=>({}))
        throw new Error(j?.message || 'Failed to set role via backend')
      }
      const { data } = await res.json().catch(()=>({})) as { data?: { role?: string } }
      const full_name = user.full_name || user.email?.split('@')[0] || 'User'
      setUser({ ...user, role: (data?.role ?? role), full_name })
      return
    }

    // Production fallback: upsert via Supabase client (requires proper RLS policies)
    if (!supabase) throw new Error('Supabase not initialized')
    const { data, error } = await supabase
      .from('profiles')
      .upsert({ id: user.id, role: role, email: user.email! })
      .select()
      .single()

    if (error) throw error
    const updated = (data as { role?: string } | null)
    const full_name = user.full_name || user.email?.split('@')[0] || 'User'
    setUser({ ...user, role: updated?.role ?? role, full_name })
  }

  // Update profile details in the 'profiles' table and reflect in context
  const updateProfile = async (
    updates: Partial<Pick<UserProfile, 'full_name' | 'email'>> & Record<string, unknown>
  ) => {
    if (!user) throw new Error('No user logged in')

    // Extract first_name and last_name from full_name if provided
    const payload: Record<string, unknown> = {
      id: user.id,
      ...updates,
    }
    
    if (updates.full_name) {
      const nameParts = updates.full_name.split(' ')
      payload.first_name = nameParts[0]
      payload.last_name = nameParts.slice(1).join(' ') || nameParts[0]
      delete payload.full_name
    }

    if (!supabase) throw new Error('Supabase not initialized')
    const { data, error } = await supabase
      .from('profiles')
      .upsert(payload)
      .select('first_name, last_name, role, email')
      .single()

    if (error) throw error
    const profileData = (data as { first_name?: string; last_name?: string; role?: string; email?: string } | null) || {}
    const full_name = profileData.first_name && profileData.last_name 
      ? `${profileData.first_name} ${profileData.last_name}`
      : profileData.first_name || profileData.last_name || user.full_name

    setUser({ ...user, full_name, role: profileData.role ?? user.role, email: profileData.email ?? user.email })
  }

  const value = {
    user,
    session,
    loading,
    login,
    logout,
    register,
    updateProfile,
    updateUserRole,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

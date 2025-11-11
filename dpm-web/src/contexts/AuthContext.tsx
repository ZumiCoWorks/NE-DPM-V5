import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Session, User } from '@supabase/supabase-js'

// Define a more complete user profile type
// Lightweight user profile used across the app to avoid strict coupling
// with Supabase's types while we stabilize the schema.
export interface UserProfile {
  id: string
  email?: string
  role?: string
  full_name?: string
  created_at?: string
  [key: string]: any
}

export interface AuthContextType {
  user: UserProfile | null
  session: Session | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  register: (email: string, password: string, fullName: string) => Promise<void>
  updateProfile: (updates: Partial<Pick<UserProfile, 'full_name' | 'email'>> & Record<string, any>) => Promise<void>
  updateUserRole: (role: 'event_organizer' | 'venue_manager') => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  // Helper function to get user profile and set role
  const getProfileAndSetUser = async (user: User) => {
    try {
      const { data: profile } = await supabase
        .from('users')
        .select('role, full_name')
        .eq('id', user.id)
        .single()
      
      if (profile) {
        setUser({ ...user, role: profile.role, full_name: profile.full_name })
      } else {
        // No profile, just set the user.
        // The ProtectedRoute will force role selection.
        setUser(user)
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
      setUser(user) // Still set the user
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setLoading(true)
    // 1. Get the initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      const currentUser = session?.user ?? null
      if (currentUser) {
        // 2. If session exists, get profile
        getProfileAndSetUser(currentUser)
      } else {
        setLoading(false)
      }

      // 3. Listen for future auth state changes
      const { data: authListener } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          setLoading(true)
          setSession(session)
          const newCurrentUser = session?.user ?? null

          if (newCurrentUser) {
            // User logged in or signed up, get their profile
            await getProfileAndSetUser(newCurrentUser)
          } else {
            // User logged out
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
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw error
    // onAuthStateChange will handle setting the user
  }

  const register = async (email: string, password: string, fullName: string) => {
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
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    // onAuthStateChange will handle setting user to null
  }

  // Function to set role *after* signup (for RoleSelectorPage)
  const updateUserRole = async (role: 'event_organizer' | 'venue_manager') => {
    if (!user) throw new Error("No user logged in")

    // 1. Update the 'users' table (or create entry)
    const { data, error } = await supabase
      .from('users')
      .upsert({ id: user.id, role: role, email: user.email!, updated_at: new Date().toISOString() })
      .select()
      .single()

    if (error) throw error

    // 2. Update the role on the user object in context
    setUser({ ...user, role: data.role })
  }

  // Update profile details in the 'users' table and reflect in context
  const updateProfile = async (
    updates: Partial<Pick<UserProfile, 'full_name' | 'email'>> & Record<string, any>
  ) => {
    if (!user) throw new Error('No user logged in')

    const payload = {
      id: user.id,
      ...updates,
      updated_at: new Date().toISOString(),
    }

    const { data, error } = await supabase
      .from('users')
      .upsert(payload, { onConflict: 'id' })
      .select('full_name, role, email')
      .single()

    if (error) throw error

    setUser({ ...user, full_name: data.full_name ?? user.full_name, role: data.role ?? user.role, email: data.email ?? user.email })
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
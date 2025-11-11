import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
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
  updateUserRole: (role: 'admin' | 'attendee' | 'sponsor' | 'staff') => Promise<void>
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
        .from('profiles')
        .select('role, first_name, last_name')
        .eq('id', user.id)
        .single()
      
      if (profile) {
        const full_name = profile.first_name && profile.last_name 
          ? `${profile.first_name} ${profile.last_name}`
          : profile.first_name || profile.last_name || user.email?.split('@')[0] || 'User'
        setUser({ ...user, role: profile.role, full_name })
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
        async (_event: string, session: Session | null) => {
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
  const updateUserRole = async (role: 'admin' | 'attendee' | 'sponsor' | 'staff') => {
    if (!user) throw new Error("No user logged in")

    // 1. Update the 'profiles' table (or create entry)
    const { data, error } = await supabase
      .from('profiles')
      .upsert({ id: user.id, role: role, email: user.email! })
      .select()
      .single()

    if (error) throw error

    // 2. Update the role on the user object in context
    const full_name = user.full_name || user.email?.split('@')[0] || 'User'
    setUser({ ...user, role: data.role, full_name })
  }

  // Update profile details in the 'profiles' table and reflect in context
  const updateProfile = async (
    updates: Partial<Pick<UserProfile, 'full_name' | 'email'>> & Record<string, any>
  ) => {
    if (!user) throw new Error('No user logged in')

    // Extract first_name and last_name from full_name if provided
    let payload: any = {
      id: user.id,
      ...updates,
    }
    
    if (updates.full_name) {
      const nameParts = updates.full_name.split(' ')
      payload.first_name = nameParts[0]
      payload.last_name = nameParts.slice(1).join(' ') || nameParts[0]
      delete payload.full_name
    }

    const { data, error } = await supabase
      .from('profiles')
      .upsert(payload, { onConflict: 'id' })
      .select('first_name, last_name, role, email')
      .single()

    if (error) throw error

    const full_name = data.first_name && data.last_name 
      ? `${data.first_name} ${data.last_name}`
      : data.first_name || data.last_name || user.full_name

    setUser({ ...user, full_name, role: data.role ?? user.role, email: data.email ?? user.email })
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
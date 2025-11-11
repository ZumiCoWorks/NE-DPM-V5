import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { Session, User } from '@supabase/supabase-js'
import type { Database } from '../types/database'

type UserProfile = Database['public']['Tables']['users']['Row']

// Define a more complete user profile type
export interface UserProfileExtended extends User {
  role?: UserProfile['role']
  full_name?: string
}

export interface AuthContextType {
  user: UserProfileExtended | null
  profile: UserProfile | null
  session: Session | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  register: (email: string, password: string, fullName: string) => Promise<void>
  updateUserRole: (role: UserProfile['role']) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<UserProfileExtended | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  const createUserProfile = useCallback(async (authUser: User) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .insert({
          id: authUser.id,
          email: authUser.email!,
          full_name: authUser.user_metadata?.full_name || null,
          role: 'event_organizer', // Default role
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating user profile:', error)
        setProfile(null)
      } else if (data) {
        console.log('User profile created successfully')
        setProfile(data)
        setUser({ ...authUser, role: data.role, full_name: data.full_name || undefined })
      }
    } catch (error) {
      console.error('Error creating user profile:', error)
      setProfile(null)
    } finally {
      setLoading(false)
    }
  }, [])

  // Helper function to get user profile and set role
  const getProfileAndSetUser = useCallback(async (authUser: User) => {
    try {
      const { data: userProfile, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single()
      
      if (userProfile) {
        setProfile(userProfile)
        setUser({ ...authUser, role: userProfile.role, full_name: userProfile.full_name || undefined })
      } else if (error?.code === 'PGRST116') {
        // No profile exists, create one
        await createUserProfile(authUser)
      } else {
        // No profile, just set the user.
        // The ProtectedRoute will force role selection.
        setUser(authUser)
        setProfile(null)
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
      setUser(authUser) // Still set the user
      setProfile(null)
    } finally {
      setLoading(false)
    }
  }, [createUserProfile])

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
    })

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
          setProfile(null)
          setLoading(false)
        }
      }
    )

    return () => {
      authListener.subscription.unsubscribe()
    }
  }, [getProfileAndSetUser])

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
  const updateUserRole = async (role: UserProfile['role']) => {
    if (!user) throw new Error("No user logged in")

    // 1. Update the 'users' table (or create entry)
    const { error } = await supabase
      .from('users')
      .upsert({ id: user.id, role: role, email: user.email!, updated_at: new Date().toISOString() })
      .select()
      .single()

    if (error) throw error

    // 2. Refresh profile to get updated role
    await getProfileAndSetUser(user)
  }

  const value = {
    user,
    profile,
    session,
    loading,
    login,
    logout,
    register,
    updateUserRole,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
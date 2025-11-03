import { createClient } from '@supabase/supabase-js'

const supabaseUrl = (import.meta as { env: Record<string, string> }).env.VITE_SUPABASE_URL
const supabaseAnonKey = (import.meta as { env: Record<string, string> }).env.VITE_SUPABASE_ANON_KEY

// Try to create the Supabase client. If env vars are missing or invalid (e.g. placeholder
// values), don't throw during module initialization — log a warning and export a null
// client. This prevents the entire app from crashing before React can render and lets
// the UI handle the missing configuration (or the developer fill in real values).
let _supabase: any = null
if (supabaseUrl && supabaseAnonKey) {
  try {
    _supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      }
    })
  } catch (err) {
    // Could be an invalid URL or other initialization error from the library
    // Log the error but don't throw to avoid a blank page on startup.
    // eslint-disable-next-line no-console
    console.error('Failed to initialize Supabase client:', err)
    _supabase = null
  }
} else {
  // eslint-disable-next-line no-console
  console.warn('Supabase environment variables are not set (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY).')
}

export const supabase = _supabase

// Helper function to get the current user
export const getCurrentUser = async () => {
  if (!supabase) return null
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error) {
    console.error('Error getting current user:', error)
    return null
  }
  return user
}

// Helper function to sign out
export const signOut = async () => {
  if (!supabase) {
    // nothing to do when client is not initialized
    return
  }
  const { error } = await supabase.auth.signOut()
  if (error) {
    console.error('Error signing out:', error)
    throw error
  }
}

// Log the supabase URL so we can quickly validate runtime env at startup
/* eslint-disable no-console */
console.log("LOG: Supabase client created. URL:", (import.meta as { env: Record<string, string> }).env.VITE_SUPABASE_URL)
/* eslint-enable no-console */

// If the client was created, listen for auth state changes and redirect on sign-out / deletion.
// This helps ensure the UI doesn't remain stuck when the library clears a session due to
// an invalid refresh token or other auth issues.
if (supabase && typeof window !== 'undefined') {
  // eslint-disable-next-line no-console
  console.log('LOG: Supabase: registering onAuthStateChange listener')

  supabase.auth.onAuthStateChange((event, session) => {
    // eslint-disable-next-line no-console
    console.log('LOG: Supabase auth event:', event, session ? 'session exists' : 'no session')
    if (event === 'SIGNED_OUT' || event === 'USER_DELETED') {
      // Clear any client-side state if necessary and redirect to login
      try {
        // eslint-disable-next-line no-console
        console.log('LOG: Supabase: detected sign-out or user deletion, redirecting to /login')
        window.location.href = '/login'
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error('LOG: Supabase: failed to redirect after auth event', e)
      }
    }
  })
}
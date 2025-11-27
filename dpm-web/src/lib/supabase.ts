import { createClient } from '@supabase/supabase-js'
import type { Session } from '@supabase/auth-js'

const env = (import.meta as { env: Record<string, string> }).env
const supabaseUrl = env.VITE_SUPABASE_URL
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY
const demoMode = env.VITE_DEMO_MODE === 'true'

// Minimal interfaces to type the demo/mock client without using `any`.
// Keep the surface strictly to what the app uses to avoid over-typing.
interface QueryBuilder extends PromiseLike<{ data: unknown; error: null }> {
  select(columns?: string): QueryBuilder
  eq(column: string, value: unknown): QueryBuilder
  in(column: string, values: unknown[]): QueryBuilder
  order(column: string, opts?: { ascending?: boolean; nullsFirst?: boolean }): QueryBuilder
  limit(n: number): QueryBuilder
  single(): QueryBuilder
  delete(): QueryBuilder
  insert(rows?: unknown): QueryBuilder
  update(values?: unknown): QueryBuilder
  upsert(values?: unknown): QueryBuilder
  then<TResult1 = { data: unknown; error: null }, TResult2 = never>(
    onfulfilled?: ((value: { data: unknown; error: null }) => TResult1 | PromiseLike<TResult1>) | null | undefined,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined
  ): PromiseLike<TResult1 | TResult2>
}

interface SupabaseAuthLike {
  getSession(): Promise<{ data: { session: Session | null } }>
  onAuthStateChange(
    callback: (event: string, session: Session | null) => void
  ): { data: { subscription: { unsubscribe(): void } } }
  getUser(): Promise<{ data: { user: { id: string; email: string } }; error: null }>
  signInWithPassword(_opts?: unknown): Promise<{ data: { user: any; session: any }; error: null }>
  signUp(_opts?: unknown): Promise<{ data: { user: any; session: any }; error: null }>
  signOut(): Promise<{ error: null }>
}

interface SupabaseStorageLike {
  from(bucket: string): {
    upload(path: string, file: any, options?: any): Promise<{ data: any; error: any }>
    getPublicUrl(path: string): { data: { publicUrl: string } }
    remove(paths: string[]): Promise<{ data: any; error: any }>
  }
}

interface SupabaseClientLike {
  from(table: string): QueryBuilder
  auth: SupabaseAuthLike
  storage: SupabaseStorageLike
}

let _supabase: SupabaseClientLike | null = null

if (demoMode) {
  // A lightweight thenable query builder to mimic supabase-js chaining in demo mode.
  const makeBuilder = (initialData: unknown = []) => {
    let data = initialData
    const builder: QueryBuilder = {
      select: (_columns?: string) => { void _columns; return builder },
      eq: (_column: string, _value: unknown) => { void _column; void _value; return builder },
      in: (_column: string, _values: unknown[]) => { void _column; void _values; return builder },
      order: (_column: string, _opts?: { ascending?: boolean; nullsFirst?: boolean }) => { void _column; void _opts; return builder },
      limit: (n: number) => { void n; return builder },
      single: () => { data = null; return builder },
      delete: () => { data = null; return builder },
      insert: (_rows?: unknown) => { void _rows; data = null; return builder },
      update: (_values?: unknown) => { void _values; data = null; return builder },
      upsert: (_values?: unknown) => { void _values; data = { role: 'admin' }; return builder },
      // Provide a PromiseLike-compliant `then` signature to satisfy TypeScript
      then: <TResult1 = { data: unknown; error: null }, TResult2 = never>(
        onfulfilled?: ((value: { data: unknown; error: null }) => TResult1 | PromiseLike<TResult1>) | null | undefined,
        onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined
      ) => {
        void onrejected
        const payload = { data, error: null as null }
        return Promise.resolve(onfulfilled ? onfulfilled(payload) : payload) as PromiseLike<TResult1 | TResult2>
      }
    }
    return builder
  }
  const mockAuth: SupabaseAuthLike = {
    getSession: async () => ({ data: { session: null } }),
    onAuthStateChange: (callback: (event: string, session: Session | null) => void) => { void callback; return { data: { subscription: { unsubscribe() { } } } } },
    getUser: async () => ({ data: { user: { id: 'demo-user', email: 'demo@example.com' } }, error: null }),
    signInWithPassword: async (_opts?: unknown) => { void _opts; return { data: { user: null, session: null }, error: null } },
    signUp: async (_opts?: unknown) => { void _opts; return { data: { user: null, session: null }, error: null } },
    signOut: async () => ({ error: null }),
  }
  const mockStorage: SupabaseStorageLike = {
    from: (bucket: string) => ({
      upload: async (path: string, file: any, options?: any) => {
        console.log(`[Mock Storage] Uploading to ${bucket}/${path}`, file);
        return { data: { path }, error: null };
      },
      getPublicUrl: (path: string) => ({
        data: { publicUrl: `https://mock-storage.com/${bucket}/${path}` }
      }),
      remove: async () => ({ data: {}, error: null }),
    })
  }
  _supabase = {
    from: (table: string) => { void table; return makeBuilder([]) },
    auth: mockAuth,
    storage: mockStorage,
  }
  // eslint-disable-next-line no-console
  console.log('LOG: Demo mode enabled — using mock Supabase client')
} else {
  // Try to create the Supabase client. If env vars are missing or invalid (e.g. placeholder
  // values), don't throw during module initialization — log a warning and export a null client.
  if (supabaseUrl && supabaseAnonKey) {
    try {
      _supabase = createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: true,
        }
      }) as unknown as SupabaseClientLike
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Failed to initialize Supabase client:', err)
      _supabase = null
    }
  } else {
    // In demo mode, we don't need real Supabase credentials, so don't warn
    if (!demoMode) {
      // eslint-disable-next-line no-console
      console.warn('Supabase environment variables are not set (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY).')
    }
  }
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
if (demoMode) {
  console.log('LOG: Demo mode enabled — using mock Supabase client')
} else if (supabaseUrl) {
  console.log('LOG: Supabase client created. URL:', supabaseUrl)
}
/* eslint-enable no-console */

// If the client was created, listen for auth state changes and redirect on sign-out / deletion.
// This helps ensure the UI doesn't remain stuck when the library clears a session due to
// an invalid refresh token or other auth issues.
if (supabase && typeof window !== 'undefined' && !demoMode) {
  // eslint-disable-next-line no-console
  console.log('LOG: Supabase: registering onAuthStateChange listener')

  // Real client only: type listener params to avoid `any`.
  supabase.auth.onAuthStateChange((event: string, session: Session | null) => {
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
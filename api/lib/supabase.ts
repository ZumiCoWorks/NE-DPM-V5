import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// Check if we're using demo/placeholder values
const isDemoMode = supabaseUrl?.includes('demo.supabase.co') || 
                   supabaseServiceRoleKey?.includes('demo-')

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error('Missing Supabase environment variables for backend')
}

// Create Supabase client with service role key for backend operations
let supabaseAdmin: any

if (isDemoMode) {
  console.log('🧪 Backend using Mock Supabase Client for Demo')
  
  // Mock database for demo
  const mockDB: { [key: string]: any[] } = { cdv_reports: [] }
  
  supabaseAdmin = {
    from: (table: string) => ({
      select: (columns = '*') => ({
        order: (column: string, options?: any) => ({
          limit: (count: number) => 
            Promise.resolve({ 
              data: (mockDB[table] || []).slice(0, count), 
              error: null 
            })
        }),
        then: (callback: any) => 
          Promise.resolve({ data: mockDB[table] || [], error: null }).then(callback)
      }),
      insert: (records: any[]) => ({
        select: () => 
          Promise.resolve().then(() => {
            if (!mockDB[table]) mockDB[table] = []
            const newRecords = records.map((record, i) => ({
              id: `demo_${Date.now()}_${i}`,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              ...record
            }))
            mockDB[table].push(...newRecords)
            return { data: newRecords, error: null }
          })
      })
    })
  }
} else {
  supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

export { supabaseAdmin }

// Create regular client for user operations
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY
if (!supabaseAnonKey) {
  throw new Error('Missing Supabase anon key for user operations')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Helper function to get user from JWT token
export const getUserFromToken = async (token: string) => {
  const { data: { user }, error } = await supabase.auth.getUser(token)
  if (error) {
    throw new Error(`Invalid token: ${error.message}`)
  }
  return user
}

// Helper function to verify user authentication
export const verifyAuth = async (authHeader: string | undefined) => {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Missing or invalid authorization header')
  }
  
  const token = authHeader.substring(7) // Remove 'Bearer ' prefix
  return await getUserFromToken(token)
}
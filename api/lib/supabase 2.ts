import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error('Missing Supabase environment variables for backend')
}

// Create Supabase client with service role key for backend operations
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

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
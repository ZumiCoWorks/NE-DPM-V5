import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

// Load environment variables
const __filename = fileURLToPath((import.meta as { url: string }).url)
const __dirname = path.dirname(__filename)
config({ path: path.resolve(__dirname, '../../.env') })

// Environment variables validation
const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl) {
  throw new Error('Missing SUPABASE_URL environment variable')
}

if (!supabaseServiceKey) {
  throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable')
}

// Create Supabase client with service role key for server-side operations
export const supabaseAdmin = createClient(
  supabaseUrl,
  supabaseServiceKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
)

// Alias for backwards compatibility
export const supabase = supabaseAdmin

// Helper function to get user by ID
export const getUserById = async (userId: string) => {
  const { data, error } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) {
    throw new Error(`Failed to fetch user: ${error.message}`)
  }

  if (!data) {
    throw new Error('User not found')
  }

  return data
}

// Helper function to check if user has specific role
export const userHasRole = async (userId: string, allowedRoles: string[]) => {
  const user = await getUserById(userId)
  return allowedRoles.includes(user.role)
}

// Helper function to check if user owns resource
export const userOwnsResource = async (
  userId: string,
  table: string,
  resourceId: string,
  ownerField = 'created_by'
) => {
  const { data, error } = await supabaseAdmin
    .from(table)
    .select(ownerField)
    .eq('id', resourceId)
    .single()

  if (error) {
    throw new Error(`Failed to check resource ownership: ${error.message}`)
  }

  if (!data) {
    throw new Error('Resource not found')
  }

  return (data as Record<string, unknown>)[ownerField] === userId
}

// Helper to get a Supabase user from an access token (used by some middleware)
export const getUserFromToken = async (token: string) => {
  if (!token) return null
  try {
    const { data, error } = await supabaseAdmin.auth.getUser(token)
    if (error) return null
    return data.user || null
  } catch (err) {
    console.error('getUserFromToken error:', err)
    return null
  }
}
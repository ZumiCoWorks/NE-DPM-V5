import { createClient } from '@supabase/supabase-js'
import { Database } from '../../src/types/database'
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
export const supabase = createClient<Database>(
  supabaseUrl,
  supabaseServiceKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
)

// Helper function to get user by ID
export const getUserById = async (userId: string) => {
  const { data, error } = await supabase
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
  const { data, error } = await supabase
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
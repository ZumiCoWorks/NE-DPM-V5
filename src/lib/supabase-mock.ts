/**
 * Mock Supabase Client for Development/Demo
 * This allows the application to run without actual Supabase credentials
 */

// In-memory storage for demo purposes
let mockDatabase: { [table: string]: any[] } = {
  cdv_reports: []
}

let mockSubscriptions: { [channel: string]: any } = {}

// Mock Supabase client interface
const createMockSupabaseClient = () => {
  return {
    from: (table: string) => ({
      select: (columns = '*') => ({
        order: (column: string, options?: any) => ({
          limit: (count: number) => ({
            then: (callback: (result: { data: any[], error: null }) => void) => {
              const data = mockDatabase[table] || []
              const sortedData = [...data].sort((a, b) => {
                if (options?.ascending === false) {
                  return new Date(b[column]).getTime() - new Date(a[column]).getTime()
                }
                return new Date(a[column]).getTime() - new Date(b[column]).getTime()
              })
              callback({ data: sortedData.slice(0, count), error: null })
            }
          })
        }),
        then: (callback: (result: { data: any[], error: null }) => void) => {
          const data = mockDatabase[table] || []
          callback({ data, error: null })
        }
      }),
      insert: (records: any[]) => ({
        select: () => ({
          then: (callback: (result: { data: any[], error: null }) => void) => {
            if (!mockDatabase[table]) mockDatabase[table] = []
            
            const newRecords = records.map(record => ({
              id: `mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              ...record
            }))
            
            mockDatabase[table].push(...newRecords)
            
            // Trigger mock real-time subscription
            setTimeout(() => {
              Object.values(mockSubscriptions).forEach((sub: any) => {
                if (sub.table === table && sub.callback) {
                  newRecords.forEach(record => {
                    sub.callback({ new: record })
                  })
                }
              })
            }, 100)
            
            callback({ data: newRecords, error: null })
          }
        })
      })
    }),
    
    channel: (channelName: string) => ({
      on: (event: string, filter: any, callback: (payload: any) => void) => {
        const subscription = {
          channel: channelName,
          event,
          filter,
          callback,
          table: filter.table
        }
        mockSubscriptions[channelName] = subscription
        return {
          subscribe: () => {
            console.log(`Mock subscription created for ${channelName}`)
            return subscription
          }
        }
      }
    }),
    
    auth: {
      getSession: () => Promise.resolve({ 
        data: { session: null }, 
        error: null 
      }),
      signInWithPassword: (credentials: any) => Promise.resolve({
        data: { user: { id: 'mock-user', email: credentials.email }, session: {} },
        error: null
      }),
      signUp: (credentials: any) => Promise.resolve({
        data: { user: { id: 'mock-user', email: credentials.email }, session: {} },
        error: null
      }),
      signOut: () => Promise.resolve({ error: null }),
      onAuthStateChange: (callback: any) => {
        // Mock auth state
        return { data: { subscription: { unsubscribe: () => {} } } }
      }
    }
  }
}

// Export mock clients
export const supabase = createMockSupabaseClient()
export const supabaseAdmin = createMockSupabaseClient()

// Console log to indicate we're using mock mode
console.log('🧪 Using Mock Supabase Client for Development')

export interface User {
  id: string
  email: string
  full_name: string
  organization?: string
  role: string
  created_at: string
  updated_at: string
}

// Mock user data for testing
export const mockUser: User = {
  id: 'mock-user-123',
  email: 'organizer@naveaze.com',
  full_name: 'Demo Organizer',
  organization: 'ZumiCo Works',
  role: 'organizer',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
}
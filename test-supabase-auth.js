// Quick auth test to verify Supabase connection
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://uzhfjyoztmirybnyifnu.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV6aGZqeW96dG1pcnlibnlpZm51Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk2NTg2NzQsImV4cCI6MjA3NTIzNDY3NH0.A-alxweaan6BF8Q-KpCuHgIPFNyluTgh9EmhFZ-2biU'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testAuth() {
  console.log('Testing Supabase connection...')
  
  // Test auth state
  const { data: { session }, error: sessionError } = await supabase.auth.getSession()
  
  if (sessionError) {
    console.error('❌ Session error:', sessionError)
    return
  }
  
  console.log('✅ Session check passed:', session ? 'User logged in' : 'No active session')
  
  // Test a simple database query
  const { data, error: dbError } = await supabase.from('venues').select('*').limit(1)
  
  if (dbError) {
    console.error('❌ Database error:', dbError)
    return
  }
  
  console.log('✅ Database connection working')
  console.log('🎉 All systems ready for campus demo!')
}

testAuth().catch(console.error)
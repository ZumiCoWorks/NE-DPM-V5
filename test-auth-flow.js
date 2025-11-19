// Test the actual auth flow that's failing
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://uzhfjyoztmirybnyifnu.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV6aGZqeW96dG1pcnlibnlpZm51Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk2NTg2NzQsImV4cCI6MjA3NTIzNDY3NH0.A-alxweaan6BF8Q-KpCuHgIPFNyluTgh9EmhFZ-2biU'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testRegistration() {
  console.log('Testing registration process...')
  
  try {
    // Test sign up with a test email
    const { data, error } = await supabase.auth.signUp({
      email: 'test@campusdemo.com',
      password: 'testpassword123'
    })
    
    if (error) {
      console.error('❌ Registration failed:', error)
      return
    }
    
    console.log('✅ Registration successful:', data.user ? 'User created' : 'No user data')
    
    // Test login
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: 'test@campusdemo.com',
      password: 'testpassword123'
    })
    
    if (loginError) {
      console.error('❌ Login failed:', loginError)
      return
    }
    
    console.log('✅ Login successful:', loginData.user ? 'User logged in' : 'No user data')
    
    // Test database access with authenticated user
    const { data: venues, error: dbError } = await supabase.from('venues').select('*').limit(1)
    
    if (dbError) {
      console.error('❌ Database access failed:', dbError)
      return
    }
    
    console.log('✅ Database access working')
    console.log('🎉 All auth systems ready for campus demo!')
    
  } catch (err) {
    console.error('❌ Unexpected error:', err)
  }
}

testRegistration().catch(console.error)
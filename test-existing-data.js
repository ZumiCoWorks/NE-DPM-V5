// Test existing functionality without registration
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://uzhfjyoztmirybnyifnu.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV6aGZqeW96dG1pcnlibnlpZm51Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk2NTg2NzQsImV4cCI6MjA3NTIzNDY3NH0.A-alxweaan6BF8Q-KpCuHgIPFNyluTgh9EmhFZ-2biU'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testExistingData() {
  console.log('Testing access to existing data...')
  
  try {
    // Test venues (should be publicly readable)
    const { data: venues, error: venuesError } = await supabase.from('venues').select('*').limit(1)
    
    if (venuesError) {
      console.error('❌ Venues access failed:', venuesError)
    } else {
      console.log('✅ Venues access working, found', venues?.length || 0, 'venues')
    }
    
    // Test events (should be publicly readable)
    const { data: events, error: eventsError } = await supabase.from('events').select('*').limit(1)
    
    if (eventsError) {
      console.error('❌ Events access failed:', eventsError)
    } else {
      console.log('✅ Events access working, found', events?.length || 0, 'events')
    }
    
    // Test map_qr_nodes (should be publicly readable)
    const { data: qrNodes, error: qrError } = await supabase.from('map_qr_nodes').select('*').limit(1)
    
    if (qrError) {
      console.error('❌ QR nodes access failed:', qrError)
    } else {
      console.log('✅ QR nodes access working, found', qrNodes?.length || 0, 'QR nodes')
    }
    
    // Test leads (should require authentication)
    const { data: leads, error: leadsError } = await supabase.from('leads').select('*').limit(1)
    
    if (leadsError) {
      console.log('ℹ️  Leads access requires auth (expected):', leadsError.message)
    } else {
      console.log('✅ Leads access working, found', leads?.length || 0, 'leads')
    }
    
    console.log('🎉 Database access test completed!')
    
  } catch (err) {
    console.error('❌ Unexpected error:', err)
  }
}

testExistingData().catch(console.error)
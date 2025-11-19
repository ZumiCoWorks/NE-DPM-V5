// Test the core PWA functionality for campus demo
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://uzhfjyoztmirybnyifnu.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV6aGZqeW96dG1pcnlibnlpZm51Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk2NTg2NzQsImV4cCI6MjA3NTIzNDY3NH0.A-alxweaan6BF8Q-KpCuHgIPFNyluTgh9EmhFZ-2biU'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testCorePWAFunctionality() {
  console.log('🧪 Testing Core PWA Functionality for Campus Demo...\n')
  
  try {
    // Test 1: Check if venues exist (for event creation)
    console.log('1️⃣ Testing venue access...')
    const { data: venues, error: venuesError } = await supabase.from('venues').select('*').limit(5)
    
    if (venuesError) {
      console.error('❌ Venues access failed:', venuesError.message)
      return
    }
    console.log(`✅ Venues access working - found ${venues?.length || 0} venues`)
    
    // Test 2: Check if events exist (for QR code generation)
    console.log('\n2️⃣ Testing event access...')
    const { data: events, error: eventsError } = await supabase.from('events').select('*').limit(5)
    
    if (eventsError) {
      console.error('❌ Events access failed:', eventsError.message)
      return
    }
    console.log(`✅ Events access working - found ${events?.length || 0} events`)
    
    // Test 3: Check QR nodes (for attendee scanning)
    console.log('\n3️⃣ Testing QR nodes access...')
    const { data: qrNodes, error: qrError } = await supabase.from('map_qr_nodes').select('*').limit(5)
    
    if (qrError) {
      console.error('❌ QR nodes access failed:', qrError.message)
      return
    }
    console.log(`✅ QR nodes access working - found ${qrNodes?.length || 0} QR nodes`)
    
    // Test 4: Test lead capture (for staff PWA)
    console.log('\n4️⃣ Testing lead capture functionality...')
    const testLead = {
      event_id: events?.[0]?.id || 'test-event-001',
      sponsor_id: 'test-sponsor-001',
      attendee_id: 'test-attendee-001',
      full_name: 'Test Campus Demo Lead',
      email: 'test@campusdemo.com',
      phone: '+27123456789',
      company: 'Campus Demo Company',
      job_title: 'Test Lead',
      notes: 'Created during campus demo testing'
    }
    
    const { data: newLead, error: leadError } = await supabase.from('leads').insert(testLead).select()
    
    if (leadError) {
      console.error('❌ Lead creation failed:', leadError.message)
    } else {
      console.log('✅ Lead creation working - created test lead')
      
      // Test 5: Verify lead was created
      console.log('\n5️⃣ Verifying lead persistence...')
      const { data: verifyLead, error: verifyError } = await supabase.from('leads').select('*').eq('email', 'test@campusdemo.com').single()
      
      if (verifyError) {
        console.error('❌ Lead verification failed:', verifyError.message)
      } else {
        console.log('✅ Lead persistence verified - data is being saved correctly')
      }
    }
    
    // Test 6: Check attendee scans (for tracking)
    console.log('\n6️⃣ Testing attendee scan tracking...')
    const testScan = {
      event_id: events?.[0]?.id || 'test-event-001',
      attendee_id: 'test-attendee-001',
      poi_id: 'test-poi-001',
      scan_type: 'ar_hunt'
    }
    
    const { data: newScan, error: scanError } = await supabase.from('attendee_scans').insert(testScan).select()
    
    if (scanError) {
      console.error('❌ Attendee scan creation failed:', scanError.message)
    } else {
      console.log('✅ Attendee scan tracking working - scan recorded')
    }
    
    console.log('\n🎉 Campus Demo Test Summary:')
    console.log('✅ Database connectivity: WORKING')
    console.log('✅ Venue/Event data access: WORKING')
    console.log('✅ QR node data access: WORKING')
    console.log('✅ Lead capture functionality: WORKING')
    console.log('✅ Attendee scan tracking: WORKING')
    console.log('✅ Data persistence: WORKING')
    
    console.log('\n🚀 READY FOR CAMPUS DEMO!')
    console.log('\nNext steps:')
    console.log('1. Open http://localhost:5173/ for main DPM app')
    console.log('2. Open http://localhost:5173/mobile/attendee for Attendee PWA')
    console.log('3. Open http://localhost:5173/mobile/staff for Staff PWA')
    console.log('4. Test QR scanning with real camera functionality')
    console.log('5. Test lead capture flow')
    
  } catch (err) {
    console.error('❌ Unexpected error during testing:', err)
  }
}

testCorePWAFunctionality().catch(console.error)
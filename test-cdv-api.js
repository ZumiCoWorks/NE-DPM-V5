#!/usr/bin/env node
/**
 * Test script for CDV API endpoint
 * Simulates B2C app sending engagement data to B2B dashboard
 */

const axios = require('axios')

const API_BASE_URL = 'http://localhost:3001'

// Sample CDV report data (what B2C app would send)
const sampleCDVReports = [
  {
    attendee_id: 'QCK_001_John_Doe',
    dwell_time_minutes: 2.5,
    active_engagement_status: true,
    event_id: null,
    venue_id: null,
    zone_coordinates: { x: 150, y: 200, width: 100, height: 80 },
    zone_name: 'Sponsor Booth A',
    session_id: 'session_123',
    device_info: { platform: 'iOS', app_version: '1.0.0' }
  },
  {
    attendee_id: 'QCK_002_Jane_Smith',
    dwell_time_minutes: 1.8,
    active_engagement_status: true,
    event_id: null,
    venue_id: null,
    zone_coordinates: { x: 300, y: 150, width: 120, height: 90 },
    zone_name: 'Product Demo Zone',
    session_id: 'session_124',
    device_info: { platform: 'Android', app_version: '1.0.0' }
  },
  {
    attendee_id: 'QCK_003_Mike_Johnson',
    dwell_time_minutes: 0.9,
    active_engagement_status: false,
    event_id: null,
    venue_id: null,
    zone_coordinates: { x: 150, y: 200, width: 100, height: 80 },
    zone_name: 'Sponsor Booth A',
    session_id: 'session_125',
    device_info: { platform: 'iOS', app_version: '1.0.0' }
  },
  {
    attendee_id: 'QCK_004_Sarah_Davis',
    dwell_time_minutes: 3.2,
    active_engagement_status: true,
    event_id: null,
    venue_id: null,
    zone_coordinates: { x: 450, y: 250, width: 110, height: 85 },
    zone_name: 'VIP Lounge',
    session_id: 'session_126',
    device_info: { platform: 'Android', app_version: '1.0.0' }
  }
]

async function testCDVEndpoint() {
  console.log('🧪 Testing CDV API Endpoint...\n')

  try {
    // Test API health
    console.log('1. Testing API health...')
    const healthResponse = await axios.get(`${API_BASE_URL}/health`)
    console.log('✅ API is healthy:', healthResponse.data)
    
    // Send sample CDV reports
    console.log('\n2. Sending sample CDV reports...')
    
    for (let i = 0; i < sampleCDVReports.length; i++) {
      const report = sampleCDVReports[i]
      
      try {
        console.log(`\n📊 Sending CDV report ${i + 1}/${sampleCDVReports.length}:`)
        console.log(`   Attendee: ${report.attendee_id}`)
        console.log(`   Zone: ${report.zone_name}`)
        console.log(`   Dwell Time: ${report.dwell_time_minutes}m`)
        console.log(`   Engaged: ${report.active_engagement_status ? 'YES' : 'NO'}`)
        
        const response = await axios.post(`${API_BASE_URL}/api/cdv-report`, report)
        
        if (response.status === 201) {
          console.log('   ✅ Report saved successfully')
        } else {
          console.log('   ⚠️  Unexpected response:', response.status)
        }
        
        // Wait 2 seconds between reports to simulate real-time
        if (i < sampleCDVReports.length - 1) {
          console.log('   ⏳ Waiting 2 seconds...')
          await new Promise(resolve => setTimeout(resolve, 2000))
        }
        
      } catch (error) {
        console.log(`   ❌ Failed to send report: ${error.message}`)
        if (error.response) {
          console.log(`   Response: ${error.response.status} - ${JSON.stringify(error.response.data)}`)
        }
      }
    }
    
    // Test GET endpoint
    console.log('\n3. Testing GET endpoint to retrieve reports...')
    try {
      const getResponse = await axios.get(`${API_BASE_URL}/api/cdv-report?limit=10`)
      console.log('✅ Successfully retrieved reports:', getResponse.data.count, 'records')
    } catch (error) {
      console.log('❌ Failed to retrieve reports:', error.message)
    }
    
    // Test stats endpoint
    console.log('\n4. Testing stats endpoint...')
    try {
      const statsResponse = await axios.get(`${API_BASE_URL}/api/cdv-report/stats`)
      console.log('✅ Successfully retrieved stats:')
      console.log('   Total Reports:', statsResponse.data.stats.totalReports)
      console.log('   Active Engagements:', statsResponse.data.stats.activeEngagements)
      console.log('   Engagement Rate:', statsResponse.data.stats.engagementRate + '%')
      console.log('   Avg Dwell Time:', statsResponse.data.stats.avgDwellTime + 'm')
    } catch (error) {
      console.log('❌ Failed to retrieve stats:', error.message)
    }
    
    console.log('\n🎉 CDV API Test Complete!')
    console.log('\n💡 Next Steps:')
    console.log('   1. Open the B2B Dashboard at http://localhost:5173')
    console.log('   2. Navigate to "CDV Intelligence" tab')
    console.log('   3. You should see the CDV reports in real-time!')
    
  } catch (error) {
    console.log('❌ API test failed:', error.message)
    console.log('\n🔧 Troubleshooting:')
    console.log('   1. Make sure the server is running: npm run dev')
    console.log('   2. Check if port 3001 is available')
    console.log('   3. Verify Supabase configuration in .env file')
  }
}

// Run the test
testCDVEndpoint()
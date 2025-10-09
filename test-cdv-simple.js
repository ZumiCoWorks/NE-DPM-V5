/**
 * Simple CDV API Test
 * Tests the POST /api/cdv-report endpoint
 */

// Sample CDV report data
const testReport = {
  attendee_id: 'QCK_001_Demo_User',
  dwell_time_minutes: 2.5,
  active_engagement_status: true,
  zone_name: 'Sponsor Booth A',
  zone_coordinates: { x: 150, y: 200, width: 100, height: 80 },
  session_id: 'demo_session_123'
}

console.log('🧪 Testing CDV API Endpoint...')
console.log('Sending test report:', testReport)

fetch('http://localhost:3001/api/cdv-report', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(testReport)
})
.then(response => response.json())
.then(data => {
  console.log('✅ API Response:', data)
  console.log('🎉 CDV API test completed successfully!')
})
.catch(error => {
  console.error('❌ API test failed:', error)
})
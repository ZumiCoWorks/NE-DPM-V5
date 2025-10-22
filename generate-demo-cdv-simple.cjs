/**
 * Simple CDV Demo Data Generator
 * Generates basic engagement data for AR wayfinding MVP
 */

const fetch = require('node-fetch')

const booths = [
  { name: 'Nedbank Main Stage', rate: 12000 },
  { name: 'Discovery VIP Lounge', rate: 8000 },
  { name: 'MTN Sponsor Pavilion', rate: 5000 },
  { name: 'Shoprite Food Court', rate: 3000 },
  { name: 'Standard Bank Innovation Hub', rate: 7000 }
]

async function sendCdvReport(report) {
  try {
    const response = await fetch('http://localhost:3001/api/cdv-report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(report)
    })
    return await response.json()
  } catch (error) {
    console.error('  ❌ Error sending report:', error.message)
    return { success: false }
  }
}

async function generateDemoData(numReports = 100) {
  console.log('\n📊 NavEaze B2B Demo Data Generator')
  console.log('════════════════════════════════════════')
  console.log(`Generating ${numReports} CDV reports...\n`)
  
  let successCount = 0
  let totalRevenue = 0
  
  for (let i = 0; i < numReports; i++) {
    const booth = booths[Math.floor(Math.random() * booths.length)]
    const dwellMinutes = parseFloat((Math.random() * 10 + 1).toFixed(2))
    const activeEngagement = Math.random() > 0.3 // 70% active
    
    // Calculate revenue for this report
    const dwellHours = dwellMinutes / 60
    let revenue = dwellHours * booth.rate
    if (activeEngagement) revenue *= 1.5
    totalRevenue += revenue
    
    const report = {
      attendee_id: `QKT_${String(Math.floor(Math.random() * 100) + 1).padStart(5, '0')}`,
      zone_name: booth.name,
      dwell_time_minutes: dwellMinutes,
      active_engagement_status: activeEngagement,
      event_id: 'event-1',
      created_at: new Date(Date.now() - Math.random() * 3600000).toISOString()
    }
    
    const result = await sendCdvReport(report)
    if (result.success) successCount++
    
    if ((i + 1) % 20 === 0) {
      console.log(`  ✓ ${i + 1}/${numReports} reports sent (R${Math.round(totalRevenue)} revenue)`)
    }
  }
  
  console.log('\n════════════════════════════════════════')
  console.log(`✅ Demo Complete!`)
  console.log(`   Reports Sent: ${successCount}/${numReports}`)
  console.log(`   Total Revenue: R${Math.round(totalRevenue).toLocaleString()}`)
  console.log(`\n🎯 Next Steps:`)
  console.log(`   1. Open http://localhost:5175`)
  console.log(`   2. Navigate to "💰 Revenue & Engagement" tab`)
  console.log(`   3. View sponsor ROI breakdown\n`)
}

// Run the generator
generateDemoData(100).catch(err => {
  console.error('\n❌ Failed to generate demo data:', err.message)
  console.error('   Make sure the backend is running: npm run server:dev\n')
  process.exit(1)
})



#!/usr/bin/env node
// Simple integration smoke test:
// 1) POST /api/scans/log with a test attendee
// 2) GET /api/scans/analytics/dev/:eventId with X-Dev-Token header and assert attendee appears

const BASE = process.env.BASE_URL || 'http://localhost:3001'
const EVENT_ID = process.env.SMOKE_EVENT_ID || '22222222-2222-2222-2222-222222222222'
const DEV_TOKEN = process.env.DEV_ANALYTICS_TOKEN || 'dev-token'

async function run() {
  try {
    console.log('Smoke test: posting a test scan...')

    const scanPayload = {
      device_id: 'smoke-device-1',
      anchor_id: 'smoke-anchor',
      event_id: EVENT_ID,
      booth_id: null,
      timestamp: new Date().toISOString(),
      attendee_id: 'SMOKE-ATTENDEE-1',
      attendee_name: 'Smoke Tester',
      ticket_tier: 'General',
    }

    const postRes = await fetch(`${BASE}/api/scans/log`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(scanPayload),
    })

    const postBody = await postRes.text()
    console.log('POST response status:', postRes.status)
    console.log(postBody)

    if (postRes.status !== 201) {
      console.error('POST failed - aborting smoke test')
      process.exit(2)
    }

    console.log('Waiting 500ms for DB consistency...')
    await new Promise((r) => setTimeout(r, 500))

    console.log('Fetching dev analytics...')
    const analyticsRes = await fetch(`${BASE}/api/scans/analytics/dev/${EVENT_ID}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-dev-token': DEV_TOKEN,
      },
    })

    const analyticsJson = await analyticsRes.json()
    console.log('Analytics status:', analyticsRes.status)
    console.log(JSON.stringify(analyticsJson, null, 2))

    if (!analyticsJson || !analyticsJson.analytics) {
      console.error('Invalid analytics response')
      process.exit(3)
    }

    const found = analyticsJson.analytics.some((entry) => {
      return (entry.unique_attendees || []).some((a) => a.attendee_id === 'SMOKE-ATTENDEE-1')
    })

    if (found) {
      console.log('SMOKE TEST PASSED: attendee found in analytics')
      process.exit(0)
    } else {
      console.error('SMOKE TEST FAILED: attendee not found in analytics')
      process.exit(4)
    }
  } catch (err) {
    console.error('Smoke test error:', err)
    process.exit(10)
  }
}

run()

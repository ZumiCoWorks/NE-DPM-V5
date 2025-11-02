#!/usr/bin/env node
// scripts/seed-demo.js
// Simple script to POST demo scan rows to the running dev server.
// Usage: node scripts/seed-demo.js [API_BASE]
// Example: node scripts/seed-demo.js http://localhost:3001

const API_BASE = process.argv[2] ? process.argv[2].replace(/\/$/, '') : 'http://localhost:3001'

async function postScan(payload) {
  const url = `${API_BASE}/api/scans/log`
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })

    const text = await res.text()
    console.log(`POST ${url} -> ${res.status}`)
    console.log(text)
  } catch (err) {
    console.error('Failed to post scan:', err)
  }
}

async function seed() {
  console.log('Seeding demo scans to', API_BASE)

  const now = new Date().toISOString()

  const rows = [
    {
      device_id: 'device_demo_1',
      anchor_id: 'anchor_entrance',
      event_id: '101',
      booth_id: null,
      timestamp: now,
      attendee_id: 'QKT-DEMO-1',
      attendee_name: 'Alice Example',
      ticket_tier: 'General'
    },
    {
      device_id: 'device_demo_2',
      anchor_id: 'anchor_booth_1',
      event_id: '101',
      booth_id: 'booth_1',
      timestamp: now,
      attendee_id: null,
      attendee_name: null,
      ticket_tier: null
    },
    {
      device_id: 'device_demo_3',
      anchor_id: 'anchor_booth_2',
      event_id: '101',
      booth_id: 'booth_2',
      timestamp: now,
      attendee_id: 'QKT-DEMO-2',
      attendee_name: 'Bob Example',
      ticket_tier: 'VIP'
    }
  ]

  for (const r of rows) {
    // small delay to avoid too-fast requests
    // eslint-disable-next-line no-await-in-loop
    await postScan(r)
    // eslint-disable-next-line no-await-in-loop
    await new Promise((resolve) => setTimeout(resolve, 250))
  }

  console.log('Seeding complete')
}

// Node 18+ has global fetch
if (typeof fetch !== 'function') {
  console.error('This script requires Node 18+ (global fetch).')
  process.exit(1)
}

seed()

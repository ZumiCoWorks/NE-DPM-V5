#!/usr/bin/env node
/**
 * Seed demo data: sponsors, staff, attendees, leads
 * Usage:
 *   node scripts/seed-demo-full.js        # uses SUPABASE env vars from api/lib/supabase.js
 * If SUPABASE env vars are not available the script will print SQL INSERT statements you can paste
 * into the Supabase SQL editor.
 */
import fs from 'fs'
import path from 'path'

let supabaseAdmin = null
try {
  // lazily import supabaseAdmin; api/lib/supabase.js will load .env
  // when running locally with proper .env configured
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  supabaseAdmin = require('../api/lib/supabase.js').supabaseAdmin
} catch (e) {
  // supabase client not available; we'll fall back to printing SQL
  supabaseAdmin = null
}

function buildSqlInserts() {
  const lines = []
  lines.push("-- Demo seed inserts for attendees, sponsors, staff_accounts, leads")
  lines.push("\n-- sponsors")
  lines.push("INSERT INTO sponsors (id,name,contact_email) VALUES ('sponsor_1','Sponsor A','manager@sponsorA.com') ON CONFLICT DO NOTHING;")
  lines.push("INSERT INTO sponsors (id,name,contact_email) VALUES ('sponsor_2','Sponsor B','manager@sponsorB.com') ON CONFLICT DO NOTHING;")
  lines.push('\n-- staff_accounts')
  lines.push("INSERT INTO staff_accounts (id,sponsor_id,email) VALUES ('staff_1','sponsor_1','sales1@sponsorA.com') ON CONFLICT DO NOTHING;")
  lines.push("INSERT INTO staff_accounts (id,sponsor_id,email) VALUES ('staff_2','sponsor_1','sales2@sponsorA.com') ON CONFLICT DO NOTHING;")
  lines.push('\n-- attendees')
  for (let i = 1; i <= 10; i++) {
    const id = `att_${i}`
    const email = `guest${i}@example.com`
    const first = `Guest${i}`
    lines.push(`INSERT INTO attendees (id,email,first_name,last_name,company,job_title,ticket_type,event_id,qr_code_id) VALUES ('${id}','${email}','${first}','Demo','Company ${i}','Manager','General','event_demo','QR_${id}') ON CONFLICT DO NOTHING;`)
  }
  lines.push('\n-- leads')
  lines.push("INSERT INTO leads (id,sponsor_id,staff_id,attendee_id,event_id,rating,note) VALUES ('lead_1','sponsor_1','staff_1','att_1','event_demo',5,'Hot lead') ON CONFLICT DO NOTHING;")
  lines.push("INSERT INTO leads (id,sponsor_id,staff_id,attendee_id,event_id,rating,note) VALUES ('lead_2','sponsor_1','staff_2','att_2','event_demo',4,'Follow up') ON CONFLICT DO NOTHING;")
  return lines.join('\n')
}

async function seedWithSupabase() {
  try {
    console.log('Seeding sponsors...')
    const sponsors = [
      { id: 'sponsor_1', name: 'Sponsor A', contact_email: 'manager@sponsorA.com' },
      { id: 'sponsor_2', name: 'Sponsor B', contact_email: 'manager@sponsorB.com' }
    ]
    await supabaseAdmin.from('sponsors').upsert(sponsors)

    console.log('Seeding staff accounts...')
    const staff = [
      { id: 'staff_1', sponsor_id: 'sponsor_1', email: 'sales1@sponsorA.com' },
      { id: 'staff_2', sponsor_id: 'sponsor_1', email: 'sales2@sponsorA.com' }
    ]
    await supabaseAdmin.from('staff_accounts').upsert(staff)

    console.log('Seeding attendees...')
    const attendees = []
    for (let i = 1; i <= 10; i++) {
      const id = `att_${i}`
      attendees.push({
        id,
        email: `guest${i}@example.com`,
        first_name: `Guest${i}`,
        last_name: `Demo`,
        company: `Company ${i}`,
        job_title: 'Manager',
        ticket_type: 'General',
        event_id: 'event_demo',
        qr_code_id: `QR_${id}`,
        qr_code_data_url: null
      })
    }
    await supabaseAdmin.from('attendees').upsert(attendees)

    console.log('Seeding leads...')
    const leads = [
      { id: 'lead_1', sponsor_id: 'sponsor_1', staff_id: 'staff_1', attendee_id: 'att_1', event_id: 'event_demo', rating: 5, note: 'Hot lead' },
      { id: 'lead_2', sponsor_id: 'sponsor_1', staff_id: 'staff_2', attendee_id: 'att_2', event_id: 'event_demo', rating: 4, note: 'Follow up' }
    ]
    await supabaseAdmin.from('leads').upsert(leads)

    console.log('Seed complete')
    process.exit(0)
  } catch (err) {
    console.error('Seed failed:', err)
    process.exit(1)
  }
}

async function main() {
  if (supabaseAdmin) {
    await seedWithSupabase()
    return
  }

  // No supabase client available — print SQL for user to paste into Supabase SQL editor
  const sql = buildSqlInserts()
  const outPath = path.resolve(process.cwd(), 'seed-demo-full.sql')
  fs.writeFileSync(outPath, sql, 'utf8')
  console.log('SUPABASE env not found or client failed to load.')
  console.log('Wrote SQL seed file to:', outPath)
  console.log('Paste the contents into Supabase SQL editor and run it to seed demo data.')
  process.exit(0)
}

main()

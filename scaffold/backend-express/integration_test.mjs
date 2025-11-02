import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';

// Integration test for Express + Supabase scaffold
// Usage:
// SUPABASE_URL=... SUPABASE_KEY=... PORT=3003 node integration_test.mjs

const { SUPABASE_URL, SUPABASE_KEY, PORT = 3003 } = process.env;
if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Please set SUPABASE_URL and SUPABASE_KEY in env (see .env.example)');
  process.exit(1);
}

// Start the server (server.js starts listening on import)
import './server.js';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const serverBase = `http://localhost:${PORT}`;

async function upsertTestData() {
  // insert event
  const { data: [event], error: e1 } = await supabase.from('events').insert([{ name: 'Integration Test Event' }]).select().limit(1);
  if (e1) throw e1;

  // insert map
  const { data: [map], error: e2 } = await supabase.from('event_maps').insert([{ event_id: event.id, storage_url: 'https://example.com/maps/test.png' }]).select().limit(1);
  if (e2) throw e2;

  // insert POIs
  const poisToInsert = [
    { map_id: map.id, name: 'Main Entrance', type: 'localization', x: 100, y: 50 },
    { map_id: map.id, name: 'BCom Project 1', type: 'booth', x: 400, y: 300 }
  ];
  const { data: pois, error: e3 } = await supabase.from('pois').insert(poisToInsert).select();
  if (e3) throw e3;

  // insert path
  const { data: [path], error: e4 } = await supabase.from('paths').insert([{ map_id: map.id, poi_id_start: pois[0].id, poi_id_end: pois[1].id, distance: 180 }]).select().limit(1);
  if (e4) throw e4;

  return { event, map, pois, path };
}

async function cleanup(ids) {
  // Attempt to delete in safe order
  try {
    if (ids.path) await supabase.from('paths').delete().eq('id', ids.path);
    if (ids.pois && ids.pois.length) {
      for (const pid of ids.pois) await supabase.from('pois').delete().eq('id', pid);
    }
    if (ids.map) await supabase.from('event_maps').delete().eq('id', ids.map);
    if (ids.event) await supabase.from('events').delete().eq('id', ids.event);
  } catch (err) {
    console.warn('Cleanup error (non-fatal):', err.message || err);
  }
}

(async () => {
  let inserted = {};
  try {
    console.log('Seeding Supabase with test data...');
    const seed = await upsertTestData();
    inserted = {
      event: seed.event.id,
      map: seed.map.id,
      pois: seed.pois.map(p => p.id),
      path: seed.path.id
    };
    console.log('Seeded:', inserted);

    console.log('Calling GET /events/:id/map_data');
    const res = await fetch(`${serverBase}/events/${inserted.event}/map_data`);
    const body = await res.text();
    console.log('GET result status:', res.status);
    console.log(body);

    console.log('Calling POST /events/:id/engage');
    const engageRes = await fetch(`${serverBase}/events/${inserted.event}/engage`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ attendee_id: 'test-attendee-1', poi_id: inserted.pois[1], type: 'ar_hunt' })
    });
    const engageBody = await engageRes.json();
    console.log('POST /engage status:', engageRes.status);
    console.log(engageBody);

    console.log('Integration test completed successfully. Cleaning up test data.');
  } catch (err) {
    console.error('Integration test failed:', err);
  } finally {
    await cleanup(inserted);
    console.log('Done.');
    process.exit(0);
  }
})();

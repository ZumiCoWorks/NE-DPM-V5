import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3003;

// Initialize Supabase client if environment variables provided
let supabase = null;
if (process.env.SUPABASE_URL && process.env.SUPABASE_KEY) {
  supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
}

// Demo fallback data (used when Supabase is not configured)
const demoMap = {
  map_url: 'https://example.com/maps/campus_map.png',
  pois: [
    { id: 1, name: 'Main Entrance', type: 'localization', x: 100, y: 50 },
    { id: 2, name: 'BCom Project 1', type: 'booth', x: 400, y: 300 },
    { id: 3, name: 'Hall 2 Junction', type: 'localization', x: 250, y: 200 }
  ],
  paths: [
    { start: 1, end: 3, distance: 180 },
    { start: 3, end: 2, distance: 220 }
  ]
};

app.get('/events/:id/map_data', async (req, res) => {
  const { id } = req.params;
  if (!supabase) {
    // Demo fallback
    return res.json(demoMap);
  }

  try {
    const { data: map } = await supabase.from('event_maps').select('*').eq('event_id', id).limit(1).single();
    if (!map) return res.json(demoMap);

    const { data: pois } = await supabase.from('pois').select('*').eq('map_id', map.id);
    const { data: paths } = await supabase.from('paths').select('*').eq('map_id', map.id);

    return res.json({ map_url: map.storage_url, pois, paths });
  } catch (err) {
    console.error('Supabase error:', err);
    return res.status(500).json({ error: 'supabase_error', details: String(err) });
  }
});

app.post('/events/:id/engage', async (req, res) => {
  const { id } = req.params;
  const payload = req.body;
  if (!supabase) {
    // In demo mode, echo back and pretend saved
    return res.status(201).json({ success: true, saved: { event_id: Number(id), payload, id: Date.now() } });
  }

  try {
    const { data, error } = await supabase.from('attendee_engagements').insert([{ event_id: Number(id), attendee_id: payload.attendee_id || null, poi_id: payload.poi_id || null, metadata: payload }]).select();
    if (error) throw error;
    return res.status(201).json({ success: true, record: data[0] });
  } catch (err) {
    console.error('Supabase insert error:', err);
    return res.status(500).json({ error: 'insert_failed', details: String(err) });
  }
});

app.post('/leads/scan', async (req, res) => {
  const payload = req.body;
  // For the pilot, this can call Quicket and persist to 'leads'. Here we echo.
  return res.status(201).json({ success: true, lead: { id: Date.now(), payload } });
});

// Create an event_map (expects { event_id, storage_url })
app.post('/event_maps', async (req, res) => {
  const body = req.body;
  if (!body || !body.event_id || !body.storage_url) return res.status(400).json({ error: 'missing_fields' });
  if (!supabase) {
    return res.status(201).json({ success: true, record: { id: `demo-map-${Date.now()}`, event_id: body.event_id, storage_url: body.storage_url } });
  }
  try {
    const { data, error } = await supabase.from('event_maps').insert([{ event_id: body.event_id, storage_url: body.storage_url }]).select().limit(1);
    if (error) throw error;
    return res.status(201).json({ success: true, record: data[0] });
  } catch (err) {
    console.error('event_maps insert error:', err);
    return res.status(500).json({ error: 'insert_failed', details: String(err) });
  }
});

// Create a POI (expects { map_id, name, type, x, y })
app.post('/pois', async (req, res) => {
  const body = req.body;
  // Accept either pixel coords (x,y) or normalized coords (x_pct,y_pct).
  // For backward compatibility the client should send both when possible.
  if (!body || !body.map_id || !body.name || !body.type) {
    return res.status(400).json({ error: 'missing_fields' });
  }

  // Build metadata to include normalized coords if provided or computable
  const metadata = body.metadata || {};
  if (typeof body.x_pct === 'number' && typeof body.y_pct === 'number') {
    metadata.x_pct = body.x_pct;
    metadata.y_pct = body.y_pct;
  } else if (typeof body.x === 'number' && typeof body.y === 'number' && typeof body.image_width === 'number' && typeof body.image_height === 'number') {
    metadata.x_pct = (body.x / body.image_width) * 100;
    metadata.y_pct = (body.y / body.image_height) * 100;
  }

  // Ensure we have integer pixel fallbacks for DB schema (pois.x, pois.y are integers)
  const pxX = typeof body.x === 'number' ? Math.round(body.x) : null;
  const pxY = typeof body.y === 'number' ? Math.round(body.y) : null;

  if (!supabase) {
    const rec = { id: `demo-poi-${Date.now()}`, map_id: body.map_id, name: body.name, type: body.type, x: pxX || 0, y: pxY || 0, metadata };
    return res.status(201).json({ success: true, record: rec });
  }

  try {
    const insertObj = {
      map_id: body.map_id,
      name: body.name,
      type: body.type,
      x: pxX !== null ? pxX : 0,
      y: pxY !== null ? pxY : 0,
      metadata: metadata || null
    };
    const { data, error } = await supabase.from('pois').insert([insertObj]).select().limit(1);
    if (error) throw error;
    return res.status(201).json({ success: true, record: data[0] });
  } catch (err) {
    console.error('pois insert error:', err);
    return res.status(500).json({ error: 'insert_failed', details: String(err) });
  }
});

// Create a path (expects { map_id, poi_id_start, poi_id_end, distance })
app.post('/paths', async (req, res) => {
  const body = req.body;
  if (!body || !body.map_id || !body.poi_id_start || !body.poi_id_end) return res.status(400).json({ error: 'missing_fields' });
  if (!supabase) {
    return res.status(201).json({ success: true, record: { id: `demo-path-${Date.now()}`, ...body } });
  }
  try {
    const { data, error } = await supabase.from('paths').insert([{
      map_id: body.map_id,
      poi_id_start: body.poi_id_start,
      poi_id_end: body.poi_id_end,
      distance: body.distance || null
    }]).select().limit(1);
    if (error) throw error;
    return res.status(201).json({ success: true, record: data[0] });
  } catch (err) {
    console.error('paths insert error:', err);
    return res.status(500).json({ error: 'insert_failed', details: String(err) });
  }
});

// Save a full map payload (convenience endpoint for the editor)
// Expects: { event_id, storage_url, image_width, image_height, pois: [...], paths: [...] }
app.post('/save_map', async (req, res) => {
  const body = req.body;
  if (!body || !body.event_id || !body.storage_url) return res.status(400).json({ error: 'missing_fields' });

  if (!supabase) {
    // Demo mode: echo back with generated ids
    const mapId = `demo-map-${Date.now()}`;
    const pois = (body.pois || []).map(p => ({ ...p, id: `demo-poi-${Date.now()}-${Math.floor(Math.random()*1000)}` }));
    const paths = (body.paths || []).map(p => ({ ...p, id: `demo-path-${Date.now()}-${Math.floor(Math.random()*1000)}` }));
    return res.status(201).json({ success: true, record: { map: { id: mapId, storage_url: body.storage_url }, pois, paths } });
  }

  try {
    // Insert event_map
    const { data: mapData, error: mapErr } = await supabase.from('event_maps').insert([{ event_id: body.event_id, storage_url: body.storage_url }]).select().limit(1);
    if (mapErr) throw mapErr;
    const mapRec = mapData[0];

    // Insert POIs and collect their IDs
    const poisToInsert = (body.pois || []).map(p => ({ map_id: mapRec.id, name: p.name, type: p.type, x: p.x || 0, y: p.y || 0, metadata: p.metadata || null }));
    const { data: poisData, error: poisErr } = await supabase.from('pois').insert(poisToInsert).select();
    if (poisErr) throw poisErr;

    // Build mapping from client index to inserted POI id
    const poiIdMap = {};
    for (let i = 0; i < poisData.length; i++) {
      poiIdMap[i] = poisData[i].id;
    }

    // Insert paths translating start/end indices to real POI ids if client used indices
    const pathsToInsert = (body.paths || []).map(pt => {
      const start = typeof pt.start_index === 'number' ? poiIdMap[pt.start_index] : pt.start_id || pt.start;
      const end = typeof pt.end_index === 'number' ? poiIdMap[pt.end_index] : pt.end_id || pt.end;
      return { map_id: mapRec.id, poi_id_start: start, poi_id_end: end, distance: pt.distance || null };
    });

    const { data: pathsData, error: pathsErr } = await supabase.from('paths').insert(pathsToInsert).select();
    if (pathsErr) throw pathsErr;

    return res.status(201).json({ success: true, record: { map: mapRec, pois: poisData, paths: pathsData } });
  } catch (err) {
    console.error('save_map error', err);
    return res.status(500).json({ error: 'save_failed', details: String(err) });
  }
});

app.listen(PORT, () => {
  console.log(`NavEaze Express backend listening on http://localhost:${PORT}`);
});

export default app;

// auto_connect_orphans.mjs
// Finds orphan POI nodes and connects each to its nearest connected path node

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: resolve(__dirname, '../.env') });

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY  // service role bypasses RLS
);

function dist(a, b) {
    return Math.sqrt(Math.pow(a.x_coord - b.x_coord, 2) + Math.pow(a.y_coord - b.y_coord, 2));
}

async function main() {
    // 1. Fetch all nodes
    const { data: nodes, error: ne } = await supabase
        .from('navigation_points')
        .select('id, name, x_coord, y_coord, point_type, event_id');
    if (ne) { console.error('Node fetch error:', ne); return; }

    // 1b. Get the floorplan_id for this event (required by navigation_segments)
    const eventId = nodes[0]?.event_id;
    const { data: fp } = await supabase
        .from('floorplans')
        .select('id')
        .eq('event_id', eventId)
        .single();
    const floorplan_id = fp?.id;
    console.log(`📌 Using event_id: ${eventId}, floorplan_id: ${floorplan_id}`);

    // 2. Fetch all segments with CORRECT column names
    const { data: allSegs, error: se } = await supabase
        .from('navigation_segments')
        .select('start_node_id, end_node_id');
    if (se) { console.error('Segment fetch error:', se); return; }

    // 3. Build set of connected node IDs
    const connectedIds = new Set();
    (allSegs || []).forEach(s => {
        if (s.start_node_id) connectedIds.add(s.start_node_id);
        if (s.end_node_id) connectedIds.add(s.end_node_id);
    });

    const orphans = nodes.filter(n => !connectedIds.has(n.id));
    const connected = nodes.filter(n => connectedIds.has(n.id));

    console.log(`\n📊 ${nodes.length} total nodes | ${connected.length} connected | ${orphans.length} orphans`);
    if (orphans.length === 0) { console.log('✅ Graph already fully connected!'); return; }

    console.log('\n🔧 Auto-connecting orphans to nearest path node...');

    // 4. For each orphan, find nearest connected node
    const toInsert = [];
    for (const orphan of orphans) {
        let nearest = null;
        let minDist = Infinity;

        // If no connected nodes, connect orphans to each other in sequence
        const candidates = connected.length > 0 ? connected : nodes.filter(n => n.id !== orphan.id);
        for (const node of candidates) {
            const d = dist(orphan, node);
            if (d < minDist) { minDist = d; nearest = node; }
        }

        if (!nearest) { console.warn(`  ⚠️ Cannot connect ${orphan.name} — no candidates`); continue; }
        const dist_meters = Math.max(1, Math.round(minDist * 0.18));
        console.log(`  📍 ${orphan.name} → ${nearest.name} (${minDist.toFixed(0)}px ≈ ${dist_meters}m)`);

        toInsert.push({
            start_node_id: orphan.id,
            end_node_id: nearest.id,
            is_bidirectional: true,
            distance_meters: dist_meters,
            event_id: orphan.event_id,
            floorplan_id: floorplan_id,
        });
    }

    if (toInsert.length === 0) { console.log('Nothing to insert.'); return; }

    // 5. Insert segments
    const { data: inserted, error: ie } = await supabase
        .from('navigation_segments')
        .insert(toInsert)
        .select('id, start_node_id, end_node_id');

    if (ie) {
        console.error('\n❌ Insert failed:', JSON.stringify(ie, null, 2));
        return;
    }

    console.log(`\n✅ Inserted ${inserted.length} new segments`);

    // 6. Re-verify
    const { data: final } = await supabase.from('navigation_segments').select('start_node_id, end_node_id');
    const finalIds = new Set();
    (final || []).forEach(s => { finalIds.add(s.start_node_id); finalIds.add(s.end_node_id); });
    const remaining = nodes.filter(n => !finalIds.has(n.id));
    if (remaining.length === 0) {
        console.log('🎉 Graph is now fully connected — A* pathfinding should work!');
    } else {
        console.log(`⚠️ Still ${remaining.length} orphans:`, remaining.map(n => n.name));
    }
}

main().catch(console.error);

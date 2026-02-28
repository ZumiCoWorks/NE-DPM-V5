import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: resolve(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function findOrphanNodes() {
    console.log('🔍 Analyzing Navigation Graph for Orphan Nodes...');

    // 1. Get all nodes
    const { data: nodes, error: nodeError } = await supabase
        .from('navigation_points')
        .select('id, name, x_coord, y_coord');

    if (nodeError) {
        console.error('Error fetching nodes:', nodeError);
        return;
    }

    // 2. Get all segments
    const { data: segments, error: segError } = await supabase
        .from('navigation_segments')
        .select('start_node_id, end_node_id');

    if (segError) {
        console.error('Error fetching segments:', segError);
        return;
    }

    console.log(`📊 Found ${nodes.length} nodes and ${segments.length} segments.`);

    // 3. Build Adjacency List
    const connectedNodeIds = new Set<string>();
    segments.forEach(seg => {
        connectedNodeIds.add(seg.start_node_id);
        connectedNodeIds.add(seg.end_node_id);
    });

    // 4. Find Orphans
    const orphans = nodes.filter(n => !connectedNodeIds.has(n.id));

    if (orphans.length === 0) {
        console.log('✅ GREAT NEWS! No orphan nodes found. The graph is fully connected.');
    } else {
        console.log(`⚠️ FOUND ${orphans.length} ORPHAN NODES (Islands):`);
        console.log('---------------------------------------------------');
        orphans.forEach(n => {
            console.log(`- [${n.name || 'Unnamed Node'}] (ID: ${n.id}) at (${n.x_coord}, ${n.y_coord})`);
        });
        console.log('---------------------------------------------------');
        console.log('💡 FIX: Go to Map Editor and draw a path to these nodes.');
    }
}

findOrphanNodes();

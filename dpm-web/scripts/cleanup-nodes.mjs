// Cleanup script to remove duplicate navigation nodes
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://uzhfjyoztmirybnyifnu.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseKey) {
    console.error('❌ VITE_SUPABASE_ANON_KEY not found in environment');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const EVENT_ID = 'f0ca4b22-6d25-4f2b-8360-de84d69395f5';

async function cleanupDuplicateNodes() {
    console.log('🧹 Starting database cleanup...\n');

    try {
        // Step 1: Get nodes without GPS
        const { data: nodesWithoutGPS, error: fetchError } = await supabase
            .from('navigation_points')
            .select('id, name')
            .eq('event_id', EVENT_ID)
            .or('gps_lat.is.null,gps_lng.is.null');

        if (fetchError) throw fetchError;

        console.log(`📊 Found ${nodesWithoutGPS?.length || 0} nodes without GPS coordinates\n`);

        if (!nodesWithoutGPS || nodesWithoutGPS.length === 0) {
            console.log('✅ No nodes to delete!');
            return;
        }

        const nodeIds = nodesWithoutGPS.map(n => n.id);

        // Step 2: Delete segments connecting to these nodes
        console.log('🔗 Deleting segments connected to nodes without GPS...');
        const { error: segmentError } = await supabase
            .from('navigation_segments')
            .delete()
            .eq('event_id', EVENT_ID)
            .or(`start_node_id.in.(${nodeIds.join(',')}),end_node_id.in.(${nodeIds.join(',')})`);

        if (segmentError) throw segmentError;
        console.log('✅ Segments deleted\n');

        // Step 3: Delete nodes without GPS
        console.log('📍 Deleting nodes without GPS coordinates...');
        const { error: nodeError } = await supabase
            .from('navigation_points')
            .delete()
            .eq('event_id', EVENT_ID)
            .or('gps_lat.is.null,gps_lng.is.null');

        if (nodeError) throw nodeError;
        console.log('✅ Nodes deleted\n');

        // Step 4: Verify remaining data
        const { count: remainingNodes } = await supabase
            .from('navigation_points')
            .select('*', { count: 'exact', head: true })
            .eq('event_id', EVENT_ID);

        const { count: remainingSegments } = await supabase
            .from('navigation_segments')
            .select('*', { count: 'exact', head: true })
            .eq('event_id', EVENT_ID);

        console.log('📊 Cleanup Summary:');
        console.log(`   • Remaining nodes: ${remainingNodes}`);
        console.log(`   • Remaining segments: ${remainingSegments}`);
        console.log('\n✅ Cleanup complete!');

    } catch (error) {
        console.error('❌ Cleanup failed:', error);
        process.exit(1);
    }
}

cleanupDuplicateNodes();

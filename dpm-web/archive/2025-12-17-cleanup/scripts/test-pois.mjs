import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY
);

console.log('🔍 Testing POI data fetch...\n');

// Fetch events
const { data: events, error: eventsErr } = await supabase
  .from('events')
  .select('id, name, status')
  .eq('status', 'published');

if (eventsErr) {
  console.error('❌ Events error:', eventsErr);
  process.exit(1);
}

console.log(`📅 Found ${events?.length || 0} published events`);

if (events && events.length > 0) {
  for (const event of events) {
    console.log(`\n🎯 Event: ${event.name} (${event.id})`);
    
    // Fetch navigation points
    const { data: points, error: pointsErr } = await supabase
      .from('navigation_points')
      .select('*')
      .eq('event_id', event.id);
    
    if (pointsErr) {
      console.error('  ❌ Points error:', pointsErr);
      continue;
    }
    
    console.log(`  📍 Total points: ${points?.length || 0}`);
    
    const pois = points?.filter(p => p.point_type === 'poi') || [];
    console.log(`  🎨 POIs: ${pois.length}`);
    
    if (pois.length > 0) {
      pois.forEach(poi => {
        console.log(`    - ${poi.name} (${poi.id})`);
        console.log(`      Type: ${poi.point_type}`);
        console.log(`      GPS: ${poi.gps_lat ? 'Yes' : 'No'}`);
      });
    } else {
      console.log('  ⚠️  No POIs found!');
    }
  }
} else {
  console.log('⚠️  No published events found');
}

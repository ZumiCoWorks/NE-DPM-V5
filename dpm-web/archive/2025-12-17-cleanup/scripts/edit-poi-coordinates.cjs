/**
 * Script to edit POI GPS coordinates
 * Usage: node edit-poi-coordinates.js
 */

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://uzhfjyoztmirybnyifnu.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV6aGZqeW96dG1pcnlibnlpZm51Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTY1ODY3NCwiZXhwIjoyMDc1MjM0Njc0fQ.9fMjygbySsWOQrOJGG_j8LZQKFOoAzL2dwI5ujtWPvM'
);

async function listPOIs(eventId) {
  const { data, error } = await supabase
    .from('navigation_points')
    .select('*')
    .eq('event_id', eventId)
    .eq('point_type', 'poi')
    .order('name');
  
  if (error) {
    console.error('❌ Error:', error.message);
    return [];
  }
  
  console.log('\n📍 POIs in event:');
  console.log('─'.repeat(80));
  data.forEach((poi, index) => {
    console.log(`${index + 1}. ${poi.name}`);
    console.log(`   ID: ${poi.id}`);
    console.log(`   GPS: ${poi.gps_lat || 'not set'}, ${poi.gps_lng || 'not set'}`);
    console.log(`   Position: (${poi.x_coord}, ${poi.y_coord})`);
    console.log();
  });
  
  return data;
}

async function updatePOICoordinates(poiId, lat, lng) {
  console.log(`\n🔄 Updating POI ${poiId}...`);
  
  const { data, error } = await supabase
    .from('navigation_points')
    .update({
      gps_lat: lat,
      gps_lng: lng
    })
    .eq('id', poiId)
    .select()
    .single();
  
  if (error) {
    console.error('❌ Error:', error.message);
    return false;
  }
  
  console.log('✅ Updated successfully!');
  console.log(`   ${data.name}: ${data.gps_lat}, ${data.gps_lng}`);
  return true;
}

async function getCurrentLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator || !navigator.geolocation) {
      reject(new Error('Geolocation not available'));
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
      },
      (error) => {
        reject(error);
      }
    );
  });
}

// Example usage
async function main() {
  const eventId = '1bbac756-7e75-443d-a59f-49ef5eb6c282'; // Tlotlo Molope event
  
  console.log('🗺️  POI GPS Coordinate Editor');
  console.log('════════════════════════════════════════════════════════════════════════════════');
  
  // List all POIs
  const pois = await listPOIs(eventId);
  
  if (pois.length === 0) {
    console.log('No POIs found.');
    return;
  }
  
  console.log('\n📝 To update a POI, edit this script and use:');
  console.log('   await updatePOICoordinates(POI_ID, LATITUDE, LONGITUDE);');
  console.log('\nExample:');
  console.log('   await updatePOICoordinates(');
  console.log(`     '${pois[0].id}',  // ME`);
  console.log('     -25.864681,  // Latitude');
  console.log('     28.135876    // Longitude');
  console.log('   );');
  
  // Uncomment and edit these lines to update POIs:
  
  // await updatePOICoordinates('POI_ID_HERE', -25.123456, 28.123456);
  
  process.exit(0);
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});

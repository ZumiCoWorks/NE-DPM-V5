const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://uzhfjyoztmirybnyifnu.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV6aGZqeW96dG1pcnlibnlpZm51Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTY1ODY3NCwiZXhwIjoyMDc1MjM0Njc0fQ.9fMjygbySsWOQrOJGG_j8LZQKFOoAzL2dwI5ujtWPvM';

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function setupTestFlow() {
  try {
    console.log('Setting up test flow data...');

    // 1. Create a test event
    const { data: event, error: eventError } = await supabase
      .from('events')
      .insert({
        name: 'Pilot Test Event',
        description: 'Test event for pilot flow',
        start_time: '2025-11-21T09:00:00Z',
        end_time: '2025-11-21T17:00:00Z',
        organizer_id: '00000000-0000-0000-0000-000000000000', // System user
        status: 'published'
      })
      .select('*')
      .single();

    if (eventError) {
      console.error('Error creating event:', eventError);
      return;
    }

    console.log('Created test event:', event.id);

    // 2. Create a test QR node
    const { data: qrNode, error: qrError } = await supabase
      .from('map_qr_nodes')
      .insert({
        event_id: event.id,
        qr_id_text: 'PILOT_TEST_QR1',
        x_coord: 100,
        y_coord: 200
      })
      .select('*')
      .single();

    if (qrError) {
      console.error('Error creating QR node:', qrError);
      return;
    }

    console.log('Created QR node:', qrNode);

    // 3. Create a test POI
    const { data: poi, error: poiError } = await supabase
      .from('pois')
      .insert({
        name: 'Test Booth',
        x: 300,
        y: 400,
        event_id: event.id,
        description: 'Test booth for navigation'
      })
      .select('*')
      .single();

    if (poiError) {
      console.error('Error creating POI:', poiError);
      return;
    }

    console.log('Created POI:', poi);

    // 4. Create test graph JSON
    const graphData = {
      floorplan_id: 'test-floorplan-123',
      nodes: [
        { id: 'node1', x: 100, y: 200 },
        { id: 'node2', x: 200, y: 300 },
        { id: 'node3', x: 300, y: 400 }
      ],
      segments: [
        { id: 'seg1', from: 'node1', to: 'node2' },
        { id: 'seg2', from: 'node2', to: 'node3' }
      ],
      pois: [
        { id: 'poi1', name: 'Test Booth', x: 300, y: 400 }
      ]
    };

    // Upload to storage
    try {
      await supabase.storage.createBucket('floorplans', { public: true });
    } catch (e) {
      // Bucket might already exist
    }

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('floorplans')
      .upload(`maps/test-floorplan-123.json`, JSON.stringify(graphData), {
        contentType: 'application/json',
        upsert: true
      });

    if (uploadError) {
      console.error('Error uploading graph:', uploadError);
      return;
    }

    const { data: publicUrl } = supabase.storage
      .from('floorplans')
      .getPublicUrl(uploadData.path);

    console.log('Uploaded graph JSON:', publicUrl.publicUrl);

    console.log('\nTest setup complete!');
    console.log('Event ID:', event.id);
    console.log('QR Code: PILOT_TEST_QR1');
    console.log('QR Coordinates: (100, 200)');
    console.log('POI: Test Booth at (300, 400)');
    console.log('Graph URL:', publicUrl.publicUrl);

  } catch (error) {
    console.error('Error:', error);
  }
}

setupTestFlow();
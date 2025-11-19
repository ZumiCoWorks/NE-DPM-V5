import { supabaseAdmin } from './api/lib/supabase.ts';
import { randomUUID } from 'crypto';

// Test data with correct schema
const testEvent = {
  name: 'Tech Conference 2024',
  description: 'Annual technology conference with AR navigation',
  start_time: '2024-11-21T09:00:00Z',
  end_time: '2024-11-21T18:00:00Z',
  venue_id: '550e8400-e29b-41d4-a716-446655440001',
  // organizer_id: '550e8400-e29b-41d4-a716-446655440002', // Will be set later
  status: 'published',
  max_attendees: 500,
  quicket_event_id: 'QC2024_001'
};

const testVenue = {
  name: 'Cape Town International Convention Centre',
  address: 'Convention Square, 1 Lower Long Street, Cape Town',
  description: 'Premium conference venue with modern facilities',
  capacity: 1000,
  venue_type: 'conference_center',
  contact_email: 'info@cticc.co.za',
  contact_phone: '+27 21 410 5000',
  status: 'active'
};

const testFloorplan = {
  name: 'Main Exhibition Hall',
  image_url: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=conference+venue+floor+plan+with+booths+and+pathways+technical+drawing&image_size=landscape_16_9',
  scale_meters_per_pixel: 0.5
};

const testSponsor = {
  name: 'TechCorp Solutions',
  floorplan_id: '550e8400-e29b-41d4-a716-446655440003',
  event_id: '550e8400-e29b-41d4-a716-446655440004'
};

const testQRNode = {
  qr_code_id: 'QR_ENTRANCE_001',
  x: 100,
  y: 50,
  floor: 'Ground Floor'
};

const testAttendee = {
  full_name: 'John Smith',
  email: 'john.smith@example.com',
  phone: '+27 82 123 4567',
  company: 'ABC Corporation',
  job_title: 'Marketing Director',
  address: '123 Business Ave, Cape Town'
};

async function createTestDataWithServiceRole() {
  console.log('🚀 Creating test data with service role...\n');

  try {
    // Step 0: Get existing organizer or create minimal auth user
    console.log('0️⃣ Getting existing organizer...');
    let organizer;
    
    // Try to get the first available organizer
    const { data: existingOrganizers } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('role', 'event_organizer')
      .limit(1);
    
    if (existingOrganizers && existingOrganizers.length > 0) {
      organizer = existingOrganizers[0];
      console.log(`✅ Using existing organizer: ${organizer.first_name} ${organizer.last_name} (ID: ${organizer.id})`);
    } else {
      console.log('⚠️  No existing organizer found, creating test organizer...');
      
      // Create a minimal auth user first (this might fail but we'll try)
      try {
        const authResponse = await supabaseAdmin.auth.admin.createUser({
          email: 'test-organizer@naveaze.co.za',
          password: 'TestPassword123!',
          email_confirm: true
        });
        
        if (authResponse.data.user) {
          const organizerId = authResponse.data.user.id;
          
          // Create profile
          const { data: newOrganizer, error: profileError } = await supabaseAdmin
            .from('profiles')
            .insert({
              id: organizerId,
              email: 'test-organizer@naveaze.co.za',
              role: 'event_organizer',
              first_name: 'Test',
              last_name: 'Organizer'
            })
            .select('*')
            .single();
          
          if (profileError) throw profileError;
          organizer = newOrganizer;
          console.log(`✅ Created new organizer: ${organizer.first_name} ${organizer.last_name} (ID: ${organizer.id})`);
        }
      } catch (authError) {
        console.log('⚠️  Could not create auth user, using fallback approach...');
        // For testing, we'll skip the organizer constraint and set it to null
        organizer = null;
      }
    }

    // Step 1: Create a venue
    console.log('\n1️⃣ Creating venue...');
    const { data: venue, error: venueError } = await supabaseAdmin
      .from('venues')
      .insert(testVenue)
      .select('*')
      .single();
    
    if (venueError) throw venueError;
    console.log(`✅ Venue created: ${venue.name} (ID: ${venue.id})`);

    // Step 2: Create an event
    console.log('\n2️⃣ Creating event...');
    const eventData = { 
      ...testEvent, 
      venue_id: venue.id,
      organizer_id: organizer ? organizer.id : null
    };
    const { data: event, error: eventError } = await supabaseAdmin
      .from('events')
      .insert(eventData)
      .select('*')
      .single();
    
    if (eventError) throw eventError;
    console.log(`✅ Event created: ${event.name} (ID: ${event.id})`);

    // Step 3: Create floorplan
    console.log('\n3️⃣ Creating floorplan...');
    const floorplanData = { ...testFloorplan, event_id: event.id };
    const { data: floorplan, error: floorplanError } = await supabaseAdmin
      .from('floorplans')
      .insert(floorplanData)
      .select('*')
      .single();
    
    if (floorplanError) throw floorplanError;
    console.log(`✅ Floorplan created: ${floorplan.name} (ID: ${floorplan.id})`);

    // Step 4: Create sponsor/vendor
    console.log('\n4️⃣ Creating sponsor...');
    const sponsorData = { ...testSponsor, floorplan_id: floorplan.id, event_id: event.id };
    const { data: sponsor, error: sponsorError } = await supabaseAdmin
      .from('vendors')
      .insert(sponsorData)
      .select('*')
      .single();
    
    if (sponsorError) throw sponsorError;
    console.log(`✅ Sponsor created: ${sponsor.name} (ID: ${sponsor.id})`);

    // Step 5: Create QR nodes for navigation
    console.log('\n5️⃣ Creating QR navigation nodes...');
    const qrNodeData = { ...testQRNode, event_id: event.id };
    const { data: qrNode, error: qrError } = await supabaseAdmin
      .from('map_qr_nodes')
      .insert(qrNodeData)
      .select('*')
      .single();
    
    if (qrError) throw qrError;
    console.log(`✅ QR Node created: ${qrNode.qr_code_id} at (${qrNode.x}, ${qrNode.y})`);

    // Step 6: Create attendee data
    console.log('\n6️⃣ Creating attendee data...');
    const { data: attendee, error: attendeeError } = await supabaseAdmin
      .from('users')
      .insert(testAttendee)
      .select('*')
      .single();
    
    if (attendeeError) throw attendeeError;
    console.log(`✅ Attendee created: ${attendee.full_name} (ID: ${attendee.id})`);

    // Step 7: Test lead capture functionality
    console.log('\n7️⃣ Testing lead capture...');
    const leadData = {
      event_id: event.id,
      sponsor_id: sponsor.id,
      attendee_id: attendee.id,
      full_name: attendee.full_name,
      email: attendee.email,
      phone: attendee.phone,
      company: attendee.company,
      job_title: attendee.job_title,
      notes: 'Interested in enterprise solutions'
    };
    
    const { data: lead, error: leadError } = await supabaseAdmin
      .from('leads')
      .insert(leadData)
      .select('*')
      .single();
    
    if (leadError) throw leadError;
    console.log(`✅ Lead captured: ${lead.full_name}`);

    console.log('\n🎉 Test Data Creation Completed Successfully!');
    console.log('\n📊 Test Summary:');
    console.log(`   Event: ${event.name}`);
    console.log(`   Venue: ${venue.name}`);
    console.log(`   Floorplan: ${floorplan.name}`);
    console.log(`   Sponsor: ${sponsor.name}`);
    console.log(`   Attendee: ${attendee.full_name}`);
    console.log(`   QR Nodes: 1 created`);
    console.log(`   Leads: 1 captured`);

    return {
      event,
      venue,
      floorplan,
      sponsor,
      attendee,
      qrNode
    };

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    throw error;
  }
}

// Run the test
createTestDataWithServiceRole()
  .then((result) => {
    console.log('\n✨ Test data created successfully! Ready for PWA testing.');
    console.log('\n🔄 Next steps:');
    console.log('1. Test Attendee PWA with event ID:', result.event.id);
    console.log('2. Test Staff PWA with sponsor ID:', result.sponsor.id);
    console.log('3. Verify QR code scanning and lead capture flow');
    console.log('4. Test URLs:');
    console.log(`   - Attendee PWA: http://localhost:5173/mobile/attendee?event_id=${result.event.id}`);
    console.log(`   - Staff PWA: http://localhost:5173/mobile/staff?event_id=${result.event.id}&sponsor_id=${result.sponsor.id}&staff_id=demo-staff-001`);
  })
  .catch((error) => {
    console.error('\n💥 Test failed:', error);
    process.exit(1);
  });
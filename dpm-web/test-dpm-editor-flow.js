import axios from 'axios';

const API_BASE = 'http://localhost:3001/api';

// Test data with correct schema
const testEvent = {
  name: 'Tech Conference 2024',
  description: 'Annual technology conference with AR navigation',
  start_time: '2024-11-21T09:00:00Z',
  end_time: '2024-11-21T18:00:00Z',
  venue_id: '550e8400-e29b-41d4-a716-446655440001',
  organizer_id: '550e8400-e29b-41d4-a716-446655440002',
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

async function testDPMEditorFlow() {
  console.log('🚀 Starting DPM Editor Flow Test...\n');

  try {
    // Step 1: Create a venue
    console.log('1️⃣ Creating venue...');
    const venueResponse = await axios.post(`${API_BASE}/venues`, testVenue);
    const venue = venueResponse.data;
    console.log(`✅ Venue created: ${venue.name} (ID: ${venue.id})`);

    // Step 2: Create an event
    console.log('\n2️⃣ Creating event...');
    const eventData = { ...testEvent, venue_id: venue.id };
    const eventResponse = await axios.post(`${API_BASE}/events`, eventData);
    const event = eventResponse.data;
    console.log(`✅ Event created: ${event.name} (ID: ${event.id})`);

    // Step 3: Create floorplan
    console.log('\n3️⃣ Creating floorplan...');
    const floorplanData = { ...testFloorplan, event_id: event.id };
    const floorplanResponse = await axios.post(`${API_BASE}/floorplans`, floorplanData);
    const floorplan = floorplanResponse.data;
    console.log(`✅ Floorplan created: ${floorplan.name} (ID: ${floorplan.id})`);

    // Step 4: Create sponsor/vendor
    console.log('\n4️⃣ Creating sponsor...');
    const sponsorData = { ...testSponsor, floorplan_id: floorplan.id, event_id: event.id };
    const sponsorResponse = await axios.post(`${API_BASE}/vendors`, sponsorData);
    const sponsor = sponsorResponse.data;
    console.log(`✅ Sponsor created: ${sponsor.name} (ID: ${sponsor.id})`);

    // Step 5: Create QR nodes for navigation
    console.log('\n5️⃣ Creating QR navigation nodes...');
    const qrNodeData = { ...testQRNode, event_id: event.id };
    const qrResponse = await axios.post(`${API_BASE}/editor/qr-nodes`, qrNodeData);
    const qrNode = qrResponse.data;
    console.log(`✅ QR Node created: ${qrNode.qr_code_id} at (${qrNode.x}, ${qrNode.y})`);

    // Step 6: Test Quicket API integration
    console.log('\n6️⃣ Testing Quicket API integration...');
    try {
      const quicketResponse = await axios.get(`${API_BASE}/quicket/events/${event.quicket_event_id}`);
      console.log(`✅ Quicket API connection successful`);
    } catch (error) {
      console.log(`⚠️  Quicket API test failed (expected if no API key): ${error.message}`);
    }

    // Step 7: Create attendee data
    console.log('\n7️⃣ Creating attendee data...');
    const attendeeResponse = await axios.post(`${API_BASE}/attendees`, testAttendee);
    const attendee = attendeeResponse.data;
    console.log(`✅ Attendee created: ${attendee.full_name} (ID: ${attendee.id})`);

    // Step 8: Test QR code generation
    console.log('\n8️⃣ Testing QR code generation...');
    const qrCodeResponse = await axios.post(`${API_BASE}/qr-codes`, {
      event_id: event.id,
      attendee_id: attendee.id,
      type: 'attendee_access'
    });
    console.log(`✅ QR Code generated for attendee`);

    // Step 9: Test lead capture functionality
    console.log('\n9️⃣ Testing lead capture...');
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
    const leadResponse = await axios.post(`${API_BASE}/leads`, leadData);
    console.log(`✅ Lead captured: ${leadResponse.data.full_name}`);

    console.log('\n🎉 DPM Editor Flow Test Completed Successfully!');
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
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
    throw error;
  }
}

// Run the test
testDPMEditorFlow()
  .then((result) => {
    console.log('\n✨ All tests passed! Ready for PWA testing.');
    console.log('\n🔄 Next steps:');
    console.log('1. Test Attendee PWA with event ID:', result.event.id);
    console.log('2. Test Staff PWA with sponsor ID:', result.sponsor.id);
    console.log('3. Verify QR code scanning and lead capture flow');
  })
  .catch((error) => {
    console.error('\n💥 Test failed:', error);
    process.exit(1);
  });
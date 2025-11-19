import axios from 'axios';

const API_BASE = 'http://localhost:3001/api';

// Test user credentials
const testUser = {
  email: 'test@naveaze.co.za',
  password: 'TestPassword123!'
};

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

async function createTestUser() {
  try {
    console.log('📝 Creating test user...');
    const response = await axios.post(`${API_BASE}/auth/register`, {
      email: testUser.email,
      password: testUser.password,
      full_name: 'Test Organizer',
      role: 'event_organizer',
      phone: '+27 82 123 4567'
    });
    console.log('✅ Test user created');
    return response.data;
  } catch (error) {
    console.log('⚠️  Registration error:', error.response?.data || error.message);
    console.log('⚠️  User might already exist, trying to login...');
    return null;
  }
}

async function loginTestUser() {
  try {
    console.log('🔐 Logging in test user...');
    const response = await axios.post(`${API_BASE}/auth/login`, testUser);
    const { token, user, profile } = response.data;
    console.log(`✅ Logged in as ${user.email} (Role: ${profile.role})`);
    return token;
  } catch (error) {
    console.error('❌ Login failed:', error.message);
    throw error;
  }
}

async function testDPMEditorFlow() {
  console.log('🚀 Starting DPM Editor Flow Test...\n');

  try {
    // Create and login test user
    await createTestUser();
    const authToken = await loginTestUser();
    
    // Set up axios with auth token
    const api = axios.create({
      baseURL: API_BASE,
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    // Step 1: Create a venue
    console.log('\n1️⃣ Creating venue...');
    const venueResponse = await api.post('/venues', testVenue);
    const venue = venueResponse.data;
    console.log(`✅ Venue created: ${venue.name} (ID: ${venue.id})`);

    // Step 2: Create an event
    console.log('\n2️⃣ Creating event...');
    const eventData = { ...testEvent, venue_id: venue.id };
    const eventResponse = await api.post('/events', eventData);
    const event = eventResponse.data;
    console.log(`✅ Event created: ${event.name} (ID: ${event.id})`);

    // Step 3: Create floorplan
    console.log('\n3️⃣ Creating floorplan...');
    const floorplanData = { ...testFloorplan, event_id: event.id };
    const floorplanResponse = await api.post('/floorplans', floorplanData);
    const floorplan = floorplanResponse.data;
    console.log(`✅ Floorplan created: ${floorplan.name} (ID: ${floorplan.id})`);

    // Step 4: Create sponsor/vendor
    console.log('\n4️⃣ Creating sponsor...');
    const sponsorData = { ...testSponsor, floorplan_id: floorplan.id, event_id: event.id };
    const sponsorResponse = await api.post('/vendors', sponsorData);
    const sponsor = sponsorResponse.data;
    console.log(`✅ Sponsor created: ${sponsor.name} (ID: ${sponsor.id})`);

    // Step 5: Create QR nodes for navigation
    console.log('\n5️⃣ Creating QR navigation nodes...');
    const qrNodeData = { ...testQRNode, event_id: event.id };
    const qrResponse = await api.post('/editor/qr-node', {
      event_id: event.id,
      qr_id_text: testQRNode.qr_code_id,
      x_coord: testQRNode.x,
      y_coord: testQRNode.y
    });
    const qrNode = qrResponse.data;
    console.log(`✅ QR Node created: ${testQRNode.qr_code_id} at (${testQRNode.x}, ${testQRNode.y})`);

    // Step 6: Test Quicket API integration
    console.log('\n6️⃣ Testing Quicket API integration...');
    try {
      const quicketResponse = await api.get(`/quicket/events/${event.quicket_event_id}`);
      console.log(`✅ Quicket API connection successful`);
    } catch (error) {
      console.log(`⚠️  Quicket API test failed (expected if no API key): ${error.message}`);
    }

    // Step 7: Create attendee data
    console.log('\n7️⃣ Creating attendee data...');
    const attendeeResponse = await api.post('/attendees', testAttendee);
    const attendee = attendeeResponse.data;
    console.log(`✅ Attendee created: ${attendee.full_name} (ID: ${attendee.id})`);

    // Step 8: Test QR code generation
    console.log('\n8️⃣ Testing QR code generation...');
    const qrCodeResponse = await api.post('/qr-codes', {
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
    const leadResponse = await api.post('/leads', leadData);
    console.log(`✅ Lead captured: ${leadResponse.data.full_name}`);

    // Step 10: Test public QR nodes endpoint (for PWA)
    console.log('\n🔟 Testing public QR nodes endpoint...');
    const publicQRResponse = await axios.get(`${API_BASE}/editor/qr-nodes?event_id=${event.id}`);
    console.log(`✅ Public QR nodes: ${publicQRResponse.data.data.length} nodes found`);

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
      qrNode,
      authToken
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
    console.log('4. Test URLs:');
    console.log(`   - Attendee PWA: http://localhost:5173/mobile/attendee?event_id=${result.event.id}`);
    console.log(`   - Staff PWA: http://localhost:5173/mobile/staff?event_id=${result.event.id}&sponsor_id=${result.sponsor.id}&staff_id=demo-staff-001`);
  })
  .catch((error) => {
    console.error('\n💥 Test failed:', error);
    process.exit(1);
  });
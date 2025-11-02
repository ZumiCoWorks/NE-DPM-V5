const http = require('http');

const generateDemoData = () => {
  // South African attendee IDs with SA mobile number format
  const attendeeIds = [
    'ZA_JHB_001', 'ZA_CPT_002', 'ZA_DBN_003', 'ZA_PTA_004', 
    'ZA_BFN_005', 'ZA_PLK_006', 'ZA_ELS_007', 'ZA_KMB_008'
  ];
  
  // HVZ Zone Coordinates (matching our South African sponsor zones)
  const zoneAreas = [
    { name: 'MTN Sponsor Pavilion', x: 120, y: 170, range: 30 }, // Inside MTN booth
    { name: 'Discovery VIP Lounge', x: 350, y: 230, range: 40 }, // Inside Discovery VIP
    { name: 'Nedbank Main Stage', x: 250, y: 80, range: 50 }, // Near Nedbank stage
    { name: 'Shoprite Food Court', x: 480, y: 200, range: 35 }, // Inside Shoprite area
    { name: 'Standard Bank Innovation Hub', x: 100, y: 300, range: 30 }, // Inside Standard Bank
    { name: 'General Networking Area', x: 400, y: 350, range: 60 }, // Outside HVZ zones
    { name: 'Entrance Foyer', x: 50, y: 50, range: 25 }, // Outside HVZ zones
  ];
  
  const selectedArea = zoneAreas[Math.floor(Math.random() * zoneAreas.length)];
  
  // Generate coordinates within the selected area (with some randomness)
  const x_coordinate = selectedArea.x + (Math.random() - 0.5) * selectedArea.range;
  const y_coordinate = selectedArea.y + (Math.random() - 0.5) * selectedArea.range;
  
  // South African specific data
  const provinces = ['GP', 'WC', 'KZN', 'EC', 'NC', 'NW', 'FS', 'MP', 'LP'];
  const cities = ['Johannesburg', 'Cape Town', 'Durban', 'Pretoria', 'Bloemfontein'];
  
  return {
    attendee_id: attendeeIds[Math.floor(Math.random() * attendeeIds.length)],
    dwell_time_minutes: Math.floor(Math.random() * 45) + 2, // 2-47 minutes
    active_engagement_status: Math.random() > 0.25, // 75% engagement rate (SA users are highly engaged!)
    event_id: 'event-1', // Link to our demo event
    venue_id: 'venue-1',
    x_coordinate: Math.round(x_coordinate * 10) / 10, // Round to 1 decimal
    y_coordinate: Math.round(y_coordinate * 10) / 10,
    session_id: `sa_session_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    device_info: {
      platform: Math.random() > 0.6 ? 'iOS' : 'Android', // Android more popular in SA
      app_version: '1.2.0-za',
      location_province: provinces[Math.floor(Math.random() * provinces.length)],
      location_city: cities[Math.floor(Math.random() * cities.length)]
    }
  };
};

const postData = (data) => {
  const postData = JSON.stringify(data);
  
  const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/api/cdv-report',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  const req = http.request(options, (res) => {
    let body = '';
    res.on('data', (chunk) => body += chunk);
    res.on('end', () => {
      console.log(`✅ Posted CDV data: ${data.attendee_id} in ${data.zone_name} (${data.dwell_time_minutes}m, engaged: ${data.active_engagement_status})`);
    });
  });

  req.on('error', (e) => {
    console.error(`❌ Error: ${e.message}`);
  });

  req.write(postData);
  req.end();
};

console.log('🚀 Starting CDV Demo Data Generator...');
console.log('📊 Simulating B2C app sending engagement data...\n');

// Generate initial batch
for (let i = 0; i < 3; i++) {
  setTimeout(() => postData(generateDemoData()), i * 1000);
}

// Continue generating data every 15 seconds
setInterval(() => {
  postData(generateDemoData());
}, 15000);

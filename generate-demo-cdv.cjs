const http = require('http');

const generateDemoData = () => {
  const attendeeIds = ['ATT001', 'ATT002', 'ATT003', 'ATT004', 'ATT005'];
  const zones = ['Main Stage', 'Food Court', 'Sponsor Booth A', 'VIP Lounge', 'Networking Area'];
  
  return {
    attendee_id: attendeeIds[Math.floor(Math.random() * attendeeIds.length)],
    dwell_time_minutes: Math.floor(Math.random() * 45) + 5, // 5-50 minutes
    active_engagement_status: Math.random() > 0.3, // 70% engagement rate
    zone_name: zones[Math.floor(Math.random() * zones.length)]
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

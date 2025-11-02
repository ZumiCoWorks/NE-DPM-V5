#!/usr/bin/env node

// Test CDV + HVZ Integration
const http = require('http');

const testData = [
  {
    attendee_id: "ZA_JHB_001",
    dwell_time_minutes: 12.5,
    active_engagement_status: true,
    event_id: "event-1",
    x_coordinate: 125.0, // Inside MTN booth
    y_coordinate: 175.0
  },
  {
    attendee_id: "ZA_CPT_002", 
    dwell_time_minutes: 6.2,
    active_engagement_status: true,
    event_id: "event-1",
    x_coordinate: 350.0, // Inside Discovery VIP lounge
    y_coordinate: 230.0
  },
  {
    attendee_id: "ZA_DBN_003",
    dwell_time_minutes: 8.7,
    active_engagement_status: true,
    event_id: "event-1", 
    x_coordinate: 250.0, // Near Nedbank stage
    y_coordinate: 80.0
  },
  {
    attendee_id: "ZA_PTA_004",
    dwell_time_minutes: 3.8,
    active_engagement_status: false,
    event_id: "event-1", 
    x_coordinate: 500.0, // Outside all zones
    y_coordinate: 400.0
  }
];

console.log('🇿🇦 Testing SA CDV + HVZ Geofencing Integration...\n');

testData.forEach((data, index) => {
  setTimeout(() => {
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
        try {
          const response = JSON.parse(body);
          console.log(`✅ Test ${index + 1}: ${data.attendee_id} at (${data.x_coordinate}, ${data.y_coordinate})`);
          if (response.data && response.data.detected_zone_id) {
            console.log(`   🎯 ZONE DETECTED: ${response.data.zone_name}`);
            if (response.data.revenue_impact) {
              console.log(`   💰 Revenue Impact: R${response.data.revenue_impact.estimated_value.toFixed(2)} (${response.data.revenue_impact.sponsor})`);
            }
          } else {
            console.log(`   📍 No zone detected - general area`);
          }
          console.log('');
        } catch (e) {
          console.log(`❌ Error parsing response for ${data.attendee_id}`);
        }
      });
    });

    req.on('error', (e) => {
      console.error(`❌ Request failed for ${data.attendee_id}: ${e.message}`);
    });

    req.write(postData);
    req.end();
  }, index * 1000);
});

setTimeout(() => {
  console.log('🔍 Testing Data Integrity API...\n');
  
  const req = http.request({
    hostname: 'localhost',
    port: 3001,
    path: '/api/data-integrity/stats',
    method: 'GET'
  }, (res) => {
    let body = '';
    res.on('data', (chunk) => body += chunk);
    res.on('end', () => {
      try {
        const response = JSON.parse(body);
        if (response.success) {
          console.log('📊 DATA INTEGRITY STATS:');
          console.log(`   CDV Accuracy: ${response.stats.accuracyRate}%`);
          console.log(`   Zone Detection: ${response.stats.zoneDetectionRate}%`);
          console.log(`   Revenue Tracked: R${response.stats.revenueTracked}`);
          console.log(`   Data Quality Score: ${response.stats.dataQualityScore}/100`);
          console.log(`   Total Reports: ${response.stats.totalReports}`);
          console.log('\n✅ South African B2B Blueprint Integration Complete!');
        }
      } catch (e) {
        console.log('❌ Error parsing integrity stats');
      }
    });
  });
  
  req.on('error', (e) => {
    console.error(`❌ Integrity stats request failed: ${e.message}`);
  });
  
  req.end();
}, 4000);
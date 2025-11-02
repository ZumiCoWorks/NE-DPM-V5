// Simple demo event generator for mobile app testing
const http = require('http');

const demoEvents = [
  {
    id: 'event-001',
    name: 'Tech Expo 2025',
    description: 'Annual technology and innovation showcase',
    status: 'active',
    start_date: '2025-11-01T09:00:00Z',
    end_date: '2025-11-01T18:00:00Z',
    venue: {
      id: 'venue-001',
      name: 'Convention Center Hall A',
      address: '123 Main Street, Downtown',
      description: 'Large exhibition hall with 50+ booths',
      booths: [
        { id: 'booth-001', name: 'Microsoft', x: 10, y: 10 },
        { id: 'booth-002', name: 'Google', x: 30, y: 10 },
        { id: 'booth-003', name: 'Apple', x: 50, y: 10 },
        { id: 'booth-004', name: 'Amazon', x: 10, y: 30 },
        { id: 'booth-005', name: 'Meta', x: 30, y: 30 }
      ]
    }
  },
  {
    id: 'event-002',
    name: 'Food & Wine Festival',
    description: 'Celebrate local cuisine and craft beverages',
    status: 'active',
    start_date: '2025-11-15T12:00:00Z',
    end_date: '2025-11-15T22:00:00Z',
    venue: {
      id: 'venue-002',
      name: 'Riverside Park',
      address: '456 River Road, Waterfront',
      description: 'Outdoor venue with 30+ food stalls',
      booths: [
        { id: 'booth-101', name: 'Pizza Palace', x: 15, y: 15 },
        { id: 'booth-102', name: 'Taco Truck', x: 35, y: 15 },
        { id: 'booth-103', name: 'Wine Tasting', x: 55, y: 15 }
      ]
    }
  }
];

// Store in-memory (since we're using mock data)
global.DEMO_EVENTS = demoEvents;

console.log('✅ Demo events created:');
demoEvents.forEach(event => {
  console.log(`  - ${event.name} at ${event.venue.name}`);
  console.log(`    ${event.venue.booths.length} booths`);
});

console.log('\n📱 Mobile app can now fetch these events from /api/events/public');


